#!/usr/bin/env bash
set -euo pipefail

# Rollback do site estático a partir dos backups em BACKUP_DIR.
# Configuração 100% via variáveis de ambiente (nunca commitar host ou chaves).
#
# Uso:
#   DEPLOY_HOST="usuario@seu-host" DEPLOY_KEY="$HOME/.ssh/sua_chave" ./scripts/rollback.sh --list
#   DEPLOY_HOST="usuario@seu-host" DEPLOY_KEY="$HOME/.ssh/sua_chave" ./scripts/rollback.sh [nome-do-backup.tar.gz]

APP="${APP:-mobilita}"
DEPLOY_HOST="${DEPLOY_HOST:?Erro: defina DEPLOY_HOST (ex: usuario@vps.exemplo.com)}"
DEPLOY_KEY="${DEPLOY_KEY:-}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/sites/${APP}}"
BACKUP_DIR="${BACKUP_DIR:-/opt/sites-backups/${APP}}"
TARGET="${1:-}"

SSH_OPTS=(-p "${DEPLOY_PORT}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${DEPLOY_KEY}" ]]; then
  if [[ ! -f "${DEPLOY_KEY}" ]]; then
    echo "Erro: chave SSH não encontrada em DEPLOY_KEY='${DEPLOY_KEY}'." >&2
    exit 1
  fi
  SSH_OPTS+=(-i "${DEPLOY_KEY}")
fi

if [[ "${TARGET}" == "--list" || "${TARGET}" == "-l" ]]; then
  ssh "${SSH_OPTS[@]}" "${DEPLOY_HOST}" bash -s -- "${APP}" "${BACKUP_DIR}" <<'REMOTE'
set -euo pipefail
APP="$1"
BACKUP_DIR="$2"
if [[ ! -d "${BACKUP_DIR}" ]]; then
  echo "Nenhum diretório de backup encontrado em ${BACKUP_DIR}." >&2
  exit 1
fi
ls -1t "${BACKUP_DIR}/${APP}-"*.tar.gz 2>/dev/null || echo "Nenhum backup disponível."
REMOTE
  exit 0
fi

TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
echo "[rollback] app=${APP} host=${DEPLOY_HOST} target=${TARGET:-<mais recente>}"

ssh "${SSH_OPTS[@]}" "${DEPLOY_HOST}" bash -s -- \
  "${APP}" "${DEPLOY_DIR}" "${BACKUP_DIR}" "${TARGET}" "${TIMESTAMP}" <<'REMOTE'
set -euo pipefail

APP="$1"
DEPLOY_DIR="$2"
BACKUP_DIR="$3"
TARGET="$4"
TIMESTAMP="$5"

if [[ -z "${TARGET}" ]]; then
  BACKUP_FILE="$(ls -1t "${BACKUP_DIR}/${APP}-"*.tar.gz 2>/dev/null | head -n 1 || true)"
else
  BACKUP_FILE="${BACKUP_DIR}/$(basename "${TARGET}")"
fi

if [[ -z "${BACKUP_FILE}" || ! -f "${BACKUP_FILE}" ]]; then
  echo "[remote] Erro: backup não encontrado (${BACKUP_FILE:-nenhum})." >&2
  exit 1
fi

STAGE_DIR="${DEPLOY_DIR}.rollback.${TIMESTAMP}"
OLD_DIR="${DEPLOY_DIR}.pre-rollback.${TIMESTAMP}"

cleanup() {
  rm -rf "${STAGE_DIR}"
}
trap cleanup ERR

mkdir -p "${STAGE_DIR}"
tar -xzf "${BACKUP_FILE}" -C "${STAGE_DIR}"

if [[ ! -f "${STAGE_DIR}/index.html" ]]; then
  echo "[remote] Erro: backup inválido (index.html ausente)." >&2
  exit 1
fi

chmod -R a+rX "${STAGE_DIR}"

if [[ -d "${DEPLOY_DIR}" ]]; then
  mv "${DEPLOY_DIR}" "${OLD_DIR}"
fi

mv "${STAGE_DIR}" "${DEPLOY_DIR}"
rm -rf "${OLD_DIR}"

echo "[remote] Rollback concluído usando $(basename "${BACKUP_FILE}")"
REMOTE

echo "[rollback] Concluído."
