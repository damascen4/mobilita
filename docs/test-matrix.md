# Matriz de Testes — Site Mobilità Transportes (v14)

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
| TC-01 | SEO, fontes KoHo 400–700, tokens, SVG inline/marca, `<picture>` srcset WebP e integridade de imagens | `SEO, fontes KoHo 400-700, tokens, SVG inline/marca, <picture> srcset WebP e zero imagens quebradas` | todos | Título, `lang="pt-BR"`, OG, JSON-LD `LocalBusiness`, `body >= 18px`, tokens `#54963e` / `#606167` / `#f2f2f2`, logos e folha SVG, 7 ícones `.diff-glyph` inline (`stroke="currentColor"`), 3 fotos com `srcset` 480w/960w/1600w + `sizes`, hero mobile carregando `960w`, zero imagens quebradas. |
| TC-02 | Estrutura das 6 seções, WhatsApp corrigido (`5519992638676`) e roteamento | `estrutura das 6 seções, WhatsApp correto (5519992638676) e roteamento mobile/desktop` | todos | Seções na ordem exata (`#inicio`, `#quemsomos`, `#oquefazemos`, `#diferenciais`, `#frota`, `#contato`), 5 serviços, 7 diferenciais, zero href com hífen, clique roteia para `whatsapp://send` (mobile) ou `web.whatsapp.com/send` (desktop), telefones sem quebra. |
| TC-03 | Formulário de contato acessível, Web3Forms (sucesso/erro mock) e atalho WhatsApp | `formulário de contato: validação acessível, envio Web3Forms (sucesso/erro mock) e atalho WhatsApp` | todos | Placeholder `WEB3FORMS_ACCESS_KEY_AQUI`, honeypot `botcheck`, atalho WhatsApp; envio vazio marca `aria-invalid`, exibe erro e foca o 1º campo; mock 200 exibe status de sucesso (`aria-live="polite"`) e limpa form; mock 500 exibe alerta (`role="alert"`) com fallback `wa.me`. |
| TC-04 | Acessibilidade WCAG 2.2 AA | `acessibilidade WCAG 2.2 AA: landmarks, skip link, headings, alts, alvos >=48px e contraste` | todos | Landmarks (`header`, `main`, `footer`), skip link, 1 `<h1>` sem saltos de nível, `alt` em todas as imagens, alvos `>=48px`, contraste `>=4.5:1` em botões, textos sobre verde e labels. |
| TC-05 | Menu mobile por teclado e zero overflow horizontal | `menu mobile acessível por teclado (aria-expanded, focus trap, Esc) e sem overflow horizontal` | todos | Sem scroll horizontal; no mobile, `aria-expanded`, focus trap com `Shift+Tab`, `Esc` fecha e restaura foco em `#menu-toggle`; no desktop, navegação pelas 6 âncoras. |
| TC-06 | Lazy load, skeleton shimmer e `fetchpriority="high"` | `lazy load + skeleton shimmer abaixo da dobra e hero com fetchpriority=high` | todos | Hero com `fetchpriority="high"` sem lazy; imagens abaixo da dobra com `loading="lazy"`, `decoding="async"`, `width`/`height`; `.img-skel` resolve para `.is-loaded` via HTTP e `file://`. |
| TC-07 | Reduced motion, splash inicial (<1s), barra de progresso, scroll reveal e stroke-draw SVG | `prefers-reduced-motion desliga animações mantendo conteúdo visível; com movimento ativa splash, barra de scroll e reveals` | todos | Com `reduce`, `html` sem `js-motion`, `#page-splash` e `#scroll-progress` ocultos, animações `none`, `.reveal` opacidade 1 e `stroke-dashoffset: 0`; com movimento, `#page-splash` oculta em `<1s`, `#scroll-progress-bar` escala com scroll e `.hero-leaf`/`.diff-item` recebem `.is-visible`. |
| TC-08 | Evidência visual 1440 e 375 (v14) | `captura screenshots 1440 e 375 em test-results/v14` | `desktop-chrome` | Gera `test-results/v14/v14-1440-fold.png`, `test-results/v14/v14-1440-full.png`, `test-results/v14/v14-375-fold.png` e `test-results/v14/v14-375-full.png`. |
| TC-09 | Hero editorial, CTAs de serviço, especificações da frota e topbar (v14) | `v14: hero editorial com faixa de fatos, CTAs por serviço, especificações da frota e topbar` | todos | `.hero-card` ausente, 3 itens `.hero-facts`, 5 links `.service-link`, 6 itens `.fleet-specs`, gap no topbar. |
| TC-10 | Acessibilidade axe-core (serious/critical, WCAG 2.2 AA, desktop+mobile) | `axe-core: sem violações serious/critical (WCAG 2.2 AA) em desktop e mobile` | todos | Zero violações serious/critical WCAG 2.2 AA. |
