# Manual da Marca — Mobilità Transporte Executivo

Fonte: site ORIGINAL (`docs/reference/original/`), `docs/brand-brief.md`, `public/assets/`. Tokens: `site/tokens.css`. Versão visual: `docs/brand-manual.html`. Prints do original: `docs/reference/original/screens/`.

## 1. Essência e tom de voz
- **Promessa:** "Você no seu destino, sem preocupações".
- **Pilares:** conforto · segurança · pontualidade · pegada ecológica (folha da logo = movimento + natureza).
- **Tom:** calmo, acolhedor, profissional, direto; 2ª pessoa ("você"); frases curtas; sem gíria, sem exclamação, sem superlativos vazios. Público inclui idosos e executivos: clareza > esperteza.
- **Dizer:** "Desembarque e chegue ao seu destino com segurança, sem preocupações." **Evitar:** "O melhor transfer da região!!!", jargão em inglês, urgência artificial.
- Marca escrita **Mobilità** (acento grave no à). Contatos em `brand-brief.md`.

## 2. Logo
| Arquivo | Uso |
|---|---|
| `mobilita-logo-cor.png` (200×53) | Fundos claros (branco, #f7f7f7, foto clara) |
| `mobilita-logo-branco.png` / `-grande.png` | Sobre verde, grafite ou foto com overlay |
| `mobilita-mobile2.png` (175×44) | Cabeçalho compacto mobile |
| `mobilita-elemento-logo-cor.png` / `-branco.png` | Folha isolada: marca d'água, selo, favicon |
| `favicon-mobilita.png`, `ios-favicon-mobilita.png` | Favicon / ícone iOS |

- **Cor vs branco:** cor só se o fundo tiver contraste ≥ 3:1 com o verde da logo (branco, cinzas claros). Verde/grafite/foto escurecida → branca.
- **Área de proteção:** ≥ altura da letra "M" (≈ ¼ da altura da logo) em todos os lados; cabeçalho original dá ~30px de respiro vertical.
- **Tamanho mínimo:** 120px de largura em tela (original usa 175–200px); folha isolada ≥ 24px.
- **Proibido:** esticar/distorcer, girar, recolorir, aplicar sombra/contorno/gradiente, logo cor sobre verde ou foto, logo sobre foto sem overlay, recriar a tipografia, separar o acento, usar a folha como bullet repetido.

## 3. Paleta (extraída de `theme.css`)
| Token | Hex | Papel | Uso no original |
|---|---|---|---|
| `--mb-green` | `#508f3b` | **Primária** | Botão primário, títulos de seção, fundos de seção, top bar |
| `--mb-green-deep` | `#3c6b2c` | Primária escura (derivada, também no CSS original) | Texto verde pequeno, hover, botão com texto ≤ 18px |
| `--mb-green-light` | `#55b944` | **Secundária / acento** | Rótulos, linhas, ícones; texto escuro sobre ela |
| `--mb-green-success` | `#3dc372` | Feedback positivo | Mensagens de sucesso |
| `--mb-ink` | `#2d2e33` | Grafite: títulos, fundo escuro | Headings |
| `--mb-text` | `#6c6d74` | Texto corrente | Corpo |
| `--mb-text-soft` | `#b4b5ba` | Meta/bordas fortes | Só decorativo ou sobre escuro |
| `--mb-line` | `#e5e5e7` | Divisores, bordas de input | |
| `--mb-surface` | `#f7f7f7` | Superfícies suaves | Botão default |
| `--mb-danger` / `--mb-warn` | `#e44e56` / `#ff9e45` | Erro / aviso | Validação |

**Overlays:** verde `rgba(80,143,59,.85)` e `.88` sobre fotos de seção (hero, frota, contato); escuro `rgba(0,0,0,.31)` para legibilidade em foto; branco `rgba(255,255,255,.96)` para cartões sobre foto.

**Contraste WCAG (calculado):**
| Texto / fundo | Razão | Veredito |
|---|---|---|
| Grafite `#2d2e33` / branco | 13.55 | AA + AAA |
| Branco / grafite | 13.55 | AA + AAA |
| Grafite / `#f7f7f7` | 12.65 | AA + AAA |
| Cinza `#6c6d74` / branco | 5.15 | AA (corpo) |
| Cinza `#6c6d74` / `#f7f7f7` | 4.81 | AA (corpo) |
| `#3c6b2c` / branco | 6.30 | AA (corpo, links, botão) |
| Branco / `#3c6b2c` | 6.30 | AA — **fundo de botão e seção com texto pequeno** |
| Grafite / `#55b944` | 5.42 | AA |
| `#55b944` / grafite | 5.42 | AA (acento sobre escuro) |
| Branco / `#508f3b` | **3.94** | **Só texto grande** (≥24px, ou ≥18.66px bold). Proibido em corpo/legendas |
| `#508f3b` / branco | 3.94 | Só títulos grandes e ícones/UI ≥3:1 |
| `#508f3b` / `#f7f7f7` | 3.68 | Só título grande |
| Branco / `#55b944` | **2.50** | Reprovado — nunca |
| `#b4b5ba` / branco | **2.05** | Reprovado — só decoração |
| `#e44e56` / branco | 3.80 | Só grande/ícone; mensagens de erro em 18px bold+ ou use ícone + `#2d2e33` |

Regra: texto de corpo sobre verde de marca → usar overlay + foto só se o texto ficar sobre região ≥ 4.5:1; caso contrário, painel `--mb-green-deep` ou grafite. O original falha aqui (texto 11–16px branco no `#508f3b`); o redesign corrige.

## 4. Tipografia
- **KoHo** (títulos, nav, botões, rótulos, números) 400/500/600/700; **Open Sans** (corpo) 400/600/700. Google Fonts, `display=swap`.
- Original: `html` 16px, line-height 1.625, `antialiased`, `optimizeLegibility`. Títulos KoHo 600 grafite; h4/botões/nav/meta KoHo 500 UPPERCASE, letter-spacing 2px.
- **Escala modular (≈1.25; base 18px — regra do projeto):**
| Papel | Mobile | Desktop | LH | Peso/ls |
|---|---|---|---|---|
| Display (hero) | 48 | 96 | 1.1 | KoHo 600, −0.01em |
| H1 | 40 | 64 | 1.1–1.2 | KoHo 600 |
| H2 | 32 | 44 | 1.2 | KoHo 600 |
| H3 | 24 | 28 | 1.3–1.4 | KoHo 600 |
| H4 / label | 13–20 | 13–20 | 1.4 | KoHo 500 UPPER, ls .125em |
| Lead | 20 | 24 | 1.5 | KoHo 400 |
| Corpo | 18 | 18 | 1.625 | Open Sans 400 |
| Meta/legal | 14 | 14 | 1.5 | Open Sans 400 |
- Original usa 11px em botões/nav: **não replicar** (mínimo 13px uppercase com tracking; 14px+ preferido).
- **Medida:** 60–70 caracteres (`max-width:64ch`); títulos ≤ 18ch; `text-wrap:balance` em títulos, `pretty` em parágrafos. Alinhamento à esquerda (centro só em títulos curtos de seção).

## 5. Espaçamento, grid, forma
- Escala 4/8: 4·8·12·16·24·32·48·64·96·140 (`--mb-s-*`).
- Seções: padding vertical **70px mobile / 140px desktop** (`uk-section-large` original); seções "small" 40px.
- Container 1200px, gutter 20px (mobile) → 40px (desktop); grid gap 20–40px.
- Raios: botões e pílulas `500px` (pill) ou 0 (retangular original); cartões 0–5px; avatares `50%`. Sombras: `0 1px 4px /.14` (cartão), `0 5px 15px /.08` (hover leve), `0 28px 50px /.16` (destaque).

## 6. Fotografia
- Fotos reais da frota/passageiro: `mobilita-showcase-01.jpeg` (executivo no banco traseiro), `mobilita-fundo-sessao-01.jpeg` (fundo de seção), `mobilita-carros.png` (sedan + van + ônibus, PNG transparente).
- Estilo: luz natural, interiores limpos, pessoas reais tranquilas; sem stock genérico, sem filtros fortes.
- Tratamento: overlay verde .85–.88 (seções) ou escuro .31 (legibilidade); Ken Burns lento permitido; srcset WebP; nunca distorcer; `object-fit:cover`, foco no sujeito.

## 7. Iconografia
Ícones originais (`atendimento-humanizado, frota, conforto, pontualidade, bilingue, gps, atendimento24h`): **traço único verde `#508f3b`, linha uniforme (~2–3px), cantos arredondados, sem preenchimento, sem sombra**, ~64–96px, fundo transparente, legenda KoHo uppercase abaixo. Novos ícones seguem o mesmo estilo; redes sociais em traço/monocromático.

## 8. Componentes-base
- **Botão primário:** fundo `--mb-green` (redesign: `--mb-green-deep` se texto <24px), texto branco, KoHo 500 UPPER ls .125em, altura ≥48px, padding 0 24px; hover = invertido (transparente + borda verde, texto verde-deep) — original, 100ms. Foco: outline 3px `--mb-green-light` offset 2px.
- **Botão default:** fundo `#f7f7f7`, texto `#6c6d74` → `#2d2e33`, hover borda `#e5e5e7`.
- **Botão sobre verde/foto:** branco com texto `--mb-green-deep`.
- **Link:** `--mb-green-deep`, sublinhado ao hover/foco; nunca só cor.
- **Card:** branco, sombra 1, padding 24–32px, título KoHo 600 (H3/H4 grafite), texto Open Sans cinza; sem borda dura.
- **Input:** altura ≥48px, fundo branco, apenas borda inferior `#e5e5e7` (original) → foco borda `--mb-green` 2px; label visível acima; em formulário sobre verde, inputs em painel branco/translúcido.
- **Nav:** KoHo 500 UPPER ls 2px, grafite; ativo `--mb-green`; top bar verde com WhatsApp.

## 9. Motion (emil-design-eng)
- Princípio: motion explica, nunca bloqueia; só `transform`/`opacity`; 60fps; respeitar `prefers-reduced-motion` (zera tokens).
- Easings: `--mb-ease-out cubic-bezier(.23,1,.32,1)` (entrada/UI), `--mb-ease-in-out cubic-bezier(.77,0,.175,1)` (movimentos na tela), `--mb-ease-cine cubic-bezier(.16,1,.3,1)` (hero/reveals). Nunca `ease-in` em UI.
- Durações: press 120ms (botão `scale(.97)`), hover 180ms, UI/menus 250ms, reveal 700ms, cinematográfico (Ken Burns, parallax) 1200ms+. Stagger 70ms entre irmãos. Saídas ≈ 60–70% da entrada.
- Hover só em `@media (hover:hover)`; popovers escalam da origem do gatilho; nunca partir de `scale(0)` (usar `.95` + opacity).
- Original: transições `.1s–.2s ease-in-out` (botões, inputs); não anima por scroll.

## 10. Padrões de layout do site original
Top bar verde (WhatsApp) → header branco logo + nav → **hero**: foto com overlay verde .85, folha branca gigante como marca d'água, H1 branco + texto + botão branco → **Nossos serviços** (fundo foto/cinza, lead centralizado, cartões brancos empilhados) → **Qualidade e compromisso** (branco, título verde, grade de ícones traço verde com legenda) → **Nossa frota** (seção verde, `mobilita-carros.png` + H2 + texto) → **Fale conosco** (formulário em painel verde) → **rodapé verde** (logo branca grande, folha, contatos). Ritmo: seções alternam foto/verde ↔ branco; folha como marca d'água em hero e rodapé.

## 11. Do / Don't
**Do:** verde + grafite + muito branco; logo na versão certa; foto real; texto ≥18px; alvos ≥48px; overlay verde com texto grande; motion lento e suave; folha como marca d'água ≤ 12% de opacidade em fundo claro.
**Don't:** branco sobre `#55b944`; texto pequeno branco sobre `#508f3b`; cinza `#b4b5ba` para texto; novas cores de destaque (roxo, azul, gradientes neon); sombras pesadas; ícones preenchidos/coloridos; emojis; animar `width/height/top`; uppercase em parágrafos; copiar o rodapé "Shell uploader" (invasão do site original — ignorar).
