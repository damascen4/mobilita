# Deploy — Cloudflare Pages (Mobilità Transportes)

Guia curto para publicar a pasta `site/` no Cloudflare Pages sem pipeline de build.

## 1. Conectar repositório no Cloudflare Pages

1. Acesse o painel da Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Selecione o repositório e a branch principal (`main`).
3. Configure o build:
   - **Framework preset:** `None`
   - **Build command:** *(deixar vazio)*
   - **Build output directory:** `site`
4. Clique em **Save and Deploy**.

## 2. Domínio e DNS

1. No projeto do Cloudflare Pages, abra **Custom domains** → **Set up a custom domain**.
2. Adicione `mobilitatransportes.com.br` (apex) e `www.mobilitatransportes.com.br`.
3. Se o DNS já estiver na Cloudflare, os registros `CNAME` são criados automaticamente; caso contrário, aponte os nameservers do domínio para a Cloudflare.
4. Em **SSL/TLS → Overview**, mantenha o modo **Full (strict)** e **Always Use HTTPS** ativo.
5. *(Opcional)* Como o arquivo `_redirects` não casa query strings, crie uma **Redirect Rule** no painel da Cloudflare para redirecionar URLs antigas `/?p=*` → `https://mobilitatransportes.com.br/` (`301`).

## 3. Verificação pós-migração

- Confirmar HTTPS ativo no domínio apex e redirecionamento `www` → apex (`301`).
- Conferir cabeçalhos de segurança (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`) nas DevTools ou via `curl -I https://mobilitatransportes.com.br/`.
- Testar envio do formulário de contato (Web3Forms) e links de WhatsApp.
- Acessar `/robots.txt`, `/sitemap.xml` e uma rota inexistente para validar `404.html`.

## 4. Desligar WordPress / Hostgator e rotacionar credenciais

Após confirmar que o novo site está estável no Cloudflare Pages:

1. Faça backup final do conteúdo/banco antigo da Hostgator, se necessário.
2. Desative ou cancele a hospedagem WordPress antiga para evitar custos e superfície de ataque.
3. **Troque todas as credenciais** associadas à hospedagem anterior (painel Hostgator, FTP/SFTP, banco MySQL, contas de e-mail administrativas e senhas reutilizadas).
