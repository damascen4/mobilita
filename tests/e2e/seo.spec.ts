import { test, expect } from '@playwright/test';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE_PATH = process.env.BASE_PATH || '/projetos/mobilita';
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BUILD_SCRIPT = path.join(ROOT_DIR, 'scripts', 'build.mjs');
const SERVE_SCRIPT = path.join(ROOT_DIR, 'tests', 'serve-site.mjs');

const CANONICAL_URL = `https://damascena.dev${BASE_PATH}/`;
const OG_IMAGE_URL = `https://damascena.dev${BASE_PATH}/assets/brand/hero-passageiro-executivo.jpeg`;
const LOGO_URL = `https://damascena.dev${BASE_PATH}/assets/brand/logo-mobilita-cor.png`;
const EXPECTED_TITLE = 'Transporte Executivo em Campinas e SP | Mobilità';

async function startServer(siteDir: string): Promise<{ proc: ChildProcess; origin: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [SERVE_SCRIPT], {
      cwd: ROOT_DIR,
      env: { ...process.env, PORT: '0', SITE_DIR: siteDir, BASE_PATH },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`Timeout starting server. stderr: ${stderr}`));
    }, 10000);
    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    proc.stdout?.on('data', (chunk) => {
      const match = chunk.toString().match(/at (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve({ proc, origin: match[1] });
      }
    });
    proc.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited prematurely (${code}). stderr: ${stderr}`));
    });
  });
}

test.describe('SEO metadata & structured data', () => {
  let serverProc: ChildProcess;
  let origin: string;
  let tempDistDir: string;

  test.beforeAll(async () => {
    tempDistDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mobilita-seo-'));
    execFileSync(process.execPath, [BUILD_SCRIPT], {
      cwd: ROOT_DIR,
      env: { ...process.env, OUT_DIR: tempDistDir, ALLOW_MISSING_WEB3FORMS: '1' },
      stdio: 'pipe',
    });
    const started = await startServer(tempDistDir);
    serverProc = started.proc;
    origin = started.origin;
  });

  test.afterAll(async () => {
    if (serverProc && !serverProc.killed) serverProc.kill();
    if (tempDistDir) fs.rmSync(tempDistDir, { recursive: true, force: true });
  });

  test('expõe title, canonical, Open Graph/Twitter absolutos e JSON-LD válidos', async ({ page }) => {
    await page.goto(`${origin}${BASE_PATH}/`);

    await expect(page).toHaveTitle(EXPECTED_TITLE);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL_URL);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', CANONICAL_URL);

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', OG_IMAGE_URL);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1920');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '1080');
    const ogAlt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
    expect(ogAlt && ogAlt.trim().length > 10).toBeTruthy();

    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', OG_IMAGE_URL);

    const jsonLdRaw = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLdRaw).toBeTruthy();
    const jsonLd = JSON.parse(jsonLdRaw!);
    expect(jsonLd.url).toBe(CANONICAL_URL);
    expect(jsonLd.image).toBe(OG_IMAGE_URL);
    expect(jsonLd.logo).toBe(LOGO_URL);

    const fontsHref = await page
      .locator('link[rel="stylesheet"][href*="fonts.googleapis.com"]')
      .getAttribute('href');
    expect(fontsHref).toContain('KoHo:wght@400;500;600;700');
    expect(fontsHref).toContain('Open+Sans:wght@400;600;700');
  });

  test('serve sitemap.xml com a URL canônica', async ({ request }) => {
    const res = await request.get(`${origin}${BASE_PATH}/sitemap.xml`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/xml');
    const body = await res.text();
    expect(body).toContain(`<loc>${CANONICAL_URL}</loc>`);
  });
});
