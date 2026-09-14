/** Shared domain types for GadgetBoss POS ↔ website sync. */

export type ProductStatus = 'active' | 'inactive' | 'discontinued';
export type OrderSource = 'POS' | 'ONLINE';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'COMPLETED';
export type PaymentMethod = 'Cash' | 'MoMo' | 'Card' | 'Other';
export type StaffRole = 'admin' | 'manager' | 'cashier';

export interface DbProduct {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  brand_name: string | null;
  category_name: string | null;
  description: string | null;
  cost_price: number;
  selling_price: number;
  promotional_price: number | null;
  qty_on_hand: number;
  low_stock_at: number;
  status: ProductStatus;
  website_visible: boolean;
  image_url: string | null;
  tagline: string | null;
  badge: string | null;
  specs: Record<string, string>;
  old_price: number | null;
  updated_at?: string;
}

/** Shape used by existing POS UI (`pos/app.jsx`). */
export interface PosProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  costPrice: number;
  sellingPrice: number;
  qty: number;
  barcode: string;
  image: string;
  lowStockAt: number;
  status?: ProductStatus;
  websiteVisible?: boolean;
  description?: string;
  promotionalPrice?: number | null;
  sku?: string | null;
  tagline?: string;
  badge?: string;
  oldPrice?: number | null;
}

/** Shape used by storefront `PRODUCTS` cards. */
export interface WebsiteProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  rating: number;
  reviewsCount: number;
  badge: string;
  tagline: string;
  specs: Record<string, string>;
  outOfStock: boolean;
  lowStock: boolean;
}

export interface CheckoutLineInput {
  productId: string;
  qty: number;
  unitPrice?: number;
  costPrice?: number;
  discountPct?: number;
}

export interface CompleteOrderInput {
  idempotencyKey: string;
  source: OrderSource;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  discountPct?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerLocation?: string;
  cashierName?: string;
  receiptNo?: string;
  notes?: string;
  paymentReference?: string;
  items: CheckoutLineInput[];
}

export interface InsufficientStockItem {
  product_id: string;
  name?: string;
  error: string;
  requested: number;
  available: number;
}

export interface CompleteOrderResult {
  ok: boolean;
  duplicate?: boolean;
  order_id?: string;
  receipt_no?: string;
  status?: OrderStatus;
  total?: number;
  subtotal?: number;
  error?: string;
  products?: InsufficientStockItem[];
}

export interface SyncConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}
