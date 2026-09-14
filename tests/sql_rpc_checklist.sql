-- Manual / CI SQL checks for complete_order_with_inventory_check
-- Run after seed migration against a disposable Supabase branch.

-- 1) POS sale reduces stock
SELECT public.complete_order_with_inventory_check(jsonb_build_object(
  'idempotency_key', 'sqltest-pos-1',
  'source', 'POS',
  'status', 'COMPLETED',
  'payment_method', 'Cash',
  'cashier_name', 'SQL Tester',
  'items', jsonb_build_array(jsonb_build_object(
    'product_id', 'airpods-pro-3', 'qty', 1, 'unit_price', 340, 'cost_price', 238
  ))
));

-- 2) Online order reduces stock
SELECT public.complete_order_with_inventory_check(jsonb_build_object(
  'idempotency_key', 'sqltest-online-1',
  'source', 'ONLINE',
  'status', 'PENDING',
  'payment_method', 'MoMo',
  'customer_name', 'Test Buyer',
  'customer_phone', '233500000001',
  'items', jsonb_build_array(jsonb_build_object(
    'product_id', 'airpods-pro-2', 'qty', 1, 'unit_price', 190, 'cost_price', 133
  ))
));

-- 3) Out of stock blocked
UPDATE public.products SET qty_on_hand = 0 WHERE id = 'airpods-4';
SELECT public.complete_order_with_inventory_check(jsonb_build_object(
  'idempotency_key', 'sqltest-oos-1',
  'source', 'ONLINE',
  'items', jsonb_build_array(jsonb_build_object('product_id', 'airpods-4', 'qty', 1))
));
-- Expect: ok=false, error=INSUFFICIENT_STOCK

-- 4) Idempotent retry does not double-deduct
SELECT public.complete_order_with_inventory_check(jsonb_build_object(
  'idempotency_key', 'sqltest-online-1',
  'source', 'ONLINE',
  'items', jsonb_build_array(jsonb_build_object('product_id', 'airpods-pro-2', 'qty', 1))
));
-- Expect: ok=true, duplicate=true

-- 5) Concurrent oversell simulation (last unit)
UPDATE public.products SET qty_on_hand = 1 WHERE id = 'airpods-3';
-- In two sessions, run two different idempotency keys requesting qty=1 for airpods-3.
-- Exactly one must succeed; qty_on_hand must end at 0.
