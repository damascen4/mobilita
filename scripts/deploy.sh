#!/usr/bin/env bash
set -euo pipefail

# Deploy manual de site estático via git archive + tar over SSH.
# Configuração 100% via variáveis de ambiente (nunca commitar host ou chaves).
#
# Uso:
#   DEPLOY_HOST="usuario@seu-host" DEPLOY_KEY="$HOME/.ssh/sua_chave" ./scripts/deploy.sh [git-ref]

APP="${APP:-mobilita}"
DEPLOY_HOST="${DEPLOY_HOST:?Erro: defina DEPLOY_HOST (ex: usuario@vps.exemplo.com)}"
DEPLOY_KEY="${DEPLOY_KEY:-}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/sites/${APP}}"
BACKUP_DIR="${BACKUP_DIR:-/opt/sites-backups/${APP}}"
KEEP_BACKUPS="${KEEP_BACKUPS:-5}"
GIT_REF="${1:-HEAD}"
SITE_SUBDIR="${SITE_SUBDIR:-site}"

if ! git rev-parse --verify "${GIT_REF}:${SITE_SUBDIR}" >/dev/null 2>&1; then
  echo "Erro: referência git '${GIT_REF}:${SITE_SUBDIR}' não encontrada." >&2
  exit 1
fi

DEPLOY_KNOWN_HOSTS="${DEPLOY_KNOWN_HOSTS:-${HOME}/.ssh/known_hosts}"
if [[ ! -f "${DEPLOY_KNOWN_HOSTS}" ]]; then
  echo "Erro: arquivo known_hosts não encontrado em DEPLOY_KNOWN_HOSTS='${DEPLOY_KNOWN_HOSTS}'." >&2
  exit 1
fi

SSH_OPTS=(-p "${DEPLOY_PORT}" -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=${DEPLOY_KNOWN_HOSTS}")
if [[ -n "${DEPLOY_KEY}" ]]; then
  if [[ ! -f "${DEPLOY_KEY}" ]]; then
    echo "Erro: chave SSH não encontrada em DEPLOY_KEY='${DEPLOY_KEY}'." >&2
    exit 1
  fi
  SSH_OPTS+=(-i "${DEPLOY_KEY}")
fi

COMMIT_SHA="$(git rev-parse --short "${GIT_REF}")"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_TAG="${TIMESTAMP}-${COMMIT_SHA}"

echo "[deploy] app=${APP} ref=${GIT_REF} (${COMMIT_SHA}) -> ${DEPLOY_HOST}:${DEPLOY_DIR}"

# Valida build local (caminhos relativos para subpath) antes de enviar
if command -v node >/dev/null 2>&1 && [[ -f "scripts/build.mjs" ]]; then
  echo "[deploy] Validando build estático local..."
  node scripts/build.mjs >/dev/null
fi

git archive --format=tar "${GIT_REF}:${SITE_SUBDIR}" \
  | ssh "${SSH_OPTS[@]}" "${DEPLOY_HOST}" bash -s -- \
      "${APP}" "${DEPLOY_DIR}" "${BACKUP_DIR}" "${KEEP_BACKUPS}" "${RELEASE_TAG}" <<'REMOTE'
set -euo pipefail

APP="$1"
DEPLOY_DIR="$2"
BACKUP_DIR="$3"
KEEP_BACKUPS="$4"
RELEASE_TAG="$5"

STAGE_DIR="${DEPLOY_DIR}.new.${RELEASE_TAG}"
OLD_DIR="${DEPLOY_DIR}.old.${RELEASE_TAG}"

cleanup() {
  rm -rf "${STAGE_DIR}"
}
trap cleanup ERR

mkdir -p "$(dirname "${DEPLOY_DIR}")" "${BACKUP_DIR}" "${STAGE_DIR}"
tar -xf - -C "${STAGE_DIR}"

if [[ ! -f "${STAGE_DIR}/index.html" ]]; then
  echo "[remote] Erro: index.html ausente no pacote enviado." >&2
  exit 1
fi

# Permissões de leitura para o usuário do Caddy servir os arquivos
chmod -R a+rX "${STAGE_DIR}"

if [[ -d "${DEPLOY_DIR}" ]]; then
  mv "${DEPLOY_DIR}" "${OLD_DIR}"
fi

mv "${STAGE_DIR}" "${DEPLOY_DIR}"

if [[ -d "${OLD_DIR}" ]]; then
  BACKUP_FILE="${BACKUP_DIR}/${APP}-${RELEASE_TAG}.tar.gz"
  tar -czf "${BACKUP_FILE}" -C "${OLD_DIR}" .
  rm -rf "${OLD_DIR}"
  echo "[remote] Backup salvo em ${BACKUP_FILE}"

  # Mantém apenas os últimos KEEP_BACKUPS arquivos
  ls -1t "${BACKUP_DIR}/${APP}-"*.tar.gz 2>/dev/null \
    | tail -n +"$((KEEP_BACKUPS + 1))" \
    | xargs -r rm -f
fi

echo "[remote] Release ${RELEASE_TAG} publicada em ${DEPLOY_DIR}"
REMOTE

echo "[deploy] Concluído: ${APP} (${RELEASE_TAG})."
