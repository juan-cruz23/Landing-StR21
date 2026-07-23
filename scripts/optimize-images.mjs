/**
 * optimize-images.mjs
 * Converts JPG and PNG images in public/ to WebP.
 * - Skips the originals/ folders (source files, not served)
 * - Quality 90 for photos, lossless for PNGs with transparency
 * - Leaves originals untouched
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// Folders to skip (raw originals, no need to serve)
const SKIP_FOLDERS = ['originals'];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_FOLDERS.includes(entry.name)) continue;
      files.push(...await walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function formatSize(bytes) {
  return (bytes / 1024).toFixed(1) + ' KB';
}

async function optimise(filePath) {
  const ext  = extname(filePath).toLowerCase();
  const base = basename(filePath, ext);
  const dir  = dirname(filePath);

  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return null;

  const outPath = join(dir, base + '.webp');

  // Check if source and dest are the same basename (already webp)
  const srcStat = await stat(filePath);

  let pipeline = sharp(filePath);

  if (ext === '.png') {
    // PNG: use lossless WebP — zero quality loss
    pipeline = pipeline.webp({ lossless: true, effort: 6 });
  } else {
    // JPG: quality 90 — visually identical
    pipeline = pipeline.webp({ quality: 90, effort: 6 });
  }

  await pipeline.toFile(outPath);

  const destStat = await stat(outPath);
  const saved = srcStat.size - destStat.size;
  const pct   = ((saved / srcStat.size) * 100).toFixed(1);

  return {
    src:    filePath.replace(PUBLIC_DIR, '').replace(/\\/g, '/'),
    from:   await formatSize(srcStat.size),
    to:     await formatSize(destStat.size),
    saved:  await formatSize(saved),
    pct:    pct + '%',
  };
}

async function main() {
  console.log('\n🔍  Escaneando imágenes en public/...\n');
  const files  = await walk(PUBLIC_DIR);
  const images = files.filter(f => ['.jpg','.jpeg','.png'].includes(extname(f).toLowerCase()));

  console.log(`📦  ${images.length} imágenes encontradas para optimizar\n`);

  let totalSrc  = 0;
  let totalDest = 0;
  const results = [];

  for (const img of images) {
    process.stdout.write(`  → ${basename(img)} ... `);
    try {
      const r = await optimise(img);
      if (r) {
        console.log(`${r.from} → ${r.to}  (−${r.pct})`);
        const srcBytes  = parseFloat(r.from) * 1024;
        const destBytes = parseFloat(r.to)   * 1024;
        totalSrc  += srcBytes;
        totalDest += destBytes;
        results.push(r);
      }
    } catch (e) {
      console.log(`⚠️  error: ${e.message}`);
    }
  }

  const totalSavedMB = ((totalSrc - totalDest) / 1024 / 1024).toFixed(1);
  const totalSrcMB   = (totalSrc  / 1024 / 1024).toFixed(1);
  const totalDestMB  = (totalDest / 1024 / 1024).toFixed(1);

  console.log('\n' + '─'.repeat(55));
  console.log(`✅  ${results.length} archivos convertidos a WebP`);
  console.log(`📊  Antes: ${totalSrcMB} MB  →  Después: ${totalDestMB} MB`);
  console.log(`💾  Ahorro total: ${totalSavedMB} MB`);
  console.log('─'.repeat(55) + '\n');
}

main().catch(console.error);
