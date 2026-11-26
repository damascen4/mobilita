import { test, expect } from '@playwright/test';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE_PATH = '/projetos/mobilita';
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

test.describe('Deploy em subpath (/projetos/mobilita)', () => {
  let serverProc: ChildProcess;
  let origin: string;
  let tempDistDir: string;

  test.beforeAll(async () => {
    tempDistDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mobilita-subpath-'));
    execFileSync(process.execPath, [BUILD_SCRIPT], {
      cwd: ROOT_DIR,
      env: { ...process.env, OUT_DIR: tempDistDir },
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

  test('redireciona /projetos/mobilita para /projetos/mobilita/ com 308', async ({ request }) => {
    const response = await request.get(`${origin}${BASE_PATH}`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()['location']).toBe(`${BASE_PATH}/`);
  });

  test('carrega build estático em /projetos/mobilita/ sem 404 de assets nem erros', async ({ page }) => {
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

    // Verifica que stylesheets foram carregados sob o subpath
    const loadedStylesheets = await page.evaluate(() =>
      Array.from(document.styleSheets)
        .map((s) => s.href)
        .filter((href): href is string => Boolean(href && href.startsWith(window.location.origin)))
    );
    expect(loadedStylesheets).toContain(`${origin}${BASE_PATH}/tokens.css`);
    expect(loadedStylesheets).toContain(`${origin}${BASE_PATH}/styles.css`);

    // Verifica âncora interna mantendo o subpath
    await page.locator('a[href="#quemsomos"]').first().evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(`${origin}${BASE_PATH}/#quemsomos`);

    expect(leakedRootRequests, 'Nenhum asset local deve escapar para a raiz /').toEqual([]);
    expect(failedLocalResponses, 'Nenhum asset local deve retornar 4xx/5xx').toEqual([]);
    expect(brokenImages, 'Todas as imagens devem carregar sob /projetos/mobilita/').toEqual([]);
    expect(pageErrors, 'Sem erros JS não tratados').toEqual([]);
  });
});
