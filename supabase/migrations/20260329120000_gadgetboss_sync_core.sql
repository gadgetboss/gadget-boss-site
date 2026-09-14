-- GadgetBoss shared POS + ecommerce schema
-- Migration: 20260329120000_gadgetboss_sync_core.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.product_status AS ENUM ('active', 'inactive', 'discontinued');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_source AS ENUM ('POS', 'ONLINE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'COMPLETED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('Cash', 'MoMo', 'Card', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.movement_type AS ENUM (
    'SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'CANCELLATION'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.movement_source AS ENUM ('POS', 'ONLINE', 'ADMIN', 'SUPPLIER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.staff_role AS ENUM ('admin', 'manager', 'cashier');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Profiles (maps auth.users → role)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role public.staff_role NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_name TEXT,
  category_name TEXT,
  description TEXT DEFAULT '',
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  promotional_price NUMERIC(12,2) CHECK (promotional_price IS NULL OR promotional_price >= 0),
  qty_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (qty_on_hand >= 0),
  low_stock_at INTEGER NOT NULL DEFAULT 3 CHECK (low_stock_at >= 0),
  status public.product_status NOT NULL DEFAULT 'active',
  website_visible BOOLEAN NOT NULL DEFAULT TRUE,
  image_url TEXT,
  tagline TEXT,
  badge TEXT,
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  old_price NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_status_visible ON public.products (status, website_visible);
CREATE INDEX IF NOT EXISTS idx_products_qty ON public.products (qty_on_hand);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images (product_id);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique
  ON public.customers (phone) WHERE phone IS NOT NULL AND phone <> '';

-- ---------------------------------------------------------------------------
-- Orders / payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT NOT NULL UNIQUE,
  source public.order_source NOT NULL,
  status public.order_status NOT NULL DEFAULT 'COMPLETED',
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_location TEXT,
  payment_method public.payment_method,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  cogs NUMERIC(12,2) NOT NULL DEFAULT 0,
  cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cashier_name TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  method public.payment_method NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders (source);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON public.orders (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- Inventory ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id),
  movement_type public.movement_type NOT NULL,
  source public.movement_source NOT NULL,
  qty_before INTEGER NOT NULL,
  qty_change INTEGER NOT NULL,
  qty_after INTEGER NOT NULL,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  related_purchase_id UUID,
  reason TEXT,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON public.inventory_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_order ON public.inventory_movements (related_order_id);

-- ---------------------------------------------------------------------------
-- Purchases (optional but required by data model)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_cost NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0),
  line_total NUMERIC(12,2) NOT NULL
);

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_updated ON public.products;
CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS public.staff_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = TRUE
      AND role IN ('admin', 'manager')
  );
$$;

-- ---------------------------------------------------------------------------
-- Atomic checkout RPC (POS + ONLINE)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_order_with_inventory_check(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_idempotency TEXT := COALESCE(payload->>'idempotency_key', '');
  v_source public.order_source := (payload->>'source')::public.order_source;
  v_status public.order_status;
  v_payment public.payment_method := NULLIF(payload->>'payment_method', '')::public.payment_method;
  v_discount NUMERIC := COALESCE((payload->>'discount_pct')::NUMERIC, 0);
  v_existing public.orders%ROWTYPE;
  v_order_id UUID;
  v_receipt TEXT;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_cogs NUMERIC := 0;
  v_item JSONB;
  v_product public.products%ROWTYPE;
  v_qty INTEGER;
  v_unit NUMERIC;
  v_cost NUMERIC;
  v_line_disc NUMERIC;
  v_line_total NUMERIC;
  v_customer_id UUID;
  v_insufficient JSONB := '[]'::JSONB;
  v_cashier UUID := auth.uid();
BEGIN
  IF v_idempotency = '' THEN
    RAISE EXCEPTION 'idempotency_key is required' USING ERRCODE = 'P0001';
  END IF;

  IF v_source IS NULL THEN
    RAISE EXCEPTION 'source must be POS or ONLINE' USING ERRCODE = 'P0001';
  END IF;

  -- Idempotent replay
  SELECT * INTO v_existing FROM public.orders WHERE idempotency_key = v_idempotency;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'duplicate', TRUE,
      'order_id', v_existing.id,
      'receipt_no', v_existing.receipt_no,
      'status', v_existing.status,
      'total', v_existing.total
    );
  END IF;

  IF v_source = 'POS' THEN
    IF NOT public.is_staff() THEN
      RAISE EXCEPTION 'POS checkout requires authenticated staff' USING ERRCODE = '42501';
    END IF;
    v_status := COALESCE(NULLIF(payload->>'status', '')::public.order_status, 'COMPLETED');
  ELSE
    -- Public online orders start as PENDING unless staff elevates later
    v_status := COALESCE(NULLIF(payload->>'status', '')::public.order_status, 'PENDING');
  END IF;

  -- Validate & lock stock for every line first (no partial writes)
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'items', '[]'::JSONB))
  LOOP
    v_qty := (v_item->>'qty')::INTEGER;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Each item qty must be > 0' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_item->>'product_id'
    FOR UPDATE;

    IF NOT FOUND THEN
      v_insufficient := v_insufficient || jsonb_build_array(jsonb_build_object(
        'product_id', v_item->>'product_id',
        'error', 'PRODUCT_NOT_FOUND',
        'requested', v_qty,
        'available', 0
      ));
      CONTINUE;
    END IF;

    IF v_source = 'ONLINE' AND (v_product.status <> 'active' OR v_product.website_visible IS NOT TRUE) THEN
      v_insufficient := v_insufficient || jsonb_build_array(jsonb_build_object(
        'product_id', v_product.id,
        'name', v_product.name,
        'error', 'NOT_AVAILABLE_ONLINE',
        'requested', v_qty,
        'available', v_product.qty_on_hand
      ));
      CONTINUE;
    END IF;

    IF v_product.qty_on_hand < v_qty THEN
      v_insufficient := v_insufficient || jsonb_build_array(jsonb_build_object(
        'product_id', v_product.id,
        'name', v_product.name,
        'error', 'INSUFFICIENT_STOCK',
        'requested', v_qty,
        'available', v_product.qty_on_hand
      ));
    END IF;
  END LOOP;

  IF jsonb_array_length(v_insufficient) > 0 THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'error', 'INSUFFICIENT_STOCK',
      'products', v_insufficient
    );
  END IF;

  -- Optional customer upsert by phone
  IF COALESCE(payload->>'customer_phone', '') <> '' THEN
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE phone = payload->>'customer_phone'
    LIMIT 1;

    IF v_customer_id IS NULL THEN
      INSERT INTO public.customers (name, phone, email, location)
      VALUES (
        COALESCE(NULLIF(payload->>'customer_name', ''), 'Customer'),
        payload->>'customer_phone',
        NULLIF(payload->>'customer_email', ''),
        NULLIF(payload->>'customer_location', '')
      )
      RETURNING id INTO v_customer_id;
    ELSE
      UPDATE public.customers SET
        name = COALESCE(NULLIF(payload->>'customer_name', ''), name),
        email = COALESCE(NULLIF(payload->>'customer_email', ''), email),
        location = COALESCE(NULLIF(payload->>'customer_location', ''), location),
        updated_at = NOW()
      WHERE id = v_customer_id;
    END IF;
  END IF;

  v_receipt := COALESCE(NULLIF(payload->>'receipt_no', ''), 'GB-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8)));

  INSERT INTO public.orders (
    receipt_no, source, status, customer_id,
    customer_name, customer_phone, customer_email, customer_location,
    payment_method, discount_pct, cashier_id, cashier_name, idempotency_key, notes
  ) VALUES (
    v_receipt, v_source, v_status, v_customer_id,
    NULLIF(payload->>'customer_name', ''),
    NULLIF(payload->>'customer_phone', ''),
    NULLIF(payload->>'customer_email', ''),
    NULLIF(payload->>'customer_location', ''),
    v_payment, v_discount, v_cashier,
    NULLIF(payload->>'cashier_name', ''),
    v_idempotency,
    NULLIF(payload->>'notes', '')
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'items', '[]'::JSONB))
  LOOP
    v_qty := (v_item->>'qty')::INTEGER;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_item->>'product_id'
    FOR UPDATE;

    v_unit := COALESCE((v_item->>'unit_price')::NUMERIC, COALESCE(v_product.promotional_price, v_product.selling_price));
    v_cost := COALESCE((v_item->>'cost_price')::NUMERIC, v_product.cost_price);
    v_line_disc := COALESCE((v_item->>'discount_pct')::NUMERIC, 0);
    v_line_total := ROUND(v_qty * v_unit * (1 - v_line_disc / 100.0), 2);

    INSERT INTO public.order_items (
      order_id, product_id, product_name, qty, unit_price, cost_price, discount_pct, line_total
    ) VALUES (
      v_order_id, v_product.id, v_product.name, v_qty, v_unit, v_cost, v_line_disc, v_line_total
    );

    INSERT INTO public.inventory_movements (
      product_id, movement_type, source, qty_before, qty_change, qty_after,
      related_order_id, reason, performed_by
    ) VALUES (
      v_product.id, 'SALE',
      CASE WHEN v_source = 'POS' THEN 'POS'::public.movement_source ELSE 'ONLINE'::public.movement_source END,
      v_product.qty_on_hand, -v_qty, v_product.qty_on_hand - v_qty,
      v_order_id,
      CASE WHEN v_source = 'POS' THEN 'POS sale' ELSE 'Online order' END,
      v_cashier
    );

    UPDATE public.products
    SET qty_on_hand = qty_on_hand - v_qty,
        updated_at = NOW()
    WHERE id = v_product.id;

    v_subtotal := v_subtotal + v_line_total;
    v_cogs := v_cogs + (v_cost * v_qty);
  END LOOP;

  v_total := ROUND(v_subtotal * (1 - v_discount / 100.0), 2);

  UPDATE public.orders
  SET subtotal = v_subtotal, total = v_total, cogs = v_cogs, updated_at = NOW()
  WHERE id = v_order_id;

  IF v_payment IS NOT NULL THEN
    INSERT INTO public.payments (order_id, method, amount, reference)
    VALUES (v_order_id, v_payment, v_total, NULLIF(payload->>'payment_reference', ''));
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, detail)
  VALUES (
    v_cashier,
    'ORDER_COMPLETED',
    'orders',
    v_order_id::TEXT,
    jsonb_build_object('source', v_source, 'total', v_total, 'receipt_no', v_receipt)
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'duplicate', FALSE,
    'order_id', v_order_id,
    'receipt_no', v_receipt,
    'status', v_status,
    'total', v_total,
    'subtotal', v_subtotal
  );
EXCEPTION
  WHEN unique_violation THEN
    -- Concurrent idempotent retry won the race
    SELECT * INTO v_existing FROM public.orders WHERE idempotency_key = v_idempotency;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'ok', TRUE,
        'duplicate', TRUE,
        'order_id', v_existing.id,
        'receipt_no', v_existing.receipt_no,
        'status', v_existing.status,
        'total', v_existing.total
      );
    END IF;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_order_with_inventory_check(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_order_with_inventory_check(JSONB) TO anon, authenticated, service_role;

-- Manual stock adjustment (manager/admin only; requires reason)
CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_product_id TEXT,
  p_qty_change INTEGER,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_after INTEGER;
BEGIN
  IF NOT public.is_manager_or_admin() THEN
    RAISE EXCEPTION 'Only managers and admins can adjust inventory' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Reason is required for stock adjustments' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found' USING ERRCODE = 'P0001';
  END IF;

  v_after := v_product.qty_on_hand + p_qty_change;
  IF v_after < 0 THEN
    RAISE EXCEPTION 'Adjustment would make stock negative' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.products SET qty_on_hand = v_after, updated_at = NOW() WHERE id = p_product_id;

  INSERT INTO public.inventory_movements (
    product_id, movement_type, source, qty_before, qty_change, qty_after, reason, performed_by
  ) VALUES (
    p_product_id, 'ADJUSTMENT', 'ADMIN', v_product.qty_on_hand, p_qty_change, v_after, p_reason, auth.uid()
  );

  RETURN jsonb_build_object('ok', TRUE, 'qty_after', v_after);
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_inventory(TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_inventory(TEXT, INTEGER, TEXT) TO authenticated;

-- Cancel online order and restore stock
CREATE OR REPLACE FUNCTION public.cancel_order_restore_inventory(p_order_id UUID, p_reason TEXT DEFAULT 'Order cancelled')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item RECORD;
  v_product public.products%ROWTYPE;
BEGIN
  IF NOT public.is_manager_or_admin() THEN
    RAISE EXCEPTION 'Only managers and admins can cancel orders' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0001';
  END IF;
  IF v_order.status = 'CANCELLED' THEN
    RETURN jsonb_build_object('ok', TRUE, 'duplicate', TRUE);
  END IF;
  IF v_order.status IN ('DELIVERED', 'COMPLETED') AND v_order.source = 'POS' THEN
    RAISE EXCEPTION 'Completed POS sales cannot be cancelled via this RPC; use a return flow' USING ERRCODE = 'P0001';
  END IF;

  FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id FOR UPDATE;
    INSERT INTO public.inventory_movements (
      product_id, movement_type, source, qty_before, qty_change, qty_after,
      related_order_id, reason, performed_by
    ) VALUES (
      v_item.product_id, 'CANCELLATION',
      CASE WHEN v_order.source = 'POS' THEN 'POS'::public.movement_source ELSE 'ONLINE'::public.movement_source END,
      v_product.qty_on_hand, v_item.qty, v_product.qty_on_hand + v_item.qty,
      p_order_id, p_reason, auth.uid()
    );
    UPDATE public.products SET qty_on_hand = qty_on_hand + v_item.qty WHERE id = v_item.product_id;
  END LOOP;

  UPDATE public.orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', TRUE, 'order_id', p_order_id, 'status', 'CANCELLED');
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order_restore_inventory(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_staff_role() = 'admin');

DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.current_staff_role() = 'admin')
  WITH CHECK (public.current_staff_role() = 'admin');

-- Products: public can read active + website_visible; staff can read all
DROP POLICY IF EXISTS products_public_read ON public.products;
CREATE POLICY products_public_read ON public.products
  FOR SELECT TO anon, authenticated
  USING (
    (status = 'active' AND website_visible = TRUE)
    OR public.is_staff()
  );

DROP POLICY IF EXISTS products_manager_write ON public.products;
CREATE POLICY products_manager_write ON public.products
  FOR ALL TO authenticated
  USING (public.is_manager_or_admin())
  WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS product_images_public_read ON public.product_images;
CREATE POLICY product_images_public_read ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND (
          (p.status = 'active' AND p.website_visible = TRUE)
          OR public.is_staff()
        )
    )
  );

DROP POLICY IF EXISTS product_images_manager_write ON public.product_images;
CREATE POLICY product_images_manager_write ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_manager_or_admin())
  WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS categories_read ON public.categories;
CREATE POLICY categories_read ON public.categories FOR SELECT TO anon, authenticated USING (TRUE);
DROP POLICY IF EXISTS brands_read ON public.brands;
CREATE POLICY brands_read ON public.brands FOR SELECT TO anon, authenticated USING (TRUE);
DROP POLICY IF EXISTS categories_write ON public.categories;
CREATE POLICY categories_write ON public.categories FOR ALL TO authenticated
  USING (public.is_manager_or_admin()) WITH CHECK (public.is_manager_or_admin());
DROP POLICY IF EXISTS brands_write ON public.brands;
CREATE POLICY brands_write ON public.brands FOR ALL TO authenticated
  USING (public.is_manager_or_admin()) WITH CHECK (public.is_manager_or_admin());

-- Orders: staff see all; anon cannot SELECT (orders created only via RPC)
DROP POLICY IF EXISTS orders_staff_read ON public.orders;
CREATE POLICY orders_staff_read ON public.orders
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS orders_staff_update ON public.orders;
CREATE POLICY orders_staff_update ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_manager_or_admin())
  WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS order_items_staff_read ON public.order_items;
CREATE POLICY order_items_staff_read ON public.order_items
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS payments_staff_read ON public.payments;
CREATE POLICY payments_staff_read ON public.payments
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS movements_staff_read ON public.inventory_movements;
CREATE POLICY movements_staff_read ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS customers_staff_all ON public.customers;
CREATE POLICY customers_staff_all ON public.customers
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS purchases_manager ON public.purchase_orders;
CREATE POLICY purchases_manager ON public.purchase_orders
  FOR ALL TO authenticated
  USING (public.is_manager_or_admin())
  WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS purchase_items_manager ON public.purchase_items;
CREATE POLICY purchase_items_manager ON public.purchase_items
  FOR ALL TO authenticated
  USING (public.is_manager_or_admin())
  WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS audit_admin_read ON public.audit_logs;
CREATE POLICY audit_admin_read ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_manager_or_admin());

-- Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_movements;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
