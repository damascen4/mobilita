import { test, expect } from '@playwright/test';

const WA_PHONE_1 = '5519998108070';
const WA_PHONE_2 = '5519992638676';
const WA_BASE_1 = `https://wa.me/${WA_PHONE_1}`;
const WA_BASE_2 = `https://wa.me/${WA_PHONE_2}`;

test.describe('Mobilità Transportes — Mobile-First & WhatsApp Direto', () => {
  test('carrega página, SEO, acessibilidade base (>=18px), WebP srcset e imagens', async ({ page }) => {
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

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Você no seu destino, sem preocupações');

    // Verifica sources WebP com srcset para imagens principais
    const webpSources = await page.locator('picture source[type="image/webp"][srcset]').count();
    expect(webpSources).toBeGreaterThanOrEqual(3);

    // Verifica tipos corretos dos inputs do formulário
    await expect(page.locator('#telefone')).toHaveAttribute('type', 'tel');
    await expect(page.locator('#data')).toHaveAttribute('type', 'date');
    await expect(page.locator('#hora')).toHaveAttribute('type', 'time');
    await expect(page.locator('#passageiros')).toHaveAttribute('type', 'number');

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

  test('navegação por âncoras alcança todas as seções (desktop e mobile)', async ({ page, isMobile }) => {
    await page.goto('/');

    const anchors = [
      '#quem-somos',
      '#servicos',
      '#diferenciais',
      '#frota',
      '#como-funciona',
      '#orcamento',
      '#contato',
    ];

    if (isMobile) {
      const menuToggle = page.locator('#menu-toggle');
      const mobileNav = page.locator('#nav-mobile');
      await expect(menuToggle).toBeVisible();
      await menuToggle.click();
      await expect(mobileNav).toBeVisible();
      await mobileNav.locator('a[href="#frota"]').click();
      await expect(mobileNav).toBeHidden();
      await expect(page).toHaveURL(/#frota$/);
      await expect(page.locator('#frota')).toBeVisible();
    } else {
      for (const hash of anchors) {
        const navLink = page.locator(`.main-nav a[href="${hash}"]`);
        await expect(navLink).toBeVisible();
        await navLink.click();
        await expect(page).toHaveURL(new RegExp(`${hash}$`));
        await expect(page.locator(hash)).toBeVisible();
      }
    }
  });

  test('CTAs WhatsApp possuem fallback wa.me correto e disparam link direto conforme dispositivo', async ({ page, isMobile }) => {
    await page.goto('/');

    // Fallbacks href (SEO / sem JS) com números só dígitos
    await expect(page.locator('#hero-whatsapp-cta')).toHaveAttribute('href', new RegExp(`^${WA_BASE_1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?text=`));
    await expect(page.locator('.header-whatsapp')).toHaveAttribute('href', new RegExp(`^${WA_BASE_1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?text=`));
    await expect(page.locator('#bottom-whatsapp-cta')).toHaveAttribute('href', new RegExp(`^${WA_BASE_1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?text=`));
    await expect(page.locator('#floating-whatsapp-cta')).toHaveAttribute('href', new RegExp(`^${WA_BASE_1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?text=`));
    await expect(page.locator(`#contato a[href^="${WA_BASE_2}"]`)).toHaveCount(1);
    await expect(page.locator('.hero-ctas a[href="tel:+5519998108070"]')).toBeVisible();

    // Captura evento de navegação WhatsApp direto sem sair da página
    await page.evaluate(() => {
      (window as unknown as { __waEvent?: Record<string, string> }).__waEvent = undefined;
      window.addEventListener('mobilita:whatsapp', (e) => {
        e.preventDefault();
        (window as unknown as { __waEvent?: Record<string, string> }).__waEvent = (e as CustomEvent).detail;
      });
    });

    await page.locator('#hero-whatsapp-cta').click();

    const waEvent = await page.evaluate(() => (window as unknown as { __waEvent?: Record<string, string> }).__waEvent);
    expect(waEvent).toBeTruthy();
    expect(waEvent!.phone).toBe(WA_PHONE_1);
    expect(waEvent!.text).toContain('orçamento');

    if (isMobile) {
      expect(waEvent!.mode).toBe('mobile');
      expect(waEvent!.url.startsWith(`whatsapp://send?phone=${WA_PHONE_1}&text=`)).toBe(true);
    } else {
      expect(waEvent!.mode).toBe('desktop');
      expect(waEvent!.url.startsWith(`https://web.whatsapp.com/send?phone=${WA_PHONE_1}&text=`)).toBe(true);
    }
  });

  test('formulário de orçamento monta mensagem com todos os campos e dispara WhatsApp direto', async ({ page, isMobile }) => {
    await page.goto('/');

    await page.evaluate(() => {
      (window as unknown as { __waEvent?: Record<string, string> }).__waEvent = undefined;
      window.addEventListener('mobilita:whatsapp', (e) => {
        e.preventDefault();
        (window as unknown as { __waEvent?: Record<string, string> }).__waEvent = (e as CustomEvent).detail;
      });
    });

    await page.fill('#nome', 'Maria Aparecida');
    await page.fill('#telefone', '(19) 99123-4567');
    await page.fill('#origem', 'Campinas - Cambuí');
    await page.fill('#destino', 'Aeroporto de Viracopos');
    await page.fill('#data', '2026-12-10');
    await page.fill('#hora', '08:30');
    await page.fill('#passageiros', '3');
    await page.fill('#observacao', '2 malas grandes');

    await page.click('#quote-submit');

    const waEvent = await page.evaluate(() => (window as unknown as { __waEvent?: Record<string, string> }).__waEvent);
    expect(waEvent).toBeTruthy();

    const expectedPrefix = isMobile
      ? `whatsapp://send?phone=${WA_PHONE_1}&text=`
      : `https://web.whatsapp.com/send?phone=${WA_PHONE_1}&text=`;
    expect(waEvent!.url.startsWith(expectedPrefix)).toBe(true);

    const decoded = decodeURIComponent(waEvent!.url.split('&text=')[1]);
    expect(decoded).toContain('Maria Aparecida');
    expect(decoded).toContain('(19) 99123-4567');
    expect(decoded).toContain('Campinas - Cambuí');
    expect(decoded).toContain('Aeroporto de Viracopos');
    expect(decoded).toContain('10/12/2026');
    expect(decoded).toContain('08:30');
    expect(decoded).toContain('3');
    expect(decoded).toContain('2 malas grandes');

    const fallbackLink = page.locator('#whatsapp-generated-link');
    await expect(fallbackLink).toBeVisible();
    await expect(fallbackLink).toHaveAttribute('href', new RegExp(`^${WA_BASE_1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?text=`));
  });

  test('mobile-first 375px: sem scroll horizontal, barra inferior e alvos de toque >= 48px', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Validação específica do projeto mobile');

    await page.goto('/');

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);

    // Barra inferior fixa visível ao alcance do polegar com WhatsApp e Ligar
    const bottomBar = page.locator('#mobile-bottom-bar');
    await expect(bottomBar).toBeVisible();
    await expect(page.locator('#bottom-call-cta')).toHaveAttribute('href', 'tel:+5519998108070');

    // Alvos de toque principais >= 48px
    const touchSelectors = [
      '.header-whatsapp',
      '#menu-toggle',
      '#hero-whatsapp-cta',
      '#bottom-whatsapp-cta',
      '#bottom-call-cta',
      '#quote-submit',
    ];
    for (const sel of touchSelectors) {
      const box = await page.locator(sel).boundingBox();
      expect(box, `Bounding box esperado para ${sel}`).not.toBeNull();
      expect(box!.height, `Altura de toque >= 48px em ${sel}`).toBeGreaterThanOrEqual(48);
    }

    // Slogan do hero não cortado horizontalmente
    const heroTitleBox = await page.locator('#hero-title').boundingBox();
    expect(heroTitleBox).not.toBeNull();
    expect(heroTitleBox!.x).toBeGreaterThanOrEqual(0);
    expect(heroTitleBox!.x + heroTitleBox!.width).toBeLessThanOrEqual(375);
  });

  test('captura screenshots mobile 375 e desktop 1440', async ({ page, isMobile }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

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

    const filename = isMobile
      ? 'tests/screenshots/mobile-375.png'
      : 'tests/screenshots/desktop-1440.png';
    await page.screenshot({ path: filename, fullPage: true });
  });
});
