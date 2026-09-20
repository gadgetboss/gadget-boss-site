const { useState, useEffect, useMemo, useRef, useCallback } = React;

const STORAGE_KEY = 'gadgetboss_pos_v1';
const Sync = (typeof window !== 'undefined' && window.GadgetBossSync) ? window.GadgetBossSync : null;
const syncEnabled = () => !!(Sync && Sync.isSyncConfigured && Sync.isSyncConfigured());
const STAFF_LOGIN_ALIASES = {
  admin: 'gadgetboss80@gmail.com',
  manager: 'gadgetboss80@gmail.com',
};

function productNameLookup(products) {
  const map = {};
  (products || []).forEach((p) => { map[p.id] = p.name; });
  return map;
}

function mapPurchaseOrder(po, names) {
  return {
    id: po.id,
    supplierId: '',
    supplierName: po.supplier_name,
    date: String(po.purchase_date || po.created_at || '').slice(0, 10),
    items: (po.purchase_items || []).map((it) => ({
      productId: it.product_id,
      name: (names && names[it.product_id]) || it.product_id,
      qty: Number(it.qty),
      cost: Number(it.unit_cost),
    })),
    total: Number(po.total_cost || 0),
    note: po.notes || '',
    recordedBy: '',
    createdAt: po.created_at,
  };
}

function mapShopExpense(row) {
  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    date: String(row.expense_date || row.created_at || '').slice(0, 10),
    note: row.note || '',
    recordedBy: row.recorded_by || '',
    createdAt: row.created_at,
  };
}

async function fetchPosPurchases(names) {
  if (!Sync || !Sync.getSupabase) return [];
  const { data, error } = await Sync.getSupabase()
    .from('purchase_orders')
    .select('*, purchase_items(*)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.warn('[POS] purchases fetch', error);
    return [];
  }
  return (data || []).map((po) => mapPurchaseOrder(po, names));
}

async function fetchPosExpenses() {
  if (!Sync || !Sync.getSupabase) return [];
  const { data, error } = await Sync.getSupabase()
    .from('shop_expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .limit(500);
  if (error) {
    console.warn('[POS] expenses fetch', error);
    return [];
  }
  return (data || []).map(mapShopExpense);
}

async function hydrateFromSupabase(store) {
  const products = await Sync.fetchStaffProducts();
  const names = productNameLookup(products);
  const [remoteOrders, purchases, expenses] = await Promise.all([
    Sync.fetchRecentOrders(200),
    fetchPosPurchases(names),
    fetchPosExpenses(),
  ]);
  return {
    ...store,
    products,
    sales: remoteOrders.map(Sync.mapOrderToPosSale),
    purchases,
    expenses,
    syncMode: true,
    syncError: null,
  };
}

async function sessionFromSupabaseAuth() {
  if (!Sync || !Sync.getSupabase) return null;
  const sb = Sync.getSupabase();
  const { data } = await sb.auth.getSession();
  const session = data && data.session;
  const userId = session && session.user && session.user.id;
  if (!userId) return null;
  let role = 'Cashier';
  let name = (session.user.email || 'Staff').split('@')[0];
  const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (profile) {
    role = String(profile.role || 'cashier');
    role = role.charAt(0).toUpperCase() + role.slice(1);
    name = profile.full_name || name;
  }
  return {
    userId,
    username: session.user.email,
    name,
    role,
  };
}
const fmt = (n) => `GH₵ ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtInt = (n) => `GH₵ ${Number(n || 0).toLocaleString()}`;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowISO = () => new Date().toISOString();
const toDate = (d) => (d ? new Date(d) : new Date());
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

const DEFAULT_SETTINGS = {
  businessName: 'GadgetBoss',
  email: 'gadgetboss80@gmail.com',
  phone: '+233540639091',
  location: 'Tudu, beside Tobinco Pharmacy',
  currency: 'Ghana Cedi (GH₵)',
};

const DEFAULT_USERS = [
  { id: 'u-admin', username: 'admin', password: 'admin123', name: 'Admin User', role: 'Admin' },
  { id: 'u-manager', username: 'manager', password: 'manager123', name: 'Store Manager', role: 'Manager' },
  { id: 'u-cashier', username: 'cashier', password: 'cashier123', name: 'Front Cashier', role: 'Cashier' },
];

const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Transport', 'Marketing', 'Salaries', 'Supplies', 'Maintenance', 'Other'];
const STORE_CATEGORIES = ['Airpods', 'Chargers', 'Accessories', 'Playstation', 'Gaming', 'Controllers', 'Videography'];

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file'));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 900;
      let w = img.width;
      let h = img.height;
      if (w > max || h > max) {
        const scale = max / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

function canAccess(role, feature) {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return true;
  const map = {
    manager: ['dashboard','pos','products','products.edit','transactions','customers','suppliers','expenses','reports','cashup','settings'],
    cashier: ['dashboard','pos','products.view','transactions.own','cashup'],
  };
  return (map[r] || []).includes(feature);
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function buildSeedSales(products, users) {
  const cashier = users.find(u => u.role === 'Cashier') || users[2];
  const manager = users.find(u => u.role === 'Manager') || users[1];
  const picks = products.filter(p => p.sellingPrice > 0).slice(0, 8);
  if (!picks.length) return [];

  const makeSale = (opts) => {
    const items = opts.items.map(it => {
      const p = products.find(x => x.id === it.productId) || picks[0];
      const line = {
        productId: p.id,
        name: p.name,
        qty: it.qty,
        unitPrice: p.sellingPrice,
        costPrice: p.costPrice,
        discountPct: it.discountPct || 0,
      };
      line.lineTotal = +(line.qty * line.unitPrice * (1 - line.discountPct / 100)).toFixed(2);
      return line;
    });
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const orderDiscount = opts.orderDiscount || 0;
    const total = +(subtotal * (1 - orderDiscount / 100)).toFixed(2);
    return {
      id: uid(),
      receiptNo: opts.receiptNo,
      saleType: opts.saleType || 'POS',
      paymentMethod: opts.paymentMethod,
      items,
      subtotal,
      orderDiscount,
      total,
      customerName: opts.customerName || '',
      customerPhone: opts.customerPhone || '',
      customerId: opts.customerId || null,
      cashierId: opts.cashierId,
      cashierName: opts.cashierName,
      createdAt: opts.createdAt,
      cogs: items.reduce((s, i) => s + i.costPrice * i.qty, 0),
    };
  };

  return [
    makeSale({
      receiptNo: 'GB-1001', saleType: 'POS', paymentMethod: 'Cash',
      cashierId: cashier.id, cashierName: cashier.name,
      customerName: 'Kwame Mensah', customerPhone: '0244123456',
      createdAt: daysAgo(0),
      items: [{ productId: picks[0].id, qty: 1 }, { productId: picks[1]?.id || picks[0].id, qty: 2 }],
    }),
    makeSale({
      receiptNo: 'GB-1002', saleType: 'POS', paymentMethod: 'MoMo',
      cashierId: cashier.id, cashierName: cashier.name,
      createdAt: daysAgo(0),
      items: [{ productId: picks[2]?.id || picks[0].id, qty: 1 }],
    }),
    makeSale({
      receiptNo: 'GB-1003', saleType: 'Online', paymentMethod: 'Card',
      cashierId: manager.id, cashierName: manager.name,
      customerName: 'Ama Owusu', customerPhone: '0555987654',
      createdAt: daysAgo(1),
      items: [{ productId: picks[3]?.id || picks[0].id, qty: 1 }],
      orderDiscount: 5,
    }),
    makeSale({
      receiptNo: 'GB-1004', saleType: 'POS', paymentMethod: 'Cash',
      cashierId: cashier.id, cashierName: cashier.name,
      createdAt: daysAgo(2),
      items: [{ productId: picks[4]?.id || picks[0].id, qty: 3 }],
    }),
    makeSale({
      receiptNo: 'GB-1005', saleType: 'Online', paymentMethod: 'MoMo',
      cashierId: manager.id, cashierName: manager.name,
      customerName: 'Yaw Boateng', customerPhone: '0201112233',
      createdAt: daysAgo(3),
      items: [{ productId: picks[5]?.id || picks[0].id, qty: 1 }, { productId: picks[6]?.id || picks[0].id, qty: 1 }],
    }),
    makeSale({
      receiptNo: 'GB-1006', saleType: 'POS', paymentMethod: 'Card',
      cashierId: cashier.id, cashierName: cashier.name,
      createdAt: daysAgo(5),
      items: [{ productId: picks[0].id, qty: 1 }],
    }),
  ];
}

function applySaleStock(products, sales) {
  const map = Object.fromEntries(products.map(p => [p.id, { ...p }]));
  sales.forEach(sale => {
    sale.items.forEach(it => {
      if (map[it.productId]) map[it.productId].qty = Math.max(0, (map[it.productId].qty || 0) - it.qty);
    });
  });
  return Object.values(map);
}

async function createInitialData() {
  let products = [];
  try {
    const res = await fetch('/pos/seed-products.json');
    products = await res.json();
  } catch (e) {
    console.error('Failed to load seed products', e);
  }

  const users = DEFAULT_USERS.map(u => ({ ...u }));
  const customers = [
    { id: uid(), name: 'Kwame Mensah', phone: '0244123456', email: 'kwame@email.com', location: 'Accra Central', createdAt: daysAgo(30) },
    { id: uid(), name: 'Ama Owusu', phone: '0555987654', email: 'ama@email.com', location: 'Kaneshie', createdAt: daysAgo(20) },
    { id: uid(), name: 'Yaw Boateng', phone: '0201112233', email: '', location: 'Tudu', createdAt: daysAgo(10) },
  ];
  const suppliers = [
    { id: uid(), name: 'TechHub Ghana', phone: '0302123456', email: 'orders@techhub.gh', location: 'Accra', notes: 'Primary Apple accessories', createdAt: daysAgo(60) },
    { id: uid(), name: 'Sony Distrib West', phone: '0302987654', email: 'supply@sonywest.gh', location: 'Tema', notes: 'PlayStation & controllers', createdAt: daysAgo(45) },
  ];

  const sales = syncEnabled() ? [] : buildSeedSales(products, users);
  products = applySaleStock(products, sales);

  // Link customers on sales where names match
  sales.forEach(s => {
    const c = customers.find(x => x.name === s.customerName);
    if (c) s.customerId = c.id;
  });

  const purchases = syncEnabled() ? [] : [
    {
      id: uid(),
      supplierId: suppliers[0].id,
      supplierName: suppliers[0].name,
      date: daysAgo(14).slice(0, 10),
      items: [
        { productId: products[0]?.id, name: products[0]?.name, qty: 5, cost: products[0]?.costPrice || 0 },
        { productId: products[6]?.id, name: products[6]?.name, qty: 10, cost: products[6]?.costPrice || 0 },
      ],
      total: 0,
      note: 'Restock AirPods & chargers',
      recordedBy: 'admin',
      createdAt: daysAgo(14),
    },
  ];
  if (purchases[0]) {
    purchases[0].total = purchases[0].items.reduce((s, i) => s + i.qty * i.cost, 0);
  }

  const expenses = syncEnabled() ? [] : [
    { id: uid(), category: 'Rent', amount: 2500, date: todayISO().slice(0, 8) + '01', note: 'Shop rent', recordedBy: 'admin', createdAt: daysAgo(12) },
    { id: uid(), category: 'Utilities', amount: 320, date: daysAgo(5).slice(0, 10), note: 'Electricity', recordedBy: 'manager', createdAt: daysAgo(5) },
    { id: uid(), category: 'Transport', amount: 150, date: daysAgo(2).slice(0, 10), note: 'Delivery runs', recordedBy: 'cashier', createdAt: daysAgo(2) },
    { id: uid(), category: 'Marketing', amount: 400, date: daysAgo(8).slice(0, 10), note: 'Instagram ads', recordedBy: 'manager', createdAt: daysAgo(8) },
  ];

  return {
    users,
    products,
    customers,
    suppliers,
    purchases,
    sales,
    expenses,
    reconciliations: [],
    settings: { ...DEFAULT_SETTINGS },
    session: null,
    receiptSeq: 1007,
  };
}

/* ---------- Icons ---------- */
function Icon({ name, size = 18, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.lucide) return;
    const iconFn = lucide[name];
    if (!iconFn) { ref.current.innerHTML = ''; return; }
    ref.current.innerHTML = '';
    const el = lucide.createElement(iconFn);
    el.setAttribute('width', size);
    el.setAttribute('height', size);
    el.style.strokeWidth = '2';
    ref.current.appendChild(el);
  }, [name, size]);
  return <span ref={ref} className={`inline-flex items-center justify-center ${className}`} aria-hidden="true" />;
}

/* ---------- Shared UI ---------- */
function Button({ children, variant = 'primary', className = '', size = 'md', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]';
  const sizes = { sm: 'px-3 py-2 text-xs min-h-[40px]', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3.5 text-base min-h-[48px]' };
  const variants = {
    primary: 'bg-accent hover:bg-accent-dim text-white shadow-soft',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    navy: 'bg-navy hover:bg-navy-soft text-white',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Card({ children, className = '', title, action }) {
  return (
    <div className={`bg-white rounded-card shadow-card border border-slate-100 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-100">
          <h3 className="font-display font-semibold text-slate-800 truncate">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop no-print" onClick={onClose}>
      <div
        className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92dvh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100">
          <h3 className="font-display font-semibold text-lg text-slate-800 pr-2">{title}</h3>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-slate-100 text-slate-500"><Icon name="X" size={18} /></button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto scrollbar-thin flex-1">{children}</div>
        {footer && <div className="px-4 sm:px-5 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-base text-slate-800 placeholder:text-slate-400 min-h-[44px]';

function StatCard({ label, value, icon, tone = 'blue', sub }) {
  const tones = {
    blue: 'bg-blue-50 text-accent',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="bg-white rounded-card shadow-card border border-slate-100 p-3 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="font-display text-xl md:text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon name={icon} size={20} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon = 'Inbox', text }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <div className="flex justify-center mb-3 opacity-40"><Icon name={icon} size={40} /></div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-50 text-accent',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-violet-50 text-violet-700',
  };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

/* ---------- Login ---------- */
function LoginScreen({ onLogin, users }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Shared DB mode: email login, or local aliases (admin) mapped to staff email
      if (syncEnabled()) {
        const alias = STAFF_LOGIN_ALIASES[username.trim().toLowerCase()];
        const email = username.includes('@') ? username.trim() : alias;
        if (!email) {
          setError('Sign in with your staff email, or admin / admin123.');
          setLoading(false);
          return;
        }
        const remote = await Sync.staffSignIn(email, password);
        onLogin({
          id: remote.id,
          username: remote.email || email,
          name: remote.name,
          role: remote.role,
        });
        setLoading(false);
        return;
      }

      const user = users.find(u => u.username === username.trim() && u.password === password);
      if (!user) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #0b1220 0%, #111827 45%, #1a2a4a 100%)',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}>
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, #4277df55 0%, transparent 40%), radial-gradient(circle at 80% 80%, #4277df33 0%, transparent 35%)'
      }} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/assets/logo.png" alt="GadgetBoss" className="w-16 h-16 mx-auto rounded-2xl object-cover shadow-lg mb-4" />
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">GadgetBoss</h1>
          <p className="text-slate-400 mt-1 text-sm">Point of Sale · Premium Retail</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-5 sm:p-7 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Use your staff credentials to continue</p>
          </div>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-xl border border-red-100">{error}</div>
          )}
          <Field label="Username / Email">
            <input className={inputCls} value={username} onChange={e => setUsername(e.target.value)} placeholder={syncEnabled() ? 'you@gadgetboss.com' : 'admin'} autoFocus required />
          </Field>
          <Field label="Password">
            <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </Field>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Signing in…' : 'Enter POS'}
          </Button>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
            {syncEnabled() ? (
              <>
                <p className="font-semibold text-slate-500 mb-1">Live database</p>
                <p>admin / admin123 · or gadgetboss80@gmail.com</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-slate-500 mb-1">Demo accounts (offline)</p>
                <p>admin / admin123 · Admin</p>
                <p>manager / manager123 · Manager</p>
                <p>cashier / cashier123 · Cashier</p>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Layout ---------- */
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', perm: 'dashboard' },
  { id: 'pos', label: 'POS Checkout', icon: 'ShoppingCart', perm: 'pos' },
  { id: 'products', label: 'Products', icon: 'Package', perm: 'products.view' },
  { id: 'transactions', label: 'Transactions', icon: 'Receipt', perm: 'transactions' },
  { id: 'customers', label: 'Customers', icon: 'Users', perm: 'customers' },
  { id: 'suppliers', label: 'Suppliers', icon: 'Truck', perm: 'suppliers' },
  { id: 'expenses', label: 'Expenses', icon: 'Wallet', perm: 'expenses' },
  { id: 'cashup', label: 'Cash-up', icon: 'Banknote', perm: 'cashup' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3', perm: 'reports' },
  { id: 'settings', label: 'Settings', icon: 'Settings', perm: 'settings' },
];

function Shell({ user, page, setPage, onLogout, settings, children, sidebarOpen, setSidebarOpen }) {
  const role = user.role;
  const items = NAV.filter(n => {
    if (n.id === 'products') return canAccess(role, 'products.view') || canAccess(role, 'products') || canAccess(role, 'products.edit');
    if (n.id === 'transactions') return canAccess(role, 'transactions') || canAccess(role, 'transactions.own');
    if (n.id === 'settings') return canAccess(role, 'settings') || role === 'Admin' || role === 'Manager';
    return canAccess(role, n.perm);
  });

  return (
    <div className="h-full w-full flex bg-[#f3f5f9]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden no-print" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[min(18rem,86vw)] bg-navy text-white flex flex-col transition-transform duration-300 no-print ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3" style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}>
          <img src="/assets/logo.png" alt="" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <div className="font-display font-bold text-lg leading-tight">{settings.businessName || 'GadgetBoss'}</div>
            <div className="text-[11px] text-slate-400 tracking-wide">POS SYSTEM</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-0.5">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              className={`nav-item w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium text-slate-300 ${page === item.id ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-bold text-sm">
              {(user.name || user.username || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-[11px] text-slate-400">{user.role}</div>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-sm text-slate-300 hover:text-white py-2 rounded-xl hover:bg-white/5">
            <Icon name="LogOut" size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full w-full">
        <header className="pos-shell-header shrink-0 z-30 bg-navy-soft text-white border-b border-white/5 no-print" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 h-14">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button className="lg:hidden p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-white/10" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <Icon name="Menu" size={20} />
              </button>
              <div className="min-w-0">
                <div className="font-display font-semibold text-sm md:text-base capitalize truncate">{page === 'pos' ? 'POS Checkout' : page === 'cashup' ? 'Cash-up' : page}</div>
                <div className="text-[11px] text-slate-400 hidden sm:block truncate">{settings.location}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-sm text-slate-300 shrink-0">
              <span className="hidden md:inline">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <Badge tone="blue">{user.role}</Badge>
            </div>
          </div>
        </header>
        <main className="pos-shell-main flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 min-w-0 max-w-full">{children}</main>
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-navy text-white border-t border-white/10 no-print" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="grid grid-cols-4">
            {items.filter((n) => ['dashboard', 'pos', 'products', 'transactions'].includes(n.id)).slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] font-semibold ${page === item.id ? 'text-white bg-white/10' : 'text-slate-400'}`}
              >
                <Icon name={item.icon} size={18} />
                {item.id === 'pos' ? 'Checkout' : item.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

/* ---------- Receipt ---------- */
function ReceiptView({ sale, settings }) {
  if (!sale) return null;
  return (
    <div id="receipt-print" className="font-jakarta text-sm text-slate-800 max-w-sm mx-auto">
      <div className="text-center mb-4">
        <div className="font-display text-xl font-bold">{settings.businessName}</div>
        <div className="text-xs text-slate-500 mt-1">{settings.location}</div>
        <div className="text-xs text-slate-500">{settings.phone}</div>
        <div className="text-xs text-slate-400 mt-2">Receipt #{sale.receiptNo}</div>
      </div>
      <div className="border-t border-b border-dashed border-slate-300 py-2 text-xs space-y-1 mb-3">
        <div className="flex justify-between"><span>Date</span><span>{new Date(sale.createdAt).toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Cashier</span><span>{sale.cashierName}</span></div>
        <div className="flex justify-between"><span>Payment</span><span>{sale.paymentMethod}</span></div>
        <div className="flex justify-between"><span>Type</span><span>{sale.saleType}</span></div>
        {(sale.customerName || sale.customerPhone) && (
          <div className="flex justify-between"><span>Customer</span><span>{sale.customerName} {sale.customerPhone}</span></div>
        )}
      </div>
      <table className="w-full text-xs mb-3">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Amt</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((it, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-1.5 pr-2">{it.name}{it.discountPct ? ` (-${it.discountPct}%)` : ''}</td>
              <td className="py-1.5 text-center">{it.qty}</td>
              <td className="py-1.5 text-right whitespace-nowrap">{fmt(it.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span>Subtotal</span><span>{fmt(sale.subtotal)}</span></div>
        {sale.orderDiscount > 0 && <div className="flex justify-between"><span>Discount ({sale.orderDiscount}%)</span><span>-{fmt(sale.subtotal - sale.total)}</span></div>}
        <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-300"><span>Total</span><span>{fmt(sale.total)}</span></div>
      </div>
      <p className="text-center text-xs text-slate-400 mt-6">Thank you for shopping at GadgetBoss!</p>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function SalesChart({ sales, mode }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;
    const now = new Date();
    let labels = [];
    let data = [];

    if (mode === 'daily') {
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      });
      data = labels.map((_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (6 - i));
        const s = startOfDay(d), e = endOfDay(d);
        return sales.filter(x => { const t = new Date(x.createdAt); return t >= s && t <= e; })
          .reduce((sum, x) => sum + x.total, 0);
      });
    } else if (mode === 'weekly') {
      labels = Array.from({ length: 8 }, (_, i) => `W${8 - i}`);
      data = labels.map((_, i) => {
        const end = new Date(now); end.setDate(end.getDate() - (7 - i) * 7);
        const start = new Date(end); start.setDate(start.getDate() - 6);
        return sales.filter(x => { const t = new Date(x.createdAt); return t >= startOfDay(start) && t <= endOfDay(end); })
          .reduce((sum, x) => sum + x.total, 0);
      });
    } else {
      labels = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return d.toLocaleDateString(undefined, { month: 'short' });
      });
      data = labels.map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const s = new Date(d.getFullYear(), d.getMonth(), 1);
        const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        return sales.filter(x => { const t = new Date(x.createdAt); return t >= s && t <= e; })
          .reduce((sum, x) => sum + x.total, 0);
      });
    }

    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Sales (GH₵)',
          data,
          borderColor: '#4277df',
          backgroundColor: 'rgba(66,119,223,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#4277df',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => 'GH₵ ' + v.toLocaleString() } },
          x: { grid: { display: false } },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [sales, mode]);

  return <div className="chart-wrap"><canvas ref={canvasRef} /></div>;
}

function Dashboard({ data, user }) {
  const [chartMode, setChartMode] = useState('daily');
  const { sales, products, expenses, purchases } = data;
  const role = user.role;

  const totalSales = sales.reduce((s, x) => s + x.total, 0);
  const posSales = sales.filter(x => x.saleType === 'POS').reduce((s, x) => s + x.total, 0);
  const onlineSales = sales.filter(x => x.saleType === 'Online').reduce((s, x) => s + x.total, 0);
  const totalPurchases = purchases.reduce((s, x) => s + x.total, 0);
  const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
  const stockUnits = products.reduce((s, p) => s + (p.qty || 0), 0);
  const stockValue = products.reduce((s, p) => s + (p.qty || 0) * (p.costPrice || 0), 0);

  const todaySales = sales.filter(x => startOfDay(new Date(x.createdAt)).getTime() === startOfDay(new Date()).getTime());
  const byCashier = {};
  todaySales.forEach(s => {
    const k = s.cashierName || 'Unknown';
    if (!byCashier[k]) byCashier[k] = { count: 0, total: 0, Cash: 0, MoMo: 0, Card: 0 };
    byCashier[k].count++;
    byCashier[k].total += s.total;
    byCashier[k][s.paymentMethod] = (byCashier[k][s.paymentMethod] || 0) + s.total;
  });
  const payTotals = { Cash: 0, MoMo: 0, Card: 0 };
  todaySales.forEach(s => { payTotals[s.paymentMethod] = (payTotals[s.paymentMethod] || 0) + s.total; });

  const limited = role === 'Cashier';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Sales" value={fmtInt(totalSales)} icon="TrendingUp" tone="blue" />
        <StatCard label="POS Sales" value={fmtInt(posSales)} icon="Store" tone="green" />
        {!limited && <StatCard label="Online Sales" value={fmtInt(onlineSales)} icon="Globe" tone="purple" />}
        {!limited && <StatCard label="Purchases" value={fmtInt(totalPurchases)} icon="Truck" tone="amber" />}
        {!limited && <StatCard label="Expenses" value={fmtInt(totalExpenses)} icon="Wallet" tone="rose" />}
        <StatCard label="Stock Balance" value={stockUnits.toLocaleString() + ' units'} icon="Package" tone="slate" />
        {!limited && <StatCard label="Stock Value" value={fmtInt(stockValue)} icon="Coins" tone="amber" sub="At cost" />}
        {limited && <StatCard label="Today's Sales" value={fmtInt(todaySales.reduce((s,x)=>s+x.total,0))} icon="Calendar" tone="green" sub={`${todaySales.length} transactions`} />}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3" title="Sales Overview" action={
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {['daily','weekly','monthly'].map(m => (
              <button key={m} onClick={() => setChartMode(m)}
                className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-semibold capitalize ${chartMode === m ? 'bg-white text-accent shadow-sm' : 'text-slate-500'}`}>
                {m}
              </button>
            ))}
          </div>
        }>
          <div className="p-5"><SalesChart sales={sales} mode={chartMode} /></div>
        </Card>

        <Card className="lg:col-span-2" title="Cashier Reconciliation" action={<Badge tone="blue">Today</Badge>}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {['Cash','MoMo','Card'].map(m => (
                <div key={m} className="bg-slate-50 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">{m}</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">{fmtInt(payTotals[m])}</div>
                </div>
              ))}
            </div>
            <div className="bg-accent/10 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Expected drawer (cash)</span>
              <span className="font-display font-bold text-accent">{fmt(payTotals.Cash)}</span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">By cashier</p>
              {Object.keys(byCashier).length === 0 && <p className="text-sm text-slate-400">No sales yet today</p>}
              {Object.entries(byCashier).map(([name, v]) => (
                <div key={name} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-semibold text-slate-800">{name}</div>
                    <div className="text-xs text-slate-400">{v.count} sales</div>
                  </div>
                  <div className="font-bold text-slate-800">{fmt(v.total)}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- POS ---------- */
function POSPage({ data, update, user, settings }) {
  const [query, setQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [payment, setPayment] = useState('Cash');
  const [receiptSale, setReceiptSale] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const barcodeRef = useRef(null);

  const products = data.products.filter(p => p.sellingPrice > 0 || p.qty > 0);
  const filtered = products.filter(p => {
    const q = query.toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
  });

  const addToCart = (product, qty = 1) => {
    if ((product.qty || 0) <= 0) return alert('Out of stock');
    setCart(prev => {
      const existing = prev.find(c => c.productId === product.id);
      if (existing) {
        const nextQty = existing.qty + qty;
        if (nextQty > product.qty) { alert('Not enough stock'); return prev; }
        return prev.map(c => c.productId === product.id ? { ...c, qty: nextQty } : c);
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        qty,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        discountPct: 0,
        image: product.image,
      }];
    });
  };

  const onBarcodeEnter = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const code = barcode.trim();
    if (!code) return;
    const p = data.products.find(x => (x.barcode || '').toLowerCase() === code.toLowerCase());
    if (!p) { alert('Product not found for barcode: ' + code); setBarcode(''); return; }
    addToCart(p);
    setBarcode('');
  };

  const updateLine = (productId, patch) => {
    setCart(prev => prev.map(c => c.productId === productId ? { ...c, ...patch } : c).filter(c => c.qty > 0));
  };

  const lines = cart.map(c => ({
    ...c,
    lineTotal: +(c.qty * c.unitPrice * (1 - (c.discountPct || 0) / 100)).toFixed(2),
  }));
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const total = +(subtotal * (1 - (orderDiscount || 0) / 100)).toFixed(2);

  const completeSale = async () => {
    if (!lines.length) return alert('Cart is empty');
    for (const line of lines) {
      const p = data.products.find(x => x.id === line.productId);
      if (!p || p.qty < line.qty) return alert(`Insufficient stock for ${line.name}`);
    }

    let customerId = null;
    let customers = [...data.customers];
    if (customerPhone.trim()) {
      let c = customers.find(x => x.phone === customerPhone.trim());
      if (!c && customerName.trim()) {
        c = { id: uid(), name: customerName.trim(), phone: customerPhone.trim(), email: '', location: '', createdAt: nowISO() };
        customers.push(c);
      }
      customerId = c?.id || null;
    }

    const receiptNo = `GB-${String(data.receiptSeq || 1000).padStart(4, '0')}`;
    const idempotencyKey = `pos-${uid()}`;

    // Shared Supabase atomic checkout (POS + website use the same RPC)
    if (syncEnabled()) {
      try {
        const result = await Sync.completeOrder({
          idempotencyKey,
          source: 'POS',
          status: 'COMPLETED',
          paymentMethod: payment,
          discountPct: Number(orderDiscount) || 0,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          cashierName: user.name,
          receiptNo,
          items: lines.map((l) => ({
            productId: l.productId,
            qty: l.qty,
            unitPrice: l.unitPrice,
            costPrice: l.costPrice,
            discountPct: l.discountPct || 0,
          })),
        });
        if (!result.ok) {
          const detail = (result.products || []).map((p) => `${p.name || p.product_id}: need ${p.requested}, have ${p.available}`).join('\n');
          return alert(result.error === 'INSUFFICIENT_STOCK' ? `Insufficient stock:\n${detail}` : (result.error || 'Checkout failed'));
        }

        const products = await Sync.fetchStaffProducts();
        const remoteOrders = await Sync.fetchRecentOrders(200);
        const sales = remoteOrders.map(Sync.mapOrderToPosSale);
        update({
          ...data,
          products,
          sales,
          customers,
          receiptSeq: (data.receiptSeq || 1000) + 1,
        });
        setCart([]);
        setOrderDiscount(0);
        setCustomerName('');
        setCustomerPhone('');
        setReceiptSale(sales.find((s) => s.id === result.order_id) || sales[0] || null);
        setCartOpen(false);
        return;
      } catch (err) {
        console.error(err);
        return alert('Could not complete sale on the shared database. Check your connection and try again.\n' + (err.message || err));
      }
    }

    const sale = {
      id: uid(),
      receiptNo,
      saleType: 'POS',
      paymentMethod: payment,
      items: lines.map(({ productId, name, qty, unitPrice, costPrice, discountPct, lineTotal }) => ({
        productId, name, qty, unitPrice, costPrice, discountPct, lineTotal,
      })),
      subtotal,
      orderDiscount: Number(orderDiscount) || 0,
      total,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerId,
      cashierId: user.id,
      cashierName: user.name,
      createdAt: nowISO(),
      cogs: lines.reduce((s, l) => s + l.costPrice * l.qty, 0),
      idempotencyKey,
    };

    const products = data.products.map(p => {
      const line = lines.find(l => l.productId === p.id);
      if (!line) return p;
      return { ...p, qty: p.qty - line.qty };
    });

    update({
      ...data,
      products,
      customers,
      sales: [sale, ...data.sales],
      receiptSeq: (data.receiptSeq || 1000) + 1,
    });
    setCart([]);
    setOrderDiscount(0);
    setCustomerName('');
    setCustomerPhone('');
    setReceiptSale(sale);
    setCartOpen(false);
  };

  const cartPanel = (mobile = false) => (
    <>
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <h3 className="font-display font-semibold">Cart ({cart.length})</h3>
        <div className="flex items-center gap-2">
          {cart.length > 0 && <button className="text-xs text-red-500 font-semibold min-h-[44px] min-w-[44px] px-2" onClick={() => setCart([])}>Clear</button>}
          {mobile && <button className="text-sm font-semibold text-accent min-h-[44px] min-w-[44px] px-2" onClick={() => setCartOpen(false)}>Done</button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 min-h-0">
        {lines.length === 0 && <EmptyState icon="ShoppingCart" text="Scan or tap products to add" />}
        {lines.map(line => (
          <div key={line.productId} className="bg-slate-50 rounded-xl p-3">
            <div className="flex justify-between gap-2">
              <div className="font-semibold text-sm text-slate-800 flex-1">{line.name}</div>
              <button className="min-w-[44px] min-h-[44px]" onClick={() => setCart(c => c.filter(x => x.productId !== line.productId))} ><span className="text-slate-400 hover:text-red-500"><Icon name="Trash2" size={16} /></span></button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button className="w-11 h-11 rounded-lg bg-white border border-slate-200 font-bold text-lg" onClick={() => updateLine(line.productId, { qty: line.qty - 1 })}>−</button>
              <span className="w-8 text-center text-sm font-bold">{line.qty}</span>
              <button className="w-11 h-11 rounded-lg bg-white border border-slate-200 font-bold text-lg" onClick={() => updateLine(line.productId, { qty: line.qty + 1 })}>+</button>
              <div className="ml-auto flex items-center gap-1">
                <input type="number" min="0" max="100" className="w-16 px-2 py-2 rounded-lg border border-slate-200 text-sm min-h-[44px]"
                  value={line.discountPct} onChange={e => updateLine(line.productId, { discountPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
                <span className="text-[10px] text-slate-400">% off</span>
              </div>
            </div>
            <div className="text-right text-sm font-bold text-slate-800 mt-1">{fmt(line.lineTotal)}</div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 space-y-3 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Field label="Customer name">
            <input className={inputCls} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Optional" />
          </Field>
        </div>
        <Field label="Order discount %">
          <input type="number" min="0" max="100" className={inputCls} value={orderDiscount} onChange={e => setOrderDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
        </Field>
        <div>
          <span className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Payment</span>
          <div className="grid grid-cols-3 gap-2">
            {['Cash','MoMo','Card'].map(m => (
              <button key={m} type="button" onClick={() => setPayment(m)}
                className={`py-3 min-h-[44px] rounded-xl text-sm font-semibold border ${payment === m ? 'bg-accent text-white border-accent' : 'bg-white border-slate-200 text-slate-600'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span></div>
        <div className="flex justify-between items-center">
          <span className="font-display font-bold text-lg">Total</span>
          <span className="font-display font-bold text-xl sm:text-2xl text-accent">{fmt(total)}</span>
        </div>
        <Button className="w-full" size="lg" onClick={completeSale} disabled={!lines.length}>
          <Icon name="Check" size={18} /> Complete Sale
        </Button>
      </div>
    </>
  );

  return (
    <div className="pos-checkout grid lg:grid-cols-5 gap-4 lg:h-full">
      <div className="lg:col-span-3 space-y-4">
        <Card className="p-3 sm:p-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="Search" size={16} /></span>
              <input className={`${inputCls} pl-9`} placeholder="Search name, category…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="ScanLine" size={16} /></span>
              <input
                ref={barcodeRef}
                className={`${inputCls} pl-9`}
                placeholder="Scan barcode + Enter"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                onKeyDown={onBarcodeEnter}
              />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto scrollbar-thin pr-1">
          {filtered.map(p => {
            const low = p.qty <= (p.lowStockAt ?? 3);
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.qty <= 0}
                className={`text-left bg-white rounded-card border shadow-soft overflow-hidden hover:border-accent/50 hover:shadow-card transition disabled:opacity-50 min-h-[44px] ${low && p.qty > 0 ? 'border-amber-300' : 'border-slate-100'}`}
              >
                <div className="aspect-square bg-slate-50 flex items-center justify-center p-2 sm:p-3">
                  <img src={p.image} alt="" className="max-h-full max-w-full object-contain" onError={e => { e.target.style.display='none'; }} />
                </div>
                <div className="p-2.5 sm:p-3">
                  <div className="text-xs font-semibold text-slate-800 line-clamp-2 min-h-[2.4rem]">{p.name}</div>
                  <div className="flex items-center justify-between mt-2 gap-1">
                    <span className="font-display font-bold text-accent text-sm">{fmtInt(p.sellingPrice)}</span>
                    <span className={`text-[10px] font-bold ${p.qty <= 0 ? 'text-red-500' : low ? 'text-amber-600' : 'text-slate-400'}`}>{p.qty} left</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-2">
        <Card className="sticky top-20 flex flex-col max-h-[calc(100vh-120px)]">
          {cartPanel(false)}
        </Card>
      </div>

      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] bg-white rounded-t-2xl shadow-xl flex flex-col overflow-hidden"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            {cartPanel(true)}
          </div>
        </div>
      )}

      {!cartOpen && (
        <button
          type="button"
          className="lg:hidden fixed z-[35] left-3 right-3 rounded-2xl bg-navy text-white shadow-xl px-4 py-3 min-h-[52px] flex items-center justify-between gap-3 no-print"
          style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
          onClick={() => setCartOpen(true)}
        >
          <span className="font-semibold text-sm">Cart · {cart.length} item{cart.length === 1 ? '' : 's'}</span>
          <span className="font-display font-bold text-accent-soft">{fmt(total)}</span>
        </button>
      )}

      <Modal open={!!receiptSale} onClose={() => setReceiptSale(null)} title="Sale Complete" wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setReceiptSale(null)}>Close</Button>
            <Button onClick={() => window.print()}><Icon name="Printer" size={16} /> Print Receipt</Button>
          </>
        }>
        <ReceiptView sale={receiptSale} settings={settings} />
      </Modal>
    </div>
  );
}

/* ---------- Products ---------- */
function ProductsPage({ data, update, user }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [savedMsg, setSavedMsg] = useState('');
  const canEdit = canAccess(user.role, 'products.edit') || user.role === 'Admin' || user.role === 'Manager';
  const canDelete = user.role === 'Admin' || user.role === 'Manager';

  const categories = ['All', ...Array.from(new Set(data.products.map(p => p.category).filter(Boolean)))];
  const filtered = data.products.filter(p => {
    if (category !== 'All' && p.category !== category) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q);
  });

  const openNew = () => {
    setForm({
      name: '',
      category: 'Accessories',
      brand: 'GadgetBoss',
      costPrice: 0,
      sellingPrice: 0,
      qty: 0,
      barcode: '',
      image: '../assets/logo.png',
      lowStockAt: 3,
      websiteVisible: true,
      status: 'active',
      tagline: '',
    });
    setModal('new');
  };
  const openEdit = (p) => {
    setForm({
      websiteVisible: true,
      status: 'active',
      tagline: '',
      ...p,
      websiteVisible: p.websiteVisible !== false,
    });
    setModal('edit');
  };

  const save = async () => {
    if (!form.name?.trim()) return alert('Name required');
    if (form.websiteVisible !== false && !(Number(form.sellingPrice) > 0)) {
      if (!confirm('Selling price is 0. This product will show as “Price on Request” on the online store. Continue?')) return;
    }
    const product = {
      ...form,
      id: modal === 'new' ? (form.id || uid()) : form.id,
      costPrice: Number(form.costPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      qty: Number(form.qty) || 0,
      lowStockAt: Number(form.lowStockAt) || 3,
      status: form.status || 'active',
      websiteVisible: form.websiteVisible !== false,
      tagline: form.tagline || '',
    };

    if (syncEnabled()) {
      try {
        const existing = data.products.find((p) => p.id === product.id);
        await Sync.upsertPosProduct({ ...product, qty: existing ? existing.qty : 0 });
        if (!existing && product.qty > 0) {
          const reason = window.prompt('Opening stock reason (required):', 'Initial stock');
          if (!reason || !reason.trim()) {
            return alert('Product metadata saved, but opening stock was not applied without a reason.');
          }
          await Sync.adjustInventory(product.id, product.qty, reason.trim());
        } else if (existing) {
          const qtyDelta = product.qty - Number(existing.qty || 0);
          if (qtyDelta !== 0) {
            const reason = window.prompt('Reason for stock adjustment (required):');
            if (!reason || !reason.trim()) {
              return alert('Catalogue saved. Stock was not changed — a reason is required for adjustments.');
            }
            await Sync.adjustInventory(product.id, qtyDelta, reason.trim());
          }
        }
        const products = await Sync.fetchStaffProducts();
        update({ ...data, products });
        if (Sync.publishCatalogue) Sync.publishCatalogue(products);
        setModal(null);
        const wasPrice = existing ? Number(existing.sellingPrice) : null;
        setSavedMsg(product.websiteVisible === false
          ? `${product.name} saved (hidden from the online store).`
          : wasPrice != null && wasPrice !== product.sellingPrice
            ? `${product.name} price updated to ${fmt(product.sellingPrice)} on the online store.`
            : `${product.name} is live on the online store.`);
        return;
      } catch (err) {
        console.error(err);
        return alert('Could not save product to shared database.\n' + (err.message || err));
      }
    }

    let nextProducts;
    if (modal === 'new') {
      nextProducts = [product, ...data.products];
    } else {
      nextProducts = data.products.map(p => p.id === form.id ? product : p);
    }
    update({ ...data, products: nextProducts });
    if (Sync && Sync.publishCatalogue) Sync.publishCatalogue(nextProducts);
    setModal(null);
    const previous = data.products.find((p) => p.id === product.id);
    const wasPrice = previous ? Number(previous.sellingPrice) : null;
    setSavedMsg(product.websiteVisible === false
      ? `${product.name} saved (hidden from the online store).`
      : wasPrice != null && wasPrice !== product.sellingPrice
        ? `${product.name} price updated to ${fmt(product.sellingPrice)} on the online store.`
        : `${product.name} is live on the online store.`);
  };

  const toggleOnline = async (p) => {
    const updated = { ...p, websiteVisible: p.websiteVisible === false };
    if (syncEnabled()) {
      try {
        await Sync.upsertPosProduct(updated);
      } catch (err) {
        return alert('Could not update store visibility in the shared database.\n' + (err.message || err));
      }
    }
    const nextProducts = data.products.map((x) => (x.id === p.id ? updated : x));
    update({ ...data, products: nextProducts });
    if (Sync && Sync.publishCatalogue) Sync.publishCatalogue(nextProducts);
    setSavedMsg(updated.websiteVisible
      ? `${p.name} is now showing on the online store.`
      : `${p.name} was hidden from the online store.`);
  };

  const updatePrice = async (p, raw) => {
    const sellingPrice = Number(raw);
    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) return;
    if (sellingPrice === Number(p.sellingPrice)) return;
    const updated = { ...p, sellingPrice, oldPrice: Number(p.sellingPrice) || p.oldPrice };
    if (syncEnabled()) {
      try {
        await Sync.upsertPosProduct(updated);
      } catch (err) {
        return alert('Could not update price in shared database.\n' + (err.message || err));
      }
    }
    const nextProducts = data.products.map((x) => (x.id === p.id ? updated : x));
    update({ ...data, products: nextProducts });
    if (Sync && Sync.publishCatalogue) Sync.publishCatalogue(nextProducts);
    setSavedMsg(p.websiteVisible === false
      ? `${p.name} POS price set to ${fmt(sellingPrice)} (still hidden from the store).`
      : `${p.name} is now ${fmt(sellingPrice)} on the online store.`);
  };

  const onPickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setForm((f) => ({ ...f, image: dataUrl }));
    } catch (err) {
      alert('Could not read that photo. Try a JPG or PNG.');
    }
  };

  const remove = (id) => {
    if (!confirm('Delete this product?')) return;
    const nextProducts = data.products.filter(p => p.id !== id);
    update({ ...data, products: nextProducts });
    if (Sync && Sync.publishCatalogue) Sync.publishCatalogue(nextProducts);
  };

  return (
    <div className="space-y-4 min-w-0">
      {savedMsg && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{savedMsg}</span>
          <a href="/" target="_blank" rel="noreferrer" className="font-semibold text-accent underline">Open shop</a>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 flex-wrap">
          <input className={`${inputCls} w-full sm:max-w-xs`} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className={`${inputCls} max-w-[180px]`} value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {canEdit && <Button onClick={openNew}><Icon name="Plus" size={16} /> Add to store</Button>}
      </div>
      <p className="text-xs text-slate-500">Add a product here with <strong>Show on online store</strong> checked — it appears on the shop as soon as you save.</p>

      <Card className="min-w-0">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-sm min-w-max">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 hidden lg:table-cell">Brand</th>
                <th className="px-4 py-3 text-right hidden lg:table-cell">Cost</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 hidden md:table-cell">Online</th>
                <th className="px-4 py-3 hidden xl:table-cell">Barcode</th>
                {canEdit && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const low = p.qty <= (p.lowStockAt ?? 3);
                const out = p.qty <= 0;
                return (
                  <tr key={p.id} className={`border-b border-slate-50 ${out ? 'out-stock' : low ? 'low-stock' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-contain bg-slate-50" onError={e => { e.target.src='../assets/logo.png'; }} />
                        <span className="font-semibold text-slate-800 truncate max-w-[9.5rem] sm:max-w-none">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{p.category}</td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{p.brand}</td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">{fmt(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      {canEdit ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="w-[6.5rem] sm:w-[7.5rem] text-right font-semibold rounded-lg border border-slate-200 px-2 py-2 text-base min-h-[44px]"
                          defaultValue={p.sellingPrice}
                          key={`${p.id}-${p.sellingPrice}`}
                          onBlur={(e) => updatePrice(p, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                        />
                      ) : (
                        <span className="font-semibold">{fmt(p.sellingPrice)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${out ? 'text-red-600' : low ? 'text-amber-600' : ''}`}>{p.qty}</span>
                      {low && !out && <Badge tone="amber">Low</Badge>}
                      {out && <Badge tone="red">Out</Badge>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => toggleOnline(p)}
                          className={`min-h-[44px] px-3 py-2 rounded-full text-xs font-semibold ${p.websiteVisible === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}
                        >
                          {p.websiteVisible === false ? 'Hidden' : 'On store'}
                        </button>
                      ) : (
                        <Badge tone={p.websiteVisible === false ? 'slate' : 'green'}>{p.websiteVisible === false ? 'Hidden' : 'On store'}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 hidden xl:table-cell whitespace-nowrap">{p.barcode}</td>
                    {canEdit && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button className="p-2 min-w-[44px] min-h-[44px] hover:bg-slate-100 rounded-lg" onClick={() => openEdit(p)} aria-label="Edit product"><Icon name="Pencil" size={14} /></button>
                        {canDelete && <button className="p-2 min-w-[44px] min-h-[44px] hover:bg-red-50 text-red-500 rounded-lg" onClick={() => remove(p.id)} aria-label="Delete product"><Icon name="Trash2" size={14} /></button>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <EmptyState text="No products found" />}
        </div>
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? 'Add product to store' : 'Edit Product'}
        footer={<><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button onClick={save}>{form.websiteVisible === false ? 'Save' : 'Save & show online'}</Button></>}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Product name" className="sm:col-span-2">
            <input className={inputCls} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. AirPods Pro 3" />
          </Field>
          <Field label="Category">
            <select className={inputCls} value={form.category || 'Accessories'} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {STORE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              {form.category && !STORE_CATEGORIES.includes(form.category) && <option>{form.category}</option>}
            </select>
          </Field>
          <Field label="Brand">
            <input className={inputCls} value={form.brand || ''} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
          </Field>
          <Field label="Barcode">
            <input className={inputCls} value={form.barcode || ''} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
          </Field>
          <Field label="Photo" className="sm:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <img src={form.image || '../assets/logo.png'} alt="" className="w-14 h-14 rounded-xl object-contain bg-slate-50 border border-slate-200" onError={e => { e.target.src='../assets/logo.png'; }} />
              <div className="flex-1 space-y-2 min-w-0">
                <input type="file" accept="image/*" className="block w-full text-sm" onChange={onPickPhoto} />
                <input className={inputCls} value={form.image && form.image.startsWith('data:') ? '' : (form.image || '')} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="or paste an image URL" />
              </div>
            </div>
          </Field>
          <Field label="Short description / tagline" className="sm:col-span-2">
            <input className={inputCls} value={form.tagline || ''} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Shown under the product name online" />
          </Field>
          {[['costPrice','Cost'],['sellingPrice','Selling price'],['qty','Qty'],['lowStockAt','Low stock at']].map(([k,l]) => (
            <Field key={k} label={l}>
              <input type="number" className={inputCls} value={form[k] ?? 0} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </Field>
          ))}
          <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-accent/30 bg-blue-50 px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#4277df]"
              checked={form.websiteVisible !== false}
              onChange={e => setForm(f => ({ ...f, websiteVisible: e.target.checked }))}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Show on online store</span>
              <span className="block text-xs text-slate-500">Leave this on. Saving publishes the product to gadgetboss shop.</span>
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Transactions ---------- */
function TransactionsPage({ data, user, settings }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cashier, setCashier] = useState('All');
  const [pay, setPay] = useState('All');
  const [saleType, setSaleType] = useState('All');
  const [view, setView] = useState(null);

  const ownOnly = user.role === 'Cashier';
  const cashiers = Array.from(new Set(data.sales.map(s => s.cashierName).filter(Boolean)));

  const filtered = data.sales.filter(s => {
    if (ownOnly && s.cashierId !== user.id) return false;
    if (cashier !== 'All' && s.cashierName !== cashier) return false;
    if (pay !== 'All' && s.paymentMethod !== pay) return false;
    if (saleType !== 'All' && s.saleType !== saleType) return false;
    const t = new Date(s.createdAt);
    if (from && t < startOfDay(from)) return false;
    if (to && t > endOfDay(to)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Field label="From"><input type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} /></Field>
          <Field label="To"><input type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} /></Field>
          {!ownOnly && (
            <Field label="Cashier">
              <select className={inputCls} value={cashier} onChange={e => setCashier(e.target.value)}>
                <option>All</option>
                {cashiers.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          )}
          <Field label="Payment">
            <select className={inputCls} value={pay} onChange={e => setPay(e.target.value)}>
              {['All','Cash','MoMo','Card'].map(x => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Sale type">
            <select className={inputCls} value={saleType} onChange={e => setSaleType(e.target.value)}>
              {['All','POS','Online'].map(x => <option key={x}>{x}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="min-w-0">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 hidden md:table-cell">Cashier</th>
                <th className="px-4 py-3 hidden md:table-cell">Type</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{s.receiptNo}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{s.cashierName}</td>
                  <td className="px-4 py-3 hidden md:table-cell"><Badge tone={s.saleType === 'POS' ? 'blue' : 'purple'}>{s.saleType}</Badge></td>
                  <td className="px-4 py-3">{s.paymentMethod}</td>
                  <td className="px-4 py-3 text-right font-bold whitespace-nowrap">{fmt(s.total)}</td>
                  <td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={() => setView(s)}>Receipt</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState icon="Receipt" text="No transactions match filters" />}
        </div>
      </Card>

      <Modal open={!!view} onClose={() => setView(null)} title={`Receipt ${view?.receiptNo || ''}`}
        footer={<><Button variant="secondary" onClick={() => setView(null)}>Close</Button><Button onClick={() => window.print()}><Icon name="Printer" size={16} /> Print</Button></>}>
        <ReceiptView sale={view} settings={settings} />
      </Modal>
    </div>
  );
}

/* ---------- Customers ---------- */
function CustomersPage({ data, update }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [historyOf, setHistoryOf] = useState(null);

  const openNew = () => { setForm({ name: '', phone: '', email: '', location: '' }); setModal('new'); };
  const openEdit = (c) => { setForm({ ...c }); setModal('edit'); };

  const save = () => {
    if (!form.name?.trim()) return alert('Name required');
    if (modal === 'new') {
      update({ ...data, customers: [{ ...form, id: uid(), createdAt: nowISO() }, ...data.customers] });
    } else {
      update({ ...data, customers: data.customers.map(c => c.id === form.id ? { ...c, ...form } : c) });
    }
    setModal(null);
  };

  const remove = (id) => {
    if (!confirm('Delete customer?')) return;
    update({ ...data, customers: data.customers.filter(c => c.id !== id) });
  };

  const history = historyOf
    ? data.sales.filter(s => s.customerId === historyOf.id || s.customerPhone === historyOf.phone)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{data.customers.length} customers</p>
        <Button onClick={openNew}><Icon name="Plus" size={16} /> Add Customer</Button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.customers.map(c => (
          <Card key={c.id} className="p-5">
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-display font-semibold text-lg text-slate-900">{c.name}</div>
                <div className="text-sm text-slate-500 mt-1">{c.phone || '—'}</div>
                <div className="text-xs text-slate-400">{c.email || 'No email'}</div>
                <div className="text-xs text-slate-400 mt-1">{c.location || ''}</div>
              </div>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => openEdit(c)}><Icon name="Pencil" size={14} /></button>
                <button className="p-2 hover:bg-red-50 text-red-500 rounded-lg" onClick={() => remove(c.id)}><Icon name="Trash2" size={14} /></button>
              </div>
            </div>
            <Button size="sm" variant="secondary" className="mt-4 w-full" onClick={() => setHistoryOf(c)}>Purchase history</Button>
          </Card>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? 'Add Customer' : 'Edit Customer'}
        footer={<><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-3">
          {['name','phone','email','location'].map(k => (
            <Field key={k} label={k}><input className={inputCls} value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} /></Field>
          ))}
        </div>
      </Modal>

      <Modal open={!!historyOf} onClose={() => setHistoryOf(null)} title={`History · ${historyOf?.name || ''}`} wide>
        {history.length === 0 ? <EmptyState text="No purchases yet" /> : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-400 border-b"><th className="py-2">Receipt</th><th>Date</th><th className="hidden sm:table-cell">Payment</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {history.map(s => (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="py-2 font-mono text-xs">{s.receiptNo}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="hidden sm:table-cell">{s.paymentMethod}</td>
                  <td className="text-right font-bold">{fmt(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------- Suppliers & Purchases ---------- */
function SuppliersPage({ data, update, user }) {
  const [tab, setTab] = useState('suppliers');
  const [modal, setModal] = useState(null);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [form, setForm] = useState({});
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: '', date: todayISO(), note: '', items: [{ productId: '', qty: 1, cost: 0 }] });

  const openSupplier = (s) => {
    setForm(s || { name: '', phone: '', email: '', location: '', notes: '' });
    setModal(s ? 'edit-sup' : 'new-sup');
  };

  const saveSupplier = () => {
    if (!form.name?.trim()) return alert('Name required');
    if (modal === 'new-sup') {
      update({ ...data, suppliers: [{ ...form, id: uid(), createdAt: nowISO() }, ...data.suppliers] });
    } else {
      update({ ...data, suppliers: data.suppliers.map(s => s.id === form.id ? { ...s, ...form } : s) });
    }
    setModal(null);
  };

  const removeSupplier = (id) => {
    if (!confirm('Delete supplier?')) return;
    update({ ...data, suppliers: data.suppliers.filter(s => s.id !== id) });
  };

  const addPurchaseLine = () => setPurchaseForm(f => ({ ...f, items: [...f.items, { productId: '', qty: 1, cost: 0 }] }));

  const savePurchase = async () => {
    const supplier = data.suppliers.find(s => s.id === purchaseForm.supplierId);
    if (!supplier) return alert('Select supplier');
    const items = purchaseForm.items.filter(i => i.productId && Number(i.qty) > 0).map(i => {
      const p = data.products.find(x => x.id === i.productId);
      return { productId: i.productId, name: p?.name || '', qty: Number(i.qty), cost: Number(i.cost) };
    });
    if (!items.length) return alert('Add at least one item');
    const total = items.reduce((s, i) => s + i.qty * i.cost, 0);
    const purchase = {
      id: uid(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: purchaseForm.date,
      items,
      total,
      note: purchaseForm.note,
      recordedBy: user.username,
      createdAt: nowISO(),
    };

    if (syncEnabled()) {
      setSavingPurchase(true);
      try {
        const sb = Sync.getSupabase();
        const { error } = await sb.rpc('receive_purchase', {
          p_payload: {
            supplierName: supplier.name,
            notes: purchaseForm.note || '',
            purchaseDate: purchaseForm.date,
            items: items.map((i) => ({ productId: i.productId, qty: i.qty, unitCost: i.cost })),
          },
        });
        if (error) throw error;
        const products = await Sync.fetchStaffProducts();
        const purchases = await fetchPosPurchases(productNameLookup(products));
        update({ ...data, purchases, products });
      } catch (err) {
        alert(err.message || 'Could not save purchase');
        setSavingPurchase(false);
        return;
      }
      setSavingPurchase(false);
    } else {
      const products = data.products.map(p => {
        const line = items.find(i => i.productId === p.id);
        if (!line) return p;
        return { ...p, qty: (p.qty || 0) + line.qty, costPrice: line.cost || p.costPrice };
      });
      update({ ...data, purchases: [purchase, ...data.purchases], products });
    }

    setPurchaseForm({ supplierId: '', date: todayISO(), note: '', items: [{ productId: '', qty: 1, cost: 0 }] });
    setModal(null);
    setTab('purchases');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['suppliers','purchases'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${tab === t ? 'bg-navy text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
            {t}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {tab === 'suppliers' && <Button onClick={() => openSupplier(null)}><Icon name="Plus" size={16} /> Supplier</Button>}
          {tab === 'purchases' && <Button onClick={() => setModal('purchase')}><Icon name="Plus" size={16} /> Record Purchase</Button>}
        </div>
      </div>

      {tab === 'suppliers' && (
        <div className="grid md:grid-cols-2 gap-4">
          {data.suppliers.map(s => (
            <Card key={s.id} className="p-5">
              <div className="flex justify-between">
                <div>
                  <div className="font-display font-semibold text-lg">{s.name}</div>
                  <div className="text-sm text-slate-500 mt-1">{s.phone}</div>
                  <div className="text-xs text-slate-400">{s.email}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.location}</div>
                  {s.notes && <p className="text-xs text-slate-500 mt-2">{s.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => openSupplier(s)}><Icon name="Pencil" size={14} /></button>
                  <button className="p-2 hover:bg-red-50 text-red-500 rounded-lg" onClick={() => removeSupplier(s.id)}><Icon name="Trash2" size={14} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'purchases' && (
        <Card className="min-w-0">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-400 border-b">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 hidden md:table-cell">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {data.purchases.map(p => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="px-4 py-3">{p.date}</td>
                    <td className="px-4 py-3 font-semibold">{p.supplierName}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{p.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
                    <td className="px-4 py-3 text-right font-bold">{fmt(p.total)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.purchases.length && <EmptyState text="No purchases yet" />}
          </div>
        </Card>
      )}

      <Modal open={modal === 'new-sup' || modal === 'edit-sup'} onClose={() => setModal(null)}
        title={modal === 'new-sup' ? 'Add Supplier' : 'Edit Supplier'}
        footer={<><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button onClick={saveSupplier}>Save</Button></>}>
        <div className="space-y-3">
          {['name','phone','email','location','notes'].map(k => (
            <Field key={k} label={k}><input className={inputCls} value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} /></Field>
          ))}
        </div>
      </Modal>

      <Modal open={modal === 'purchase'} onClose={() => setModal(null)} title="Record Purchase" wide
        footer={<><Button variant="secondary" onClick={() => setModal(null)} disabled={savingPurchase}>Cancel</Button><Button onClick={savePurchase} disabled={savingPurchase}>{savingPurchase ? 'Saving…' : 'Save Purchase'}</Button></>}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Supplier">
              <select className={inputCls} value={purchaseForm.supplierId} onChange={e => setPurchaseForm(f => ({ ...f, supplierId: e.target.value }))}>
                <option value="">Select…</option>
                {data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" className={inputCls} value={purchaseForm.date} onChange={e => setPurchaseForm(f => ({ ...f, date: e.target.value }))} />
            </Field>
          </div>
          <Field label="Note"><input className={inputCls} value={purchaseForm.note} onChange={e => setPurchaseForm(f => ({ ...f, note: e.target.value }))} /></Field>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold uppercase text-slate-500">Items</span>
              <Button size="sm" variant="secondary" onClick={addPurchaseLine}>Add line</Button>
            </div>
            {purchaseForm.items.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <select className={`${inputCls} col-span-6`} value={line.productId}
                  onChange={e => {
                    const p = data.products.find(x => x.id === e.target.value);
                    setPurchaseForm(f => ({
                      ...f,
                      items: f.items.map((it, i) => i === idx ? { ...it, productId: e.target.value, cost: p?.costPrice || 0 } : it),
                    }));
                  }}>
                  <option value="">Product…</option>
                  {data.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" className={`${inputCls} col-span-2`} placeholder="Qty" value={line.qty}
                  onChange={e => setPurchaseForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, qty: e.target.value } : it) }))} />
                <input type="number" className={`${inputCls} col-span-3`} placeholder="Cost" value={line.cost}
                  onChange={e => setPurchaseForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, cost: e.target.value } : it) }))} />
                <button className="col-span-1 text-red-500" onClick={() => setPurchaseForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}><Icon name="X" size={16} /></button>
              </div>
            ))}
            <div className="text-right font-bold">
              Total: {fmt(purchaseForm.items.reduce((s, i) => s + (Number(i.qty)||0) * (Number(i.cost)||0), 0))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Expenses ---------- */
function ExpensesPage({ data, update, user }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: 'Rent', amount: '', date: todayISO(), note: '' });

  const filtered = data.expenses.filter(e => {
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    return true;
  });
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const save = async () => {
    if (!form.amount || Number(form.amount) <= 0) return alert('Enter amount');
    const expense = {
      id: uid(),
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      note: form.note,
      recordedBy: user.username,
      createdAt: nowISO(),
    };
    if (syncEnabled()) {
      setSaving(true);
      try {
        const { error } = await Sync.getSupabase().from('shop_expenses').insert({
          category: form.category,
          amount: Number(form.amount),
          expense_date: form.date,
          note: form.note || null,
          recorded_by: user.username || user.name,
          created_by: data.session?.userId || null,
        });
        if (error) throw error;
        const expenses = await fetchPosExpenses();
        update({ ...data, expenses });
      } catch (err) {
        alert(err.message || 'Could not save expense');
        setSaving(false);
        return;
      }
      setSaving(false);
    } else {
      update({ ...data, expenses: [expense, ...data.expenses] });
    }
    setModal(false);
    setForm({ category: 'Rent', amount: '', date: todayISO(), note: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          <Field label="From"><input type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} /></Field>
          <Field label="To"><input type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} /></Field>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 shadow-soft">
            <span className="text-xs text-slate-400 uppercase font-bold">Period total</span>
            <div className="font-display font-bold text-accent">{fmt(total)}</div>
          </div>
          <Button onClick={() => setModal(true)}><Icon name="Plus" size={16} /> Add Expense</Button>
        </div>
      </div>

      <Card className="min-w-0">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400 border-b">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 hidden md:table-cell">Note</th>
                <th className="px-4 py-3 hidden lg:table-cell">By</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-slate-50">
                  <td className="px-4 py-3">{e.date}</td>
                  <td className="px-4 py-3"><Badge tone="amber">{e.category}</Badge></td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{e.note}</td>
                  <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{e.recordedBy}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState text="No expenses in period" />}
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Expense"
        footer={<><Button variant="secondary" onClick={() => setModal(false)} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></>}>
        <div className="space-y-3">
          <Field label="Category">
            <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount (GH₵)"><input type="number" className={inputCls} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></Field>
          <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Note"><input className={inputCls} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></Field>
          <p className="text-xs text-slate-400">Recorded by: {user.username}</p>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Cash-up ---------- */
function CashupPage({ data, update, user }) {
  const [date, setDate] = useState(todayISO());
  const [opening, setOpening] = useState(100);
  const [counted, setCounted] = useState('');

  const daySales = data.sales.filter(s => s.createdAt.slice(0, 10) === date && (user.role !== 'Cashier' || s.cashierId === user.id));
  const byPay = { Cash: 0, MoMo: 0, Card: 0 };
  daySales.forEach(s => { byPay[s.paymentMethod] = (byPay[s.paymentMethod] || 0) + s.total; });
  const expectedCash = Number(opening || 0) + byPay.Cash;
  const variance = (Number(counted) || 0) - expectedCash;

  const existing = data.reconciliations.find(r => r.date === date && r.userId === user.id);

  const save = () => {
    const record = {
      id: existing?.id || uid(),
      date,
      userId: user.id,
      userName: user.name,
      openingFloat: Number(opening) || 0,
      cashSales: byPay.Cash,
      momoSales: byPay.MoMo,
      cardSales: byPay.Card,
      expectedCash,
      countedCash: Number(counted) || 0,
      variance,
      createdAt: nowISO(),
    };
    const reconciliations = existing
      ? data.reconciliations.map(r => r.id === existing.id ? record : r)
      : [record, ...data.reconciliations];
    update({ ...data, reconciliations });
    alert('Reconciliation saved');
  };

  useEffect(() => {
    if (existing) {
      setOpening(existing.openingFloat);
      setCounted(existing.countedCash);
    }
  }, [date]); // eslint-disable-line

  return (
    <div className="max-w-2xl space-y-4">
      <Card className="p-5 space-y-4">
        <Field label="Date">
          <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['Cash','MoMo','Card'].map(m => (
            <div key={m} className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">{m} sales</div>
              <div className="font-display font-bold text-lg mt-1">{fmt(byPay[m])}</div>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Opening float (cash)">
            <input type="number" className={inputCls} value={opening} onChange={e => setOpening(e.target.value)} />
          </Field>
          <Field label="Counted cash">
            <input type="number" className={inputCls} value={counted} onChange={e => setCounted(e.target.value)} placeholder="0.00" />
          </Field>
        </div>
        <div className="bg-navy text-white rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-slate-300">Expected cash</span><span className="font-bold">{fmt(expectedCash)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-300">Counted</span><span className="font-bold">{fmt(Number(counted)||0)}</span></div>
          <div className={`flex justify-between text-base pt-2 border-t border-white/10 ${variance === 0 ? 'text-emerald-300' : variance < 0 ? 'text-red-300' : 'text-amber-300'}`}>
            <span>Variance</span>
            <span className="font-display font-bold">{fmt(variance)}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">{daySales.length} sales on this date · Expected = opening + cash sales</p>
        <Button className="w-full" onClick={save}><Icon name="Save" size={16} /> Save Reconciliation</Button>
      </Card>

      {data.reconciliations.length > 0 && (
        <Card title="Recent reconciliations">
          <div className="divide-y divide-slate-100">
            {data.reconciliations.slice(0, 8).map(r => (
              <div key={r.id} className="px-5 py-3 flex justify-between text-sm">
                <div>
                  <div className="font-semibold">{r.date} · {r.userName}</div>
                  <div className="text-xs text-slate-400">Expected {fmt(r.expectedCash)} · Counted {fmt(r.countedCash)}</div>
                </div>
                <Badge tone={r.variance === 0 ? 'green' : 'red'}>{fmt(r.variance)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------- Reports ---------- */
function ReportsPage({ data }) {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(todayISO());

  const sales = data.sales.filter(s => {
    const d = s.createdAt.slice(0, 10);
    return d >= from && d <= to;
  });
  const expenses = data.expenses.filter(e => e.date >= from && e.date <= to);
  const revenue = sales.reduce((s, x) => s + x.total, 0);
  const cogs = sales.reduce((s, x) => s + (x.cogs || x.items.reduce((a, i) => a + i.costPrice * i.qty, 0)), 0);
  const expenseTotal = expenses.reduce((s, x) => s + x.amount, 0);
  const profit = revenue - cogs - expenseTotal;

  const stockIn = data.purchases.filter(p => p.date >= from && p.date <= to)
    .reduce((s, p) => s + p.items.reduce((a, i) => a + i.qty, 0), 0);
  const stockOut = sales.reduce((s, sale) => s + sale.items.reduce((a, i) => a + i.qty, 0), 0);

  const byCashier = {};
  sales.forEach(s => {
    const k = s.cashierName || 'Unknown';
    if (!byCashier[k]) byCashier[k] = { count: 0, revenue: 0 };
    byCashier[k].count++;
    byCashier[k].revenue += s.total;
  });

  const byExpenseCat = {};
  expenses.forEach(e => { byExpenseCat[e.category] = (byExpenseCat[e.category] || 0) + e.amount; });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <Field label="From"><input type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} /></Field>
          <Field label="To"><input type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} /></Field>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Sales revenue" value={fmtInt(revenue)} icon="TrendingUp" tone="blue" sub={`${sales.length} sales`} />
        <StatCard label="COGS" value={fmtInt(cogs)} icon="Package" tone="amber" />
        <StatCard label="Expenses" value={fmtInt(expenseTotal)} icon="Wallet" tone="rose" />
        <StatCard label="Profit" value={fmtInt(profit)} icon="DollarSign" tone={profit >= 0 ? 'green' : 'rose'} sub="Revenue − COGS − Expenses" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Stock movement">
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4">
              <div className="text-xs font-bold uppercase text-emerald-600">Units in (purchases)</div>
              <div className="font-display text-2xl font-bold mt-1">{stockIn}</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-4">
              <div className="text-xs font-bold uppercase text-rose-600">Units out (sales)</div>
              <div className="font-display text-2xl font-bold mt-1">{stockOut}</div>
            </div>
            <div className="col-span-2 text-sm text-slate-500">
              Current stock: {data.products.reduce((s, p) => s + (p.qty || 0), 0)} units · Value {fmt(data.products.reduce((s, p) => s + p.qty * p.costPrice, 0))}
            </div>
          </div>
        </Card>

        <Card title="Expenses summary">
          <div className="p-5 space-y-2">
            {Object.keys(byExpenseCat).length === 0 && <EmptyState text="No expenses in period" />}
            {Object.entries(byExpenseCat).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between text-sm py-2 border-b border-slate-50">
                <span className="font-medium">{cat}</span>
                <span className="font-bold">{fmt(amt)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Cashier performance" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-400 border-b">
                  <th className="px-5 py-3">Cashier</th>
                  <th className="px-5 py-3 text-right">Sales count</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byCashier).map(([name, v]) => (
                  <tr key={name} className="border-b border-slate-50">
                    <td className="px-5 py-3 font-semibold">{name}</td>
                    <td className="px-5 py-3 text-right">{v.count}</td>
                    <td className="px-5 py-3 text-right font-bold">{fmt(v.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!Object.keys(byCashier).length && <EmptyState text="No sales in period" />}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */
function SettingsPage({ data, update, user, onReset }) {
  const [settings, setSettings] = useState({ ...data.settings });
  const [userModal, setUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', name: '', role: 'Cashier' });
  const isAdmin = user.role === 'Admin';

  const saveSettings = () => {
    update({ ...data, settings });
    alert('Business settings saved');
  };

  const saveUser = () => {
    if (!userForm.username.trim() || !userForm.password) return alert('Username and password required');
    if (data.users.some(u => u.username === userForm.username.trim())) return alert('Username already exists');
    const newUser = { id: uid(), ...userForm, username: userForm.username.trim() };
    update({ ...data, users: [...data.users, newUser] });
    setUserModal(false);
    setUserForm({ username: '', password: '', name: '', role: 'Cashier' });
  };

  const removeUser = (id) => {
    if (id === user.id) return alert('Cannot delete yourself');
    if (!confirm('Delete user?')) return;
    update({ ...data, users: data.users.filter(u => u.id !== id) });
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Card title="Business details">
        <div className="p-5 grid sm:grid-cols-2 gap-3">
          {[['businessName','Business name'],['email','Email'],['phone','Phone'],['location','Location'],['currency','Currency']].map(([k,l]) => (
            <Field key={k} label={l} className={k === 'location' ? 'sm:col-span-2' : ''}>
              <input className={inputCls} value={settings[k] || ''} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))} />
            </Field>
          ))}
          <div className="sm:col-span-2">
            <Button onClick={saveSettings}><Icon name="Save" size={16} /> Save settings</Button>
          </div>
        </div>
      </Card>

      {isAdmin && (
        <Card title="Users" action={<Button size="sm" onClick={() => setUserModal(true)}><Icon name="Plus" size={14} /> Add user</Button>}>
          <div className="divide-y divide-slate-100">
            {data.users.map(u => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{u.name} <span className="text-slate-400 font-normal">@{u.username}</span></div>
                  <Badge tone={u.role === 'Admin' ? 'purple' : u.role === 'Manager' ? 'blue' : 'slate'}>{u.role}</Badge>
                </div>
                {u.id !== user.id && (
                  <button className="text-red-500 p-2 hover:bg-red-50 rounded-lg" onClick={() => removeUser(u.id)}><Icon name="Trash2" size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {isAdmin && (
        <Card title="Danger zone" className="border-red-100">
          <div className="p-5">
            <p className="text-sm text-slate-500 mb-3">Reset all POS data to demo seed. This cannot be undone.</p>
            <Button variant="danger" onClick={onReset}><Icon name="RotateCcw" size={16} /> Reset demo data</Button>
          </div>
        </Card>
      )}

      {!isAdmin && user.role === 'Manager' && (
        <Card className="p-5"><p className="text-sm text-slate-500">User management and data reset are Admin-only.</p></Card>
      )}

      <Modal open={userModal} onClose={() => setUserModal(false)} title="Create user"
        footer={<><Button variant="secondary" onClick={() => setUserModal(false)}>Cancel</Button><Button onClick={saveUser}>Create</Button></>}>
        <div className="space-y-3">
          <Field label="Name"><input className={inputCls} value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Username"><input className={inputCls} value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} /></Field>
          <Field label="Password"><input type="password" className={inputCls} value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} /></Field>
          <Field label="Role">
            <select className={inputCls} value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
              {['Admin','Manager','Cashier'].map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- App Root ---------- */
function App() {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public-config');
        if (res.ok) {
          const cfg = await res.json();
          window.__GADGETBOSS_ENV__ = window.__GADGETBOSS_ENV__ || {};
          if (cfg.SUPABASE_URL) window.__GADGETBOSS_ENV__.SUPABASE_URL = cfg.SUPABASE_URL;
          if (cfg.SUPABASE_ANON_KEY) window.__GADGETBOSS_ENV__.SUPABASE_ANON_KEY = cfg.SUPABASE_ANON_KEY;
        }
      } catch (err) {
        console.warn('[POS] public-config unavailable', err);
      }

      let store = loadStore();
      if (!store || !store.products?.length) {
        store = await createInitialData();
        saveStore(store);
      }

      if (syncEnabled()) {
        try {
          const staffSession = await sessionFromSupabaseAuth();
          if (staffSession) {
            store = await hydrateFromSupabase({ ...store, session: staffSession });
          } else {
            store = {
              ...store,
              session: null,
              sales: [],
              purchases: [],
              expenses: [],
              syncMode: true,
            };
          }
          saveStore(store);
        } catch (err) {
          console.warn('[POS] Supabase hydrate failed; using local cache', err);
          store = { ...store, session: null, sales: [], purchases: [], expenses: [], syncMode: false, syncError: String(err.message || err) };
        }
      }

      setData(store);
      setReady(true);
      try {
        if (window.GadgetBossSync && window.GadgetBossSync.publishCatalogue) {
          window.GadgetBossSync.publishCatalogue(store.products || []);
        }
      } catch (e) {}
    })();
  }, []);

  // Realtime: products, inventory, online orders
  useEffect(() => {
    if (!ready || !syncEnabled() || !data) return undefined;
    const refresh = async () => {
      try {
        const products = await Sync.fetchStaffProducts();
        const names = productNameLookup(products);
        const [remoteOrders, purchases, expenses] = await Promise.all([
          Sync.fetchRecentOrders(200),
          fetchPosPurchases(names),
          fetchPosExpenses(),
        ]);
        setData((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            products,
            sales: remoteOrders.map(Sync.mapOrderToPosSale),
            purchases,
            expenses,
          };
          saveStore(next);
          return next;
        });
      } catch (err) {
        console.error('[POS] realtime refresh failed', err);
      }
    };
    const chProducts = Sync.subscribeProducts(refresh);
    const chOrders = Sync.subscribeOrders(refresh);
    const chMoves = Sync.subscribeInventoryMovements(refresh);
    const extra = [];
    try {
      const sb = Sync.getSupabase && Sync.getSupabase();
      if (sb) {
        extra.push(
          sb.channel('gb-purchases').on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, refresh).subscribe(),
          sb.channel('gb-expenses').on('postgres_changes', { event: '*', schema: 'public', table: 'shop_expenses' }, refresh).subscribe(),
        );
      }
    } catch (e) {}
    return () => {
      try { chProducts.unsubscribe(); } catch (e) {}
      try { chOrders.unsubscribe(); } catch (e) {}
      try { chMoves.unsubscribe(); } catch (e) {}
      extra.forEach((ch) => { try { ch.unsubscribe(); } catch (e) {} });
    };
  }, [ready]);

  const persist = useCallback((next) => {
    setData(next);
    saveStore(next);
    // Keep online store catalogue in sync whenever POS data changes
    try {
      if (window.GadgetBossSync && window.GadgetBossSync.publishCatalogue && next && next.products) {
        window.GadgetBossSync.publishCatalogue(next.products);
      }
    } catch (e) {}
  }, []);

  const update = useCallback((next) => {
    persist({ ...next, session: data?.session });
  }, [persist, data?.session]);

  const session = data?.session || null;
  const user = session && data
    ? (data.users.find(u => u.id === session.userId) || session)
    : null;

  const pageAllowed = useMemo(() => {
    if (!user) return true;
    if (page === 'dashboard') return canAccess(user.role, 'dashboard');
    if (page === 'pos') return canAccess(user.role, 'pos');
    if (page === 'products') return canAccess(user.role, 'products.view') || canAccess(user.role, 'products') || canAccess(user.role, 'products.edit');
    if (page === 'transactions') return canAccess(user.role, 'transactions') || canAccess(user.role, 'transactions.own');
    if (page === 'customers') return canAccess(user.role, 'customers');
    if (page === 'suppliers') return canAccess(user.role, 'suppliers');
    if (page === 'expenses') return canAccess(user.role, 'expenses');
    if (page === 'cashup') return canAccess(user.role, 'cashup');
    if (page === 'reports') return canAccess(user.role, 'reports');
    if (page === 'settings') return canAccess(user.role, 'settings') || user.role === 'Admin' || user.role === 'Manager';
    return false;
  }, [user, page]);

  useEffect(() => {
    if (session && !pageAllowed) setPage('dashboard');
  }, [session, pageAllowed]);

  const onLogin = async (u) => {
    let store = { ...data, session: { userId: u.id, username: u.username, name: u.name, role: u.role } };
    if (syncEnabled()) {
      try {
        store = await hydrateFromSupabase(store);
      } catch (err) {
        console.warn('[POS] post-login hydrate failed', err);
        store = { ...store, sales: [], purchases: [], expenses: [], syncError: String(err.message || err) };
      }
    }
    persist(store);
    setPage('dashboard');
  };

  const onLogout = async () => {
    try {
      if (syncEnabled() && Sync.staffSignOut) await Sync.staffSignOut();
    } catch (e) {}
    persist({
      ...data,
      session: null,
      sales: syncEnabled() ? [] : data.sales,
      purchases: syncEnabled() ? [] : data.purchases,
      expenses: syncEnabled() ? [] : data.expenses,
    });
  };

  const onReset = async () => {
    if (!confirm('Reset all demo data? Current sales, customers, etc. will be wiped.')) return;
    localStorage.removeItem(STORAGE_KEY);
    const store = await createInitialData();
    store.session = data.session;
    persist(store);
    setPage('dashboard');
    alert('Demo data restored');
  };

  if (!ready || !data) {
    return (
      <div className="min-h-full flex items-center justify-center bg-navy text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300">Loading GadgetBoss POS…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={onLogin} users={data.users} />;
  }

  return (
    <Shell
      user={user}
      page={page}
      setPage={setPage}
      onLogout={onLogout}
      settings={data.settings}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      {page === 'dashboard' && <Dashboard data={data} user={user} />}
      {page === 'pos' && <POSPage data={data} update={update} user={user} settings={data.settings} />}
      {page === 'products' && <ProductsPage data={data} update={update} user={user} />}
      {page === 'transactions' && <TransactionsPage data={data} user={user} settings={data.settings} />}
      {page === 'customers' && canAccess(user.role, 'customers') && <CustomersPage data={data} update={update} />}
      {page === 'suppliers' && canAccess(user.role, 'suppliers') && <SuppliersPage data={data} update={update} user={user} />}
      {page === 'expenses' && canAccess(user.role, 'expenses') && <ExpensesPage data={data} update={update} user={user} />}
      {page === 'cashup' && <CashupPage data={data} update={update} user={user} />}
      {page === 'reports' && canAccess(user.role, 'reports') && <ReportsPage data={data} />}
      {page === 'settings' && <SettingsPage data={data} update={update} user={user} onReset={onReset} />}
    </Shell>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
