import type { DbProduct, PosProduct, WebsiteProduct } from './types';

export function dbProductToPos(p: DbProduct): PosProduct {
  return {
    id: p.id,
    name: p.name,
    category: p.category_name || 'General',
    brand: p.brand_name || 'GadgetBoss',
    costPrice: Number(p.cost_price),
    sellingPrice: Number(p.promotional_price ?? p.selling_price),
    qty: Number(p.qty_on_hand),
    barcode: p.barcode || '',
    image: normalizeImagePath(p.image_url || '', 'pos'),
    lowStockAt: Number(p.low_stock_at ?? 3),
    status: p.status,
    websiteVisible: p.website_visible,
    description: p.description || '',
    promotionalPrice: p.promotional_price,
    sku: p.sku,
    tagline: p.tagline || '',
    badge: p.badge || '',
    oldPrice: p.old_price,
  };
}

export function dbProductToWebsite(p: DbProduct): WebsiteProduct {
  const stock = Number(p.qty_on_hand);
  const price = Number(p.promotional_price ?? p.selling_price);
  return {
    id: p.id,
    title: p.name,
    category: (p.category_name || 'other').toLowerCase(),
    price,
    oldPrice: p.old_price != null ? Number(p.old_price) : undefined,
    stock,
    image: normalizeImagePath(p.image_url || '', 'web'),
    rating: 4.8,
    reviewsCount: 0,
    badge: stock <= 0 ? 'OUT OF STOCK' : p.badge || '',
    tagline: p.tagline || p.description || '',
    specs: p.specs || {},
    outOfStock: stock <= 0 || price <= 0,
    lowStock: stock > 0 && stock <= Number(p.low_stock_at ?? 3),
  };
}

export function posProductToDbPatch(p: PosProduct): Partial<DbProduct> {
  return {
    id: p.id,
    name: p.name,
    barcode: p.barcode || null,
    sku: p.sku || p.barcode || null,
    brand_name: p.brand,
    category_name: p.category,
    description: p.description || '',
    cost_price: Number(p.costPrice),
    selling_price: Number(p.sellingPrice),
    promotional_price: p.promotionalPrice ?? null,
    low_stock_at: Number(p.lowStockAt ?? 3),
    status: p.status || 'active',
    website_visible: p.websiteVisible !== false,
    image_url: p.image,
    tagline: p.tagline || '',
    badge: p.badge || '',
    old_price: p.oldPrice ?? null,
  };
}

/** POS pages live under /pos so ../assets works; website root wants assets/. */
function normalizeImagePath(url: string, target: 'pos' | 'web'): string {
  if (!url) return target === 'pos' ? '../assets/logo.png' : 'assets/logo.png';
  if (/^https?:\/\//i.test(url)) return url;
  const cleaned = url.replace(/^\.\.\//, '').replace(/^\//, '');
  if (target === 'pos') {
    return cleaned.startsWith('assets/') ? `../${cleaned}` : `../assets/${cleaned}`;
  }
  return cleaned.startsWith('assets/') ? cleaned : `assets/${cleaned}`;
}

export function isWebsitePurchasable(p: DbProduct | WebsiteProduct): boolean {
  if ('outOfStock' in p) return !p.outOfStock && p.price > 0;
  return (
    p.status === 'active' &&
    p.website_visible &&
    Number(p.qty_on_hand) > 0 &&
    Number(p.promotional_price ?? p.selling_price) > 0
  );
}
