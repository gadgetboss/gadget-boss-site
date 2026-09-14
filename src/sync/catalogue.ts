/** Same-origin catalogue bridge so POS product changes update the online store without Supabase. */
import type { PosProduct, WebsiteProduct } from './types';

export const CATALOGUE_KEY = 'gadgetboss_shared_catalogue_v1';
const CATALOGUE_CHANNEL = 'gadgetboss-catalogue';

export function posToWebsiteProduct(p: PosProduct): WebsiteProduct & { websiteVisible: boolean; brand?: string; costPrice?: number } {
  const stock = Number(p.qty || 0);
  const price = Number(p.sellingPrice || 0);
  let image = String(p.image || 'assets/logo.png').replace(/^\.\.\//, '');
  if (!image.startsWith('assets/') && !/^https?:\/\//i.test(image)) {
    image = `assets/${image.replace(/^\//, '')}`;
  }
  const visible = p.websiteVisible !== false && (p.status || 'active') === 'active';
  return {
    id: p.id,
    title: p.name,
    category: String(p.category || 'other').toLowerCase(),
    price,
    oldPrice: p.oldPrice != null ? Number(p.oldPrice) : undefined,
    stock,
    image,
    rating: 4.8,
    reviewsCount: 0,
    badge: !visible ? 'HIDDEN' : stock <= 0 && price > 0 ? 'OUT OF STOCK' : p.badge || 'NEW DROP',
    tagline: p.tagline || p.description || [p.brand, p.category].filter(Boolean).join(' · '),
    specs: p.specs || {},
    outOfStock: !visible || stock <= 0 || price <= 0,
    lowStock: stock > 0 && stock <= Number(p.lowStockAt ?? 3),
    websiteVisible: visible,
    brand: p.brand,
    costPrice: Number(p.costPrice || 0),
  };
}

export function publishCatalogue(products: PosProduct[]) {
  const list = (products || []).filter((p) => p?.id && p?.name).map(posToWebsiteProduct);
  const payload = { updatedAt: new Date().toISOString(), products: list };
  try {
    localStorage.setItem(CATALOGUE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(CATALOGUE_CHANNEL);
      ch.postMessage({ type: 'catalogue-updated', updatedAt: payload.updatedAt });
      ch.close();
    }
  } catch {
    /* ignore */
  }
  return payload;
}

export function loadPublishedCatalogue() {
  try {
    const raw = localStorage.getItem(CATALOGUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed?.products || [];
  } catch {
    return [];
  }
}

export function subscribeCatalogue(onChange: (products: ReturnType<typeof loadPublishedCatalogue>) => void) {
  const handler = () => onChange(loadPublishedCatalogue());
  const onStorage = (ev: StorageEvent) => {
    if (ev.key === CATALOGUE_KEY) handler();
  };
  window.addEventListener('storage', onStorage);
  let ch: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel(CATALOGUE_CHANNEL);
      ch.onmessage = (ev) => {
        if (ev.data?.type === 'catalogue-updated') handler();
      };
    }
  } catch {
    /* ignore */
  }
  const poll = window.setInterval(handler, 4000);
  return () => {
    window.clearInterval(poll);
    window.removeEventListener('storage', onStorage);
    try {
      ch?.close();
    } catch {
      /* ignore */
    }
  };
}
