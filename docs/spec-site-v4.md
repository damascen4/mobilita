Papel: designer — leia `.claude/agents/designer.md`, carregue skills `frontend-design:frontend-design` e `web-design-guidelines`. Base: master @ 5995f72 (`site/`). Marca/conteúdo: `docs/brand-brief.md`. Pesquise referências modernas onde indicado e cite no worker_done.

Feedback do cliente (v3 aprovada no geral; ajustes):
1. Hero: remover a logo duplicada abaixo do header — manter só a do header/menu. Em compensação, o elemento/logo animado do hero (efeito flutuante atual) deve ficar BEM maior e protagonista (mobile e desktop), sem duplicar a logo do header.
2. Quem somos (desktop ruim): título espremido, texto apertado à esquerda e imagem pequena à direita. Redesenhar mais orgânico/editorial: imagem grande (como a v anterior ou maior, ex. sangrando a borda/formato orgânico com máscara), título sem quebras estranhas (text-wrap: balance, largura de título maior), leitura confortável (~60–70ch). Busque referências editoriais.
3. Serviços: ocupar a largura toda (hoje só o meio); o intro "Facilidades e soluções…" quebra mal e parece faltar algo à direita — compor com imagem/elemento (ex. foto ou `mobilita-carros`/folha) ou layout de 2 colunas equilibrado. Card "Serviço em destaque" (Transfer Aeroporto): enriquecer (imagem/ícone de avião, lista de aeroportos como chips com ícone, microcopy de benefício, ex. monitoramento de voo NÃO — só o que o brief permite: recepção no desembarque, pontualidade, plantão 24h). Botão "Agendar transfer no WhatsApp" está bugado (pílula enorme cheia de texto): virar botão normal, texto curto ("Agendar pelo WhatsApp"), ícone, contraste AA alto (texto branco sobre verde escuro #3d7a2c ou similar ≥4.5:1). Cards de serviço: pode refinar.
4. Diferenciais (aprovado): 7 cards em 4+3 — centralizar a linha de baixo (flex/grid com justify center) sem buraco.
5. Frota e Como funciona: aprovados, não mexer.
6. Orçamento: formulário ainda "grotesco/basicão". Redesenhar: card elegante, labels flutuantes ou bem diagramadas, agrupamento (Contato / Viagem / Detalhes), ícones nos campos, focus states bonitos. Substituir date/time nativos por seletores custom acessíveis e simples (ex. calendário em popover leve vanilla ou lib pequena fixada via cdnjs como flatpickr com locale pt e tema na marca; horário em seletor de slots de 15/30 min ou select estilizado). Passageiros com stepper − / + grande. Manter máscara de telefone, data mínima hoje, geração da mensagem WhatsApp e acessibilidade (teclado, aria). Coluna esquerda: título sem quebra feia; telefone NUNCA quebrar (white-space: nowrap) — "Prefere falar por telefone? Ligue para (19) 99810-8070".
7. Contato ("Entre em contato e tire suas dúvidas"): hoje parece dois cards soltos. Redesenhar como seção de contato de verdade (ex. bloco imersivo com foto/verde, lista de canais com ícones: WhatsApp x2, telefone, e-mail, Instagram, área de atendimento; botões claros). Números sem quebra.
8. Rodapé: Instagram e Facebook como ÍCONES SVG (clicáveis, aria-label, alvo ≥48px), sem texto.
9. Botão flutuante do WhatsApp no desktop não pode cobrir conteúdo (menor/canto com margem, ou só aparece após rolar).

Manter: mobile-first, openWhatsApp direto, barra inferior mobile, reduced-motion, SEO, sem scroll horizontal, desempenho. Verifique também o celular de cada seção alterada.

Arquivos permitidos: `site/**`, `tests/**`, `docs/test-matrix.md`, `package.json`. Proibidos: `public/assets/**`, `.env*`, credenciais.

Prova: `npx playwright test tests/e2e/site.spec.ts` verde (adapte o teste do formulário aos novos controles sem perder cobertura: data mínima, máscara, stepper, mensagem gerada) + teste de que não há logo duplicada no hero e de que telefones não quebram linha. Screenshots mobile e desktop de: hero, quem somos, serviços, diferenciais, orçamento, contato, rodapé em `tests/screenshots/`. Reporte pass/fail.

Commit em master. Use rg antes de abrir arquivos; economize tokens: não leia arquivos inteiros sem necessidade, não narre.
worker_done: resultado, comando + pass/fail, arquivos, referências, bloqueios, até 3 propostas (arquivo:linha, ganho, esforço, risco+mitigação).
