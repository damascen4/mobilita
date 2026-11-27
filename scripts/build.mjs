import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'site');
const outDir = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(rootDir, 'dist');

const TEXT_EXTS = new Set(['.html', '.css', '.js']);
const CODE_EXTS = new Set(['.css', '.js']);
const ASSET_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff2', '.woff']);
const ROOT_RELATIVE_PATTERN = /(?:href|src|srcset|action)=["']\/(?!\/)|url\(\s*["']?\/(?!\/)/g;
const DEFAULT_BASE_PATH = '/projetos/mobilita';
const BASE_PATH = (process.env.BASE_PATH || DEFAULT_BASE_PATH).trim().replace(/\/+$/, '');
if (!/^\/[A-Za-z0-9._~\/-]*[A-Za-z0-9._~-]$/.test(BASE_PATH)) {
  throw new Error(`Invalid BASE_PATH: ${BASE_PATH} (expected e.g. /projetos/mobilita)`);
}
const WEB3FORMS_PLACEHOLDER = 'WEB3FORMS_ACCESS_KEY_AQUI';

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').slice(0, 8);
}

function toHashedRelPath(relPath, hash) {
  const ext = path.posix.extname(relPath);
  return `${relPath.slice(0, -ext.length)}.${hash}${ext}`;
}

function resolveLocalRef(rawRef, fromFileRel) {
  const trimmed = rawRef.trim();
  if (
    !trimmed ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(trimmed)
  ) {
    return null;
  }
  const suffixIdx = trimmed.search(/[?#]/);
  const cleanPath = suffixIdx === -1 ? trimmed : trimmed.slice(0, suffixIdx);
  const suffix = suffixIdx === -1 ? '' : trimmed.slice(suffixIdx);
  if (!cleanPath) return null;

  const baseDir = path.posix.dirname(fromFileRel);
  const relPath = path.posix.normalize(baseDir === '.' ? cleanPath : path.posix.join(baseDir, cleanPath));
  if (relPath.startsWith('..')) return null;

  return { relPath, suffix, hadDotSlash: cleanPath.startsWith('./') };
}

function formatRef(targetRel, fromFileRel, suffix, hadDotSlash) {
  const baseDir = path.posix.dirname(fromFileRel);
  let rel = baseDir === '.' ? targetRel : path.posix.relative(baseDir, targetRel);
  if (hadDotSlash && !rel.startsWith('.')) rel = `./${rel}`;
  return `${rel}${suffix}`;
}

function mapRef(rawRef, fromFileRel, manifest, onMatch) {
  const resolved = resolveLocalRef(rawRef, fromFileRel);
  if (!resolved) return rawRef;
  if (onMatch) onMatch(resolved.relPath);
  const mapped = manifest?.get(resolved.relPath);
  return mapped ? formatRef(mapped, fromFileRel, resolved.suffix, resolved.hadDotSlash) : rawRef;
}

function processCss(content, fromFileRel, manifest, onMatch) {
  let out = content.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g, (full, quote, ref) => {
    const next = mapRef(ref, fromFileRel, manifest, onMatch);
    return next === ref ? full : `url(${quote}${next}${quote})`;
  });
  out = out.replace(/(@import\s+)(['"])([^'"]+)\2/g, (full, prefix, quote, ref) => {
    const next = mapRef(ref, fromFileRel, manifest, onMatch);
    return next === ref ? full : `${prefix}${quote}${next}${quote}`;
  });
  return out;
}

function processJs(content, fromFileRel, manifest, onMatch) {
  let out = content.replace(
    /((?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"])([^'"]+)(['"])/g,
    (full, pre, ref, post) => {
      const next = mapRef(ref, fromFileRel, manifest, onMatch);
      return next === ref ? full : `${pre}${next}${post}`;
    }
  );
  out = out.replace(/(import\(\s*['"])([^'"]+)(['"]\s*\))/g, (full, pre, ref, post) => {
    const next = mapRef(ref, fromFileRel, manifest, onMatch);
    return next === ref ? full : `${pre}${next}${post}`;
  });
  return out;
}

function processHtml(content, fromFileRel, manifest, onMatch) {
  let out = content.replace(/(\b(?:href|src)\s*=\s*)(["'])([^"']+)\2/gi, (full, pre, quote, ref) => {
    const next = mapRef(ref, fromFileRel, manifest, onMatch);
    return next === ref ? full : `${pre}${quote}${next}${quote}`;
  });
  out = out.replace(/(\b(?:srcset|imagesrcset)\s*=\s*)(["'])([^"']+)\2/gi, (full, pre, quote, value) => {
    const rewritten = value
      .split(',')
      .map((entry) => {
        const match = entry.match(/^(\s*)(\S+)([\s\S]*)$/);
        if (!match) return entry;
        const [, lead, url, rest] = match;
        const next = mapRef(url, fromFileRel, manifest, onMatch);
        return `${lead}${next}${rest}`;
      })
      .join(',');
    return rewritten === value ? full : `${pre}${quote}${rewritten}${quote}`;
  });
  return out;
}

function applyContentHashes(dir) {
  const allFiles = walk(dir);
  const relSet = new Set(allFiles.map((f) => toPosix(path.relative(dir, f))));
  const htmlFiles = allFiles.filter((f) => path.extname(f).toLowerCase() === '.html');
  const codeFiles = allFiles.filter((f) => CODE_EXTS.has(path.extname(f).toLowerCase()));

  const referencedAssets = new Set();
  const collect = (rel) => {
    if (relSet.has(rel) && ASSET_EXTS.has(path.posix.extname(rel).toLowerCase())) {
      referencedAssets.add(rel);
    }
  };

  const absoluteKeepAssets = new Set();
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    processHtml(content, toPosix(path.relative(dir, file)), null, collect);
    for (const match of content.matchAll(/https?:\/\/[^\s"'<>]+/g)) {
      for (const rel of relSet) {
        if (ASSET_EXTS.has(path.posix.extname(rel).toLowerCase()) && match[0].endsWith(`/${rel}`)) {
          absoluteKeepAssets.add(rel);
        }
      }
    }
  }
  for (const file of codeFiles) {
    const rel = toPosix(path.relative(dir, file));
    const content = fs.readFileSync(file, 'utf8');
    if (rel.endsWith('.css')) processCss(content, rel, null, collect);
    else processJs(content, rel, null, collect);
  }

  const manifest = new Map();

  // 1. Hash referenced leaf assets (images/fonts)
  for (const rel of referencedAssets) {
    const fullPath = path.join(dir, rel);
    const hashedRel = toHashedRelPath(rel, hashFile(fullPath));
    const hashedPath = path.join(dir, hashedRel);
    manifest.set(rel, hashedRel);
    if (absoluteKeepAssets.has(rel)) {
      fs.copyFileSync(fullPath, hashedPath);
    } else {
      fs.renameSync(fullPath, hashedPath);
    }
  }

  // 2. Rewrite & hash CSS/JS (repeat if a CSS/JS references another CSS/JS)
  const codeOrigToCurrent = new Map(codeFiles.map((f) => {
    const rel = toPosix(path.relative(dir, f));
    return [rel, rel];
  }));

  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (const [origRel, currentRel] of codeOrigToCurrent) {
      const currentPath = path.join(dir, currentRel);
      const raw = fs.readFileSync(currentPath, 'utf8');
      const rewritten = origRel.endsWith('.css')
        ? processCss(raw, origRel, manifest)
        : processJs(raw, origRel, manifest);
      if (rewritten !== raw) {
        fs.writeFileSync(currentPath, rewritten, 'utf8');
        changed = true;
      }
      const nextRel = toHashedRelPath(origRel, hashFile(currentPath));
      if (nextRel !== currentRel) {
        fs.renameSync(currentPath, path.join(dir, nextRel));
        codeOrigToCurrent.set(origRel, nextRel);
        manifest.set(origRel, nextRel);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // 3. Rewrite all HTML files (index.html, 404.html, etc.)
  for (const file of htmlFiles) {
    const rel = toPosix(path.relative(dir, file));
    const raw = fs.readFileSync(file, 'utf8');
    const rewritten = processHtml(raw, rel, manifest);
    if (rewritten !== raw) {
      fs.writeFileSync(file, rewritten, 'utf8');
    }
  }

  return manifest;
}

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
  fs.cpSync(srcDir, outDir, {
    recursive: true,
    filter: (src) => BASE_PATH === DEFAULT_BASE_PATH || path.relative(srcDir, src) !== 'sitemap.xml',
  });

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

  if (BASE_PATH !== DEFAULT_BASE_PATH) {
    const baseRe = /\/projetos\/mobilita(?![\w.~-])/g;
    for (const file of walk(outDir)) {
      const ext = path.extname(file).toLowerCase();
      if (!['.html', '.xml', '.txt'].includes(ext)) continue;
      const raw = fs.readFileSync(file, 'utf8');
      let next = raw.replace(baseRe, () => BASE_PATH);
      if (ext === '.html' && !/name=["']robots["']/i.test(next)) {
        next = next.replace(/<head>/i, '<head>\n<meta name="robots" content="noindex">');
      }
      if (next !== raw) fs.writeFileSync(file, next, 'utf8');
    }
  }

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

  const manifest = applyContentHashes(outDir);
  const builtFiles = walk(outDir);

  return { outDir, fileCount: builtFiles.length, manifest: Object.fromEntries(manifest) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { outDir: dir, fileCount } = buildSite();
  console.log(`Built static site (${fileCount} files) -> ${path.relative(rootDir, dir)}`);
}
