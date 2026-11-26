Papel: designer — leia `.claude/agents/designer.md`. Carregue e siga as skills do projeto: `impeccable` (tipografia/espaçamento), `emil-design-eng` (motion), `design-taste-frontend` (anti-genérico). Use o MCP `playwright` (ou o Playwright CLI se o MCP não estiver disponível) para prints.

Tarefa: criar o MANUAL DA MARCA da Mobilità a partir do site ORIGINAL (não do nosso redesign).
Fontes:
- `docs/reference/original/index.html` + `docs/reference/original/theme.css` (HTML/CSS originais salvos; ignore qualquer resquício de "Shell uploader" — é invasão).
- Assets originais em `public/assets/` (logos cor/branco, elemento-folha, fotos, ícones, favicon).
- `docs/brand-brief.md` (contatos e textos).
- Para ver o layout original, renderize `docs/reference/original/index.html` localmente com Playwright (as imagens apontam para o site; se não carregarem, troque os caminhos para `public/assets/` numa cópia temporária fora do repo). NÃO interaja com formulários do site real.

Entregáveis:
1. `docs/brand-manual.md` (para workers): essência/tom de voz (conforto, segurança, pontualidade, pegada ecológica), logo (versões, área de proteção, tamanho mínimo, usos proibidos, quando usar cor vs branco), paleta (hex extraídos do theme.css com papéis: primária, secundária, neutros, overlays rgba(80,143,59,.85–.88); contraste AA de cada combinação de texto), tipografia (KoHo/Open Sans: pesos, escala modular com tamanhos mobile/desktop, line-height, letter-spacing, medida de linha), espaçamento (escala 4/8 px, ritmo vertical de seção, grid/containers, raios, sombras), fotografia (estilo, overlays, tratamento), iconografia (estilo dos ícones originais), componentes-base (botões, links, cards, inputs) e motion (durações/easings conforme emil-design-eng), padrões de layout do site original (seções com foto+overlay verde, folha como marca d'água), do/don't.
2. `docs/brand-manual.html`: página visual autocontida do mesmo manual (CSS inline, fontes via Google Fonts, imagens referenciando `../public/assets/` ou embutidas), bonita, mobile-first, aplicando o próprio manual. Inclua prints do site original (`docs/reference/original/screens/*.png`, desktop 1440 e mobile 375).
3. Tokens: `site/tokens.css` com as variáveis CSS do manual (cores, tipo, espaço, raio, sombra, motion) — ainda NÃO refatore o site.

Arquivos permitidos: `docs/brand-manual.*`, `docs/reference/original/screens/**`, `site/tokens.css`. Proibidos: demais arquivos de `site/`, `public/assets/**`, `.env*`, credenciais.

Prova: abrir `docs/brand-manual.html` no Playwright em 375 e 1440, sem scroll horizontal e com imagens carregadas; salvar prints em `docs/reference/manual-375.png` e `manual-1440.png` (permitido). Commit em master.
Use rg antes de abrir arquivos; economize tokens: não leia arquivos inteiros sem necessidade (theme.css é grande: use rg), não narre.
worker_done: resultado, evidência (comandos + resultado), arquivos, quais skills usou de fato, bloqueios, até 3 propostas.
