#!/usr/bin/env node
/**
 * Generates supabase/migrations/20260329120100_seed_catalogue.sql
 * from pos/seed-products.json + storefront marketing fields in app.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seed = JSON.parse(fs.readFileSync(path.join(root, 'pos/seed-products.json'), 'utf8'));
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function extractStorefrontMeta(id) {
  const re = new RegExp(`id:\\s*"${id}"[\\s\\S]*?(?=\\n  \\{|\\n\\];)`, 'm');
  const block = appJs.match(re)?.[0] || '';
  const grab = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*"([^"]*)"|${key}:\\s*(\\d+(?:\\.\\d+)?)`));
    return m ? (m[1] ?? m[2]) : null;
  };
  let specs = {};
  const specsMatch = block.match(/specs:\\s*(\{[^}]*\})/);
  if (specsMatch) {
    try {
      specs = Function(`return (${specsMatch[1]})`)();
    } catch {
      specs = {};
    }
  }
  return {
    tagline: grab('tagline') || '',
    badge: grab('badge') || '',
    oldPrice: grab('oldPrice') ? Number(grab('oldPrice')) : null,
    specs,
  };
}

const esc = (s) => String(s ?? '').replace(/'/g, "''");
const lines = [];
lines.push('-- Auto-generated catalogue seed. Re-run: npm run seed:sql');
lines.push('-- Migration: 20260329120100_seed_catalogue.sql');
lines.push('');

const categories = [...new Set(seed.map((p) => p.category))];
const brands = [...new Set(seed.map((p) => p.brand))];

for (const c of categories) {
  const slug = c.toLowerCase().replace(/\s+/g, '-');
  lines.push(
    `INSERT INTO public.categories (name, slug) VALUES ('${esc(c)}', '${esc(slug)}') ON CONFLICT (slug) DO NOTHING;`,
  );
}
for (const b of brands) {
  lines.push(`INSERT INTO public.brands (name) VALUES ('${esc(b)}') ON CONFLICT (name) DO NOTHING;`);
}
lines.push('');

for (const p of seed) {
  const meta = extractStorefrontMeta(p.id);
  const image = (p.image || '').replace(/^\.\.\//, '');
  const visible = Number(p.sellingPrice) > 0;
  const status = visible ? 'active' : 'inactive';
  const specsJson = esc(JSON.stringify(meta.specs || {}));
  lines.push(`INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  '${esc(p.id)}',
  '${esc(p.name)}',
  '${esc(p.barcode)}',
  '${esc(p.barcode)}',
  '${esc(p.brand)}',
  '${esc(p.category)}',
  '${esc(meta.tagline)}',
  ${Number(p.costPrice)},
  ${Number(p.sellingPrice)},
  NULL,
  ${Number(p.qty)},
  ${Number(p.lowStockAt || 3)},
  '${status}',
  ${visible},
  '${esc(image)}',
  '${esc(meta.tagline)}',
  '${esc(meta.badge)}',
  '${specsJson}'::jsonb,
  ${meta.oldPrice == null ? 'NULL' : meta.oldPrice}
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sku = EXCLUDED.sku,
  barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name,
  category_name = EXCLUDED.category_name,
  description = EXCLUDED.description,
  cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price,
  qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at,
  status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible,
  image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline,
  badge = EXCLUDED.badge,
  specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price,
  updated_at = NOW();`);
  lines.push('');
}

const out = path.join(root, 'supabase/migrations/20260329120100_seed_catalogue.sql');
fs.writeFileSync(out, lines.join('\n'));
console.log(`Wrote ${out} (${seed.length} products)`);
