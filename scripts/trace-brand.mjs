#!/usr/bin/env node
/**
 * Traça simbolo-folha-cor.png e logo-mobilita-branco-grande.png em SVGs vetoriais fiéis.
 * Uso: node scripts/trace-brand.mjs
 */
import fs from 'node:fs';
import sharp from 'sharp';

function traceContours(mask, w, h) {
  const nextMap = new Map();
  const key = (x, y) => (y << 16) | x;
  const addEdge = (x1, y1, x2, y2) => {
    const k = key(x1, y1);
    const arr = nextMap.get(k);
    if (arr) arr.push([x2, y2]);
    else nextMap.set(k, [[x2, y2]]);
  };
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? mask[y * w + x] : 0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue;
      if (!at(x, y - 1)) addEdge(x, y, x + 1, y);
      if (!at(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1);
      if (!at(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1);
      if (!at(x - 1, y)) addEdge(x, y + 1, x, y);
    }
  }
  const loops = [];
  for (const [startK, arr] of nextMap) {
    while (arr.length) {
      const pts = [];
      let cx = startK & 0xffff;
      let cy = startK >>> 16;
      pts.push([cx, cy]);
      let [nx, ny] = arr.pop();
      let prevDx = nx - cx;
      let prevDy = ny - cy;
      cx = nx;
      cy = ny;
      let guard = 0;
      while ((cx !== pts[0][0] || cy !== pts[0][1]) && guard++ < 200000) {
        pts.push([cx, cy]);
        const cand = nextMap.get(key(cx, cy));
        if (!cand || !cand.length) break;
        let pickIdx = 0;
        if (cand.length > 1) {
          for (let i = 0; i < cand.length; i++) {
            const dx = cand[i][0] - cx;
            const dy = cand[i][1] - cy;
            if (dx === prevDx && dy === prevDy) {
              pickIdx = i;
              break;
            }
          }
        }
        const [tx, ty] = cand.splice(pickIdx, 1)[0];
        prevDx = tx - cx;
        prevDy = ty - cy;
        cx = tx;
        cy = ty;
      }
      if (pts.length >= 6) loops.push(pts);
    }
  }
  return loops;
}

function chaikin(pts, iters = 2) {
  let cur = pts;
  for (let k = 0; k < iters; k++) {
    const out = [];
    const n = cur.length;
    for (let i = 0; i < n; i++) {
      const a = cur[i];
      const b = cur[(i + 1) % n];
      out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
      out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    cur = out;
  }
  return cur;
}

function rdp(pts, eps) {
  if (pts.length <= 2) return pts;
  let maxD = 0;
  let idx = 0;
  const [x1, y1] = pts[0];
  const [x2, y2] = pts[pts.length - 1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / len;
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > eps) {
    const l = rdp(pts.slice(0, idx + 1), eps);
    const r = rdp(pts.slice(idx), eps);
    return l.slice(0, -1).concat(r);
  }
  return [pts[0], pts[pts.length - 1]];
}

function simplifyClosed(pts, eps) {
  let maxDist = -1;
  let a = 0;
  let b = Math.floor(pts.length / 2);
  const step = Math.max(1, Math.floor(pts.length / 60));
  for (let i = 0; i < pts.length; i += step) {
    for (let j = i + 1; j < pts.length; j += step) {
      const d = (pts[i][0] - pts[j][0]) ** 2 + (pts[i][1] - pts[j][1]) ** 2;
      if (d > maxDist) {
        maxDist = d;
        a = i;
        b = j;
      }
    }
  }
  const p1 = pts.slice(a, b + 1);
  const p2 = pts.slice(b).concat(pts.slice(0, a + 1));
  const s1 = rdp(p1, eps);
  const s2 = rdp(p2, eps);
  return s1.slice(0, -1).concat(s2.slice(0, -1));
}

function ptsToPath(pts, scale = 1, sharpDeg = 55) {
  const n = pts.length;
  const f = (v) => +(v * scale).toFixed(1);
  const isCorner = pts.map((p, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const v1x = p[0] - prev[0];
    const v1y = p[1] - prev[1];
    const v2x = next[0] - p[0];
    const v2y = next[1] - p[1];
    const d1 = Math.hypot(v1x, v1y) || 1;
    const d2 = Math.hypot(v2x, v2y) || 1;
    const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (d1 * d2)));
    const deg = (Math.acos(cos) * 180) / Math.PI;
    return deg > sharpDeg;
  });
  let d = '';
  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const prev = pts[(i - 1 + n) % n];
    const midPrev = [(prev[0] + curr[0]) / 2, (prev[1] + curr[1]) / 2];
    const midNext = [(curr[0] + next[0]) / 2, (curr[1] + next[1]) / 2];
    if (i === 0) {
      d += isCorner[i] ? `M${f(curr[0])} ${f(curr[1])}` : `M${f(midPrev[0])} ${f(midPrev[1])}`;
    }
    if (isCorner[i]) {
      if (i > 0) d += `L${f(curr[0])} ${f(curr[1])}`;
      if (!isCorner[(i + 1) % n]) d += `L${f(midNext[0])} ${f(midNext[1])}`;
    } else {
      d += `Q${f(curr[0])} ${f(curr[1])} ${f(midNext[0])} ${f(midNext[1])}`;
    }
  }
  return `${d}Z`;
}

// 1. Trace simbolo-folha-cor.png (1191x1080)
const leaf = await sharp('public/assets/brand/simbolo-folha-cor.png').raw().toBuffer({ resolveWithObject: true });
const lw = leaf.info.width;
const lh = leaf.info.height;
const lmask = new Uint8Array(lw * lh);
for (let i = 0; i < lw * lh; i++) lmask[i] = leaf.data[i * 4 + 3] >= 128 ? 1 : 0;
const leafLoops = traceContours(lmask, lw, lh).filter((l) => l.length > 50);
leafLoops.sort((a, b) => Math.min(...a.map((p) => p[1])) - Math.min(...b.map((p) => p[1])));
const leafPaths = leafLoops.map((l) => {
  const sm = simplifyClosed(chaikin(l, 2), 4.5);
  console.log('Leaf blade:', l.length, '->', sm.length, 'pts');
  return ptsToPath(sm, 1, 50);
});

const leafCorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lw} ${lh}" fill="none">
  <defs>
    <linearGradient id="mb-leaf-grad" x1="41" y1="540" x2="1146" y2="200" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4eb082"/>
      <stop offset="55%" stop-color="#239e53"/>
      <stop offset="100%" stop-color="#00902f"/>
    </linearGradient>
  </defs>
${leafPaths.map((d, i) => `  <path data-blade="${i + 1}" d="${d}" fill="url(#mb-leaf-grad)"/>`).join('\n')}
</svg>
`;
const leafBrancoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lw} ${lh}" fill="none">
${leafPaths.map((d, i) => `  <path data-blade="${i + 1}" d="${d}" fill="#ffffff"/>`).join('\n')}
</svg>
`;
fs.writeFileSync('site/assets/brand/simbolo-folha-cor.svg', leafCorSvg);
fs.writeFileSync('site/assets/brand/simbolo-folha-branco.svg', leafBrancoSvg);
console.log('Wrote leaf SVGs:', leafCorSvg.length, 'B,', leafBrancoSvg.length, 'B');

// 2. Trace logo-mobilita-branco-grande.png (308x82) upscaled 4x for crisp contours
const scale = 4;
const logoUp = await sharp('public/assets/brand/logo-mobilita-branco-grande.png')
  .resize(308 * scale, 82 * scale, { kernel: 'lanczos3' })
  .raw()
  .toBuffer({ resolveWithObject: true });
const gw = logoUp.info.width;
const gh = logoUp.info.height;
const gmask = new Uint8Array(gw * gh);
for (let i = 0; i < gw * gh; i++) gmask[i] = logoUp.data[i * 4 + 3] >= 120 ? 1 : 0;
const gLoops = traceContours(gmask, gw, gh).filter((l) => l.length > 16);
const wordLoops = [];
const logoLeafLoops = [];
for (const l of gLoops) {
  const avgX = l.reduce((s, p) => s + p[0], 0) / l.length;
  const avgY = l.reduce((s, p) => s + p[1], 0) / l.length;
  if (avgX >= 256 * scale && avgY < 66 * scale) logoLeafLoops.push(l);
  else wordLoops.push(l);
}
console.log('Logo loops: wordmark=', wordLoops.length, 'leaf=', logoLeafLoops.length);
const wordPath = wordLoops
  .map((l) => ptsToPath(simplifyClosed(chaikin(l, 1), 1.35), 1 / scale, 42))
  .join(' ');
const logoLeafPath = logoLeafLoops
  .map((l) => ptsToPath(simplifyClosed(chaikin(l, 2), 1.6), 1 / scale, 48))
  .join(' ');

const logoCorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 308 82" fill="none" role="img" aria-label="Mobilità Transporte Executivo">
  <defs>
    <linearGradient id="mb-logo-leaf" x1="256" y1="50" x2="304" y2="20" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4eb082"/>
      <stop offset="55%" stop-color="#239e53"/>
      <stop offset="100%" stop-color="#00902f"/>
    </linearGradient>
  </defs>
  <path fill-rule="evenodd" d="${wordPath}" fill="#515151"/>
  <path fill-rule="evenodd" d="${logoLeafPath}" fill="url(#mb-logo-leaf)"/>
</svg>
`;
const logoBrancoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 308 82" fill="none" role="img" aria-label="Mobilità Transporte Executivo">
  <path fill-rule="evenodd" d="${wordPath}" fill="#ffffff"/>
  <path fill-rule="evenodd" d="${logoLeafPath}" fill="#ffffff"/>
</svg>
`;
fs.writeFileSync('site/assets/brand/logo-mobilita-cor.svg', logoCorSvg);
fs.writeFileSync('site/assets/brand/logo-mobilita-branco.svg', logoBrancoSvg);
console.log('Wrote logo SVGs:', logoCorSvg.length, 'B,', logoBrancoSvg.length, 'B');
