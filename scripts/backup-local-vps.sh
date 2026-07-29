#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_NAME="$(basename "$0")"
PROJECT_ROOT="${SIMDP_PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
TIMESTAMP="$(date -u +%Y%m%d_%H%M%S)"
COMMAND="${1:-create}"

BACKUP_TARGET="${BACKUP_TARGET:-local}"
STORAGE_PROVIDER="${STORAGE_PROVIDER:-local}"
BACKUP_DB_ENABLED="${BACKUP_DB_ENABLED:-true}"
BACKUP_STORAGE_ENABLED="${BACKUP_STORAGE_ENABLED:-true}"
BACKUP_DB_DUMP_PROVIDER="${BACKUP_DB_DUMP_PROVIDER:-auto}"
BACKUP_DB_DOCKER_CONTAINER="${BACKUP_DB_DOCKER_CONTAINER:-}"
BACKUP_DB_DOCKER_IMAGE="${BACKUP_DB_DOCKER_IMAGE:-postgres:17-alpine}"
BACKUP_DIR="${BACKUP_LOCAL_DIR:-${BACKUP_FOLDER_PATH:-${SIMDP_BACKUP_DIR:-}}}"
STORAGE_DIR="${SIMDP_STORAGE_DIR:-$PROJECT_ROOT/uploads}"
DATABASE_URL_VALUE="${BACKUP_DATABASE_URL:-${DATABASE_URL:-}}"
PASSPHRASE_FILE="${SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE:-}"
ALLOW_UNENCRYPTED="${SIMDP_BACKUP_ALLOW_UNENCRYPTED:-false}"
DAILY_RETENTION_DAYS="${BACKUP_RETENTION_DAILY_DAYS:-${SIMDP_BACKUP_RETENTION_DAILY_DAYS:-14}}"
WEEKLY_RETENTION_DAYS="${BACKUP_RETENTION_WEEKLY_DAYS:-${SIMDP_BACKUP_RETENTION_WEEKLY_DAYS:-56}}"
MONTHLY_RETENTION_DAYS="${BACKUP_RETENTION_MONTHLY_DAYS:-${SIMDP_BACKUP_RETENTION_MONTHLY_DAYS:-365}}"
SOURCE_SNAPSHOT_DIR=""

node_command() {
  if command -v node >/dev/null 2>&1; then
    printf 'node'
  elif command -v node.exe >/dev/null 2>&1; then
    printf 'node.exe'
  else
    fail "Command 'node' tidak ditemukan. Install Node.js atau pastikan node.exe tersedia di PATH."
  fi
}

run_storage_snapshot_node() {
  local out_dir="$1"
  local node_bin script_path out_arg
  node_bin="$(node_command)"
  script_path="$PROJECT_ROOT/scripts/backup-storage-source.mjs"
  out_arg="$out_dir"

  if [ "$(basename "$node_bin")" = "node.exe" ]; then
    if command -v cygpath >/dev/null 2>&1; then
      script_path="$(cygpath -w "$script_path")"
      out_arg="$(cygpath -w "$out_arg")"
    elif command -v wslpath >/dev/null 2>&1; then
      script_path="$(wslpath -w "$script_path")"
      out_arg="$(wslpath -w "$out_arg")"
    fi
  fi

  "$node_bin" "$script_path" snapshot --out-dir "$out_arg" >&2
}

usage() {
  cat <<'USAGE'
SIMDP local/VPS backup helper.

Usage:
  scripts/backup-local-vps.sh create
  scripts/backup-local-vps.sh prune
  scripts/backup-local-vps.sh dry-run
  scripts/backup-local-vps.sh help

Required environment for real backup:
  DATABASE_URL                                   PostgreSQL connection string when BACKUP_DB_ENABLED=true.
  BACKUP_DATABASE_URL                           Optional pg_dump-safe URL, overrides DATABASE_URL for backup.
  BACKUP_TARGET=local|folder                    Local filesystem target for this helper.
  BACKUP_LOCAL_DIR or BACKUP_FOLDER_PATH        Backup destination outside the repo.
  SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE       File containing encryption passphrase.

Optional environment:
  SIMDP_BACKUP_DIR                              Legacy alias for BACKUP_LOCAL_DIR.
  BACKUP_DB_ENABLED=true|false                  Enable database dump artifact.
  BACKUP_STORAGE_ENABLED=true|false             Enable document storage artifact.
  BACKUP_DB_DUMP_PROVIDER=auto|local|docker|docker-image
                                                Use local pg_dump, docker exec pg_dump, or docker run pg_dump.
  BACKUP_DB_DOCKER_CONTAINER                    PostgreSQL container name when provider=docker.
  BACKUP_DB_DOCKER_IMAGE                        PostgreSQL image when provider=docker-image.
  STORAGE_PROVIDER=local|supabase               Storage source for document backup.
  SIMDP_STORAGE_DIR                             Local storage folder. Default: ./uploads.
  SUPABASE_URL                                  Supabase URL when STORAGE_PROVIDER=supabase.
  SUPABASE_SERVICE_ROLE_KEY                     Supabase service role key when STORAGE_PROVIDER=supabase.
  SUPABASE_STORAGE_BUCKET                       Supabase bucket when STORAGE_PROVIDER=supabase.
  SIMDP_BACKUP_ALLOW_UNENCRYPTED=true           Allow unencrypted backup for local test only.
  BACKUP_RETENTION_DAILY_DAYS=14                Daily retention window.
  BACKUP_RETENTION_WEEKLY_DAYS=56               Weekly retention window.
  BACKUP_RETENTION_MONTHLY_DAYS=365             Monthly retention window.

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
  case "$BACKUP_TARGET" in
    local|folder) ;;
    *)
      fail "scripts/backup-local-vps.sh hanya mendukung BACKUP_TARGET=local atau folder. Gunakan job offsite terpisah untuk $BACKUP_TARGET."
      ;;
  esac

  [ -n "$BACKUP_DIR" ] || fail "BACKUP_LOCAL_DIR/BACKUP_FOLDER_PATH wajib diisi dan harus berada di luar repository."
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

prepare_storage_snapshot() {
  case "$STORAGE_PROVIDER" in
    local)
      [ -d "$STORAGE_DIR" ] || fail "SIMDP_STORAGE_DIR tidak ditemukan ($STORAGE_DIR)."
      printf '%s\n' "$STORAGE_DIR"
      ;;
    supabase)
      SOURCE_SNAPSHOT_DIR="$(mktemp -d)"
      run_storage_snapshot_node "$SOURCE_SNAPSHOT_DIR"
      [ -d "$SOURCE_SNAPSHOT_DIR/storage" ] || fail "Snapshot storage Supabase gagal dibuat."
      printf '%s\n' "$SOURCE_SNAPSHOT_DIR/storage"
      ;;
    s3)
      fail "STORAGE_PROVIDER=s3 belum didukung oleh backup worker VPS ini. Gunakan local atau supabase."
      ;;
    *)
      fail "STORAGE_PROVIDER tidak dikenal: $STORAGE_PROVIDER"
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

resolve_db_dump_provider() {
  case "$BACKUP_DB_DUMP_PROVIDER" in
    auto)
      if command -v pg_dump >/dev/null 2>&1; then
        printf 'local'
      elif [ -n "$BACKUP_DB_DOCKER_CONTAINER" ] && command -v docker >/dev/null 2>&1; then
        printf 'docker'
      else
        fail "pg_dump tidak ditemukan. Install PostgreSQL client, atau isi BACKUP_DB_DUMP_PROVIDER=docker dan BACKUP_DB_DOCKER_CONTAINER."
      fi
      ;;
    local|docker|docker-image)
      printf '%s' "$BACKUP_DB_DUMP_PROVIDER"
      ;;
    *)
      fail "BACKUP_DB_DUMP_PROVIDER tidak dikenal: $BACKUP_DB_DUMP_PROVIDER"
      ;;
  esac
}

assert_db_dump_ready() {
  local provider="$1"
  case "$provider" in
    local)
      require_command pg_dump
      ;;
    docker)
      require_command docker
      [ -n "$BACKUP_DB_DOCKER_CONTAINER" ] || fail "BACKUP_DB_DOCKER_CONTAINER wajib diisi saat BACKUP_DB_DUMP_PROVIDER=docker."
      docker inspect "$BACKUP_DB_DOCKER_CONTAINER" >/dev/null 2>&1 || fail "Docker container tidak ditemukan: $BACKUP_DB_DOCKER_CONTAINER"
      ;;
    docker-image)
      require_command docker
      [ -n "$BACKUP_DB_DOCKER_IMAGE" ] || fail "BACKUP_DB_DOCKER_IMAGE wajib diisi saat BACKUP_DB_DUMP_PROVIDER=docker-image."
      docker image inspect "$BACKUP_DB_DOCKER_IMAGE" >/dev/null 2>&1 || fail "Docker image tidak ditemukan: $BACKUP_DB_DOCKER_IMAGE"
      ;;
    *)
      fail "Provider database dump tidak dikenal: $provider"
      ;;
  esac
}

dump_database() {
  local provider="$1"
  case "$provider" in
    local)
      PGDATABASE="$DATABASE_URL_VALUE" pg_dump --no-owner --no-privileges --format=plain
      ;;
    docker)
      export DATABASE_URL_VALUE
      docker exec \
        -e DATABASE_URL_VALUE \
        -i "$BACKUP_DB_DOCKER_CONTAINER" \
        sh -c 'exec pg_dump --no-owner --no-privileges --format=plain "$DATABASE_URL_VALUE"'
      ;;
    docker-image)
      export DATABASE_URL_VALUE
      docker run \
        --rm \
        -e DATABASE_URL_VALUE \
        "$BACKUP_DB_DOCKER_IMAGE" \
        sh -c 'exec pg_dump --no-owner --no-privileges --format=plain "$DATABASE_URL_VALUE"'
      ;;
    *)
      fail "Provider database dump tidak dikenal: $provider"
      ;;
  esac
}

create_backup() {
  is_true "$BACKUP_DB_ENABLED" || is_true "$BACKUP_STORAGE_ENABLED" || fail "Minimal salah satu dari BACKUP_DB_ENABLED atau BACKUP_STORAGE_ENABLED harus true."
  if is_true "$BACKUP_DB_ENABLED"; then
    [ -n "$DATABASE_URL_VALUE" ] || fail "DATABASE_URL wajib diisi untuk backup database."
  fi

  assert_backup_dir_safe
  assert_encryption_policy
  require_command gzip

  local db_dump_provider
  db_dump_provider=""
  if is_true "$BACKUP_DB_ENABLED"; then
    db_dump_provider="$(resolve_db_dump_provider)"
    assert_db_dump_ready "$db_dump_provider"
  fi

  if is_true "$BACKUP_STORAGE_ENABLED"; then
    require_command tar
  fi

  local period period_dir db_plain db_artifact storage_plain storage_artifact manifest storage_source_dir
  period="$(backup_period)"
  period_dir="$BACKUP_DIR/$period"
  mkdir -p "$period_dir"

  db_plain="$period_dir/simdp-db_${TIMESTAMP}.sql.gz"
  storage_plain="$period_dir/simdp-storage_${TIMESTAMP}.tar.gz"
  manifest="$period_dir/manifest_${TIMESTAMP}.txt"
  db_artifact=""
  storage_artifact=""
  storage_source_dir=""

  if is_true "$BACKUP_DB_ENABLED"; then
    log "Mulai backup database PostgreSQL ke $period_dir via $db_dump_provider"
    if ! dump_database "$db_dump_provider" | gzip -9 > "$db_plain"; then
      rm -f "$db_plain"
      fail "Backup database gagal. Artifact parsial sudah dibersihkan."
    fi
    db_artifact="$(encrypt_file_if_configured "$db_plain")"
  else
    log "Lewati backup database karena BACKUP_DB_ENABLED=false"
  fi

  if is_true "$BACKUP_STORAGE_ENABLED"; then
    storage_source_dir="$(prepare_storage_snapshot)"
    log "Mulai backup storage dari STORAGE_PROVIDER=$STORAGE_PROVIDER"
    if ! tar -czf "$storage_plain" -C "$(dirname "$storage_source_dir")" "$(basename "$storage_source_dir")"; then
      rm -f "$storage_plain"
      fail "Backup storage gagal. Artifact parsial sudah dibersihkan."
    fi
    storage_artifact="$(encrypt_file_if_configured "$storage_plain")"
  else
    log "Lewati backup storage karena BACKUP_STORAGE_ENABLED=false"
  fi

  {
    printf 'SIMDP Backup Manifest\n'
    printf 'timestamp_utc=%s\n' "$TIMESTAMP"
    printf 'period=%s\n' "$period"
    printf 'backup_target=%s\n' "$BACKUP_TARGET"
    printf 'backup_db_enabled=%s\n' "$BACKUP_DB_ENABLED"
    printf 'backup_storage_enabled=%s\n' "$BACKUP_STORAGE_ENABLED"
    printf 'backup_db_dump_provider=%s\n' "${db_dump_provider:-disabled}"
    printf 'storage_provider=%s\n' "$STORAGE_PROVIDER"
    printf 'project_root=%s\n' "$PROJECT_ROOT"
    printf 'storage_dir=%s\n' "$STORAGE_DIR"
    printf 'storage_source_dir=%s\n' "$storage_source_dir"
    if [ -n "$db_artifact" ]; then
      printf 'database_artifact=%s\n' "$db_artifact"
      printf 'database_sha256=%s\n' "$(sha256_file "$db_artifact")"
      printf 'database_bytes=%s\n' "$(wc -c < "$db_artifact" | tr -d ' ')"
    else
      printf 'database_artifact=disabled\n'
    fi
    if [ -n "$storage_artifact" ]; then
      printf 'storage_artifact=%s\n' "$storage_artifact"
      printf 'storage_sha256=%s\n' "$(sha256_file "$storage_artifact")"
      printf 'storage_bytes=%s\n' "$(wc -c < "$storage_artifact" | tr -d ' ')"
    else
      printf 'storage_artifact=disabled\n'
    fi
    printf 'encrypted=%s\n' "$([ -n "$PASSPHRASE_FILE" ] && printf true || printf false)"
  } > "$manifest"

  log "Backup selesai. Manifest: $manifest"
}

cleanup_snapshot_dir() {
  if [ -n "$SOURCE_SNAPSHOT_DIR" ] && [ -d "$SOURCE_SNAPSHOT_DIR" ]; then
    rm -rf "$SOURCE_SNAPSHOT_DIR"
  fi
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
  printf 'BACKUP_TARGET=%s\n' "$BACKUP_TARGET"
  printf 'BACKUP_DB_ENABLED=%s\n' "$BACKUP_DB_ENABLED"
  printf 'BACKUP_STORAGE_ENABLED=%s\n' "$BACKUP_STORAGE_ENABLED"
  printf 'BACKUP_DB_DUMP_PROVIDER=%s\n' "$BACKUP_DB_DUMP_PROVIDER"
  printf 'BACKUP_DB_DOCKER_CONTAINER=%s\n' "${BACKUP_DB_DOCKER_CONTAINER:-<missing>}"
  printf 'BACKUP_DB_DOCKER_IMAGE=%s\n' "${BACKUP_DB_DOCKER_IMAGE:-<missing>}"
  printf 'STORAGE_PROVIDER=%s\n' "$STORAGE_PROVIDER"
  printf 'BACKUP_LOCAL_DIR/BACKUP_FOLDER_PATH=%s\n' "${BACKUP_DIR:-<wajib diisi>}"
  printf 'SIMDP_STORAGE_DIR=%s\n' "$STORAGE_DIR"
  printf 'SUPABASE_URL=%s\n' "$([ -n "${SUPABASE_URL:-}" ] && printf '<set>' || printf '<missing>')"
  printf 'SUPABASE_SERVICE_ROLE_KEY=%s\n' "$([ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ] && printf '<set>' || printf '<missing>')"
  printf 'SUPABASE_STORAGE_BUCKET=%s\n' "$([ -n "${SUPABASE_STORAGE_BUCKET:-}" ] && printf '<set>' || printf '<missing>')"
  printf 'DATABASE_URL=%s\n' "$([ -n "$DATABASE_URL_VALUE" ] && printf '<set>' || printf '<missing>')"
  printf 'SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE=%s\n' "$([ -n "$PASSPHRASE_FILE" ] && printf '<set>' || printf '<missing>')"
  printf 'SIMDP_BACKUP_ALLOW_UNENCRYPTED=%s\n' "$ALLOW_UNENCRYPTED"
  printf 'period_if_run_now=%s\n' "$(backup_period)"
  for cmd in pg_dump docker gzip tar find; do
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
    trap cleanup_snapshot_dir EXIT
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
