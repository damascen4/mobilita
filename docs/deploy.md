# Deploy — Hostgator (Apache compartilhado / cPanel)

Guia para substituir a instalação antiga de WordPress pelo site estático da pasta `site/` na hospedagem Hostgator (`mobilitatransportes.com.br`).

## 1. Backup completo do ambiente atual

Antes de remover qualquer arquivo:

1. Acesse o **cPanel** da Hostgator → **Backup** (ou **Gerenciador de Arquivos** + **phpMyAdmin**).
2. Baixe uma cópia completa do diretório `public_html` (compactado em `.zip` ou `.tar.gz`).
3. Baixe o dump do banco de dados MySQL do WordPress (caso precise de referência histórica de textos/contatos).
4. Guarde o backup fora do servidor (localmente). **Não deixe o arquivo `.zip` dentro do `public_html`.**

## 2. Remover WordPress e o arquivo malicioso (shell uploader)

1. No **Gerenciador de Arquivos** do cPanel, clique em **Configurações** (canto superior direito) e marque **Mostrar arquivos ocultos (dotfiles)**.
2. Abra `public_html` e remova **todos** os arquivos e pastas do WordPress (`wp-admin`, `wp-content`, `wp-includes`, `wp-config.php`, `wp-login.php`, `xmlrpc.php`, `index.php`, `.htaccess` antigo, etc.), preservando apenas a pasta `.well-known` (se existir, usada pelo AutoSSL).
3. Localize e remova o arquivo malicioso do **shell uploader** e qualquer outro arquivo `.php`, `.phtml` ou script suspeito deixado pelo invasor em `public_html` e subpastas.
4. Verifique no cPanel → **Trabalhos Cron (Cron Jobs)** se há alguma tarefa suspeita cadastrada e remova-a.
5. No cPanel → **Bancos de Dados MySQL**:
   - Remova o banco de dados do WordPress.
   - Remova o(s) usuário(s) MySQL associados ao WordPress.

## 3. Subir o conteúdo de `site/`

Suba **apenas o conteúdo de dentro da pasta `site/`** diretamente para a raiz de `public_html` (sem subir `node_modules/`, `docs/`, `tests/`, `.git/` ou arquivos `.env*`):

- **Via Gerenciador de Arquivos (cPanel):**
  1. Compacte localmente o conteúdo de `site/` (incluindo o arquivo oculto `.htaccess`) em um `.zip`.
  2. Em `public_html`, clique em **Carregar**, envie o `.zip` e clique em **Extrair**.
  3. Confirme que `index.html`, `404.html`, `styles.css`, `tokens.css`, `main.js`, `inline.js`, `robots.txt`, `sitemap.xml`, `.htaccess` e a pasta `assets/` estão diretamente em `public_html/`.
  4. Apague o `.zip` de `public_html` após extrair.
- **Via FTP/SFTP (FileZilla ou similar):**
  1. Habilite a exibição de arquivos ocultos no cliente FTP.
  2. Envie todo o conteúdo de `site/` para `public_html/` garantindo que `.htaccess` foi transferido.

> **Web3Forms:** antes ou logo após publicar, substitua o placeholder `WEB3FORMS_ACCESS_KEY_AQUI` em `site/index.html` pela chave real do formulário Web3Forms (nunca commite chaves/credenciais no repositório se forem privadas, ou configure conforme política do projeto).

## 4. Conferir que nenhum arquivo PHP restou

No Gerenciador de Arquivos (pesquisa em `public_html` por `.php`) ou via terminal/SSH do cPanel:

```sh
find ~/public_html -iname "*.php*" -o -iname "*.phtml"
```

O resultado deve ser **vazio**. O site é 100% estático (HTML, CSS, JS e assets).

## 5. SSL / HTTPS (AutoSSL)

1. No cPanel, abra **SSL/TLS Status**.
2. Confirme que o **AutoSSL** está ativo e válido para `mobilitatransportes.com.br` e `www.mobilitatransportes.com.br`.
3. Se o certificado estiver expirado ou pendente, clique em **Run AutoSSL**. O `.htaccess` já preserva `/.well-known/` para que a validação funcione automaticamente.

## 6. Rotacionar todas as senhas e chaves

Como houve comprometimento (shell uploader), troque imediatamente todas as credenciais:

- Senha do **painel Hostgator / Portal do Cliente** e **cPanel**.
- Senhas de todas as contas **FTP/SFTP** (e remova contas FTP não utilizadas).
- Senhas de contas **MySQL** remanescentes (se houver outros bancos).
- Senhas das contas de **e-mail** do domínio e quaisquer **chaves de API / tokens** que estivessem no servidor ou em `wp-config.php`.

## 7. Verificação pós-deploy

Execute os checks abaixo após a publicação:

- **HTTPS e www → apex (301):**
  ```sh
  curl -I http://www.mobilitatransportes.com.br/
  curl -I https://www.mobilitatransportes.com.br/
  ```
  Ambos devem retornar `301` para `https://mobilitatransportes.com.br/`.
- **Headers de segurança e cache:**
  ```sh
  curl -I https://mobilitatransportes.com.br/
  ```
  Confirmar `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` e `Cache-Control: public, max-age=300, must-revalidate`.
- **Bloqueios e redirects legados do WordPress:**
  - `/wp-login.php`, `/wp-admin`, `/xmlrpc.php`, `/wp-content/`, `/wp-includes/` → `410 Gone`.
  - `/?p=123` → `301` para `/` (sem query string).
  - `/.htaccess`, `/.env`, `/assets/stock/CREDITS.md` → `403 Forbidden`.
- **Páginas e funcionalidades:**
  - Acessar `/robots.txt`, `/sitemap.xml` e uma URL inexistente (ex.: `/nao-existe`) para validar `404.html`.
  - Testar o formulário de contato (envio real pelo Web3Forms) e os links de WhatsApp.
  - Abrir DevTools → Console e confirmar zero erros de CSP ou recursos bloqueados.
