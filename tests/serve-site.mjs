import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSiteDir = path.resolve(__dirname, '..', 'site');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function normalizeBasePath(basePath = '') {
  if (!basePath || basePath === '/') return '';
  return `/${basePath.replace(/^\/+|\/+$/g, '')}`;
}

export function createSiteServer({ siteDir = defaultSiteDir, basePath = '' } = {}) {
  const resolvedDir = path.resolve(siteDir);
  const prefix = normalizeBasePath(basePath);

  return http.createServer((req, res) => {
    const rawUrl = req.url || '/';
    const [urlPath, query = ''] = rawUrl.split('?');

    let relativePath = urlPath;
    if (prefix) {
      if (urlPath === prefix) {
        const location = query ? `${prefix}/?${query}` : `${prefix}/`;
        res.writeHead(308, { Location: location });
        res.end();
        return;
      }
      if (!urlPath.startsWith(`${prefix}/`)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      relativePath = urlPath.slice(prefix.length) || '/';
    }

    const safePath = path
      .normalize(relativePath === '/' ? '/index.html' : relativePath)
      .replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(resolvedDir, safePath);

    if (!filePath.startsWith(resolvedDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173);
  const siteDir = process.env.SITE_DIR ? path.resolve(process.env.SITE_DIR) : defaultSiteDir;
  const basePath = process.env.BASE_PATH || '';
  const server = createSiteServer({ siteDir, basePath });

  server.listen(port, '127.0.0.1', () => {
    const addr = server.address();
    const actualPort = typeof addr === 'object' && addr ? addr.port : port;
    console.log(`Serving ${siteDir} at http://127.0.0.1:${actualPort}${normalizeBasePath(basePath) || '/'}`);
  });
}
