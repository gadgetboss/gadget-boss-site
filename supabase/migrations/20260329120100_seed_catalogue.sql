-- Auto-generated catalogue seed
-- Migration: 20260329120100_seed_catalogue.sql

INSERT INTO public.categories (name, slug) VALUES ('Accessories', 'accessories') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug) VALUES ('Airpods', 'airpods') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug) VALUES ('Chargers', 'chargers') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug) VALUES ('Controllers', 'controllers') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug) VALUES ('Gaming', 'gaming') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug) VALUES ('Playstation', 'playstation') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug) VALUES ('Videography', 'videography') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.brands (name) VALUES ('Apple') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.brands (name) VALUES ('GadgetBoss') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.brands (name) VALUES ('Sony') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'airpods-pro-3', 'AirPods Pro 3rd Gen', 'GB00001', 'GB00001',
  'Apple', 'Airpods', 'H2 Apple Silicon, Active Noise Cancellation, 30h MagSafe',
  238, 340, NULL, 12, 3,
  'active', TRUE, 'assets/airpods-pro-3.jpg', 'H2 Apple Silicon, Active Noise Cancellation, 30h MagSafe', 'IOS 26 VERIFIED',
  '{}'::jsonb, 500.0
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'airpods-pro-2', 'AirPods Pro 2 Gen', 'GB00002', 'GB00002',
  'Apple', 'Airpods', 'Adaptive Transparency, Low-Distortion Audio',
  133, 190, NULL, 5, 3,
  'active', TRUE, 'assets/airpods-pro-2-gen.jpg', 'Adaptive Transparency, Low-Distortion Audio', 'BEST SELLER',
  '{}'::jsonb, 280.0
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'airpods-pro-v1', 'AirPods Pro 1st Gen', 'GB00003', 'GB00003',
  'Apple', 'Airpods', 'Active Noise Cancellation, Smart H1 Chip',
  112, 160, NULL, 3, 3,
  'active', TRUE, 'assets/airpods-pro-v1.jpg', 'Active Noise Cancellation, Smart H1 Chip', 'V.1 LIMITED',
  '{}'::jsonb, 200.0
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'airpods-3', 'AirPods 3', 'GB00004', 'GB00004',
  'Apple', 'Airpods', 'Personalized Spatial Audio, Sweat-Resistant',
  119, 170, NULL, 15, 3,
  'active', TRUE, 'assets/airpods-3-new.webp', 'Personalized Spatial Audio, Sweat-Resistant', 'POPULAR',
  '{}'::jsonb, 230.0
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'airpods-4', 'AirPods 4', 'GB00005', 'GB00005',
  'Apple', 'Airpods', 'Instant Device Switch, Optical Sensor Detect',
  182, 260, NULL, 20, 3,
  'active', TRUE, 'assets/airpods4.jpg', 'Instant Device Switch, Optical Sensor Detect', 'BUDGET',
  '{}'::jsonb, 350.0
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'airpods-max', 'AirPods Max Over-Ear', 'GB00006', 'GB00006',
  'Apple', 'Airpods', '40mm Dynamic Driver, High-Fidelity ANC Audio',
  1260, 1800, NULL, 2, 3,
  'active', TRUE, 'assets/AirPods-Max-black.webp', '40mm Dynamic Driver, High-Fidelity ANC Audio', 'ELITE PRODUCTS',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'usb-c-charger-20w', 'Original 20W USB-C Charger', 'GB00007', 'GB00007',
  'Apple', 'Chargers', '20W Max Power Delivery, Secure Fast Charging',
  84, 120, NULL, 20, 3,
  'active', TRUE, 'assets/usb-c-charger-20w.png', '20W Max Power Delivery, Secure Fast Charging', 'ORIGINAL',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'charging-cable-c-to-l', 'MFi Charging Cable (C to L)', 'GB00008', 'GB00008',
  'Apple', 'Chargers', 'MFi Certified Braided Cable, 30W Charging',
  3, 4, NULL, 50, 3,
  'active', TRUE, 'assets/charging-cable-c-to-l.png', 'MFi Certified Braided Cable, 30W Charging', 'MFI CERTIFIED',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'type-c-to-type-c-cable', 'Type-C to Type-C Cable', 'GB00009', 'GB00009',
  'GadgetBoss', 'Chargers', 'TPE High-Speed Sync, 60W Power Delivery',
  42, 60, NULL, 45, 3,
  'active', TRUE, 'assets/type-c-to-type-c-cable.png', 'TPE High-Speed Sync, 60W Power Delivery', 'ORIGINAL',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'macbook-charger', 'MacBook Pro Charger', 'GB00010', 'GB00010',
  'Apple', 'Chargers', '96W PD Power Source, Smart Current Safeguard',
  245, 350, NULL, 10, 3,
  'active', TRUE, 'assets/macbook-charger.png', '96W PD Power Source, Smart Current Safeguard', 'PREMIUM',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'magsafe-battery-pack', 'MagSafe Battery Pack', 'GB00011', 'GB00011',
  'Apple', 'Accessories', '5k mAh MagSafe Power Bank, Pass-Through Charging',
  119, 170, NULL, 18, 3,
  'active', TRUE, 'assets/battery pack.jpg', '5k mAh MagSafe Power Bank, Pass-Through Charging', 'HOT',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'powerbank-high-cap', 'High-Capacity Wireless Powerbank', 'GB00012', 'GB00012',
  'GadgetBoss', 'Accessories', '10k mAh Wireless, Digital LED Indicator',
  210, 300, NULL, 25, 3,
  'active', TRUE, 'assets/wireless powerbank.webp', '10k mAh Wireless, Digital LED Indicator', 'WIRELESS',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'ps4-slim', 'PlayStation 4 Slim', 'GB00013', 'GB00013',
  'Sony', 'Playstation', '500GB/1TB Console, 1 DualShock Controller',
  1, 0, NULL, 5, 3,
  'inactive', FALSE, 'assets/ps 4 slim.webp', '500GB/1TB Console, 1 DualShock Controller', 'CONTACT FOR PRICE',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'ps4-pro', 'PlayStation 4 Pro Console', 'GB00014', 'GB00014',
  'Sony', 'Playstation', '1TB 4K UHD Console, Enhanced 5GHz Wifi',
  1, 0, NULL, 5, 3,
  'inactive', FALSE, 'assets/ps4 pro.webp', '1TB 4K UHD Console, Enhanced 5GHz Wifi', 'CONTACT FOR PRICE',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'ps5-slim', 'PlayStation 5 Slim', 'GB00015', 'GB00015',
  'Sony', 'Playstation', '1TB High-Speed SSD Console, 4K 120Hz Output',
  5250, 7500, NULL, 4, 3,
  'active', TRUE, 'assets/ps5 slim.webp', '1TB High-Speed SSD Console, 4K 120Hz Output', 'NEW ARRIVAL',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'ps5-standard', 'PlayStation 5 Standard Edition', 'GB00016', 'GB00016',
  'Sony', 'Playstation', '825GB SSD, Native 4K HDR 120Hz Output',
  4550, 6500, NULL, 7, 3,
  'active', TRUE, 'assets/standard.webp', '825GB SSD, Native 4K HDR 120Hz Output', 'IN STOCK',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'ps5-pro', 'PlayStation 5 Pro Console', 'GB00017', 'GB00017',
  'Sony', 'Playstation', '2TB SSD, Native 8K 60Hz, AI PSSR Scaling',
  6300, 9000, NULL, 3, 3,
  'active', TRUE, 'assets/ps5 pro.webp', '2TB SSD, Native 8K 60Hz, AI PSSR Scaling', 'PREMIUM',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'ps5-dualsense', 'PS5 DualSense Controller', 'GB00018', 'GB00018',
  'Sony', 'Controllers', 'Haptic Feedback, Responsive Adaptive Triggers',
  735, 1050, NULL, 12, 3,
  'active', TRUE, 'assets/ps5 control.webp', 'Haptic Feedback, Responsive Adaptive Triggers', 'ORIGINAL',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'ps4-dualshock', 'PS4 DualShock 4 Controller', 'GB00019', 'GB00019',
  'Sony', 'Controllers', '2-Point Touch Pad, Integrated Light Bar',
  112, 160, NULL, 15, 3,
  'active', TRUE, 'assets/ps4 controller.webp', '2-Point Touch Pad, Integrated Light Bar', 'BEST SELLER',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'quadrapod', 'AI Face Tracking Quadrapod', 'GB00020', 'GB00020',
  'GadgetBoss', 'Videography', '360° Auto Rotation, Smart AI Face Tracking',
  196, 280, NULL, 20, 3,
  'active', TRUE, 'assets/quadrapod.webp', '360° Auto Rotation, Smart AI Face Tracking', 'PROMO',
  '{}'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'gaming-phone-cooler', 'AeroActive Gaming Phone Cooler', 'GB00021', 'GB00021',
  'GadgetBoss', 'Gaming', 'Peltier Cooling Fan, RGB Aura Sync',
  245, 350, NULL, 15, 3,
  'active', TRUE, 'assets/gaming-phone-cooler.png', 'Peltier Cooling Fan, RGB Aura Sync', 'HOT DROP',
  '{}'::jsonb, 450.0
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();

INSERT INTO public.products (
  id, name, sku, barcode, brand_name, category_name, description,
  cost_price, selling_price, promotional_price, qty_on_hand, low_stock_at,
  status, website_visible, image_url, tagline, badge, specs, old_price
) VALUES (
  'video-capture-card', '4K Ultra Stream Capture Card', 'GB00022', 'GB00022',
  'GadgetBoss', 'Videography', '4K 60fps Passthrough, Zero-Latency Streaming',
  455, 650, NULL, 8, 3,
  'active', TRUE, 'assets/video-capture-card.png', '4K 60fps Passthrough, Zero-Latency Streaming', 'PROMO',
  '{}'::jsonb, 850.0
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode,
  brand_name = EXCLUDED.brand_name, category_name = EXCLUDED.category_name,
  description = EXCLUDED.description, cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price, qty_on_hand = EXCLUDED.qty_on_hand,
  low_stock_at = EXCLUDED.low_stock_at, status = EXCLUDED.status,
  website_visible = EXCLUDED.website_visible, image_url = EXCLUDED.image_url,
  tagline = EXCLUDED.tagline, badge = EXCLUDED.badge, specs = EXCLUDED.specs,
  old_price = EXCLUDED.old_price, updated_at = NOW();
