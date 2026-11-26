Papel: dev-frontend (leia `.claude/agents/dev-frontend.md`). Base: branch master, commit 8207d20 (site v1 em `site/`, testes em `tests/e2e/site.spec.ts`, 6/6 pass). Conteúdo/marca: `docs/brand-brief.md`.

Mudanças:
1. MOBILE-FIRST real em `site/styles.css`: estilos base = celular 375px; só `min-width` media queries para tablet/desktop (remover abordagem desktop-first). No celular: barra fixa inferior com "WhatsApp" e "Ligar" (alcance do polegar; não cobrir conteúdo — padding-bottom no body), alvos de toque >=48px, inputs grandes com type corretos (tel, date, time, number; inputmode), hero legível sem cortar slogan. Imagens: gerar WebP com `<picture>` + fallback e srcset (sharp via npx ok).
2. WhatsApp DIRETO, sem página intermediária do wa.me, em todos os CTAs (header, hero, barra inferior, flutuante, contato, formulário). Helper `openWhatsApp(phone, text)` em `site/main.js`:
   - Mobile (Android/iOS): `location.href = 'whatsapp://send?phone=<digits>&text=' + encodeURIComponent(text)`; se após ~1500ms a página continuar visível (sem visibilitychange/blur), fallback `https://wa.me/<digits>?text=...`.
   - Desktop: abrir `https://web.whatsapp.com/send?phone=<digits>&text=...` em nova aba.
   - Manter `href="https://wa.me/..."` nos `<a>` (fallback sem JS) e interceptar click.
   - Números só dígitos: 5519998108070 (principal) e 5519992638676. Botões Ligar: `tel:+5519998108070`.
   - Mensagem pré-preenchida contextual por CTA (ex.: "Olá! Vim pelo site e gostaria de um orçamento de transfer."). Formulário continua montando a mensagem com os campos.
3. Melhorias aprovadas: máscara leve de telefone BR (permitindo dígitos livres) e data mínima = hoje.

Arquivos permitidos: `site/**`, `tests/**`, `playwright.config.ts`, `package.json`, `docs/test-matrix.md`. Proibidos: `public/assets/**`, `.env*`, credenciais.

Prova: atualizar `tests/e2e/site.spec.ts` com projetos Playwright mobile (iPhone 13 e Pixel 7) + desktop: barra inferior visível só no mobile; sem scroll horizontal em 375; com UA mobile o click tenta `whatsapp://send` com phone/text corretos (intercepte navegação); no desktop abre `web.whatsapp.com/send`; href fallback correto; formulário gera texto com os campos. Screenshots mobile-375 (primeiro) e desktop-1440 em `tests/screenshots/`. Rode só essa suíte; reporte pass/fail. Atualize `docs/test-matrix.md`.

Commit em master. Mapeie com rg antes de abrir arquivos; economize tokens: não leia arquivos inteiros sem necessidade, não narre.
worker_done: resultado, comando + pass/fail, arquivos, bloqueios, até 3 propostas (arquivo:linha, ganho, esforço, risco+mitigação).
