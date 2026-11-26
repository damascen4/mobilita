import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'site');
const outDir = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(rootDir, 'dist');

const TEXT_EXTS = new Set(['.html', '.css', '.js']);
const ROOT_RELATIVE_PATTERN = /(?:href|src|srcset|action)=["']\/(?!\/)|url\(\s*["']?\/(?!\/)/g;
const WEB3FORMS_PLACEHOLDER = 'WEB3FORMS_ACCESS_KEY_AQUI';

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export function buildSite() {
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Source directory not found: ${srcDir}`);
  }

  const violations = [];
  for (const file of walk(srcDir)) {
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXTS.has(ext)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (!/<base\s/.test(line) && ROOT_RELATIVE_PATTERN.test(line)) {
        violations.push(`${path.relative(rootDir, file)}:${idx + 1}: ${line.trim()}`);
      }
      ROOT_RELATIVE_PATTERN.lastIndex = 0;
    });
  }

  if (violations.length > 0) {
    throw new Error(
      `Root-relative asset paths break subpath deploys (/projetos/mobilita/):\n${violations.join('\n')}`
    );
  }

  const web3formsKey = (process.env.WEB3FORMS_ACCESS_KEY || '').trim();
  const allowMissingWeb3forms = process.env.ALLOW_MISSING_WEB3FORMS === '1';

  if (!web3formsKey && !allowMissingWeb3forms) {
    throw new Error(
      'WEB3FORMS_ACCESS_KEY is required for production builds. Set WEB3FORMS_ACCESS_KEY (or ALLOW_MISSING_WEB3FORMS=1 for test builds).'
    );
  }
  if (web3formsKey === WEB3FORMS_PLACEHOLDER) {
    throw new Error(`WEB3FORMS_ACCESS_KEY must not be the placeholder value (${WEB3FORMS_PLACEHOLDER}).`);
  }

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.cpSync(srcDir, outDir, { recursive: true });

  const outIndexHtml = path.join(outDir, 'index.html');
  if (!fs.existsSync(outIndexHtml)) {
    throw new Error('Build failed: dist/index.html missing');
  }
  const rawHtml = fs.readFileSync(outIndexHtml, 'utf8');
  if (!rawHtml.includes(WEB3FORMS_PLACEHOLDER)) {
    throw new Error(`Expected placeholder ${WEB3FORMS_PLACEHOLDER} in site/index.html`);
  }
  const injectedHtml = rawHtml.replaceAll(WEB3FORMS_PLACEHOLDER, () => web3formsKey);
  if (injectedHtml.includes(WEB3FORMS_PLACEHOLDER)) {
    throw new Error(`Production build still contains placeholder ${WEB3FORMS_PLACEHOLDER} in dist/index.html`);
  }
  fs.writeFileSync(outIndexHtml, injectedHtml, 'utf8');

  const outMainJs = path.join(outDir, 'main.js');
  if (fs.existsSync(outMainJs)) {
    const rawMain = fs.readFileSync(outMainJs, 'utf8');
    const strippedMain = rawMain.replace(
      /\r?\n?[ \t]*\/\* __MOBILITA_TEST_HOOK_START__ \*\/[\s\S]*?\/\* __MOBILITA_TEST_HOOK_END__ \*\//g,
      ''
    );
    if (strippedMain.includes('__mobilitaNavigate')) {
      throw new Error('Production build still exposes __mobilitaNavigate in dist/main.js');
    }
    fs.writeFileSync(outMainJs, strippedMain, 'utf8');
  }

  const builtFiles = walk(outDir);

  return { outDir, fileCount: builtFiles.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { outDir: dir, fileCount } = buildSite();
  console.log(`Built static site (${fileCount} files) -> ${path.relative(rootDir, dir)}`);
}
