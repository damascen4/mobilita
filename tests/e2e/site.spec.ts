import { test, expect } from '@playwright/test';

const PRIMARY_PHONE = '5519998108070';
const SECONDARY_PHONE = '5519992638676';
const WA_PRIMARY_PREFIX = `https://wa.me/${PRIMARY_PHONE}`;
const WA_SECONDARY_PREFIX = `https://wa.me/${SECONDARY_PHONE}`;

test.describe('Mobilità Transportes — Site Mobile-First & WhatsApp Direto', () => {
  test('carrega página, SEO, fonte >=18px, WebP <picture> e imagens íntegras', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Transporte Executivo em Campinas e SP | Mobilità');
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
    await page.screenshot({ path: 'tests/screenshots/mobile-375.png', fullPage: true });

    // Desktop 1440
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await loadAllImages();
    await page.screenshot({ path: 'tests/screenshots/desktop-1440.png', fullPage: true });
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

  test('diferenciais: 7 cards com linha de baixo centralizada e contato lista todos os canais', async ({ page }, testInfo) => {
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
      expect(lines.map((l) => l.length)).toEqual([4, 3]);
      const vw = await page.evaluate(() => window.innerWidth);
      const last = lines[1];
      const left = last[0].l;
      const right = vw - last[last.length - 1].r;
      expect(Math.abs(left - right)).toBeLessThan(6);
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
});
