import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PRIMARY_PHONE = '5519998108070';
const SECONDARY_PHONE = '5519992638676';

test.describe('Mobilità Transportes — v14 Arquitetura clean/moderna, WCAG 2.2 AA e conversão', () => {
  test('SEO, fontes KoHo 400-700, tokens, SVG inline/marca, <picture> srcset WebP e zero imagens quebradas', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.startsWith('mobile-');
    await page.goto('/');

    await expect(page).toHaveTitle('Transporte Executivo com Segurança e Conforto - Mobilità Transportes');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Mobilità/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Mobilità/);
    await expect(page.locator('body')).not.toContainText(/WP Shell uploader/i);

    const fontHref = await page.locator('link[href*="fonts.googleapis.com/css2"]').getAttribute('href');
    expect(fontHref).toContain('KoHo:wght@400;500;600;700');
    expect(fontHref).toContain('display=swap');

    const jsonLdRaw = await page.locator('script[type="application/ld+json"]').textContent();
    const jsonLd = JSON.parse(jsonLdRaw || '{}');
    expect(jsonLd['@type']).toBe('LocalBusiness');
    expect(jsonLd.name).toBe('Mobilità Transportes');

    // Tokens obrigatórios e base >= 18px
    const metrics = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        bodyFs: parseFloat(getComputedStyle(document.body).fontSize),
        greenHover: root.getPropertyValue('--mb-green-hover').trim().toLowerCase(),
        textHover: root.getPropertyValue('--mb-text-hover').trim().toLowerCase(),
        surfaceAlt: root.getPropertyValue('--mb-surface-alt').trim().toLowerCase(),
      };
    });
    expect(metrics.bodyFs).toBeGreaterThanOrEqual(18);
    expect(metrics.greenHover).toBe('#54963e');
    expect(metrics.textHover).toBe('#606167');
    expect(metrics.surfaceAlt).toBe('#f2f2f2');

    // SVGs de marca + folha inline do hero + 7 ícones de diferenciais inline (stroke currentColor)
    await expect(page.locator('.brand-logo')).toHaveAttribute('src', /logo-mobilita-cor\.svg$/);
    await expect(page.locator('.footer-logo')).toHaveAttribute('src', /logo-mobilita-branco\.svg$/);
    await expect(page.locator('.about-leaf')).toHaveAttribute('src', /simbolo-folha-branco\.svg$/);
    await expect(page.locator('.hero-leaf-svg .leaf-blade')).toHaveCount(3);
    await expect(page.locator('#diferenciais .diff-glyph')).toHaveCount(7);
    const glyphStrokes = await page.locator('#diferenciais .diff-glyph').evaluateAll((els) =>
      els.map((el) => el.getAttribute('stroke'))
    );
    expect(glyphStrokes).toEqual(Array(7).fill('currentColor'));

    // 3 fotos de marca via <picture> com srcset 480w/960w/1600w e sizes
    const webpSources = await page.locator('picture source[type="image/webp"]').evaluateAll((els) =>
      els.map((el) => ({
        srcset: el.getAttribute('srcset') || '',
        sizes: el.getAttribute('sizes') || '',
      }))
    );
    expect(webpSources.length).toBeGreaterThanOrEqual(4);
    for (const base of ['hero-passageiro-executivo', 'servicos-onibus-estrada', 'frota-veiculos-recorte']) {
      const match = webpSources.find(
        (s) => s.srcset.includes(`${base}-480.webp 480w`) && s.srcset.includes(`${base}-960.webp 960w`) && s.srcset.includes(`${base}-1600.webp 1600w`)
      );
      expect(match, `srcset completo ausente para ${base}`).toBeTruthy();
      expect(match!.sizes.length).toBeGreaterThan(0);
    }

    // Hero mobile carrega 960w
    if (isMobile) {
      const heroCurrentSrc = await page.locator('.hero-img').evaluate((img: HTMLImageElement) => img.currentSrc);
      expect(heroCurrentSrc).toContain('hero-passageiro-executivo-960.webp');
    }

    // Todas as imagens carregam sem erro
    const broken = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      imgs.forEach((img) => {
        img.loading = 'eager';
      });
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
    expect(broken).toEqual([]);
  });

  test('estrutura das 6 seções, WhatsApp correto (5519992638676) e roteamento mobile/desktop', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.startsWith('mobile-');

    await page.addInitScript(() => {
      const w = window as unknown as {
        __navigatedUrls?: string[];
        __openedUrls?: string[];
        __mobilitaNavigate?: (url: string) => void;
      };
      w.__navigatedUrls = [];
      w.__openedUrls = [];
      w.__mobilitaNavigate = (url: string) => w.__navigatedUrls!.push(url);
      window.open = ((url?: string | URL) => {
        w.__openedUrls!.push(String(url || ''));
        return null;
      }) as typeof window.open;
    });

    await page.goto('/');

    // Ordem exata das seções
    const sectionIds = await page.locator('main > section').evaluateAll((els) => els.map((e) => e.id));
    expect(sectionIds).toEqual(['inicio', 'quemsomos', 'oquefazemos', 'diferenciais', 'frota', 'contato']);

    await expect(page.locator('#oquefazemos .service-card')).toHaveCount(5);
    await expect(page.locator('#diferenciais .diff-item')).toHaveCount(7);

    // Href WhatsApp sem hífen no segundo número
    const secondWaLinks = page.locator(`a[href*="wa.me/${SECONDARY_PHONE}"]`);
    expect(await secondWaLinks.count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator('a[href*="551999263-8676"]')).toHaveCount(0);

    // Clique no segundo número testa roteamento
    await page.locator('#contact-whatsapp-2').click();
    const triggered = await page.evaluate((mobile) => {
      const w = window as unknown as { __navigatedUrls: string[]; __openedUrls: string[] };
      return mobile ? w.__navigatedUrls[0] || '' : w.__openedUrls[0] || '';
    }, isMobile);

    if (isMobile) {
      expect(triggered).toMatch(new RegExp(`^whatsapp://send\\?phone=${SECONDARY_PHONE}&text=`));
    } else {
      expect(triggered).toMatch(new RegExp(`^https://web\\.whatsapp\\.com/send\\?phone=${SECONDARY_PHONE}&text=`));
    }

    // Telefones nunca quebram linha
    const wrappedPhones = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.phone-nowrap'))
        .filter((el) => el.getClientRects().length > 1)
        .map((el) => el.textContent);
    });
    expect(wrappedPhones).toEqual([]);
  });

  test('formulário de contato: validação acessível, envio Web3Forms (sucesso/erro mock) e atalho WhatsApp', async ({ page }) => {
    let mockMode: 'success' | 'error' = 'success';
    const capturedPayloads: Array<Record<string, unknown>> = [];

    await page.route('https://api.web3forms.com/submit', async (route) => {
      const postData = route.request().postDataJSON() as Record<string, unknown>;
      capturedPayloads.push(postData);
      if (mockMode === 'success') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Email sent successfully' }),
        });
      } else {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Server error' }),
        });
      }
    });

    await page.goto('/');
    await page.locator('#contato').scrollIntoViewIfNeeded();

    // Placeholder de access_key, honeypot anti-spam e atalho WhatsApp presentes
    await expect(page.locator('#contact-form input[name="access_key"]')).toHaveValue('WEB3FORMS_ACCESS_KEY_AQUI');
    await expect(page.locator('#contact-form input[name="botcheck"]')).toHaveCount(1);
    await expect(page.locator('#form-whatsapp-shortcut')).toHaveAttribute('href', new RegExp(`^https://wa\\.me/${PRIMARY_PHONE}\\?text=`));

    // Envio vazio mostra erros acessíveis e foca o primeiro campo inválido
    await page.click('#contact-submit');
    await expect(page.locator('#nome')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#nome-erro')).toBeVisible();
    await expect(page.locator('#nome')).toBeFocused();

    // 1. Cenário de sucesso (mock Web3Forms 200)
    await page.fill('#nome', 'Carlos Mendes');
    await page.fill('#telefone', '19991234567');
    await expect(page.locator('#telefone')).toHaveValue('(19) 99123-4567');
    await page.fill('#email', 'carlos@empresa.com.br');
    await page.fill('#mensagem', 'Transfer Campinas para Viracopos amanhã às 07h.');
    await page.click('#contact-submit');

    await expect(page.locator('#form-status')).toBeVisible();
    await expect(page.locator('#form-status')).toHaveClass(/is-success/);
    await expect(page.locator('#form-status')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#form-status')).toContainText(/sucesso/i);
    await expect(page.locator('#nome')).toHaveValue('');
    expect(capturedPayloads).toHaveLength(1);
    expect(capturedPayloads[0]).toMatchObject({
      access_key: 'WEB3FORMS_ACCESS_KEY_AQUI',
      botcheck: false,
      nome: 'Carlos Mendes',
      telefone: '(19) 99123-4567',
      email: 'carlos@empresa.com.br',
    });

    // 2. Cenário de erro (mock Web3Forms 500) exibe alerta acessível + fallback WhatsApp
    mockMode = 'error';
    await page.fill('#nome', 'Maria Silva');
    await page.fill('#telefone', '19998887766');
    await page.fill('#email', 'maria@empresa.com.br');
    await page.fill('#mensagem', 'Cotação van executiva para evento corporativo.');
    await page.click('#contact-submit');

    await expect(page.locator('#form-status')).toBeVisible();
    await expect(page.locator('#form-status')).toHaveClass(/is-error/);
    await expect(page.locator('#form-status')).toHaveAttribute('role', 'alert');
    await expect(page.locator('#whatsapp-fallback-link')).toHaveAttribute('href', new RegExp(`^https://wa\\.me/${PRIMARY_PHONE}\\?text=`));
  });

  test('acessibilidade WCAG 2.2 AA: landmarks, skip link, headings, alts, alvos >=48px e contraste', async ({ page }) => {
    await page.goto('/');

    // Landmarks e skip link
    await expect(page.locator('header.site-header')).toHaveCount(1);
    await expect(page.locator('main#conteudo')).toHaveCount(1);
    await expect(page.locator('footer.site-footer')).toHaveCount(1);
    await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#conteudo');

    // Hierarquia de headings: 1 único H1 e nenhum salto de nível
    const headings = await page.evaluate(() =>
      Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => Number(h.tagName.slice(1)))
    );
    expect(headings.filter((l) => l === 1)).toHaveLength(1);
    expect(headings[0]).toBe(1);
    for (let i = 1; i < headings.length; i++) {
      expect(headings[i] - headings[i - 1]).toBeLessThanOrEqual(1);
    }

    // Toda imagem possui atributo alt (informativas descritivas, decorativas alt="")
    const missingAlt = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).filter((i) => !i.hasAttribute('alt')).length
    );
    expect(missingAlt).toBe(0);
    await expect(page.locator('.hero-img')).toHaveAttribute('alt', /Executivo/);
    await expect(page.locator('.fleet-img')).toHaveAttribute('alt', /Frota da Mobilità/);

    // Alvos de toque >= 48px
    const smallTargets = await page.evaluate(() => {
      const sels = ['.btn', '#menu-toggle', '.social-btn', '.contact-channel', '.footer-link', '.field input'];
      const bad: string[] = [];
      sels.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && r.height < 47.5) {
            bad.push(`${sel}:${Math.round(r.height)}`);
          }
        });
      });
      return bad;
    });
    expect(smallTargets).toEqual([]);

    // Contraste WCAG AA em botões primários, labels e textos sobre verde
    const contrasts = await page.evaluate(() => {
      const parseRgb = (c: string) => (c.match(/\d+(\.\d+)?/g) || [0, 0, 0]).slice(0, 3).map(Number);
      const lum = (c: string) => {
        const [r, g, b] = parseRgb(c).map((x) => {
          const s = x / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (fg: string, bg: string) => {
        const a = lum(fg), b = lum(bg);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      };

      const btnPrimary = getComputedStyle(document.querySelector('.btn-primary')!);
      const aboutSec = getComputedStyle(document.querySelector('#quemsomos')!);
      const aboutP = getComputedStyle(document.querySelector('#quemsomos p')!);
      const label = getComputedStyle(document.querySelector('.field-label')!);
      const panel = getComputedStyle(document.querySelector('.contact-panel')!);

      return {
        btnPrimary: ratio(btnPrimary.color, btnPrimary.backgroundColor),
        aboutBody: ratio(aboutP.color, aboutSec.backgroundColor),
        formLabel: ratio(label.color, panel.backgroundColor),
      };
    });
    expect(contrasts.btnPrimary).toBeGreaterThanOrEqual(4.5);
    expect(contrasts.aboutBody).toBeGreaterThanOrEqual(4.5);
    expect(contrasts.formLabel).toBeGreaterThanOrEqual(4.5);
  });

  test('menu mobile acessível por teclado (aria-expanded, focus trap, Esc) e sem overflow horizontal', async ({ page }, testInfo) => {
    await page.goto('/');

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);

    if (testInfo.project.name.startsWith('mobile-')) {
      const toggle = page.locator('#menu-toggle');
      const drawer = page.locator('#mobile-nav');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(drawer).toBeHidden();

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(drawer).toBeVisible();
      await expect(page.locator('#menu-close')).toBeFocused();

      // Shift+Tab no primeiro item circula para o último (focus trap)
      await page.keyboard.press('Shift+Tab');
      const focusedInside = await page.evaluate(() =>
        Boolean(document.getElementById('mobile-nav')?.contains(document.activeElement))
      );
      expect(focusedInside).toBe(true);

      // Esc fecha e devolve foco ao gatilho
      await page.keyboard.press('Escape');
      await expect(drawer).toBeHidden();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toBeFocused();

      // Navegação via link fecha o menu
      await toggle.click();
      await drawer.locator('a[href="#frota"]').click();
      await expect(drawer).toBeHidden();
      await expect(page).toHaveURL(/#frota$/);
    } else {
      for (const hash of ['#inicio', '#quemsomos', '#oquefazemos', '#diferenciais', '#frota', '#contato']) {
        const link = page.locator(`.main-nav a[href="${hash}"]`);
        await expect(link).toBeVisible();
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${hash}$`));
      }
    }
  });

  test('lazy load + skeleton shimmer abaixo da dobra e hero com fetchpriority=high', async ({ page }) => {
    await page.route('**/assets/brand/frota-veiculos-recorte*', async (route) => {
      await new Promise((r) => setTimeout(r, 350));
      await route.continue();
    });

    await page.goto('/');

    await expect(page.locator('.hero-img')).toHaveAttribute('fetchpriority', 'high');
    expect(await page.locator('.hero-img').getAttribute('loading')).toBeNull();

    // Todas as imagens abaixo da dobra têm loading=lazy, decoding=async, width e height
    const belowFold = await page.evaluate(() => {
      const vh = window.innerHeight;
      return Array.from(document.querySelectorAll('img'))
        .map((img) => ({
          src: img.getAttribute('src') || '',
          top: img.getBoundingClientRect().top + window.scrollY,
          loading: img.getAttribute('loading'),
          decoding: img.getAttribute('decoding'),
          hasSize: Boolean(img.getAttribute('width') && img.getAttribute('height')),
        }))
        .filter((i) => i.top > vh);
    });
    expect(belowFold.length).toBeGreaterThanOrEqual(4);
    expect(belowFold.filter((i) => i.loading !== 'lazy')).toEqual([]);
    expect(belowFold.filter((i) => i.decoding !== 'async')).toEqual([]);
    expect(belowFold.filter((i) => !i.hasSize)).toEqual([]);

    // Skeleton resolve para is-loaded ao rolar até a frota
    const fleetSkel = page.locator('#frota .img-skel');
    await page.locator('#frota').scrollIntoViewIfNeeded();
    await expect(fleetSkel).toHaveClass(/is-loaded/, { timeout: 6000 });
    const natW = await page.locator('.fleet-img').evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(natW).toBeGreaterThan(0);

    // Funciona também via file://
    const fileUrl = pathToFileURL(path.resolve('site/index.html')).href;
    await page.goto(fileUrl);
    await page.locator('#frota').scrollIntoViewIfNeeded();
    await expect(page.locator('#frota .img-skel')).toHaveClass(/is-loaded/, { timeout: 6000 });
  });

  test('prefers-reduced-motion desliga animações mantendo conteúdo visível; com movimento ativa reveals', async ({ page }) => {
    // 1. Reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/js-motion/);
    const reduced = await page.evaluate(() => ({
      heroAnim: getComputedStyle(document.querySelector('.hero-title .w > span')!).animationName,
      revealOp: getComputedStyle(document.querySelector('.reveal')!).opacity,
      leafOffset: parseFloat(getComputedStyle(document.querySelector('.hero-leaf .leaf-blade')!).strokeDashoffset),
      glyphOffset: parseFloat(getComputedStyle(document.querySelector('.diff-glyph path')!).strokeDashoffset),
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
    }));
    expect(reduced.heroAnim).toBe('none');
    expect(reduced.revealOp).toBe('1');
    expect(reduced.leafOffset).toBe(0);
    expect(reduced.glyphOffset).toBe(0);
    expect(reduced.overflowX).toBe(false);

    // 2. Com movimento
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/js-motion/);
    await expect(page.locator('.hero-leaf')).toHaveClass(/is-visible/, { timeout: 3000 });
    await page.locator('#diferenciais .diff-item').first().scrollIntoViewIfNeeded();
    await expect(page.locator('#diferenciais .diff-item').first()).toHaveClass(/is-visible/, { timeout: 3000 });
  });

  test('axe-core: sem violações serious/critical (WCAG 2.2 AA) em desktop e mobile', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(blocking.map((v) => v.id + ': ' + v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | '))).toEqual([]);
  });

  test('v14: hero editorial com faixa de fatos, CTAs por serviço, especificações da frota e topbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-card')).toHaveCount(0);
    await expect(page.locator('.hero-facts li')).toHaveCount(3);
    await expect(page.locator('#oquefazemos .service-link')).toHaveCount(5);
    await expect(page.locator('#frota .fleet-specs li')).toHaveCount(6);
    const gap = await page.locator('.topbar-link').evaluate((el) => parseFloat(getComputedStyle(el).columnGap));
    expect(gap).toBeGreaterThan(0);
  });

  test('captura screenshots 1440 e 375 em test-results/v14', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Screenshots gerados uma única vez no projeto desktop-chrome');

    fs.mkdirSync('test-results/v14', { recursive: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const loadAllImages = async () => {
      for (const sel of ['#quemsomos', '#oquefazemos', '#diferenciais', '#frota', '#contato', 'footer']) {
        await page.locator(sel).scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(async () => {
        const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
          const r = img.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        await Promise.all(
          imgs.map((img) =>
            img.complete && img.naturalWidth > 0
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.addEventListener('load', resolve, { once: true });
                  img.addEventListener('error', resolve, { once: true });
                  setTimeout(resolve, 2000);
                })
          )
        );
      });
    };

    // Desktop 1440
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await loadAllImages();
    await page.screenshot({ path: 'test-results/v14/v14-1440-fold.png' });
    await page.screenshot({ path: 'test-results/v14/v14-1440-full.png', fullPage: true });

    // Mobile 375
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await loadAllImages();
    await page.screenshot({ path: 'test-results/v14/v14-375-fold.png' });
    await page.screenshot({ path: 'test-results/v14/v14-375-full.png', fullPage: true });
  });
});
