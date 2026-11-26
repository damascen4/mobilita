Papel: dev-frontend. Leia `.claude/agents/dev-frontend.md` e `docs/brand-brief.md` (fonte única de conteúdo/marca; não invente telefones, preços ou dados).

Alvo: site one-page estático novo da Mobilità (transporte executivo + transfer aeroportuário), HTML/CSS/JS vanilla, em `site/` (index.html, styles.css, main.js), usando imagens de `public/assets/` (copie/otimize para `site/assets/`).

Direção: cinemático e atual, porém MUITO simples de usar (público inclui idosos).
- Hero full-screen com `mobilita-showcase-01.jpeg`, overlay grafite→verde, slogan em KoHo grande, reveal suave; 2 CTAs grandes: "Pedir orçamento no WhatsApp" e "Ligar agora".
- Header fixo enxuto com logo + botão WhatsApp sempre visível; menu mobile simples.
- Seções: Quem somos, Serviços (cards com destaque para Transfer Aeroporto: Viracopos, Guarulhos, Congonhas — rotule como exemplos de destinos atendidos), Diferenciais (ícones existentes), Frota (`mobilita-carros.png` com parallax leve, chips Sedan / Van / Micro-ônibus / Ônibus), Como funciona (3 passos: Peça → Confirmamos → Buscamos você), Contato.
- Formulário de orçamento simples (nome, telefone, origem, destino, data/hora, nº passageiros, observação) que monta mensagem e abre WhatsApp (wa.me/5519998108070) — sem backend.
- Botão flutuante WhatsApp, footer com contatos, Instagram, Facebook, área atendida.
- Elemento folha da logo como motivo decorativo (pegada ecológica). Fontes KoHo + Open Sans; cores do brief.
- SEO: meta description, Open Graph, JSON-LD LocalBusiness, lang pt-BR, favicon.
- Acessibilidade: base ≥18px, foco visível, alt texts, contraste AA, prefers-reduced-motion.

Arquivos permitidos: `site/**`, `tests/**`, `package.json`, `playwright.config.*`, `docs/test-matrix.md`. Proibidos: `public/assets/**` (não alterar originais), `.env*`, credenciais.

Prova: Playwright (`tests/e2e/site.spec.ts`): carrega, nav âncoras, CTA WhatsApp com href correto, formulário gera URL wa.me com os campos, sem scroll horizontal em 375px; screenshots desktop 1440 e mobile 375 em `tests/screenshots/`. Rode só esses testes; reporte contagem pass/fail. Crie `docs/test-matrix.md`.

Commit na branch atual ao final. Mapeamento: graphify/rg antes de abrir arquivos. Economize tokens: não leia arquivos inteiros sem necessidade, não narre.

worker_done: resultado, comando de teste + pass/fail, arquivos, bloqueios, até 3 propostas de melhoria (arquivo:linha, ganho, esforço, risco+mitigação).
