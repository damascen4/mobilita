import { test, expect } from '@playwright/test';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE_PATH = '/projetos/mobilitav2';
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BUILD_SCRIPT = path.join(ROOT_DIR, 'scripts', 'build.mjs');
const SERVE_SCRIPT = path.join(ROOT_DIR, 'tests', 'serve-site.mjs');

async function startSubpathServer(siteDir: string): Promise<{ proc: ChildProcess; origin: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [SERVE_SCRIPT], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        PORT: '0',
        SITE_DIR: siteDir,
        BASE_PATH,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`Timeout starting subpath server. stderr: ${stderr}`));
    }, 10000);

    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      const match = text.match(/at (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve({ proc, origin: match[1] });
      }
    });

    proc.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Subpath server exited prematurely (${code}). stderr: ${stderr}`));
    });
  });
}

test.describe('Deploy em subpath (/projetos/mobilitav2)', () => {
  let serverProc: ChildProcess;
  let origin: string;
  let tempDistDir: string;

  test.beforeAll(async () => {
    tempDistDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mobilita-subpath-'));
    execFileSync(process.execPath, [BUILD_SCRIPT], {
      cwd: ROOT_DIR,
      env: { ...process.env, OUT_DIR: tempDistDir, WEB3FORMS_ACCESS_KEY: 'e2e-mock-access-key' },
      stdio: 'pipe',
    });
    const started = await startSubpathServer(tempDistDir);
    serverProc = started.proc;
    origin = started.origin;
  });

  test.afterAll(async () => {
    if (serverProc && !serverProc.killed) {
      serverProc.kill();
    }
    if (tempDistDir) {
      fs.rmSync(tempDistDir, { recursive: true, force: true });
    }
  });

  test('redireciona /projetos/mobilitav2 para /projetos/mobilitav2/ com 308', async ({ request }) => {
    const response = await request.get(`${origin}${BASE_PATH}`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()['location']).toBe(`${BASE_PATH}/`);
  });

  test('carrega build estático em /projetos/mobilitav2/ sem 404 de assets nem erros', async ({ page }) => {
    const failedLocalResponses: string[] = [];
    const leakedRootRequests: string[] = [];
    const pageErrors: string[] = [];

    page.on('response', (res) => {
      const url = new URL(res.url());
      if (url.origin !== origin) return;
      if (!url.pathname.startsWith(`${BASE_PATH}/`)) {
        leakedRootRequests.push(`${res.status()} ${url.pathname}`);
      }
      if (res.status() >= 400) {
        failedLocalResponses.push(`${res.status()} ${url.pathname}`);
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    const mainResponse = await page.goto(`${origin}${BASE_PATH}/`, { waitUntil: 'networkidle' });
    expect(mainResponse?.status()).toBe(200);
    await expect(page).toHaveURL(`${origin}${BASE_PATH}/`);

    // Força carregamento eager de todas as imagens para detectar qualquer 404 de lazy image
    const brokenImages = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      for (const img of imgs) {
        img.loading = 'eager';
      }
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
              })
        )
      );
      return imgs
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.getAttribute('src') || 'unknown');
    });

    // Verifica que stylesheets com hash foram carregados sob o subpath
    const loadedStylesheets = await page.evaluate(() =>
      Array.from(document.styleSheets)
        .map((s) => s.href)
        .filter((href): href is string => Boolean(href && href.startsWith(window.location.origin)))
    );
    const prefix = `${origin}${BASE_PATH}/`;
    expect(loadedStylesheets.some((href) => href.startsWith(prefix) && /^tokens\.[0-9a-f]{8}\.css$/.test(href.slice(prefix.length)))).toBe(true);
    expect(loadedStylesheets.some((href) => href.startsWith(prefix) && /^styles\.[0-9a-f]{8}\.css$/.test(href.slice(prefix.length)))).toBe(true);

    // Verifica âncora interna mantendo o subpath
    await page.locator('a[href="#quemsomos"]').first().evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(`${origin}${BASE_PATH}/#quemsomos`);

    expect(leakedRootRequests, 'Nenhum asset local deve escapar para a raiz /').toEqual([]);
    expect(failedLocalResponses, 'Nenhum asset local deve retornar 4xx/5xx').toEqual([]);
    expect(brokenImages, 'Todas as imagens devem carregar sob /projetos/mobilitav2/').toEqual([]);
    expect(pageErrors, 'Sem erros JS não tratados').toEqual([]);
  });

  test('injeta WEB3FORMS_ACCESS_KEY não-placeholder no formulário do build mockado', async ({ page }) => {
    await page.goto(`${origin}${BASE_PATH}/`, { waitUntil: 'domcontentloaded' });
    const accessKeyInput = page.locator('#contact-form input[name="access_key"]');
    await expect(accessKeyInput).toHaveValue('e2e-mock-access-key');
    await expect(accessKeyInput).not.toHaveValue('WEB3FORMS_ACCESS_KEY_AQUI');
    const html = await page.content();
    expect(html).not.toContain('WEB3FORMS_ACCESS_KEY_AQUI');
  });

  test('assets referenciados no HTML (index e 404) têm hash de conteúdo e retornam 200', async ({ page, request }) => {
    const HASHED_ASSET_RE = /\.[0-9a-f]{8}\.[a-z0-9]+$/i;

    for (const route of [`${BASE_PATH}/`, `${BASE_PATH}/404.html`]) {
      await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded' });

      const refs = await page.evaluate(() => {
        const urls = new Set<string>();
        const addIfLocal = (raw: string | null) => {
          if (!raw) return;
          const trimmed = raw.trim();
          if (!trimmed || trimmed.startsWith('#') || /^(?:https?:|data:|mailto:|tel:|\/\/)/i.test(trimmed)) return;
          urls.add(trimmed);
        };

        document
          .querySelectorAll('link[rel="stylesheet"], link[rel="preload"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
          .forEach((el) => addIfLocal(el.getAttribute('href')));
        document.querySelectorAll('script[src]').forEach((el) => addIfLocal(el.getAttribute('src')));
        document.querySelectorAll('img[src]').forEach((el) => addIfLocal(el.getAttribute('src')));
        document.querySelectorAll('source[srcset]').forEach((el) => {
          const srcset = el.getAttribute('srcset') || '';
          for (const entry of srcset.split(',')) {
            const url = entry.trim().split(/\s+/)[0];
            addIfLocal(url);
          }
        });
        return Array.from(urls);
      });

      expect(refs.length, `Deve haver assets locais referenciados em ${route}`).toBeGreaterThan(0);

      for (const ref of refs) {
        expect(ref, `Asset ${ref} em ${route} deve conter hash de 8 hex`).toMatch(HASHED_ASSET_RE);
        const assetUrl = new URL(ref, `${origin}${BASE_PATH}/`).toString();
        const res = await request.get(assetUrl);
        expect(res.status(), `Asset ${assetUrl} deve retornar 200`).toBe(200);
      }
    }
  });
});
