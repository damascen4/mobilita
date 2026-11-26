# Matriz de Testes — Site Mobilità Transportes

Comando de execução:

```bash
npx playwright test tests/e2e/site.spec.ts
```

| ID | Cenário | Arquivo / Teste | Critério de Aprovação |
|---|---|---|---|
| TC-01 | Carregamento, SEO e acessibilidade base | `tests/e2e/site.spec.ts` — `carrega página, SEO, acessibilidade base (>=18px) e imagens` | Título exato do brief, `lang="pt-BR"`, `meta description`, Open Graph, JSON-LD `LocalBusiness`, `font-size` raiz `>= 18px`, `<h1>` com slogan e nenhuma imagem quebrada (`naturalWidth > 0`). |
| TC-02 | Navegação por âncoras (desktop 1440) | `tests/e2e/site.spec.ts` — `navegação por âncoras alcança todas as seções principais` | Cliques nos links `#quem-somos`, `#servicos`, `#diferenciais`, `#frota`, `#como-funciona`, `#orcamento` e `#contato` atualizam o hash e exibem cada seção. |
| TC-03 | CTAs WhatsApp e Ligar agora | `tests/e2e/site.spec.ts` — `CTAs WhatsApp e Ligar agora possuem href corretos` | CTAs no header, hero e botão flutuante apontam para `https://wa.me/5519998108070`; CTA "Ligar agora" aponta para `tel:+5519998108070`. |
| TC-04 | Formulário de orçamento → URL WhatsApp | `tests/e2e/site.spec.ts` — `formulário de orçamento gera URL wa.me com todos os campos preenchidos` | Submissão com nome, telefone, origem, destino, data/hora, passageiros e observação gera `https://wa.me/5519998108070?text=...` contendo todos os dados e exibe link direto de fallback. |
| TC-05 | Responsividade mobile 375px e menu mobile | `tests/e2e/site.spec.ts` — `layout mobile 375px sem scroll horizontal e menu mobile funcional` | `scrollWidth <= innerWidth` em `375x812`; botão Menu abre o drawer mobile e clicar em âncora fecha o menu e navega corretamente. |
| TC-06 | Evidência visual desktop e mobile | `tests/e2e/site.spec.ts` — `captura screenshots desktop 1440 e mobile 375` | Gera `tests/screenshots/desktop-1440.png` e `tests/screenshots/mobile-375.png` em página inteira (`fullPage: true`). |
