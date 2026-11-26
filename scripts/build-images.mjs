#!/usr/bin/env node
/**
 * Gera variantes WebP responsivas (480w / 960w / 1600w) das fotos de marca usadas em site/.
 * Uso: node scripts/build-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC_DIR = path.resolve('public/assets/brand');
const OUT_DIR = path.resolve('site/assets/brand');

const IMAGES = [
  {
    src: 'hero-passageiro-executivo.jpeg',
    base: 'hero-passageiro-executivo',
    widths: [480, 960, 1600],
    quality: 80,
  },
  {
    src: 'servicos-onibus-estrada.jpeg',
    base: 'servicos-onibus-estrada',
    widths: [480, 960, 1600],
    quality: 78,
  },
  {
    src: 'frota-veiculos-recorte.png',
    base: 'frota-veiculos-recorte',
    widths: [480, 960, 1600],
    quality: 72,
    alphaQuality: 78,
  },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const item of IMAGES) {
  const inputPath = path.join(SRC_DIR, item.src);
  const meta = await sharp(inputPath).metadata();
  const maxW = meta.width || 1600;

  for (const w of item.widths) {
    const targetW = Math.min(w, maxW);
    const outName = `${item.base}-${w}.webp`;
    const outPath = path.join(OUT_DIR, outName);

    const webpOpts = { quality: item.quality, effort: 6 };
    if (item.alphaQuality) webpOpts.alphaQuality = item.alphaQuality;
    if (item.base === 'frota-veiculos-recorte' && w === 960) {
      webpOpts.quality = 62;
      webpOpts.alphaQuality = 72;
    }

    await sharp(inputPath)
      .resize({ width: targetW, withoutEnlargement: true })
      .webp(webpOpts)
      .toFile(outPath);

    const stat = fs.statSync(outPath);
    console.log(`${outName.padEnd(42)} ${targetW}px  ${(stat.size / 1024).toFixed(1)} KB`);
  }
}
