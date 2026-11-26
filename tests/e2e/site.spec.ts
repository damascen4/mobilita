import { test, expect } from '@playwright/test';

const WA_BASE = 'https://wa.me/5519998108070';

test.describe('Mobilità Transportes — One-Page Site', () => {
  test('carrega página, SEO, acessibilidade base (>=18px) e imagens', async ({ page }) => {
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

    // Garante que imagens visíveis não estão quebradas
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

  test('navegação por âncoras alcança todas as seções principais', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
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

    for (const hash of anchors) {
      const navLink = page.locator(`.main-nav a[href="${hash}"]`);
      await expect(navLink).toBeVisible();
      await navLink.click();
      await expect(page).toHaveURL(new RegExp(`${hash}$`));
      await expect(page.locator(hash)).toBeVisible();
    }
  });

  test('CTAs WhatsApp e Ligar agora possuem href corretos', async ({ page }) => {
    await page.goto('/');

    const heroWhatsapp = page.locator('#hero-whatsapp-cta');
    await expect(heroWhatsapp).toHaveAttribute('href', new RegExp(`^${WA_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));

    const headerWhatsapp = page.locator('.header-whatsapp');
    await expect(headerWhatsapp).toHaveAttribute('href', new RegExp(`^${WA_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));

    const floatingWhatsapp = page.locator('.floating-whatsapp');
    await expect(floatingWhatsapp).toHaveAttribute('href', new RegExp(`^${WA_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));

    const callNow = page.locator('.hero-ctas a[href="tel:+5519998108070"]');
    await expect(callNow).toBeVisible();
  });

  test('formulário de orçamento gera URL wa.me com todos os campos preenchidos', async ({ page }) => {
    await page.goto('/');

    // Intercepta window.open para validar URL sem abrir aba externa
    await page.evaluate(() => {
      (window as unknown as { __openedUrl?: string }).__openedUrl = '';
      window.open = ((url?: string | URL) => {
        (window as unknown as { __openedUrl?: string }).__openedUrl = String(url || '');
        return null;
      }) as typeof window.open;
    });

    await page.fill('#nome', 'Maria Aparecida');
    await page.fill('#telefone', '(19) 99123-4567');
    await page.fill('#origem', 'Campinas - Cambuí');
    await page.fill('#destino', 'Aeroporto de Viracopos');
    await page.fill('#dataHora', '2026-12-10T08:30');
    await page.fill('#passageiros', '3');
    await page.fill('#observacao', '2 malas grandes');

    await page.click('#quote-submit');

    const openedUrl = await page.evaluate(() => (window as unknown as { __openedUrl?: string }).__openedUrl || '');
    expect(openedUrl.startsWith(`${WA_BASE}?text=`)).toBe(true);

    const decoded = decodeURIComponent(openedUrl.split('?text=')[1]);
    expect(decoded).toContain('Maria Aparecida');
    expect(decoded).toContain('(19) 99123-4567');
    expect(decoded).toContain('Campinas - Cambuí');
    expect(decoded).toContain('Aeroporto de Viracopos');
    expect(decoded).toContain('10/12/2026 às 08:30');
    expect(decoded).toContain('3');
    expect(decoded).toContain('2 malas grandes');

    const fallbackLink = page.locator('#whatsapp-generated-link');
    await expect(fallbackLink).toBeVisible();
    await expect(fallbackLink).toHaveAttribute('href', openedUrl);
  });

  test('layout mobile 375px sem scroll horizontal e menu mobile funcional', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);

    const menuToggle = page.locator('#menu-toggle');
    const mobileNav = page.locator('#nav-mobile');
    await expect(menuToggle).toBeVisible();
    await expect(mobileNav).toBeHidden();

    await menuToggle.click();
    await expect(mobileNav).toBeVisible();

    await mobileNav.locator('a[href="#frota"]').click();
    await expect(mobileNav).toBeHidden();
    await expect(page).toHaveURL(/#frota$/);
  });

  test('captura screenshots desktop 1440 e mobile 375', async ({ page }) => {
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

    // Desktop 1440
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await loadAllImages();
    await page.screenshot({ path: 'tests/screenshots/desktop-1440.png', fullPage: true });

    // Mobile 375
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await loadAllImages();
    await page.screenshot({ path: 'tests/screenshots/mobile-375.png', fullPage: true });
  });
});
