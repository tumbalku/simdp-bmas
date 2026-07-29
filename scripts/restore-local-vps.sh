#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMMAND="${1:-dry-run}"

BACKUP_DIR="${RESTORE_BACKUP_DIR:-${BACKUP_LOCAL_DIR:-${BACKUP_FOLDER_PATH:-${SIMDP_BACKUP_DIR:-}}}}"
RESTORE_TIMESTAMP="${RESTORE_TIMESTAMP:-latest}"
RESTORE_DB_ENABLED="${RESTORE_DB_ENABLED:-true}"
RESTORE_STORAGE_ENABLED="${RESTORE_STORAGE_ENABLED:-true}"
RESTORE_DB_TARGET_PROVIDER="${RESTORE_DB_TARGET_PROVIDER:-auto}"
RESTORE_DB_DOCKER_CONTAINER="${RESTORE_DB_DOCKER_CONTAINER:-${BACKUP_DB_DOCKER_CONTAINER:-}}"
RESTORE_DATABASE_URL="${RESTORE_DATABASE_URL:-${BACKUP_DATABASE_URL:-${DATABASE_URL:-}}}"
RESTORE_STORAGE_DIR="${RESTORE_STORAGE_DIR:-}"
RESTORE_CONFIRM="${RESTORE_CONFIRM:-}"
PASSPHRASE_FILE="${SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE:-}"

usage() {
  cat <<'USAGE'
SIMDP local/VPS restore helper.

Usage:
  scripts/restore-local-vps.sh dry-run
  scripts/restore-local-vps.sh restore
  scripts/restore-local-vps.sh help

Required environment:
  RESTORE_BACKUP_DIR or BACKUP_LOCAL_DIR/BACKUP_FOLDER_PATH   Folder containing daily/weekly/monthly backup folders.
  RESTORE_TIMESTAMP=latest|YYYYMMDD_HHmmSS                   Backup timestamp to restore.

Database restore:
  RESTORE_DB_ENABLED=true|false
  RESTORE_DATABASE_URL                                       Target PostgreSQL URL.
  RESTORE_DB_TARGET_PROVIDER=auto|local|docker               Use local psql or docker exec psql.
  RESTORE_DB_DOCKER_CONTAINER                                PostgreSQL container name when provider=docker.
  RESTORE_CONFIRM=I_UNDERSTAND_RESTORE_OVERWRITES_DATA       Required for actual database restore.

Storage restore:
  RESTORE_STORAGE_ENABLED=true|false
  RESTORE_STORAGE_DIR                                        Target folder for extracted storage.

Security notes:
  - Restore database can overwrite or conflict with existing data. Prefer a temporary restore database.
  - Restore storage should target a separate folder first, then be checked before cutover.
  - Encrypted artifacts require SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE.
USAGE
}

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

fail() {
  printf '[%s] ERROR: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2
  exit 1
}

is_true() {
  case "${1:-}" in
    true|TRUE|1|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Command '$1' tidak ditemukan."
}

assert_backup_dir() {
  [ -n "$BACKUP_DIR" ] || fail "RESTORE_BACKUP_DIR/BACKUP_LOCAL_DIR/BACKUP_FOLDER_PATH wajib diisi."
  [ -d "$BACKUP_DIR" ] || fail "Folder backup tidak ditemukan: $BACKUP_DIR"
  BACKUP_DIR="$(cd "$BACKUP_DIR" && pwd)"
}

find_manifest() {
  if [ "$RESTORE_TIMESTAMP" = "latest" ]; then
    local latest_line
    latest_line="$(
      find "$BACKUP_DIR" -type f -name 'manifest_*.txt' -print |
        while IFS= read -r manifest; do
          timestamp="$(manifest_value "$manifest" timestamp_utc)"
          [ -n "$timestamp" ] || continue
          printf '%s\t%s\n' "$timestamp" "$manifest"
        done |
        sort -k1,1 |
        tail -n 1
    )"
    [ -n "$latest_line" ] || return 0
    printf '%s\n' "${latest_line#*	}"
    return 0
  fi

  find "$BACKUP_DIR" -type f -name "manifest_${RESTORE_TIMESTAMP}.txt" -print | sort | tail -n 1
}

manifest_value() {
  local manifest="$1"
  local key="$2"
  awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, ""); print; exit }' "$manifest"
}

artifact_for() {
  local manifest="$1"
  local key="$2"
  local fallback_prefix="$3"
  local timestamp="$4"
  local value
  value="$(manifest_value "$manifest" "$key")"

  if [ -n "$value" ] && [ "$value" != "disabled" ] && [ -f "$value" ]; then
    printf '%s' "$value"
    return 0
  fi

  local dir
  dir="$(dirname "$manifest")"
  if [ -f "$dir/${fallback_prefix}_${timestamp}.sql.gz" ]; then
    printf '%s' "$dir/${fallback_prefix}_${timestamp}.sql.gz"
  elif [ -f "$dir/${fallback_prefix}_${timestamp}.sql.gz.enc" ]; then
    printf '%s' "$dir/${fallback_prefix}_${timestamp}.sql.gz.enc"
  elif [ -f "$dir/${fallback_prefix}_${timestamp}.tar.gz" ]; then
    printf '%s' "$dir/${fallback_prefix}_${timestamp}.tar.gz"
  elif [ -f "$dir/${fallback_prefix}_${timestamp}.tar.gz.enc" ]; then
    printf '%s' "$dir/${fallback_prefix}_${timestamp}.tar.gz.enc"
  else
    return 1
  fi
}

artifact_stream() {
  local artifact="$1"
  case "$artifact" in
    *.enc)
      [ -n "$PASSPHRASE_FILE" ] || fail "Artifact terenkripsi, isi SIMDP_BACKUP_ENCRYPTION_PASSPHRASE_FILE."
      [ -f "$PASSPHRASE_FILE" ] || fail "Passphrase file tidak ditemukan: $PASSPHRASE_FILE"
      require_command openssl
      openssl enc -d -aes-256-cbc -salt -pbkdf2 -iter 200000 -pass "file:$PASSPHRASE_FILE" -in "$artifact"
      ;;
    *)
      cat "$artifact"
      ;;
  esac
}

resolve_db_target_provider() {
  case "$RESTORE_DB_TARGET_PROVIDER" in
    auto)
      if command -v psql >/dev/null 2>&1; then
        printf 'local'
      elif [ -n "$RESTORE_DB_DOCKER_CONTAINER" ] && command -v docker >/dev/null 2>&1; then
        printf 'docker'
      else
        fail "psql tidak ditemukan. Install PostgreSQL client, atau isi RESTORE_DB_TARGET_PROVIDER=docker dan RESTORE_DB_DOCKER_CONTAINER."
      fi
      ;;
    local|docker)
      printf '%s' "$RESTORE_DB_TARGET_PROVIDER"
      ;;
    *)
      fail "RESTORE_DB_TARGET_PROVIDER tidak dikenal: $RESTORE_DB_TARGET_PROVIDER"
      ;;
  esac
}

assert_db_restore_ready() {
  local provider="$1"
  [ -n "$RESTORE_DATABASE_URL" ] || fail "RESTORE_DATABASE_URL wajib diisi untuk restore database."
  [ "$RESTORE_CONFIRM" = "I_UNDERSTAND_RESTORE_OVERWRITES_DATA" ] || fail "Set RESTORE_CONFIRM=I_UNDERSTAND_RESTORE_OVERWRITES_DATA untuk menjalankan restore database."

  case "$provider" in
    local)
      require_command psql
      ;;
    docker)
      require_command docker
      [ -n "$RESTORE_DB_DOCKER_CONTAINER" ] || fail "RESTORE_DB_DOCKER_CONTAINER wajib diisi saat provider=docker."
      docker inspect "$RESTORE_DB_DOCKER_CONTAINER" >/dev/null 2>&1 || fail "Docker container tidak ditemukan: $RESTORE_DB_DOCKER_CONTAINER"
      ;;
    *)
      fail "Provider restore database tidak dikenal: $provider"
      ;;
  esac
}

restore_database() {
  local provider="$1"
  local artifact="$2"
  log "Mulai restore database via $provider dari $artifact"
  case "$provider" in
    local)
      artifact_stream "$artifact" | gzip -dc | PGDATABASE="$RESTORE_DATABASE_URL" psql -v ON_ERROR_STOP=1
      ;;
    docker)
      export RESTORE_DATABASE_URL_VALUE="$RESTORE_DATABASE_URL"
      artifact_stream "$artifact" | gzip -dc | docker exec \
        -e RESTORE_DATABASE_URL_VALUE \
        -i "$RESTORE_DB_DOCKER_CONTAINER" \
        sh -c 'exec psql -v ON_ERROR_STOP=1 "$RESTORE_DATABASE_URL_VALUE"'
      ;;
  esac
}

restore_storage() {
  local artifact="$1"
  [ -n "$RESTORE_STORAGE_DIR" ] || fail "RESTORE_STORAGE_DIR wajib diisi untuk restore storage."
  mkdir -p "$RESTORE_STORAGE_DIR"
  log "Mulai restore storage ke $RESTORE_STORAGE_DIR dari $artifact"
  artifact_stream "$artifact" | tar -xzf - -C "$RESTORE_STORAGE_DIR"
}

run_restore() {
  assert_backup_dir
  is_true "$RESTORE_DB_ENABLED" || is_true "$RESTORE_STORAGE_ENABLED" || fail "Minimal salah satu dari RESTORE_DB_ENABLED atau RESTORE_STORAGE_ENABLED harus true."

  local manifest timestamp db_artifact storage_artifact db_provider
  manifest="$(find_manifest)"
  [ -n "$manifest" ] || fail "Manifest backup tidak ditemukan untuk RESTORE_TIMESTAMP=$RESTORE_TIMESTAMP."
  timestamp="$(manifest_value "$manifest" timestamp_utc)"
  [ -n "$timestamp" ] || fail "timestamp_utc tidak ditemukan di manifest: $manifest"

  log "Manifest terpilih: $manifest"

  if is_true "$RESTORE_DB_ENABLED"; then
    db_artifact="$(artifact_for "$manifest" database_artifact simdp-db "$timestamp")" || fail "Database artifact tidak ditemukan untuk timestamp $timestamp."
    db_provider="$(resolve_db_target_provider)"
    assert_db_restore_ready "$db_provider"
    restore_database "$db_provider" "$db_artifact"
  else
    log "Lewati restore database karena RESTORE_DB_ENABLED=false"
  fi

  if is_true "$RESTORE_STORAGE_ENABLED"; then
    storage_artifact="$(artifact_for "$manifest" storage_artifact simdp-storage "$timestamp")" || fail "Storage artifact tidak ditemukan untuk timestamp $timestamp."
    restore_storage "$storage_artifact"
  else
    log "Lewati restore storage karena RESTORE_STORAGE_ENABLED=false"
  fi

  log "Restore selesai."
}

dry_run() {
  assert_backup_dir
  local manifest timestamp
  manifest="$(find_manifest)"
  [ -n "$manifest" ] || fail "Manifest backup tidak ditemukan untuk RESTORE_TIMESTAMP=$RESTORE_TIMESTAMP."
  timestamp="$(manifest_value "$manifest" timestamp_utc)"

  log "Dry run restore lokal/VPS SIMDP"
  printf 'RESTORE_BACKUP_DIR=%s\n' "$BACKUP_DIR"
  printf 'RESTORE_TIMESTAMP=%s\n' "$RESTORE_TIMESTAMP"
  printf 'selected_manifest=%s\n' "$manifest"
  printf 'selected_timestamp=%s\n' "$timestamp"
  printf 'RESTORE_DB_ENABLED=%s\n' "$RESTORE_DB_ENABLED"
  printf 'RESTORE_STORAGE_ENABLED=%s\n' "$RESTORE_STORAGE_ENABLED"
  printf 'RESTORE_DB_TARGET_PROVIDER=%s\n' "$RESTORE_DB_TARGET_PROVIDER"
  printf 'RESTORE_DB_DOCKER_CONTAINER=%s\n' "${RESTORE_DB_DOCKER_CONTAINER:-<missing>}"
  printf 'RESTORE_DATABASE_URL=%s\n' "$([ -n "$RESTORE_DATABASE_URL" ] && printf '<set>' || printf '<missing>')"
  printf 'RESTORE_STORAGE_DIR=%s\n' "${RESTORE_STORAGE_DIR:-<missing>}"
  printf 'RESTORE_CONFIRM=%s\n' "$([ -n "$RESTORE_CONFIRM" ] && printf '<set>' || printf '<missing>')"

  for cmd in gzip tar docker psql openssl; do
    if command -v "$cmd" >/dev/null 2>&1; then
      printf 'command_%s=ok\n' "$cmd"
    else
      printf 'command_%s=missing\n' "$cmd"
    fi
  done
}

case "$COMMAND" in
  restore)
    run_restore
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
