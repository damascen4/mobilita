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

    const rootFontSize = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
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
      await expect(floatingWa).toBeVisible();

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
    await expect(page.locator('#data')).toHaveAttribute('type', 'date');
    await expect(page.locator('#hora')).toHaveAttribute('type', 'time');
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
    await page.fill('#data', '2026-12-10');
    await page.fill('#hora', '08:30');
    await page.fill('#passageiros', '3');
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
    expect(decoded).toContain('10/12/2026 às 08:30');
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
    await page.locator('#diferenciais').scrollIntoViewIfNeeded();
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
      for (const id of ['diferenciais', 'como-funciona', 'frota']) {
        await page.evaluate((sel) => document.querySelector(sel)!.scrollIntoView({ behavior: 'instant', block: 'start' }), `#${id}`);
        await page.evaluate(() => window.scrollBy(0, 120));
        await page.waitForTimeout(1300);
        await page.screenshot({ path: `tests/screenshots/${id}-${name}.png` });
      }
    }
  });
});
