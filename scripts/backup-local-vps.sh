#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_NAME="$(basename "$0")"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP="$(date -u +%Y%m%d_%H%M%S)"
COMMAND="${1:-create}"

BACKUP_DIR="${SIMDP_BACKUP_DIR:-}"
STORAGE_DIR="${SIMDP_STORAGE_DIR:-$PROJECT_ROOT/uploads}"
DATABASE_URL_VALUE="${DATABASE_URL:-}"
PASSPHRASE_FILE="${SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE:-}"
ALLOW_UNENCRYPTED="${SIMDP_BACKUP_ALLOW_UNENCRYPTED:-false}"
DAILY_RETENTION_DAYS="${SIMDP_BACKUP_RETENTION_DAILY_DAYS:-14}"
WEEKLY_RETENTION_DAYS="${SIMDP_BACKUP_RETENTION_WEEKLY_DAYS:-56}"
MONTHLY_RETENTION_DAYS="${SIMDP_BACKUP_RETENTION_MONTHLY_DAYS:-365}"

usage() {
  cat <<'USAGE'
SIMDP local/VPS backup helper.

Usage:
  scripts/backup-local-vps.sh create
  scripts/backup-local-vps.sh prune
  scripts/backup-local-vps.sh dry-run
  scripts/backup-local-vps.sh help

Required environment for real backup:
  DATABASE_URL                                   PostgreSQL connection string.
  SIMDP_BACKUP_DIR                              Backup destination outside the repo.
  SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE       File containing encryption passphrase.

Optional environment:
  SIMDP_STORAGE_DIR                             Storage folder. Default: ./uploads
  SIMDP_BACKUP_ALLOW_UNENCRYPTED=true           Allow unencrypted backup for local test only.
  SIMDP_BACKUP_RETENTION_DAILY_DAYS=14          Daily retention window.
  SIMDP_BACKUP_RETENTION_WEEKLY_DAYS=56         Weekly retention window.
  SIMDP_BACKUP_RETENTION_MONTHLY_DAYS=365       Monthly retention window.

Output:
  <backup-dir>/daily/simdp-db_YYYYMMDD_HHmmSS.sql.gz[.enc]
  <backup-dir>/daily/simdp-storage_YYYYMMDD_HHmmSS.tar.gz[.enc]
  <backup-dir>/daily/manifest_YYYYMMDD_HHmmSS.txt

Security notes:
  - Do not put SIMDP_BACKUP_DIR inside the app repository.
  - Do not commit backup files or passphrase files.
  - Production backups should be encrypted and copied offsite.
USAGE
}

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

fail() {
  printf '[%s] ERROR: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Command '$1' tidak ditemukan. Install dulu sebelum menjalankan backup."
}

is_true() {
  case "${1:-}" in
    true|TRUE|1|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

assert_backup_dir_safe() {
  [ -n "$BACKUP_DIR" ] || fail "SIMDP_BACKUP_DIR wajib diisi dan harus berada di luar repository."
  mkdir -p "$BACKUP_DIR"

  local resolved_backup_dir
  resolved_backup_dir="$(cd "$BACKUP_DIR" && pwd)"
  BACKUP_DIR="$resolved_backup_dir"

  case "$BACKUP_DIR" in
    "$PROJECT_ROOT"|"$PROJECT_ROOT"/*)
      fail "SIMDP_BACKUP_DIR tidak boleh berada di dalam repository: $PROJECT_ROOT"
      ;;
  esac
}

assert_encryption_policy() {
  if [ -n "$PASSPHRASE_FILE" ]; then
    [ -f "$PASSPHRASE_FILE" ] || fail "SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE tidak ditemukan."
    require_command openssl
    return 0
  fi

  if is_true "$ALLOW_UNENCRYPTED"; then
    log "WARNING: backup tidak dienkripsi karena SIMDP_BACKUP_ALLOW_UNENCRYPTED=true. Jangan gunakan mode ini untuk production."
    return 0
  fi

  fail "Backup production wajib dienkripsi. Isi SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE atau gunakan SIMDP_BACKUP_ALLOW_UNENCRYPTED=true hanya untuk local test."
}

backup_period() {
  local day_of_month day_of_week
  day_of_month="$(date -u +%d)"
  day_of_week="$(date -u +%u)"

  if [ "$day_of_month" = "01" ]; then
    printf 'monthly'
  elif [ "$day_of_week" = "7" ]; then
    printf 'weekly'
  else
    printf 'daily'
  fi
}

encrypt_file_if_configured() {
  local file="$1"
  if [ -z "$PASSPHRASE_FILE" ]; then
    printf '%s' "$file"
    return 0
  fi

  local encrypted_file="${file}.enc"
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 \
    -pass "file:$PASSPHRASE_FILE" \
    -in "$file" \
    -out "$encrypted_file"
  rm -f "$file"
  printf '%s' "$encrypted_file"
}

sha256_file() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file" | awk '{print $1}'
  else
    printf 'sha256-tool-not-found'
  fi
}

create_backup() {
  [ -n "$DATABASE_URL_VALUE" ] || fail "DATABASE_URL wajib diisi untuk backup database."
  assert_backup_dir_safe
  assert_encryption_policy
  require_command pg_dump
  require_command gzip
  require_command tar

  local period period_dir db_plain db_artifact storage_plain storage_artifact manifest
  period="$(backup_period)"
  period_dir="$BACKUP_DIR/$period"
  mkdir -p "$period_dir"

  db_plain="$period_dir/simdp-db_${TIMESTAMP}.sql.gz"
  storage_plain="$period_dir/simdp-storage_${TIMESTAMP}.tar.gz"
  manifest="$period_dir/manifest_${TIMESTAMP}.txt"

  log "Mulai backup database PostgreSQL ke $period_dir"
  pg_dump --no-owner --no-privileges --format=plain "$DATABASE_URL_VALUE" | gzip -9 > "$db_plain"
  db_artifact="$(encrypt_file_if_configured "$db_plain")"

  if [ -d "$STORAGE_DIR" ]; then
    log "Mulai backup storage dari $STORAGE_DIR"
    tar -czf "$storage_plain" -C "$(dirname "$STORAGE_DIR")" "$(basename "$STORAGE_DIR")"
    storage_artifact="$(encrypt_file_if_configured "$storage_plain")"
  else
    log "WARNING: SIMDP_STORAGE_DIR tidak ditemukan ($STORAGE_DIR). Manifest akan mencatat storage sebagai missing."
    storage_artifact="missing"
  fi

  {
    printf 'SIMDP Backup Manifest\n'
    printf 'timestamp_utc=%s\n' "$TIMESTAMP"
    printf 'period=%s\n' "$period"
    printf 'project_root=%s\n' "$PROJECT_ROOT"
    printf 'storage_dir=%s\n' "$STORAGE_DIR"
    printf 'database_artifact=%s\n' "$db_artifact"
    printf 'database_sha256=%s\n' "$(sha256_file "$db_artifact")"
    printf 'database_bytes=%s\n' "$(wc -c < "$db_artifact" | tr -d ' ')"
    printf 'storage_artifact=%s\n' "$storage_artifact"
    if [ "$storage_artifact" != "missing" ]; then
      printf 'storage_sha256=%s\n' "$(sha256_file "$storage_artifact")"
      printf 'storage_bytes=%s\n' "$(wc -c < "$storage_artifact" | tr -d ' ')"
    fi
    printf 'encrypted=%s\n' "$([ -n "$PASSPHRASE_FILE" ] && printf true || printf false)"
  } > "$manifest"

  log "Backup selesai. Manifest: $manifest"
}

prune_period() {
  local period="$1"
  local retention_days="$2"
  local dir="$BACKUP_DIR/$period"
  [ -d "$dir" ] || return 0

  log "Prune backup $period lebih lama dari $retention_days hari di $dir"
  find "$dir" -type f -mtime "+$retention_days" -name 'simdp-*' -print -delete
  find "$dir" -type f -mtime "+$retention_days" -name 'manifest_*' -print -delete
}

prune_backups() {
  assert_backup_dir_safe
  prune_period daily "$DAILY_RETENTION_DAYS"
  prune_period weekly "$WEEKLY_RETENTION_DAYS"
  prune_period monthly "$MONTHLY_RETENTION_DAYS"
}

dry_run() {
  log "Dry run backup lokal/VPS SIMDP"
  printf 'PROJECT_ROOT=%s\n' "$PROJECT_ROOT"
  printf 'SIMDP_BACKUP_DIR=%s\n' "${BACKUP_DIR:-<wajib diisi>}"
  printf 'SIMDP_STORAGE_DIR=%s\n' "$STORAGE_DIR"
  printf 'DATABASE_URL=%s\n' "$([ -n "$DATABASE_URL_VALUE" ] && printf '<set>' || printf '<missing>')"
  printf 'SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE=%s\n' "$([ -n "$PASSPHRASE_FILE" ] && printf '<set>' || printf '<missing>')"
  printf 'SIMDP_BACKUP_ALLOW_UNENCRYPTED=%s\n' "$ALLOW_UNENCRYPTED"
  printf 'period_if_run_now=%s\n' "$(backup_period)"
  for cmd in pg_dump gzip tar find; do
    if command -v "$cmd" >/dev/null 2>&1; then
      printf 'command_%s=ok\n' "$cmd"
    else
      printf 'command_%s=missing\n' "$cmd"
    fi
  done
  if [ -n "$PASSPHRASE_FILE" ]; then
    if command -v openssl >/dev/null 2>&1; then printf 'command_openssl=ok\n'; else printf 'command_openssl=missing\n'; fi
  fi
}

case "$COMMAND" in
  create)
    create_backup
    ;;
  prune)
    prune_backups
    ;;
  dry-run)
    dry_run
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    usage >&2
    fail "Command tidak dikenal: $COMMAND"
    ;;
esac
