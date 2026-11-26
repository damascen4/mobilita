import { test, expect } from '@playwright/test';

const PRIMARY_PHONE = '5519998108070';
const SECONDARY_PHONE = '5519992638676';
const WA_PRIMARY_PREFIX = `https://wa.me/${PRIMARY_PHONE}`;
const WA_SECONDARY_PREFIX = `https://wa.me/${SECONDARY_PHONE}`;

test.describe('Mobilità Transportes — Site Mobile-First & WhatsApp Direto', () => {
  test('carrega página, SEO, fonte >=18px, WebP <picture> e imagens íntegras', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Transporte Executivo com Segurança e Conforto - Mobilità Transportes');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Mobilità/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Mobilità/);

    const jsonLdRaw = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLdRaw).toBeTruthy();
    const jsonLd = JSON.parse(jsonLdRaw!);
    expect(jsonLd['@type']).toBe('LocalBusiness');
    expect(jsonLd.name).toBe('Mobilità Transportes');

    const rootFontSize = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
    expect(rootFontSize).toBeGreaterThanOrEqual(18);

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Você no seu destino, sem preocupações');

    // Garante uso de <picture> com source WebP e srcset responsivo
    const webpSources = await page.locator('picture source[type="image/webp"]').count();
    expect(webpSources).toBeGreaterThanOrEqual(10);
    await expect(page.locator('.hero-picture source[type="image/webp"]')).toHaveAttribute('srcset', /640w.*1280w/);

    // Garante que nenhuma imagem está quebrada
    const brokenImages = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      for (const img of imgs) {
        img.loading = 'eager';
      }
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
              })
        )
      );
      return imgs.filter((img) => img.naturalWidth === 0).map((img) => img.getAttribute('src'));
    });
    expect(brokenImages).toEqual([]);
  });

  test('barra inferior fixa visível só no mobile e sem scroll horizontal em 375px', async ({ page }, testInfo) => {
    const isMobileProject = testInfo.project.name.startsWith('mobile-');
    await page.goto('/');

    const bottomBar = page.locator('#mobile-bottom-bar');
    const floatingWa = page.locator('.floating-whatsapp');

    if (isMobileProject) {
      await expect(bottomBar).toBeVisible();
      await expect(floatingWa).toBeHidden();

      // Alvos de toque >= 48px na barra inferior e header
      const barWaBox = await page.locator('#bottom-bar-whatsapp').boundingBox();
      const barCallBox = await page.locator('#bottom-bar-call').boundingBox();
      const menuBox = await page.locator('#menu-toggle').boundingBox();
      expect(barWaBox!.height).toBeGreaterThanOrEqual(48);
      expect(barCallBox!.height).toBeGreaterThanOrEqual(48);
      expect(menuBox!.height).toBeGreaterThanOrEqual(48);

      // Sem scroll horizontal na largura do dispositivo e em 375px
      await page.setViewportSize({ width: 375, height: 812 });
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBe(false);

      // Menu mobile abre e navega
      const menuToggle = page.locator('#menu-toggle');
      const mobileNav = page.locator('#nav-mobile');
      await expect(mobileNav).toBeHidden();
      await menuToggle.click();
      await expect(mobileNav).toBeVisible();
      await mobileNav.locator('a[href="#frota"]').click();
      await expect(mobileNav).toBeHidden();
      await expect(page).toHaveURL(/#frota$/);
    } else {
      await expect(bottomBar).toBeHidden();
      // FAB compacto: escondido no topo, aparece após rolar e some sobre contato/rodapé
      await expect(floatingWa).toBeHidden();
      await page.evaluate(() => window.scrollTo({ top: 1800, behavior: 'instant' }));
      await expect(floatingWa).toBeVisible();
      const fabBox = await floatingWa.boundingBox();
      expect(fabBox!.width).toBeLessThanOrEqual(64);
      await page.evaluate(() => document.querySelector('#contato')!.scrollIntoView({ behavior: 'instant' }));
      await expect(floatingWa).toBeHidden();

      // Navegação desktop por âncoras
      for (const hash of ['#quem-somos', '#servicos', '#diferenciais', '#frota', '#como-funciona', '#orcamento', '#contato']) {
        const navLink = page.locator(`.main-nav a[href="${hash}"]`);
        await expect(navLink).toBeVisible();
        await navLink.click();
        await expect(page).toHaveURL(new RegExp(`${hash}$`));
      }
    }
  });

  test('CTAs WhatsApp possuem href fallback correto e abrem whatsapp:// no mobile ou web.whatsapp.com no desktop', async ({ page }, testInfo) => {
    const isMobileProject = testInfo.project.name.startsWith('mobile-');

    await page.addInitScript(() => {
      const w = window as unknown as {
        __navigatedUrls?: string[];
        __openedUrls?: string[];
        __mobilitaNavigate?: (url: string) => void;
      };
      w.__navigatedUrls = [];
      w.__openedUrls = [];
      w.__mobilitaNavigate = (url: string) => {
        w.__navigatedUrls!.push(url);
      };
      window.open = ((url?: string | URL) => {
        w.__openedUrls!.push(String(url || ''));
        return null;
      }) as typeof window.open;
    });

    await page.goto('/');

    // Fallback hrefs sem JS
    await expect(page.locator('.header-whatsapp')).toHaveAttribute('href', new RegExp(`^${WA_PRIMARY_PREFIX}\\?text=`));
    await expect(page.locator('#hero-whatsapp-cta')).toHaveAttribute('href', new RegExp(`^${WA_PRIMARY_PREFIX}\\?text=`));
    await expect(page.locator('#transfer-whatsapp-cta')).toHaveAttribute('href', new RegExp(`^${WA_PRIMARY_PREFIX}\\?text=`));
    await expect(page.locator('#bottom-bar-whatsapp')).toHaveAttribute('href', new RegExp(`^${WA_PRIMARY_PREFIX}\\?text=`));
    await expect(page.locator('.floating-whatsapp')).toHaveAttribute('href', new RegExp(`^${WA_PRIMARY_PREFIX}\\?text=`));
    await expect(page.locator('#contact-whatsapp-1')).toHaveAttribute('href', new RegExp(`^${WA_PRIMARY_PREFIX}\\?text=`));
    await expect(page.locator('#contact-whatsapp-2')).toHaveAttribute('href', new RegExp(`^${WA_SECONDARY_PREFIX}\\?text=`));
    await expect(page.locator('.hero-ctas a[href="tel:+5519998108070"]')).toBeVisible();
    await expect(page.locator('#bottom-bar-call')).toHaveAttribute('href', 'tel:+5519998108070');

    // Clique no CTA de transfer (contextual)
    await page.locator('#transfer-whatsapp-cta').click();

    if (isMobileProject) {
      const navigated = await page.evaluate(
        () => (window as unknown as { __navigatedUrls: string[] }).__navigatedUrls
      );
      expect(navigated.length).toBeGreaterThanOrEqual(1);
      expect(navigated[0]).toMatch(new RegExp(`^whatsapp://send\\?phone=${PRIMARY_PHONE}&text=`));
      expect(decodeURIComponent(navigated[0])).toContain('orçamento de transfer');

      // Clique na barra inferior mobile
      await page.locator('#bottom-bar-whatsapp').click();
      const navigatedAfterBar = await page.evaluate(
        () => (window as unknown as { __navigatedUrls: string[] }).__navigatedUrls
      );
      expect(navigatedAfterBar[navigatedAfterBar.length - 1]).toMatch(
        new RegExp(`^whatsapp://send\\?phone=${PRIMARY_PHONE}&text=`)
      );
    } else {
      const opened = await page.evaluate(
        () => (window as unknown as { __openedUrls: string[] }).__openedUrls
      );
      expect(opened.length).toBeGreaterThanOrEqual(1);
      expect(opened[0]).toMatch(new RegExp(`^https://web\\.whatsapp\\.com/send\\?phone=${PRIMARY_PHONE}&text=`));
      expect(decodeURIComponent(opened[0])).toContain('orçamento de transfer');

      // Clique no segundo número em Contato
      await page.locator('#contact-whatsapp-2').click();
      const openedAfterContact = await page.evaluate(
        () => (window as unknown as { __openedUrls: string[] }).__openedUrls
      );
      expect(openedAfterContact[openedAfterContact.length - 1]).toMatch(
        new RegExp(`^https://web\\.whatsapp\\.com/send\\?phone=${SECONDARY_PHONE}&text=`)
      );
    }
  });

  test('formulário aplica máscara leve de telefone, data mínima = hoje e gera mensagem completa', async ({ page }, testInfo) => {
    const isMobileProject = testInfo.project.name.startsWith('mobile-');

    await page.addInitScript(() => {
      const w = window as unknown as {
        __navigatedUrls?: string[];
        __openedUrls?: string[];
        __mobilitaNavigate?: (url: string) => void;
      };
      w.__navigatedUrls = [];
      w.__openedUrls = [];
      w.__mobilitaNavigate = (url: string) => {
        w.__navigatedUrls!.push(url);
      };
      window.open = ((url?: string | URL) => {
        w.__openedUrls!.push(String(url || ''));
        return null;
      }) as typeof window.open;
    });

    await page.goto('/');

    // Verifica tipos corretos e inputmode
    await expect(page.locator('#telefone')).toHaveAttribute('type', 'tel');
    await expect(page.locator('#telefone')).toHaveAttribute('inputmode', 'tel');
    // Seletores custom substituem date/time nativos
    await expect(page.locator('#data')).toHaveAttribute('type', 'hidden');
    await expect(page.locator('#data-btn')).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(page.locator('#hora')).toHaveJSProperty('tagName', 'SELECT');
    await expect(page.locator('#passageiros')).toHaveAttribute('type', 'number');
    await expect(page.locator('#passageiros')).toHaveAttribute('inputmode', 'numeric');

    // Data mínima = hoje
    const expectedToday = await page.evaluate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    await expect(page.locator('#data')).toHaveAttribute('min', expectedToday);

    // Máscara leve BR + permissão de dígitos livres
    await page.fill('#telefone', '19991234567');
    await expect(page.locator('#telefone')).toHaveValue('(19) 99123-4567');
    await page.fill('#telefone', '5519991234567');
    await expect(page.locator('#telefone')).toHaveValue('5519991234567');
    await page.fill('#telefone', '19991234567');
    await expect(page.locator('#telefone')).toHaveValue('(19) 99123-4567');

    // Submissão completa
    await page.fill('#nome', 'Maria Aparecida');
    await page.fill('#origem', 'Campinas - Cambuí');
    await page.fill('#destino', 'Aeroporto de Viracopos');
    await page.locator('#quote-form').scrollIntoViewIfNeeded();

    // Calendário custom: dias passados desabilitados, navega ao próximo mês e escolhe dia 10
    await page.click('#data-btn');
    await expect(page.locator('#cal')).toBeVisible();
    await expect(page.locator('#data-btn')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#cal-prev')).toBeDisabled();
    const yesterday = await page.evaluate(() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.getDate() < new Date().getDate()
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : '';
    });
    if (yesterday) await expect(page.locator(`#cal-grid [data-iso="${yesterday}"]`)).toBeDisabled();
    await page.click('#cal-next');
    const targetIso = await page.evaluate(() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-10`;
    });
    await page.click(`#cal-grid [data-iso="${targetIso}"]`);
    await expect(page.locator('#cal')).toBeHidden();
    await expect(page.locator('#data')).toHaveValue(targetIso);
    const [ty, tm, td] = targetIso.split('-');
    const expectedDateText = `${td}/${tm}/${ty} às 08:30`;

    // Esc fecha e devolve o foco ao gatilho
    await page.click('#data-btn');
    await page.keyboard.press('Escape');
    await expect(page.locator('#cal')).toBeHidden();
    await expect(page.locator('#data-btn')).toBeFocused();

    await page.selectOption('#hora', '08:30');

    // Stepper − / +: limites 1..60
    await expect(page.locator('#passageiros')).toHaveValue('1');
    await expect(page.locator('#pax-minus')).toBeDisabled();
    await page.click('#pax-plus');
    await page.click('#pax-plus');
    await expect(page.locator('#passageiros')).toHaveValue('3');
    await page.click('#pax-minus');
    await page.click('#pax-plus');
    await expect(page.locator('#passageiros')).toHaveValue('3');
    const paxBox = await page.locator('#pax-plus').boundingBox();
    expect(paxBox!.width).toBeGreaterThanOrEqual(48);
    await page.fill('#observacao', '2 malas grandes');

    await page.click('#quote-submit');

    const triggeredUrl = await page.evaluate((mobile) => {
      const w = window as unknown as { __navigatedUrls: string[]; __openedUrls: string[] };
      return mobile ? w.__navigatedUrls[0] || '' : w.__openedUrls[0] || '';
    }, isMobileProject);

    if (isMobileProject) {
      expect(triggeredUrl).toMatch(new RegExp(`^whatsapp://send\\?phone=${PRIMARY_PHONE}&text=`));
    } else {
      expect(triggeredUrl).toMatch(new RegExp(`^https://web\\.whatsapp\\.com/send\\?phone=${PRIMARY_PHONE}&text=`));
    }

    const decoded = decodeURIComponent(triggeredUrl.split('&text=')[1] || '');
    expect(decoded).toContain('Maria Aparecida');
    expect(decoded).toContain('(19) 99123-4567');
    expect(decoded).toContain('Campinas - Cambuí');
    expect(decoded).toContain('Aeroporto de Viracopos');
    expect(decoded).toContain(expectedDateText);
    expect(decoded).toContain('3');
    expect(decoded).toContain('2 malas grandes');

    // Link de fallback wa.me visível com todos os dados
    const fallbackLink = page.locator('#whatsapp-generated-link');
    await expect(fallbackLink).toBeVisible();
    const fallbackHref = await fallbackLink.getAttribute('href');
    expect(fallbackHref).toMatch(new RegExp(`^${WA_PRIMARY_PREFIX}\\?text=`));
    expect(decodeURIComponent(fallbackHref!.split('?text=')[1])).toContain('Maria Aparecida');
  });

  test('captura screenshots mobile-375 (primeiro) e desktop-1440', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Screenshots gerados uma única vez no projeto desktop-chrome');

    const loadAllImages = async () => {
      await page.evaluate(async () => {
        const imgs = Array.from(document.querySelectorAll('img'));
        for (const img of imgs) {
          img.loading = 'eager';
        }
        await Promise.all(
          imgs.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.addEventListener('load', resolve, { once: true });
                  img.addEventListener('error', resolve, { once: true });
                })
          )
        );
      });
    };

    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Mobile 375 primeiro
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await loadAllImages();
    await page.screenshot({ path: 'tests/screenshots/v7-375.png', fullPage: true });

    // Desktop 1440
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await loadAllImages();
    await page.screenshot({ path: 'tests/screenshots/v7-1440.png', fullPage: true });
    await page.addStyleTag({ content: '.site-header,.skip-link,.floating-whatsapp,.mobile-bottom-bar{visibility:hidden!important}' });
    await page.locator('#orcamento').screenshot({ path: 'tests/screenshots/v7-1440-form.png' });
    await page.locator('#frota').screenshot({ path: 'tests/screenshots/v7-1440-frota.png' });
  });

  test('reduced-motion desliga animações: conteúdo visível, sem loader e sem scroll horizontal', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/js-enabled/);
    await expect(page.locator('.intro-loader')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const state = await page.evaluate(() => {
      const w = document.querySelector('.hero-title .w > span') as HTMLElement;
      const reveal = document.querySelector('.reveal') as HTMLElement;
      return {
        wordAnim: getComputedStyle(w).animationName,
        wordTransform: getComputedStyle(w).transform,
        revealOpacity: getComputedStyle(reveal).opacity,
        bgAnim: getComputedStyle(document.querySelector('.hero-bg-img') as HTMLElement).animationName,
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    expect(state.wordAnim).toBe('none');
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(state.wordTransform);
    expect(state.revealOpacity).toBe('1');
    expect(state.bgAnim).toBe('none');
    expect(state.overflowX).toBe(false);
  });

  test('com movimento: loader da 1ª visita some, hero anima e seções entram ao rolar', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/js-enabled/);
    await expect(page.locator('.intro-loader')).toHaveCount(0, { timeout: 3000 });
    await expect(page.locator('.hero-title .w').first()).toBeVisible();
    await page.locator('#diferenciais .diff-card').first().scrollIntoViewIfNeeded();
    await expect(page.locator('#diferenciais .diff-card').first()).toHaveClass(/is-visible/, { timeout: 3000 });
    const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowX).toBe(false);
  });

  test('screenshots de seções no meio da rolagem', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Capturas geradas uma única vez no projeto desktop-chrome');
    for (const [name, vp] of [['mobile', { width: 375, height: 812 }], ['desktop', { width: 1440, height: 900 }]] as const) {
      await page.setViewportSize(vp);
      await page.goto('/');
      await page.evaluate(() => document.querySelectorAll('img').forEach((i) => ((i as HTMLImageElement).loading = 'eager')));
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `tests/screenshots/hero-${name}.png` });
      for (const id of ['quem-somos', 'servicos', 'diferenciais', 'como-funciona', 'frota', 'orcamento', 'contato']) {
        await page.evaluate((sel) => document.querySelector(sel)!.scrollIntoView({ behavior: 'instant', block: 'start' }), `#${id}`);
        await page.evaluate(() => window.scrollBy(0, 40));
        await page.waitForTimeout(1300);
        await page.screenshot({ path: `tests/screenshots/${id}-${name}.png` });
      }
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await page.waitForTimeout(1300);
      await page.screenshot({ path: `tests/screenshots/rodape-${name}.png` });
    }
  });

  test('hero não duplica a logo do header e elemento da marca é protagonista', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero .hero-logo, .hero-logo-wrap')).toHaveCount(0);
    await expect(page.locator('.hero img[src*="logo-branco-grande"], .hero img[src*="mobilita-logo"]')).toHaveCount(0);
    await expect(page.locator('.site-header .brand-logo').first()).toHaveCount(1);
    const vw = await page.evaluate(() => window.innerWidth);
    const leaf = await page.locator('.hero-leaf-motif').boundingBox();
    expect(leaf!.width).toBeGreaterThanOrEqual(Math.min(vw * 0.5, 440));
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });

  test('telefones nunca quebram linha e rodapé usa ícones SVG para redes sociais', async ({ page }) => {
    await page.goto('/');
    const broken = await page.evaluate(() => {
      const re = /\(\d{2}\) \d{4,5}-\d{4}/g;
      const out: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement && /SCRIPT|STYLE/.test(n.parentElement.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent || '';
        let m: RegExpExecArray | null;
        re.lastIndex = 0;
        while ((m = re.exec(text))) {
          const range = document.createRange();
          range.setStart(node, m.index);
          range.setEnd(node, m.index + m[0].length);
          const tops = new Set(Array.from(range.getClientRects()).map((r) => Math.round(r.top / 4)));
          if (tops.size > 1) out.push(m[0]);
        }
      }
      return out;
    });
    expect(broken).toEqual([]);

    const social = page.locator('.site-footer .social-btn');
    await expect(social).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      const link = social.nth(i);
      await expect(link.locator('svg')).toHaveCount(1);
      await expect(link).toHaveAttribute('aria-label', /Instagram|Facebook/);
      expect(((await link.textContent()) || '').trim()).toBe('');
      const box = await link.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(48);
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }
  });

  test('diferenciais: 7 itens (desktop em 2 colunas, último em largura total) e contato lista todos os canais', async ({ page }, testInfo) => {
    await page.goto('/');
    const rects = await page.evaluate(() => Array.from(document.querySelectorAll('.diff-card')).map((c) => {
      const r = c.getBoundingClientRect();
      return { l: r.left, r: r.right, t: Math.round(r.top + window.scrollY) };
    }));
    expect(rects).toHaveLength(7);
    if (!testInfo.project.name.startsWith('mobile-')) {
      const rows = new Map<number, typeof rects>();
      rects.forEach((c) => rows.set(c.t, [...(rows.get(c.t) || []), c]));
      const lines = Array.from(rows.values());
      expect(lines.map((l) => l.length)).toEqual([2, 2, 2, 1]);
      // último item ocupa a largura das 2 colunas
      expect(lines[3][0].r - lines[3][0].l).toBeGreaterThan((lines[0][0].r - lines[0][0].l) * 1.8);
    }
    const channels = page.locator('#contato .channel');
    await expect(channels).toHaveCount(6);
    await expect(page.locator('#contato a[href^="mailto:"]')).toHaveCount(1);
    await expect(page.locator('#contato a[href*="instagram.com"]')).toHaveCount(1);
  });

  test('serviços ocupam a largura toda e CTA do transfer é botão normal com contraste AA', async ({ page }, testInfo) => {
    await page.goto('/');
    const cta = page.locator('#transfer-whatsapp-cta');
    await expect(cta).toContainText('Agendar pelo WhatsApp');
    const box = await cta.boundingBox();
    expect(box!.height).toBeLessThan(80);
    expect(box!.height).toBeGreaterThanOrEqual(48);
    const contrast = await cta.evaluate((el) => {
      const lum = (c: string) => {
        const v = (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number).map((x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
        return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
      };
      const cs = getComputedStyle(el);
      const a = lum(cs.color), b = lum(cs.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    if (!testInfo.project.name.startsWith('mobile-')) {
      const widths = await page.evaluate(() => {
        const c = document.querySelector('#servicos .container')!.getBoundingClientRect();
        const f = document.querySelector('.service-featured')!.getBoundingClientRect();
        const g = document.querySelector('.services-grid')!.getBoundingClientRect();
        return { c: c.width, f: f.width, g: g.width };
      });
      expect(widths.f).toBeGreaterThanOrEqual(widths.c - 2);
      expect(widths.g).toBeGreaterThanOrEqual(widths.c - 2);
    }
  });

  test('moldura de foto só revela depois da imagem decodificar (sem moldura vazia nem pop-in)', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__bad = [];
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.reveal').forEach((el) => {
          new MutationObserver(() => {
            if (!el.classList.contains('is-visible')) return;
            el.querySelectorAll('.media img, .fleet-stage img').forEach((img) => {
              const i = img as HTMLImageElement;
              if (i.getClientRects().length && !(i.complete && i.naturalWidth > 0)) (window as any).__bad.push(i.getAttribute('src'));
            });
          }).observe(el, { attributes: true, attributeFilter: ['class'] });
        });
      });
    });
    await page.route('**/assets/stock/**', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.continue();
    });
    await page.goto('/');
    await page.locator('#quem-somos .about-figure').scrollIntoViewIfNeeded();
    await expect(page.locator('#quem-somos .about-figure')).toHaveClass(/is-visible/, { timeout: 10000 });
    await expect(page.locator('#quem-somos .about-image')).not.toHaveClass(/is-loading/);
    expect(await page.evaluate(() => (window as any).__bad)).toEqual([]);
    expect(await page.locator('#quem-somos .about-image').evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  });

  test('frota: fundo limpo, sem foto de fundo; carros entram sem piscar (opacidade nunca regride)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile-'), 'entrada cinemática verificada no desktop');
    await page.goto('/');
    await expect(page.locator('#frota .bg-photo')).toHaveCount(0);
    await expect(page.locator('#frota .fleet-photo')).toHaveCount(0);
    expect(await page.locator('#frota').evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    await page.evaluate(() => {
      const w = window as any;
      w.__samples = [];
      const stage = document.getElementById('fleet-parallax-stage') as HTMLElement;
      const img = document.getElementById('fleet-parallax-img') as HTMLElement;
      const tick = () => {
        w.__samples.push({ s: parseFloat(getComputedStyle(stage).opacity), i: parseFloat(getComputedStyle(img).opacity), c: img.classList.contains('is-loading') });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.locator('#frota').scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 300);
    await expect(page.locator('#fleet-parallax-stage')).toHaveClass(/is-visible/, { timeout: 10000 });
    await page.waitForTimeout(2200);
    const samples: { s: number; i: number; c: boolean }[] = await page.evaluate(() => (window as any).__samples);
    expect(samples.length).toBeGreaterThan(20);
    for (let k = 1; k < samples.length; k++) {
      expect(samples[k].s).toBeGreaterThanOrEqual(samples[k - 1].s - 0.001);
      expect(samples[k].i).toBeGreaterThanOrEqual(samples[k - 1].i - 0.001);
    }
    expect(samples.some((x) => x.c)).toBe(false);
    expect(samples[samples.length - 1].s).toBe(1);
  });

  test('imagens fora da primeira dobra são lazy, com width/height e fotos novas sem repetir entre seções', async ({ page }) => {
    await page.goto('/');
    const info = await page.evaluate(() => {
      const vh = window.innerHeight;
      return Array.from(document.querySelectorAll('img')).map((i) => ({
        src: i.getAttribute('src') || '',
        lazy: i.getAttribute('loading') === 'lazy',
        top: i.getBoundingClientRect().top + window.scrollY,
        hasSize: !!i.getAttribute('width') && !!i.getAttribute('height'),
        section: i.closest('section, footer, header')?.id || i.closest('footer')?.className || '',
        vh,
      }));
    });
    const below = info.filter((i) => i.top > i.vh && i.src);
    expect(below.length).toBeGreaterThan(10);
    expect(below.filter((i) => !i.lazy).map((i) => i.src)).toEqual([]);
    expect(info.filter((i) => !i.hasSize).map((i) => i.src)).toEqual([]);
    expect(await page.locator('.hero-bg-img').getAttribute('fetchpriority')).toBe('high');
    const stock = new Set(info.filter((i) => i.src.includes('assets/stock/')).map((i) => i.src));
    expect(stock.size).toBe(3);
    const photos = new Set(info.filter((i) => /assets\/stock\/|showcase|fundo-sessao/.test(i.src)).map((i) => i.src.replace(/-(800|1600|640|1280|480|960)/, '')));
    expect(photos.size).toBeLessThanOrEqual(6);
    const bySrc = new Map<string, Set<string>>();
    info.filter((i) => i.src.includes('assets/stock/')).forEach((i) => {
      bySrc.set(i.src, (bySrc.get(i.src) || new Set<string>()).add(i.section));
    });
    bySrc.forEach((secs) => expect(secs.size).toBe(1));
  });

  test('cursor: pointer em CTAs, opções do formulário e calendário; not-allowed em desabilitados', async ({ page }) => {
    await page.goto('/');
    const cursorOf = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).cursor);
    for (const sel of ['#hero-whatsapp-cta', '#quote-submit', '#data-btn', '#pax-plus', '#cal-close', 'label[for="nome"]', 'a[href="#quem-somos"]', '.floating-whatsapp', '.site-footer .social-btn']) {
      expect(await cursorOf(sel), sel).toBe('pointer');
    }
    await expect(page.locator('#pax-minus')).toBeDisabled();
    expect(await cursorOf('#pax-minus')).toBe('not-allowed');
    expect(await cursorOf('#nome')).toBe('text');
    await page.locator('#data-btn').scrollIntoViewIfNeeded();
    await page.locator('#data-btn').click();
    const enabledDay = page.locator('.cal-day:not(:disabled)').first();
    await expect(enabledDay).toBeVisible();
    expect(await enabledDay.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');
    const disabledDay = page.locator('.cal-day:disabled').first();
    if (await disabledDay.count()) {
      expect(await disabledDay.evaluate((el) => getComputedStyle(el).cursor)).toBe('not-allowed');
    }
  });

  test('formulário: bloco verde com card branco e cabeçalho claramente distinto dos campos', async ({ page }) => {
    await page.goto('/');
    const s = await page.evaluate(() => {
      const bg = (sel: string) => getComputedStyle(document.querySelector(sel) as HTMLElement).backgroundColor;
      const head = document.querySelector('.form-head') as HTMLElement;
      const title = document.querySelector('.form-head-title') as HTMLElement;
      return {
        section: bg('.section--quote'),
        card: bg('.quote-form'),
        head: bg('.form-head'),
        input: bg('#nome'),
        headTag: title.tagName,
        headBorder: getComputedStyle(head).borderBottomWidth,
        headSize: parseFloat(getComputedStyle(title).fontSize),
      };
    });
    expect(s.section).not.toBe(s.card);
    expect(s.head).not.toBe(s.card);
    expect(s.head).not.toBe(s.input);
    expect(s.headTag).toBe('H3');
    expect(parseFloat(s.headBorder)).toBeGreaterThanOrEqual(3);
    expect(s.headSize).toBeGreaterThanOrEqual(24);
    await expect(page.locator('#orcamento .bg-photo')).toHaveCount(0);
  });

  test('desktop: hero em tela cheia com fatos, marquee e bento de serviços; mobile sem esses blocos', async ({ page }, testInfo) => {
    await page.goto('/');
    const isMobile = testInfo.project.name.startsWith('mobile-');
    if (isMobile) {
      await expect(page.locator('.hero-facts')).toBeHidden();
      await expect(page.locator('.marquee')).toBeHidden();
      await expect(page.locator('.featured-photo')).toBeHidden();
    } else {
      await expect(page.locator('.hero')).toHaveCSS('position', 'sticky');
      await expect(page.locator('.hero-facts')).toBeVisible();
      await expect(page.locator('.marquee')).toBeVisible();
      const h = await page.locator('.hero').evaluate((el) => el.getBoundingClientRect().height);
      expect(h).toBeGreaterThanOrEqual((await page.evaluate(() => window.innerHeight)) - 1);
      const cols = await page.locator('.services-grid').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      expect(cols).toBe(12);
    }
  });
});

test.describe('Rodapé premium', () => {
  for (const [w, h] of [[375, 812], [1440, 900]]) {
    test(`rodapé nítido, contatos clicáveis e print ${w}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/');
      await expect(page.locator('.intro-loader')).toHaveCount(0, { timeout: 5000 });
      await page.addStyleTag({ content: '.skip-link,.floating-whatsapp,.site-header,.mobile-bottom-bar{visibility:hidden!important}' });
      const footer = page.locator('.site-footer');
      await footer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      const logo = footer.locator('img.footer-logo');
      await expect(logo).toHaveAttribute('srcset', /@2x\.webp 2x/);
      const nat = await logo.evaluate((i: HTMLImageElement) => ({ nw: i.naturalWidth, w: i.getBoundingClientRect().width }));
      expect(nat.w).toBeLessThanOrEqual(nat.nw);
      await expect(footer.locator('a[data-wa-phone]')).toHaveCount(2);
      await expect(footer.locator('a[href^="mailto:"]')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await footer.screenshot({ path: `tests/screenshots/footer-${w}.png` });
    });
  }
});
