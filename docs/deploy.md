# Deploy — Mobilità Transportes (`damascena.dev/projetos/mobilita`)

## Arquitetura

- **Stack**: site estático puro (HTML, CSS e JS vanilla em `site/`).
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
   - Se o `/etc/caddy/Caddyfile` já tiver o bloco global `{ servers { trusted_proxies ... } }` do `screenshare`, **não duplique o bloco global** — adicione apenas o bloco `damascena.dev { ... }` (diretamente ou via `import /etc/caddy/sites-enabled/*.caddy`).
   - Valide e recarregue sem downtime:

   ```bash
   sudo caddy validate --config /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

## 2. Deploy

O script empacota `site/` via `git archive` + `tar` por SSH, faz troca atômica em `/opt/sites/mobilita` e mantém os últimos 5 backups em `/opt/sites-backups/mobilita`.

```bash
export DEPLOY_HOST="<usuario>@<host-da-vps>"
export DEPLOY_KEY="$HOME/.ssh/<sua-chave>"
export DEPLOY_KNOWN_HOSTS="$HOME/.ssh/known_hosts"   # fixado; gere antes com ssh-keyscan -p <porta> <host> >> "$DEPLOY_KNOWN_HOSTS"
# Opcionais (valores padrão já configurados):
# export APP="mobilita"
# export DEPLOY_PORT="22"
# export DEPLOY_DIR="/opt/sites/mobilita"
# export BACKUP_DIR="/opt/sites-backups/mobilita"

./scripts/deploy.sh          # publica HEAD
./scripts/deploy.sh v1.2.0   # publica tag/branch/commit específico
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
npm run build
npm run test:e2e:subpath
```

Após o deploy na VPS:

```bash
curl -I https://damascena.dev/projetos/mobilita      # esperado: 308 -> /projetos/mobilita/
curl -I https://damascena.dev/projetos/mobilita/     # esperado: 200 + headers de segurança
curl -I https://damascena.dev/                       # esperado: 200 (placeholder)
```
