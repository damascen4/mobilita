# Deploy — Mobilità Transportes (`damascena.dev/projetos/mobilita`)

## Arquitetura

- **Stack**: site estático puro (HTML, CSS e JS vanilla em `site/`, build de produção em `dist/` via `scripts/build.mjs`).
- **Servidor**: servido diretamente pelo **Caddy** (sem processo Node.js e sem unit `systemd` adicional).
- **Coexistência**: compartilha a VPS com o `screenshare` (porta `127.0.0.1:8787` não é tocada).
- **Caminhos na VPS**:
  - Produção: `/opt/sites/mobilita`
  - Backups (últimos 5): `/opt/sites-backups/mobilita`
- **DNS / TLS**: Cloudflare com proxy ativado e **SSL/TLS: Full (strict)** + `trusted_proxies` no Caddy.

## 1. Primeira instalação na VPS

1. **Crie os diretórios de destino e backup** (ajuste `<deploy_user>` para o usuário SSH usado no deploy):

   ```bash
   sudo mkdir -p /opt/sites/mobilita /opt/sites-backups/mobilita
   sudo chown -R <deploy_user>:<deploy_user> /opt/sites/mobilita /opt/sites-backups/mobilita
   sudo chmod 755 /opt/sites /opt/sites/mobilita /opt/sites-backups /opt/sites-backups/mobilita
   ```

2. **Configure o DNS no Cloudflare**:
   - Registro `A`/`AAAA` para `damascena.dev` apontando para a VPS (Proxy ON).
   - Modo SSL/TLS: **Full (strict)**.

3. **Configure o Caddy**:
   - Use `deploy/Caddyfile.damascena.dev` como referência.
   - A raiz de `damascena.dev` serve `/robots.txt` e `/sitemap.xml` inline via diretiva `respond` no Caddyfile (listando `https://damascena.dev/projetos/mobilita/`), dispensando arquivos extras fora de `/opt/sites/mobilita`. O build também inclui `sitemap.xml` em `/projetos/mobilita/sitemap.xml`.
   - Se o `/etc/caddy/Caddyfile` já tiver o bloco global `{ servers { trusted_proxies ... } }` do `screenshare`, **não duplique o bloco global** — adicione apenas o bloco `damascena.dev { ... }` (diretamente ou via `import /etc/caddy/sites-enabled/*.caddy`).
   - Valide e recarregue sem downtime:

   ```bash
   sudo caddy validate --config /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

## 2. Deploy

O script executa `npm ci && npm run build` (gerando `dist/` sem `window.__mobilitaNavigate`), valida que `dist/` existe, não contém `__mobilitaNavigate` nem dotfiles/`.env`, empacota `dist/` via `tar` por SSH, faz troca atômica em `/opt/sites/mobilita`, mantém os últimos 5 backups em `/opt/sites-backups/mobilita` e executa `caddy validate --config /etc/caddy/Caddyfile` antes de `systemctl reload caddy` (abortando se a validação falhar).

```bash
export DEPLOY_HOST="<usuario>@<host-da-vps>"
export DEPLOY_KEY="$HOME/.ssh/<sua-chave>"
export DEPLOY_KNOWN_HOSTS="$HOME/.ssh/known_hosts"   # fixado; gere antes com ssh-keyscan -p <porta> <host> >> "$DEPLOY_KNOWN_HOSTS"
export WEB3FORMS_ACCESS_KEY="<chave-web3forms>"      # obrigatória no build de produção (pode ser definida em .env local não versionado)
# Opcionais (valores padrão já configurados):
# export ALLOW_MISSING_WEB3FORMS="1"                 # permite build/deploy de visualização sem WEB3FORMS_ACCESS_KEY (formulário vai direto para o WhatsApp sem POST)
# export APP="mobilita"
# export DEPLOY_PORT="22"
# export DEPLOY_DIR="/opt/sites/mobilita"
# export BACKUP_DIR="/opt/sites-backups/mobilita"
# export DIST_DIR="dist"
# export SKIP_BUILD="0"                              # defina "1" para reutilizar dist/ já gerado
# export CADDYFILE="/etc/caddy/Caddyfile"

./scripts/deploy.sh
```

> Nunca salve `DEPLOY_HOST`, IPs ou chaves SSH em arquivos versionados. Os scripts usam `StrictHostKeyChecking=yes` com `UserKnownHostsFile="${DEPLOY_KNOWN_HOSTS}"` (padrão `~/.ssh/known_hosts`).

## 3. Rollback

```bash
# Listar backups disponíveis
./scripts/rollback.sh --list

# Restaurar o backup mais recente
./scripts/rollback.sh

# Restaurar um backup específico
./scripts/rollback.sh mobilita-YYYYMMDD-HHMMSS-sha.tar.gz
```

## 4. Validação local e pós-deploy

Localmente (antes do deploy):

```bash
WEB3FORMS_ACCESS_KEY="<chave-web3forms>" npm run build
# Ou, para build de visualização sem chave (fallback direto para WhatsApp):
# ALLOW_MISSING_WEB3FORMS=1 npm run build
npm run test:e2e:subpath
```

Após o deploy na VPS:

```bash
curl -I https://damascena.dev/projetos/mobilita      # esperado: 308 -> /projetos/mobilita/
curl -I https://damascena.dev/projetos/mobilita/     # esperado: 200 + headers de segurança
curl -I https://damascena.dev/                       # esperado: 200 (placeholder)
curl -s https://damascena.dev/robots.txt             # esperado: 200 (User-agent: *, Sitemap: https://damascena.dev/sitemap.xml)
curl -s https://damascena.dev/sitemap.xml            # esperado: 200 (lista https://damascena.dev/projetos/mobilita/)
```

## Mobilità v2 (redesign) em /projetos/mobilitav2

Deploy paralelo à v1 (`/projetos/mobilita`, inalterada): `APP=mobilitav2 ./scripts/deploy.sh` publica em `/opt/sites/mobilitav2`. O bloco `handle_path /projetos/mobilitav2/*` (+ redir 308 e 404 amigável) está em `deploy/Caddyfile.damascena.dev`; copiar o Caddyfile e recarregar o Caddy é passo do operador/CI.
