# Matriz de Testes — Site Mobilità Transportes (v11)

Comando de execução:

```bash
npx playwright test tests/e2e/site.spec.ts
```

Projetos Playwright configurados em `playwright.config.ts`:
- `mobile-iphone-13` (390×844, UA iPhone iOS, touch)
- `mobile-pixel-7` (412×915, UA Android Pixel 7, touch)
- `desktop-chrome` (1280×720, UA Desktop Chrome)

| ID | Cenário | Teste em `tests/e2e/site.spec.ts` | Projetos | Critério de Aprovação |
|---|---|---|---|---|
| TC-01 | SEO, fontes KoHo 400–700, tokens v11, `<picture>` WebP e integridade de imagens | `SEO, fontes KoHo 400-700, tokens v11, <picture> WebP e zero imagens quebradas` | todos | Título, `lang="pt-BR"`, OG, JSON-LD `LocalBusiness`, `body >= 18px`, tokens `#54963e` / `#606167` / `#f2f2f2`, 3 fotos `.webp` via `<picture>`, zero imagens quebradas e ausência de texto invasor (`WP Shell uploader`). |
| TC-02 | Estrutura das 6 seções, WhatsApp corrigido (`5519992638676`) e roteamento | `estrutura das 6 seções, WhatsApp correto (5519992638676) e roteamento mobile/desktop` | todos | Seções na ordem exata (`#inicio`, `#quemsomos`, `#oquefazemos`, `#diferenciais`, `#frota`, `#contato`), 5 serviços, 7 diferenciais, zero href com hífen, clique roteia para `whatsapp://send` (mobile) ou `web.whatsapp.com/send` (desktop), telefones sem quebra. |
| TC-03 | Formulário de contato acessível e envio para WhatsApp | `formulário de contato: labels visíveis, validação acessível e envio para WhatsApp` | todos | Envio vazio marca `aria-invalid`, exibe erro e foca o 1º campo inválido; preenchimento aplica máscara BR leve, envia mensagem formatada e exibe `role="status"` com fallback `wa.me`. |
| TC-04 | Acessibilidade WCAG 2.2 AA | `acessibilidade WCAG 2.2 AA: landmarks, skip link, headings, alts, alvos >=48px e contraste` | todos | Landmarks (`header`, `main`, `footer`), skip link, 1 `<h1>` sem saltos de nível, `alt` em todas as imagens, alvos `>=48px`, contraste `>=4.5:1` em botões, textos sobre verde e labels. |
| TC-05 | Menu mobile por teclado e zero overflow horizontal | `menu mobile acessível por teclado (aria-expanded, focus trap, Esc) e sem overflow horizontal` | todos | Sem scroll horizontal; no mobile, `aria-expanded`, focus trap com `Shift+Tab`, `Esc` fecha e restaura foco em `#menu-toggle`; no desktop, navegação pelas 6 âncoras. |
| TC-06 | Lazy load, skeleton shimmer e `fetchpriority="high"` | `lazy load + skeleton shimmer abaixo da dobra e hero com fetchpriority=high` | todos | Hero com `fetchpriority="high"` sem lazy; imagens abaixo da dobra com `loading="lazy"`, `decoding="async"`, `width`/`height`; `.img-skel` resolve para `.is-loaded` via HTTP e `file://`. |
| TC-07 | Reduced motion e scroll reveal | `prefers-reduced-motion desliga animações mantendo conteúdo visível; com movimento ativa reveals` | todos | Com `reduce`, `html` sem `js-motion`, animações `none` e `.reveal` opacidade 1; com movimento, `html.js-motion` e `.is-visible` aplicado ao rolar. |
| TC-08 | Evidência visual 1440 e 375 | `captura screenshots 1440 e 375 em test-results` | `desktop-chrome` | Gera `test-results/v11-1440-fold.png`, `test-results/v11-1440-full.png`, `test-results/v11-375-fold.png` e `test-results/v11-375-full.png`. |

| Acessibilidade axe-core (serious/critical, WCAG 2.2 AA, desktop+mobile) | e2e | tests/e2e/site.spec.ts |
