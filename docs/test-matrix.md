# Matriz de Testes — Site Mobilità Transportes

Comando de execução (projetos `mobile-pixel` 375x812 e `desktop-chromium` 1440x900):

```bash
npx playwright test tests/e2e/site.spec.ts
```

| ID | Cenário | Projetos | Critério de Aprovação |
|---|---|---|---|
| TC-01 | Carregamento, SEO, acessibilidade base (`>=18px`), WebP `srcset` e inputs | `mobile-pixel`, `desktop-chromium` | Título do brief, `lang="pt-BR"`, `meta description`, OG, JSON-LD `LocalBusiness`, `font-size >= 18px`, `>= 3` `<source type="image/webp" srcset>`, inputs `tel`/`date`/`time`/`number`, zero imagens quebradas. |
| TC-02 | Navegação por âncoras | `mobile-pixel`, `desktop-chromium` | Desktop percorre `#quem-somos` a `#contato`; mobile abre menu, navega para `#frota` e fecha o drawer. |
| TC-03 | CTAs WhatsApp direto + fallback `wa.me` + `tel:` | `mobile-pixel`, `desktop-chromium` | `href` fallback `https://wa.me/5519998108070?text=...` (e `5519992638676` no contato 2) sem hífen; mobile dispara `whatsapp://send?phone=5519998108070&text=...`; desktop dispara `https://web.whatsapp.com/send?phone=5519998108070&text=...`; Ligar usa `tel:+5519998108070`. |
| TC-04 | Formulário de orçamento → WhatsApp direto | `mobile-pixel`, `desktop-chromium` | Preenche nome, telefone, origem, destino, data, hora, passageiros e observação; gera mensagem formatada e dispara `whatsapp://send` (mobile) ou `web.whatsapp.com/send` (desktop), exibindo link fallback `wa.me`. |
| TC-05 | Mobile-first 375px, barra fixa inferior e alvos `>= 48px` | `mobile-pixel` | Sem scroll horizontal (`scrollWidth <= innerWidth`), barra fixa inferior com WhatsApp/Ligar visível, todos os CTAs principais com altura `>= 48px`, slogan do hero sem corte. |
| TC-06 | Evidência visual mobile 375 e desktop 1440 | `mobile-pixel`, `desktop-chromium` | Gera `tests/screenshots/mobile-375.png` e `tests/screenshots/desktop-1440.png` em página inteira. |
