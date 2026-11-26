import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'site');
const outDir = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(rootDir, 'dist');

const TEXT_EXTS = new Set(['.html', '.css', '.js']);
const ROOT_RELATIVE_PATTERN = /(?:href|src|srcset|action)=["']\/(?!\/)|url\(\s*["']?\/(?!\/)/g;

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

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.cpSync(srcDir, outDir, { recursive: true });

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
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error('Build failed: dist/index.html missing');
  }

  return { outDir, fileCount: builtFiles.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { outDir: dir, fileCount } = buildSite();
  console.log(`Built static site (${fileCount} files) -> ${path.relative(rootDir, dir)}`);
}
