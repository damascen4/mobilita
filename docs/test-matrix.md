# Matriz de Testes — Site Mobilità Transportes

Comando de execução:

```bash
npx playwright test tests/e2e/site.spec.ts
```

Projetos Playwright configurados em `playwright.config.ts`:
- `mobile-iphone-13` (390x844, UA iPhone iOS, touch)
- `mobile-pixel-7` (412x915, UA Android Pixel 7, touch)
- `desktop-chrome` (1280x720, UA Desktop Chrome)

| ID | Cenário | Arquivo / Teste | Projetos | Critério de Aprovação |
|---|---|---|---|---|
| TC-01 | Carregamento, SEO, fonte >=18px, WebP `<picture>` e imagens íntegras | `tests/e2e/site.spec.ts` — `carrega página, SEO, fonte >=18px, WebP <picture> e imagens íntegras` | `mobile-iphone-13`, `mobile-pixel-7`, `desktop-chrome` | Título exato do brief, `lang="pt-BR"`, `meta description`, Open Graph, JSON-LD `LocalBusiness`, `font-size` raiz `>= 18px`, `<h1>` visível com slogan, `<picture>` com `source[type="image/webp"]` e `srcset`, e nenhuma imagem quebrada (`naturalWidth > 0`). |
| TC-02 | Barra inferior mobile-only, alvos >=48px, sem scroll horizontal em 375px e navegação | `tests/e2e/site.spec.ts` — `barra inferior fixa visível só no mobile e sem scroll horizontal em 375px` | `mobile-iphone-13`, `mobile-pixel-7`, `desktop-chrome` | `#mobile-bottom-bar` visível apenas nos projetos mobile e oculta no desktop; `.floating-whatsapp` visível apenas no desktop; alvos de toque `>= 48px`; `scrollWidth <= innerWidth` em `375x812`; menu mobile e âncoras desktop funcionais. |
| TC-03 | WhatsApp direto (mobile `whatsapp://send`, desktop `web.whatsapp.com/send`) + fallbacks | `tests/e2e/site.spec.ts` — `CTAs WhatsApp possuem href fallback correto e abrem whatsapp:// no mobile ou web.whatsapp.com no desktop` | `mobile-iphone-13`, `mobile-pixel-7`, `desktop-chrome` | Todos os CTAs mantêm `href="https://wa.me/5519998108070?text=..."` ou `5519992638676` (fallback sem JS) e botões Ligar usam `tel:+5519998108070`; clique com UA mobile tenta `whatsapp://send?phone=...&text=...` com mensagem contextual; clique no desktop abre `https://web.whatsapp.com/send?phone=...&text=...`. |
| TC-04 | Formulário mobile-first: tipos/inputmode, máscara leve BR, data mínima = hoje e envio | `tests/e2e/site.spec.ts` — `formulário aplica máscara leve de telefone, data mínima = hoje e gera mensagem completa` | `mobile-iphone-13`, `mobile-pixel-7`, `desktop-chrome` | Inputs usam `tel`, `date`, `time`, `number` e `inputmode`; `#data` define `min` = data local de hoje; `#telefone` formata BR `(19) 99123-4567` e permite dígitos livres (`5519991234567`); submissão envia todos os campos para `whatsapp://send` (mobile) ou `web.whatsapp.com/send` (desktop) e exibe link fallback `wa.me`. |
| TC-05 | Evidência visual mobile-375 (primeiro) e desktop-1440 | `tests/e2e/site.spec.ts` — `captura screenshots mobile-375 (primeiro) e desktop-1440` | `desktop-chrome` | Gera `tests/screenshots/mobile-375.png` e `tests/screenshots/desktop-1440.png` em página inteira (`fullPage: true`). |

| TC-06 | Reduced-motion: animações desligadas, conteúdo visível, sem loader/overflow | `tests/e2e/site.spec.ts` — `reduced-motion desliga animações...` | todos | `html` sem `js-enabled`, animação do hero/Ken Burns `none`, `.reveal` opacidade 1, sem scroll horizontal. |
| TC-07 | Com movimento: loader 1ª visita some, reveal ao rolar, sem overflow | `tests/e2e/site.spec.ts` — `com movimento: loader da 1ª visita...` | todos | `.intro-loader` removido <3s; `.diff-card` recebe `is-visible` ao rolar. |
| TC-08 | Capturas de seções no meio da rolagem (hero, diferenciais, como-funciona, frota) | `tests/e2e/site.spec.ts` — `screenshots de seções no meio da rolagem` | `desktop-chrome` | Gera `tests/screenshots/{hero,diferenciais,como-funciona,frota}-{mobile,desktop}.png`. |
