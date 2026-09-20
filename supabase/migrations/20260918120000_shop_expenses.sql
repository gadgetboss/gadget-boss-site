-- Live POS finance: shop expenses + purchase receive RPC
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS purchase_date DATE NOT NULL DEFAULT CURRENT_DATE;

CREATE TABLE IF NOT EXISTS public.shop_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  recorded_by TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_expenses_date ON public.shop_expenses (expense_date DESC);

ALTER TABLE public.shop_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_expenses_staff ON public.shop_expenses;
CREATE POLICY shop_expenses_staff ON public.shop_expenses
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shop_expenses TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.receive_purchase(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po_id UUID;
  v_item JSONB;
  v_product public.products%ROWTYPE;
  v_after INTEGER;
  v_total NUMERIC(12,2) := 0;
  v_qty INTEGER;
  v_cost NUMERIC(12,2);
  v_line NUMERIC(12,2);
  v_supplier TEXT;
BEGIN
  IF NOT public.is_manager_or_admin() THEN
    RAISE EXCEPTION 'Only managers and admins can record purchases' USING ERRCODE = '42501';
  END IF;

  v_supplier := NULLIF(trim(COALESCE(p_payload->>'supplierName', '')), '');
  IF v_supplier IS NULL THEN
    RAISE EXCEPTION 'Supplier is required' USING ERRCODE = 'P0001';
  END IF;

  IF jsonb_typeof(COALESCE(p_payload->'items', '[]'::jsonb)) <> 'array'
     OR jsonb_array_length(COALESCE(p_payload->'items', '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'Add at least one purchase item' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.purchase_orders (
    supplier_name, status, total_cost, notes, created_by, purchase_date
  ) VALUES (
    v_supplier,
    'RECEIVED',
    0,
    NULLIF(trim(COALESCE(p_payload->>'notes', '')), ''),
    auth.uid(),
    COALESCE(NULLIF(p_payload->>'purchaseDate', '')::date, CURRENT_DATE)
  )
  RETURNING id INTO v_po_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
  LOOP
    v_qty := COALESCE((v_item->>'qty')::integer, 0);
    v_cost := COALESCE((v_item->>'unitCost')::numeric, 0);
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid purchase qty' USING ERRCODE = 'P0001';
    END IF;
    IF v_cost < 0 THEN
      RAISE EXCEPTION 'Invalid unit cost' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_product FROM public.products WHERE id = v_item->>'productId' FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'productId' USING ERRCODE = 'P0001';
    END IF;

    v_line := v_qty * v_cost;
    v_total := v_total + v_line;
    v_after := v_product.qty_on_hand + v_qty;

    INSERT INTO public.purchase_items (
      purchase_order_id, product_id, qty, unit_cost, line_total
    ) VALUES (
      v_po_id, v_product.id, v_qty, v_cost, v_line
    );

    UPDATE public.products
      SET qty_on_hand = v_after,
          cost_price = v_cost,
          updated_at = NOW()
      WHERE id = v_product.id;

    INSERT INTO public.inventory_movements (
      product_id, movement_type, source, qty_before, qty_change, qty_after,
      related_purchase_id, reason, performed_by
    ) VALUES (
      v_product.id, 'PURCHASE', 'SUPPLIER', v_product.qty_on_hand, v_qty, v_after,
      v_po_id, 'Purchase from ' || v_supplier, auth.uid()
    );
  END LOOP;

  UPDATE public.purchase_orders SET total_cost = v_total WHERE id = v_po_id;

  RETURN jsonb_build_object('ok', TRUE, 'id', v_po_id, 'total', v_total);
END;
$$;

REVOKE ALL ON FUNCTION public.receive_purchase(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.receive_purchase(JSONB) TO authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_expenses;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;
