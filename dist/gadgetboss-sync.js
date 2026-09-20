/**
 * GadgetBoss Sync — browser bundle (no build step required).
 * Depends on global `supabase` from @supabase/supabase-js UMD CDN.
 * API mirrors src/sync (TypeScript source of truth).
 */
(function (global) {
  'use strict';

  var client = null;
  var lastUrl = '';
  var lastKey = '';

  function env(key) {
    try {
      if (global.__GADGETBOSS_ENV__ && global.__GADGETBOSS_ENV__[key]) return global.__GADGETBOSS_ENV__[key];
    } catch (e) {}
    return '';
  }

  function isSyncConfigured() {
    return !!(env('SUPABASE_URL') && env('SUPABASE_ANON_KEY'));
  }

  function resolveConfig(config) {
    config = config || {};
    var url = config.supabaseUrl || env('SUPABASE_URL') || env('VITE_SUPABASE_URL');
    var key = config.supabaseAnonKey || env('SUPABASE_ANON_KEY') || env('VITE_SUPABASE_ANON_KEY');
    if (!url || !key) throw new Error('Supabase is not configured. Set window.__GADGETBOSS_ENV__.');
    return { supabaseUrl: url, supabaseAnonKey: key };
  }

  function getSupabase(config) {
    if (!global.supabase || !global.supabase.createClient) {
      throw new Error('@supabase/supabase-js CDN is required before GadgetBossSync');
    }
    var resolved = resolveConfig(config);
    if (client && lastUrl === resolved.supabaseUrl && lastKey === resolved.supabaseAnonKey) return client;
    client = global.supabase.createClient(resolved.supabaseUrl, resolved.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    lastUrl = resolved.supabaseUrl;
    lastKey = resolved.supabaseAnonKey;
    return client;
  }

  function normalizeImagePath(url, target) {
    if (!url) return target === 'pos' ? '../assets/logo.png' : 'assets/logo.png';
    if (/^https?:\/\//i.test(url)) return url;
    var cleaned = url.replace(/^\.\.\//, '').replace(/^\//, '');
    if (target === 'pos') return cleaned.indexOf('assets/') === 0 ? '../' + cleaned : '../assets/' + cleaned;
    return cleaned.indexOf('assets/') === 0 ? cleaned : 'assets/' + cleaned;
  }

  function dbProductToPos(p) {
    return {
      id: p.id,
      name: p.name,
      category: p.category_name || 'General',
      brand: p.brand_name || 'GadgetBoss',
      costPrice: Number(p.cost_price),
      sellingPrice: Number(p.promotional_price != null ? p.promotional_price : p.selling_price),
      qty: Number(p.qty_on_hand),
      barcode: p.barcode || '',
      image: normalizeImagePath(p.image_url || '', 'pos'),
      lowStockAt: Number(p.low_stock_at != null ? p.low_stock_at : 3),
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

  function dbProductToWebsite(p) {
    var stock = Number(p.qty_on_hand);
    var price = Number(p.promotional_price != null ? p.promotional_price : p.selling_price);
    return {
      id: p.id,
      title: p.name,
      category: String(p.category_name || 'other').toLowerCase(),
      price: price,
      oldPrice: p.old_price != null ? Number(p.old_price) : undefined,
      stock: stock,
      image: normalizeImagePath(p.image_url || '', 'web'),
      rating: 4.8,
      reviewsCount: 0,
      badge: stock <= 0 ? 'OUT OF STOCK' : p.badge || '',
      tagline: p.tagline || p.description || '',
      specs: p.specs || {},
      outOfStock: stock <= 0 || price <= 0,
      lowStock: stock > 0 && stock <= Number(p.low_stock_at != null ? p.low_stock_at : 3),
    };
  }

  function posProductToDbPatch(p) {
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
      promotional_price: p.promotionalPrice != null ? p.promotionalPrice : null,
      low_stock_at: Number(p.lowStockAt != null ? p.lowStockAt : 3),
      status: p.status || 'active',
      website_visible: p.websiteVisible !== false,
      image_url: p.image,
      tagline: p.tagline || '',
      badge: p.badge || '',
      old_price: p.oldPrice != null ? p.oldPrice : null,
    };
  }

  async function fetchStaffProducts(config) {
    var sb = getSupabase(config);
    var res = await sb.from('products').select('*').order('name');
    if (res.error) throw res.error;
    return (res.data || []).map(dbProductToPos);
  }

  async function fetchWebsiteProducts(config) {
    var sb = getSupabase(config);
    var res = await sb
      .from('products')
      .select('*')
      .eq('status', 'active')
      .eq('website_visible', true)
      .order('name');
    if (res.error) throw res.error;
    return (res.data || []).map(dbProductToWebsite);
  }

  async function upsertPosProduct(product, config) {
    var sb = getSupabase(config);
    var patch = posProductToDbPatch(product);
    // Intentionally omit qty_on_hand — stock only via RPC / adjust_inventory
    var res = await sb.from('products').upsert(patch, { onConflict: 'id' });
    if (res.error) throw res.error;
  }

  async function completeOrder(input, config) {
    if (!input || !input.idempotencyKey) throw new Error('idempotencyKey is required');
    if (!input.items || !input.items.length) throw new Error('Order must include at least one item');
    var sb = getSupabase(config);
    var payload = {
      idempotency_key: input.idempotencyKey,
      source: input.source,
      status: input.status,
      payment_method: input.paymentMethod,
      discount_pct: input.discountPct || 0,
      customer_name: input.customerName || '',
      customer_phone: input.customerPhone || '',
      customer_email: input.customerEmail || '',
      customer_location: input.customerLocation || '',
      cashier_name: input.cashierName || '',
      receipt_no: input.receiptNo || '',
      notes: input.notes || '',
      payment_reference: input.paymentReference || '',
      items: input.items.map(function (item) {
        return {
          product_id: item.productId,
          qty: item.qty,
          unit_price: item.unitPrice,
          cost_price: item.costPrice,
          discount_pct: item.discountPct || 0,
        };
      }),
    };
    var res = await sb.rpc('complete_order_with_inventory_check', { payload: payload });
    if (res.error) {
      console.error('[GadgetBossSync] complete_order failed', res.error);
      throw res.error;
    }
    return res.data;
  }

  async function fetchRecentOrders(limit, config) {
    var sb = getSupabase(config);
    var res = await sb
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(limit || 100);
    if (res.error) throw res.error;
    return res.data || [];
  }

  function mapOrderToPosSale(row) {
    var items = (row.order_items || []).map(function (it) {
      return {
        productId: it.product_id,
        name: it.product_name,
        qty: it.qty,
        unitPrice: Number(it.unit_price),
        costPrice: Number(it.cost_price),
        discountPct: Number(it.discount_pct || 0),
        lineTotal: Number(it.line_total),
      };
    });
    return {
      id: row.id,
      receiptNo: row.receipt_no,
      saleType: row.source === 'ONLINE' ? 'Online' : 'POS',
      paymentMethod: row.payment_method || 'Other',
      items: items,
      subtotal: Number(row.subtotal),
      orderDiscount: Number(row.discount_pct || 0),
      total: Number(row.total),
      customerName: row.customer_name || '',
      customerPhone: row.customer_phone || '',
      customerEmail: row.customer_email || '',
      customerLocation: row.customer_location || '',
      customerId: row.customer_id,
      cashierId: row.cashier_id,
      cashierName: row.cashier_name || (row.source === 'ONLINE' ? 'Online' : ''),
      createdAt: row.created_at,
      cogs: Number(row.cogs || 0),
      status: row.status,
      source: row.source,
      notes: row.notes || '',
      paymentReference: row.payment_reference || '',
    };
  }

  async function updateOrderStatus(id, status, config) {
    if (!id) throw new Error('Order id is required');
    var sb = getSupabase(config);
    var res = await sb.from('orders').update({ status: status }).eq('id', id);
    if (res.error) throw res.error;
  }

  function subscribeProducts(onChange, config) {
    return getSupabase(config)
      .channel('gb-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, function () {
        onChange();
      })
      .subscribe();
  }

  function subscribeOrders(onChange, config) {
    return getSupabase(config)
      .channel('gb-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, function (payload) {
        onChange(payload);
      })
      .subscribe();
  }

  function subscribeInventoryMovements(onChange, config) {
    return getSupabase(config)
      .channel('gb-movements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inventory_movements' }, function () {
        onChange();
      })
      .subscribe();
  }

  async function staffSignIn(email, password, config) {
    var sb = getSupabase(config);
    var res = await sb.auth.signInWithPassword({ email: email, password: password });
    if (res.error) throw res.error;
    var userId = res.data.user && res.data.user.id;
    var role = 'Cashier';
    var name = (res.data.user && res.data.user.email) || 'Staff';
    if (userId) {
      var profile = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profile.data) {
        role = String(profile.data.role || 'cashier');
        role = role.charAt(0).toUpperCase() + role.slice(1);
        name = profile.data.full_name || name;
      }
    }
    return { id: userId, email: res.data.user && res.data.user.email, name: name, role: role, session: res.data.session };
  }

  async function staffSignOut(config) {
    await getSupabase(config).auth.signOut();
  }

  async function adjustInventory(productId, qtyChange, reason, config) {
    var sb = getSupabase(config);
    var res = await sb.rpc('adjust_inventory', {
      p_product_id: productId,
      p_qty_change: qtyChange,
      p_reason: reason,
    });
    if (res.error) throw res.error;
    return res.data;
  }

  var CATALOGUE_KEY = 'gadgetboss_shared_catalogue_v1';
  var CATALOGUE_CHANNEL = 'gadgetboss-catalogue';

  function posToWebsiteProduct(p) {
    var stock = Number(p.qty || 0);
    var price = Number(p.sellingPrice || 0);
    var image = String(p.image || 'assets/logo.png').replace(/^\.\.\//, '');
    if (image.indexOf('assets/') !== 0 && image.indexOf('http') !== 0) image = 'assets/' + image.replace(/^\//, '');
    var visible = p.websiteVisible !== false && (p.status || 'active') === 'active';
    return {
      id: p.id,
      title: p.name,
      category: String(p.category || 'other').toLowerCase(),
      price: price,
      oldPrice: p.oldPrice != null ? Number(p.oldPrice) : undefined,
      stock: stock,
      image: image,
      rating: 4.8,
      reviewsCount: 0,
      badge: !visible ? 'HIDDEN' : (stock <= 0 && price > 0 ? 'OUT OF STOCK' : (p.badge || 'NEW DROP')),
      tagline: p.tagline || p.description || [p.brand, p.category].filter(Boolean).join(' · '),
      specs: p.specs || {},
      outOfStock: !visible || stock <= 0 || price <= 0,
      lowStock: stock > 0 && stock <= Number(p.lowStockAt != null ? p.lowStockAt : 3),
      websiteVisible: visible,
      brand: p.brand || '',
      costPrice: Number(p.costPrice || 0),
    };
  }

  /** Publish POS catalogue so the online store can read it (same browser origin). */
  function publishCatalogue(products) {
    var list = (products || [])
      .filter(function (p) { return p && p.id && p.name; })
      .map(posToWebsiteProduct);
    var payload = { updatedAt: new Date().toISOString(), products: list };
    try {
      localStorage.setItem(CATALOGUE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[GadgetBossSync] catalogue publish failed', e);
    }
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        var ch = new BroadcastChannel(CATALOGUE_CHANNEL);
        ch.postMessage({ type: 'catalogue-updated', updatedAt: payload.updatedAt });
        ch.close();
      }
    } catch (e) {}
    return payload;
  }

  function loadPublishedCatalogue() {
    try {
      var raw = localStorage.getItem(CATALOGUE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return (parsed && parsed.products) || [];
    } catch (e) {
      return [];
    }
  }

  function subscribeCatalogue(onChange) {
    var handler = function () { onChange(loadPublishedCatalogue()); };
    window.addEventListener('storage', function (ev) {
      if (ev.key === CATALOGUE_KEY) handler();
    });
    var ch = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        ch = new BroadcastChannel(CATALOGUE_CHANNEL);
        ch.onmessage = function (ev) {
          if (ev.data && ev.data.type === 'catalogue-updated') handler();
        };
      }
    } catch (e) {}
    // Same-tab updates (storage event does not fire in the writer tab)
    var poll = setInterval(handler, 4000);
    return function unsubscribe() {
      clearInterval(poll);
      try { if (ch) ch.close(); } catch (e) {}
    };
  }

  var api = {
    isSyncConfigured: isSyncConfigured,
    getSupabase: getSupabase,
    dbProductToPos: dbProductToPos,
    dbProductToWebsite: dbProductToWebsite,
    posProductToDbPatch: posProductToDbPatch,
    fetchStaffProducts: fetchStaffProducts,
    fetchWebsiteProducts: fetchWebsiteProducts,
    upsertPosProduct: upsertPosProduct,
    completeOrder: completeOrder,
    fetchRecentOrders: fetchRecentOrders,
    mapOrderToPosSale: mapOrderToPosSale,
    updateOrderStatus: updateOrderStatus,
    subscribeProducts: subscribeProducts,
    subscribeOrders: subscribeOrders,
    subscribeInventoryMovements: subscribeInventoryMovements,
    staffSignIn: staffSignIn,
    staffSignOut: staffSignOut,
    adjustInventory: adjustInventory,
    publishCatalogue: publishCatalogue,
    loadPublishedCatalogue: loadPublishedCatalogue,
    subscribeCatalogue: subscribeCatalogue,
    posToWebsiteProduct: posToWebsiteProduct,
  };

  global.GadgetBossSync = api;
})(typeof window !== 'undefined' ? window : globalThis);
