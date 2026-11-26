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
| TC-01 | Carregamento, SEO, fonte >=18px, WebP `<picture>` e imagens íntegras | `tests/e2e/site.spec.ts` — `carrega página, SEO, fonte >=18px, WebP <picture> e imagens íntegras` | `mobile-iphone-13`, `mobile-pixel-7`, `desktop-chrome` | Título exato do brief, `lang="pt-BR"`, `meta description`, Open Graph, JSON-LD `LocalBusiness`, `font-size` do body `>= 18px` (raiz 16px, tokens em rem), `<h1>` visível com slogan, `<picture>` com `source[type="image/webp"]` e `srcset`, e nenhuma imagem quebrada (`naturalWidth > 0`). |
| TC-02 | Barra inferior mobile-only, alvos >=48px, sem scroll horizontal em 375px e navegação | `tests/e2e/site.spec.ts` — `barra inferior fixa visível só no mobile e sem scroll horizontal em 375px` | `mobile-iphone-13`, `mobile-pixel-7`, `desktop-chrome` | `#mobile-bottom-bar` visível apenas nos projetos mobile e oculta no desktop; `.floating-whatsapp` visível apenas no desktop; alvos de toque `>= 48px`; `scrollWidth <= innerWidth` em `375x812`; menu mobile e âncoras desktop funcionais. |
| TC-03 | WhatsApp direto (mobile `whatsapp://send`, desktop `web.whatsapp.com/send`) + fallbacks | `tests/e2e/site.spec.ts` — `CTAs WhatsApp possuem href fallback correto e abrem whatsapp:// no mobile ou web.whatsapp.com no desktop` | `mobile-iphone-13`, `mobile-pixel-7`, `desktop-chrome` | Todos os CTAs mantêm `href="https://wa.me/5519998108070?text=..."` ou `5519992638676` (fallback sem JS) e botões Ligar usam `tel:+5519998108070`; clique com UA mobile tenta `whatsapp://send?phone=...&text=...` com mensagem contextual; clique no desktop abre `https://web.whatsapp.com/send?phone=...&text=...`. |
| TC-04 | Formulário mobile-first: tipos/inputmode, máscara leve BR, data mínima = hoje e envio | `tests/e2e/site.spec.ts` — `formulário aplica máscara leve de telefone, data mínima = hoje e gera mensagem completa` | `mobile-iphone-13`, `mobile-pixel-7`, `desktop-chrome` | Inputs usam `tel`, `date`, `time`, `number` e `inputmode`; `#data` define `min` = data local de hoje; `#telefone` formata BR `(19) 99123-4567` e permite dígitos livres (`5519991234567`); submissão envia todos os campos para `whatsapp://send` (mobile) ou `web.whatsapp.com/send` (desktop) e exibe link fallback `wa.me`. |
| TC-05 | Evidência visual mobile-375 (primeiro) e desktop-1440 | `tests/e2e/site.spec.ts` — `captura screenshots mobile-375 (primeiro) e desktop-1440` | `desktop-chrome` | v6: gera `tests/screenshots/v6-375.png`, `v6-1440.png` (página inteira) e `v6-1440-form.png` (seção do formulário). |

| TC-06 | Reduced-motion: animações desligadas, conteúdo visível, sem loader/overflow | `tests/e2e/site.spec.ts` — `reduced-motion desliga animações...` | todos | `html` sem `js-enabled`, animação do hero/Ken Burns `none`, `.reveal` opacidade 1, sem scroll horizontal. |
| TC-07 | Com movimento: loader 1ª visita some, reveal ao rolar, sem overflow | `tests/e2e/site.spec.ts` — `com movimento: loader da 1ª visita...` | todos | `.intro-loader` removido <3s; `.diff-card` (1º card rolado à vista) recebe `is-visible`; v5: prints 375/1440 em `tests/screenshots/v5-*.png`. |
| TC-08 | Capturas de seções no meio da rolagem (hero, diferenciais, como-funciona, frota) | `tests/e2e/site.spec.ts` — `screenshots de seções no meio da rolagem` | `desktop-chrome` | Gera `tests/screenshots/{hero,diferenciais,como-funciona,frota}-{mobile,desktop}.png`. |

## v4 (ajustes de cliente) — tests/e2e/site.spec.ts
| Funcionalidade | Tipo | Teste |
|---|---|---|
| Hero sem logo duplicada, folha protagonista | e2e (Playwright) | "hero não duplica a logo do header…" |
| Telefones sem quebra + redes sociais SVG ≥48px | e2e | "telefones nunca quebram linha…" |
| Diferenciais 4+3 centralizados, canais de contato | e2e | "diferenciais: 7 cards…" |
| Serviços largura total, CTA transfer AA | e2e | "serviços ocupam a largura toda…" |
| Calendário custom, horário, stepper, máscara, mensagem WhatsApp | e2e | "formulário aplica máscara leve…" |
| FAB compacto, só após rolar, some em contato | e2e | "barra inferior fixa…" |

## v6 (desktop editorial, skeleton, fotos, form, cursor) — tests/e2e/site.spec.ts
| Funcionalidade | Tipo | Teste |
|---|---|---|
| Skeleton shimmer em imagem lazy; classe `is-loading`/`is-skel` removida após load | e2e (Playwright) | "skeleton: imagem lazy ganha shimmer…" |
| Imagens fora da dobra com `loading=lazy`, width/height, ≥8 fotos novas em `assets/stock` sem repetir entre seções | e2e | "imagens fora da primeira dobra são lazy…" |
| `cursor: pointer` em CTAs/opções do form/calendário/stepper/label; `not-allowed` em desabilitados | e2e | "cursor: pointer em CTAs…" |
| Form em bloco verde, card branco, cabeçalho (H3, faixa escura, divisor) distinto dos campos | e2e | "formulário: bloco verde com card branco…" |
| Desktop: hero sticky tela cheia, fatos, marquee, bento 12 col; ausentes no mobile | e2e | "desktop: hero em tela cheia…" |
| Diferenciais desktop 2 colunas (último largura total) | e2e | "diferenciais: 7 itens…" |
