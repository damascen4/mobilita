# Manual da Marca — Mobilità Transporte Executivo

Fonte: recaptura ao vivo de `https://mobilitatransportes.com.br/` (2026-11-26), `docs/brand-brief.md`, `public/assets/brand/`. Tokens: `site/tokens.css`. Versão visual: `docs/brand-manual.html`. Prints atualizados (1440 e 375): `docs/reference/original/screens/`.

## 1. Essência e tom de voz
- **Promessa:** "Você no seu destino, sem preocupações".
- **Pilares:** conforto · segurança · pontualidade · pegada ecológica (folha da logo = movimento + natureza).
- **Tom:** calmo, acolhedor, profissional, direto; 2ª pessoa ("você"); frases curtas; sem gíria, sem exclamação, sem superlativos vazios. Público inclui idosos e executivos: clareza > esperteza.
- **Dizer:** "Desembarque e chegue ao seu destino com segurança, sem preocupações." **Evitar:** "O melhor transfer da região!!!", jargão em inglês, urgência artificial.
- Marca escrita **Mobilità** (acento grave no à). Contatos em `brand-brief.md`.

## 2. Logo
Todos os arquivos de marca no site atual são **PNG** (não há SVG vetorial publicado). Versões em maior resolução capturadas em `public/assets/brand/`:

| Arquivo (`public/assets/brand/`) | Dimensões | Uso | `alt` sugerido (PT-BR) |
|---|---|---|---|
| `logo-mobilita-cor.png` | 200×53 | Header desktop e fundos claros (branco, `#f7f7f7`) | `Mobilità Transporte Executivo` |
| `logo-mobilita-branco.png` | 200×53 | Fundos verdes, grafite ou foto com overlay | `Mobilità Transporte Executivo` |
| `logo-mobilita-branco-grande.png` | 308×82 | Rodapé verde e destaques sobre fundo escuro/verde | `Mobilità Transporte Executivo` |
| `logo-mobilita-mobile.png` | 175×44 | Cabeçalho compacto mobile (`< 960px`) | `Mobilità Transporte Executivo` |
| `simbolo-folha-cor.png` | 1191×1080 | Marca d'água sutil em fundo claro (seção Diferenciais) | `""` (decorativo) |
| `simbolo-folha-branco.png` | 1191×1080 | Elemento gráfico em fundo verde (Quem somos e rodapé) | `""` (decorativo) |
| `favicon-mobilita.png` | 96×96 | Favicon do navegador (`rel="shortcut icon"`) | — |
| `apple-touch-icon-mobilita.png` | 180×180 | Ícone iOS (`rel="apple-touch-icon-precomposed"`) | — |

- **Cor vs branco:** cor só se o fundo tiver contraste ≥ 3:1 com o verde da logo (branco, cinzas claros). Verde/grafite/foto escurecida → branca.
- **Área de proteção:** ≥ altura da letra "M" (≈ ¼ da altura da logo) em todos os lados; cabeçalho original dá ~30px de respiro vertical.
- **Tamanho mínimo:** 120px de largura em tela (original usa 175–200px); folha isolada ≥ 24px.
- **Proibido:** esticar/distorcer, girar, recolorir, aplicar sombra/contorno/gradiente, logo cor sobre verde ou foto, logo sobre foto sem overlay, recriar a tipografia, separar o acento, usar a folha como bullet repetido.

## 3. Paleta (extraída de `theme.1.css` ao vivo)
O tema YOOtheme do site atual **não define variáveis CSS próprias de marca** (apenas `--wp--preset--*` padrão do WordPress/Gutenberg, que devem ser ignoradas); todas as cores da marca são declaradas diretamente em hex/rgba em `theme.1.css`:

| Token | Hex | Papel | Uso no original |
|---|---|---|---|
| `--mb-green` | `#508f3b` | **Primária** | Top bar, botão primário, títulos de seção, seções Quem somos / Frota / painel Fale conosco |
| `--mb-green-hover` | `#54963e` | Primária hover (CSS original) | Hover de elementos verdes no tema |
| `--mb-green-deep` | `#3c6b2c` | Primária escura (CSS original) | Texto verde pequeno, hover/ativo, botão com texto ≤ 18px |
| `--mb-green-light` | `#55b944` | **Secundária / acento** | Rótulos, linhas, ícones; texto escuro sobre ela (variantes no CSS: `#5bbd4b`, `#73bb5b`) |
| `--mb-green-success` | `#3dc372` | Feedback positivo | Mensagens de sucesso |
| `--mb-ink` | `#2d2e33` | Grafite: títulos, fundo escuro | Headings (`#09090a` usado em contraste máximo pontual) |
| `--mb-text` | `#6c6d74` | Texto corrente | Corpo (`#606167` em hover/ênfase sutil) |
| `--mb-text-soft` | `#b4b5ba` | Meta/bordas fortes | Só decorativo ou sobre escuro (`#cacacf` / `#dcdcdf` em estados desabilitados) |
| `--mb-line` | `#e5e5e7` | Divisores, bordas de input | Bordas de formulário e separadores |
| `--mb-surface` | `#f7f7f7` | Superfícies suaves | Botão default (`#f2f2f2` em superfícies secundárias) |
| `--mb-danger` / `--mb-warn` | `#e44e56` / `#ff9e45` | Erro / aviso | Validação |

**Overlays e transparências (verificados ao vivo):**
- Cartão do hero sobre foto: `rgba(255,255,255,.95–.97)` (branco translúcido com texto grafite `#2d2e33`).
- Rodapé verde: `rgba(80,143,59,.85)` (além de `.6`/`.8` em utilitários de `theme.1.css`).
- Texto corrente sobre fundo verde (Quem somos / Frota): `rgba(255,255,255,.7)` (atenção: contraste insuficiente para corpo no original — usar branco `#ffffff` sobre `--mb-green-deep` no redesign).
- Escuro para legibilidade sobre foto (Nossos serviços): `rgba(0,0,0,.3)` / `.6`.

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
- **Origem no site atual:** auto-hospedada pelo YOOtheme em `/wp-content/themes/yootheme/fonts/*.woff2` (e `.woff`), originária do Google Fonts:
  - **KoHo:** `400`, `600`, `700` (normal e italic). *Nota:* o CSS pede `font-weight: 500` em subtítulos (`h2`), nav, top bar (`h6`), diferenciais (`h3`) e botões, mas o arquivo `500` não está nos `@font-face` originais.
  - **Open Sans:** `400`, `600`, `700` (normal e italic).
- **Redesign:** carregar via Google Fonts (`KoHo:wght@400;500;600;700` e `Open+Sans:wght@400;600;700`, `display=swap`) para garantir o peso 500 real sem síntese.
- **Original computado ao vivo:** `html`/`body` Open Sans 400 `16px/26px` (`1.625`); `h1` de seção e `h3` do hero KoHo 600 `42px/50.4px`; `h3` dos cards de serviço KoHo 600 `28px`; `h2` subtítulo/kicker KoHo 500 UPPER `15px` `ls 2px`; `h6` top bar e `h3` diferenciais KoHo 500 UPPER `13px` `ls 2px`; `.uk-button-primary` KoHo 500 UPPER `11px`.
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

## 6. Fotografia e inventário de imagens (`public/assets/brand/`)
Fotos de conteúdo baixadas em resolução máxima disponível (originais mantidos + versões `.webp` geradas com qualidade 85):

| Arquivo (`public/assets/brand/`) | Dimensões | WebP | Uso | `alt` sugerido (PT-BR) |
|---|---|---|---|---|
| `hero-passageiro-executivo.jpeg` | 1920×1080 | `hero-passageiro-executivo.webp` (182 KB) | Hero principal (full-bleed) | `Executivo sorrindo ao telefone no banco traseiro de um veículo da Mobilità` |
| `servicos-onibus-estrada.jpeg` | 1920×1080 | `servicos-onibus-estrada.webp` (86 KB) | Fundo da seção Nossos serviços | `Ônibus executivo da Mobilità em rodovia ao entardecer` |
| `frota-veiculos-recorte.png` | 1200×600 | `frota-veiculos-recorte.webp` (101 KB) | Seção Nossa frota (PNG/WebP transparente) | `Frota da Mobilità composta por sedã executivo, van Sprinter e ônibus rodoviário` |

**Ícones de diferenciais (`public/assets/brand/`, todos 150×150 PNG transparente, traço verde `#508f3b`):**
| Arquivo | Rótulo na seção | `alt` sugerido (PT-BR) |
|---|---|---|
| `icone-atendimento-humanizado.png` | Atendimento humanizado | `""` (decorativo — rótulo visível abaixo; isolado: `Ícone de aperto de mãos representando atendimento humanizado`) |
| `icone-frota-moderna.png` | Frota moderna e segura | `""` (isolado: `Ícone de van representando frota moderna e segura`) |
| `icone-conforto.png` | Conforto | `""` (isolado: `Ícone de coração representando conforto`) |
| `icone-pontualidade.png` | Pontualidade | `""` (isolado: `Ícone de relógio representando pontualidade`) |
| `icone-motoristas-bilingues.png` | Motoristas bilíngues e experientes | `""` (isolado: `Ícone de motorista com balões de fala representando atendimento bilíngue`) |
| `icone-percursos-gps.png` | Percursos traçados via GPS | `""` (isolado: `Ícone de mapa com rota representando percursos traçados via GPS`) |
| `icone-plantao-24h.png` | Assessoria e plantão 24h | `""` (isolado: `Ícone de headset representando assessoria e plantão 24 horas`) |

- Estilo: luz natural, interiores limpos, pessoas reais tranquilas; sem stock genérico, sem filtros fortes.
- Tratamento: foto do hero limpa (sem overlay verde) ou com contraste seguro sob o texto; overlay escuro `.3`–`.6` em Nossos serviços; Ken Burns lento permitido; `<picture>` com `.webp` + fallback original; nunca distorcer; `object-fit:cover`, foco no sujeito.

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

## 10. Mapa de seções e conteúdo do site atual (ordem exata)
Site one-page em `pt-BR` com 6 links de âncora na navegação: `INÍCIO` · `QUEM SOMOS` (`#quemsomos`) · `O QUE FAZEMOS` (`#oquefazemos`) · `DIFERENCIAIS` (`#diferenciais`) · `FROTA` (`#frota`) · `CONTATO` (`#contato`).

1. **Top bar (`.tm-toolbar`, só desktop `≥960px`):** fundo `#508f3b`, texto branco `WHATSAPP: (19)99810-8070`.
2. **Header (`.tm-header` / `.tm-header-mobile`):** fundo branco, logo colorida à esquerda (`logo-mobilita-cor.png` desktop / `logo-mobilita-mobile.png` mobile) + menu horizontal (desktop) ou hambúrguer (mobile).
3. **Hero (`#inicio`):** foto full-bleed (`hero-passageiro-executivo.webp`) **sem overlay verde**; cartão branco translúcido (`rgba(255,255,255,.95–.97)`) à esquerda com título grafite *"Você no seu destino, sem preocupações"* + botão verde `ENTRE EM CONTATO`.
4. **Quem somos (`#quemsomos`):** fundo sólido verde `#508f3b`; 2 colunas (texto à esquerda, folha branca gigante `simbolo-folha-branco.png` à direita; no mobile a folha sobe). Título *"Mobilità Transporte Executivo"*, 3 parágrafos institucionais (transporte corporativo, motoristas treinados, pontualidade/segurança/conforto) + botão branco `ENTRE EM CONTATO`.
5. **Nossos serviços (`#oquefazemos`):** fundo foto `servicos-onibus-estrada.webp` com overlay escuro; cabeçalho centralizado branco (*"Nossos serviços"*, kicker *"FACILIDADES E SOLUÇÕES QUE TE LEVAM ONDE VOCÊ QUER CHEGAR."*, introdução cobrindo Campinas e grande São Paulo) + **5 cartões brancos** (grade 3+2 no desktop, 1 coluna no mobile):
   - *Transporte corporativo*
   - *Recepção em aeroportos*
   - *Traslados*
   - *Locação de veículo*
   - *Assessoria e coordenação para eventos*
6. **Qualidade e compromisso (`#diferenciais`):** fundo branco com marca d'água sutil `simbolo-folha-cor.png` (desktop); título verde *"Qualidade e compromisso"*, kicker grafite *"DIFERENCIAIS QUE FAZEM A SUA VIAGEM SER MUITO MELHOR."*, grade de **7 ícones traço verde** (3+4 no desktop, 1 coluna no mobile) + botão verde `ENTRE EM CONTATO`.
7. **Nossa frota (`#frota`):** fundo sólido verde `#508f3b`; 2 colunas com recorte `frota-veiculos-recorte.webp` à esquerda e texto branco à direita (*"Nossa frota"*, kicker *"O MELHOR DO CONFORTO E SEGURANÇA PARA VOCÊ."*, descrição de ar-condicionado, inspeção constante, TV Digital, DVD, som e assentos reclináveis).
8. **Fale conosco (`#contato`):** fundo branco; 2 colunas: à esquerda título verde *"Fale conosco"* + kicker *"ENTRE EM CONTATO E TIRE SUAS DÚVIDAS."*; à direita painel verde `#508f3b` (*"Mande uma mensagem"*) com formulário (campos `Nome`, `Telefone`, `Email`, `Mensagem` + botão branco `ENVIAR MENSAGEM`).
9. **Rodapé:** fundo verde `rgba(80,143,59,.85)` com marca d'água `simbolo-folha-branco.png` à direita; à esquerda `logo-mobilita-branco-grande.png` + ícones Facebook (`facebook.com/mobilitatransporte/`) e Instagram (`instagram.com/mobilitatransportes/`); à direita bloco *Contato*: `(19) 99810-8070` (`wa.me/5519998108070`), `(19) 99263-8676` (*corrigir href original que tem hífen `551999263-8676` → `5519992638676`*), `contato@mobilitatransportes.com.br`.

**Ritmo visual:** foto limpa (hero) → verde sólido (Quem somos) → foto escurecida (Serviços) → branco (Diferenciais) → verde sólido (Frota) → branco + painel verde (Contato) → verde (Rodapé).

## 11. Do / Don't
**Do:** verde + grafite + muito branco; logo na versão certa; foto real em WebP com fallback; texto ≥18px; alvos ≥48px; overlay/painel com contraste ≥4.5:1; motion lento e suave; folha como marca d'água ≤ 12% de opacidade em fundo claro.
**Don't:** branco sobre `#55b944`; texto pequeno branco sobre `#508f3b` ou `rgba(255,255,255,.7)`; cinza `#b4b5ba` para texto; novas cores de destaque (roxo, azul, gradientes neon); sombras pesadas; ícones preenchidos/coloridos; emojis; animar `width/height/top`; uppercase em parágrafos; replicar o banner/título *"Who Knows WP Shell uploader"* injetado no topo do site atual (invasão — ignorar).
