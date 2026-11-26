Papel: designer — leia `.claude/agents/designer.md` e carregue as skills `frontend-design:frontend-design` e `web-design-guidelines`. Base: master @ bdcfc90 (`site/`). Marca/conteúdo: `docs/brand-brief.md`.

Feedback do cliente sobre a v2 (rejeitada): "perdeu a identidade da empresa", "cru", "seco", "bruto", "grotesco", "cara antiga". O site original passava CONFORTO e era gostoso de rolar: fotos de fundo em tela cheia por seção com overlay verde translúcido (rgba(80,143,59,.85–.88)), logo e elemento-folha brancos grandes sobre o verde, muito respiro. Quer uma EXPERIÊNCIA desde o primeiro acesso, cinemática e moderna, mas simples.

Redesenhe o visual (mantendo conteúdo, mobile-first, WhatsApp direto `openWhatsApp`, formulário, barra inferior, SEO e testes existentes):
- Intro/hero cinemático: foto `mobilita-showcase-01` com zoom lento (Ken Burns), overlay em gradiente grafite→verde, slogan KoHo revelado palavra a palavra com máscara, folha da logo desenhando/flutuando, indicador de scroll. Opcional: breve loader de marca (≤1,2s, pulável, só 1ª visita via sessionStorage).
- Recuperar a identidade antiga: seções com fundo fotográfico em tela cheia (`mobilita-fundo-sessao-01`, `mobilita-showcase-01`) com parallax suave e overlay verde translúcido; elemento-folha como marca d'água grande; logo branca em fundos verdes.
- Ritmo confortável: alternar seções claras (off-white quente, cantos arredondados grandes, sombras suaves) e imersivas (foto+verde). Muito espaço, tipografia KoHo grande e elegante, nada de blocos densos ou caixas duras.
- Efeitos: reveal on scroll (fade+translate+blur leve, stagger), cards de serviço com hover/tilt sutil e ícone animado, contadores/destaques animados nos diferenciais, frota entrando de lado com parallax, linha/rota animada no "Como funciona" (estrada/GPS), header que fica translúcido com blur ao rolar, smooth scroll leve (Lenis via CDN versão fixada, ou nativo). Use IntersectionObserver/CSS; libs só se pequenas e fixadas (GSAP+ScrollTrigger ok via cdnjs com versão exata).
- Pesquise 2–3 referências modernas (sites premium de transfer/chauffeur/mobilidade, Awwwards) e cite-as no worker_done com o que aproveitou.
- Desempenho e acessibilidade: transform/opacity apenas, prefers-reduced-motion desliga tudo, LCP rápido no 4G, sem scroll horizontal.

Arquivos permitidos: `site/**`, `tests/**`, `docs/test-matrix.md`, `package.json`. Proibidos: `public/assets/**`, `.env*`, credenciais.

Prova: suíte existente `npx playwright test tests/e2e/site.spec.ts` verde (ajuste seletores se necessário, sem remover cobertura) + teste de reduced-motion; screenshots mobile-375 e desktop-1440 atualizados, e capturas extras de 2–3 seções no meio da rolagem em `tests/screenshots/`. Reporte pass/fail.

Commit em master. Use rg antes de abrir arquivos; economize tokens: não leia arquivos inteiros sem necessidade, não narre.
worker_done: resultado, comando + pass/fail, arquivos, referências usadas, bloqueios, até 3 propostas (arquivo:linha, ganho, esforço, risco+mitigação).
