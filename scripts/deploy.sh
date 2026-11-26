#!/usr/bin/env bash
set -euo pipefail
# Carrega .env local (não versionado), se existir
if [[ -f "$(dirname "$0")/../.env" ]]; then set -a; . "$(dirname "$0")/../.env"; set +a; fi

# Deploy manual de site estático (build dist/ + tar over SSH).
# Configuração 100% via variáveis de ambiente (nunca commitar host ou chaves).
#
# Uso:
#   DEPLOY_HOST="usuario@seu-host" DEPLOY_KEY="$HOME/.ssh/sua_chave" ./scripts/deploy.sh

APP="${APP:-mobilita}"
DEPLOY_HOST="${DEPLOY_HOST:?Erro: defina DEPLOY_HOST (ex: usuario@vps.exemplo.com)}"
DEPLOY_KEY="${DEPLOY_KEY:-}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/sites/${APP}}"
BACKUP_DIR="${BACKUP_DIR:-/opt/sites-backups/${APP}}"
KEEP_BACKUPS="${KEEP_BACKUPS:-5}"
DIST_DIR="${DIST_DIR:-dist}"
SKIP_BUILD="${SKIP_BUILD:-0}"
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"

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

COMMIT_SHA="$(git rev-parse --short HEAD)"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_TAG="${TIMESTAMP}-${COMMIT_SHA}"

echo "[deploy] app=${APP} ref=HEAD (${COMMIT_SHA}) -> ${DEPLOY_HOST}:${DEPLOY_DIR}"

if [[ "${SKIP_BUILD}" != "1" ]]; then
  echo "[deploy] Executando build de produção (npm ci && npm run build)..."
  npm ci
  npm run build
fi

if [[ ! -d "${DIST_DIR}" ]]; then
  echo "Erro: diretório de build '${DIST_DIR}' ausente." >&2
  exit 1
fi

if [[ ! -f "${DIST_DIR}/index.html" ]]; then
  echo "Erro: '${DIST_DIR}/index.html' ausente." >&2
  exit 1
fi

if find "${DIST_DIR}" -mindepth 1 \( -name '.*' -o -name '*.env*' \) -print -quit | grep -q .; then
  echo "Erro: '${DIST_DIR}' contém dotfiles ou arquivos .env." >&2
  exit 1
fi

if grep -rn -- "__mobilitaNavigate" "${DIST_DIR}" >/dev/null 2>&1; then
  echo "Erro: '${DIST_DIR}' contém '__mobilitaNavigate' (build não é de produção)." >&2
  exit 1
fi

tar -cf - -C "${DIST_DIR}" . \
  | ssh "${SSH_OPTS[@]}" "${DEPLOY_HOST}" bash -s -- \
      "${APP}" "${DEPLOY_DIR}" "${BACKUP_DIR}" "${KEEP_BACKUPS}" "${RELEASE_TAG}" "${CADDYFILE}" <<'REMOTE'
set -euo pipefail

APP="$1"
DEPLOY_DIR="$2"
BACKUP_DIR="$3"
KEEP_BACKUPS="$4"
RELEASE_TAG="$5"
CADDYFILE="$6"

STAGE_DIR="${DEPLOY_DIR}.new.${RELEASE_TAG}"
OLD_DIR="${DEPLOY_DIR}.old.${RELEASE_TAG}"

cleanup() {
  rm -rf "${STAGE_DIR}"
}
trap cleanup ERR

run_privileged() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo -n "$@"
  fi
}

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

echo "[remote] Validando configuração do Caddy (${CADDYFILE})..."
if ! run_privileged caddy validate --config "${CADDYFILE}"; then
  echo "[remote] Erro: caddy validate falhou para ${CADDYFILE}; abortando reload." >&2
  exit 1
fi
run_privileged systemctl reload caddy

echo "[remote] Release ${RELEASE_TAG} publicada em ${DEPLOY_DIR}"
REMOTE

echo "[deploy] Concluído: ${APP} (${RELEASE_TAG})."
