// --- PRODUCT DATABASE (seed / offline fallback; replaced by Supabase when configured) ---
let PRODUCTS = [
  {
    id: "airpods-pro-3",
    title: "AirPods Pro 3rd Gen",
    category: "airpods",
    price: 340,
    oldPrice: 500,
    stock: 12,
    image: "assets/airpods-pro-3.jpg",
    rating: 5.0,
    reviewsCount: 128,
    badge: "Sealed",
    tagline: "Noise cancel. USB-C case.",
    specs: { driver: "Custom High-Excursion", battery: "6hrs (30hrs w/ Case)", chip: "H2 Apple Silicon", charging: "MagSafe / USB-C", sensors: "Skin-detect / Motion" }
  },
  {
    id: "airpods-pro-2",
    title: "AirPods Pro 2 Gen",
    category: "airpods",
    price: 190,
    oldPrice: 280,
    stock: 5,
    image: "assets/airpods-pro-2-gen.jpg",
    rating: 4.8,
    reviewsCount: 215,
    badge: "Best seller",
    tagline: "Noise cancel. MagSafe case.",
    specs: { driver: "Low-Distortion", battery: "6hrs (30hrs w/ Case)", chip: "H2 Chip", charging: "Lightning / MagSafe", transparency: "Adaptive" }
  },
  {
    id: "airpods-pro-v1",
    title: "AirPods Pro 1st Gen",
    category: "airpods",
    price: 160,
    oldPrice: 200,
    stock: 3,
    image: "assets/airpods-pro-v1.jpg",
    rating: 4.7,
    reviewsCount: 89,
    badge: "1st Gen",
    tagline: "Noise cancel. Lightning case.",
    specs: { driver: "High-Excursion", battery: "4.5hrs (24hrs w/ Case)", chip: "H1 Chip", charging: "Lightning", anc: "Active" }
  },
  {
    id: "airpods-3",
    title: "AirPods 3",
    category: "airpods",
    price: 170,
    oldPrice: 230,
    stock: 15,
    image: "assets/airpods-3-new.webp",
    rating: 4.8,
    reviewsCount: 64,
    badge: "Popular",
    tagline: "Spatial audio. Sweat resistant.",
    specs: { audio: "Spatial Audio", battery: "6hrs Total", design: "Contoured", water: "IPX4", charging: "MagSafe Inc." }
  },
  {
    id: "airpods-4",
    title: "AirPods 4",
    category: "airpods",
    price: 260,
    oldPrice: 350,
    stock: 20,
    image: "assets/airpods4.jpg",
    rating: 4.5,
    reviewsCount: 156,
    badge: "Good price",
    tagline: "New shape. Easy iPhone switch.",
    specs: { connection: "Instant Device Switch", battery: "5hrs Talk", chip: "H1", voice: "Always-on Siri", sensor: "Optical" }
  },
  {
    id: "airpods-max",
    title: "AirPods Max Over-Ear",
    category: "airpods",
    price: 1800,
    stock: 2,
    image: "assets/AirPods-Max-black.webp",
    rating: 5.0,
    reviewsCount: 42,
    badge: "In shop",
    tagline: "Over-ear. Noise cancel.",
    specs: { driver: "40mm Dynamic", battery: "20hrs ANC", chip: "Dual H2", charging: "L-Port", build: "Mesh/Alu" }
  },
  {
    id: "usb-c-charger-20w",
    title: "Original 20W USB-C Charger",
    category: "chargers",
    price: 120,
    stock: 20,
    image: "assets/usb-c-charger-20w.png",
    rating: 4.5,
    reviewsCount: 310,
    badge: "Original",
    tagline: "Original 20W USB-C brick.",
    specs: { output: "20W Max", port: "USB-C", safety: "PD 3.0", design: "Folding", weight: "55g" }
  },
  {
    id: "charging-cable-c-to-l",
    title: "MFi Charging Cable (C to L)",
    category: "chargers",
    price: 4,
    stock: 50,
    image: "assets/charging-cable-c-to-l.png",
    rating: 4.4,
    reviewsCount: 115,
    badge: "MFi",
    tagline: "MFi cable. USB-C to Lightning.",
    specs: { length: "1m", build: "Braided", certification: "MFi", speed: "480Mbps", power: "30W Max" }
  },
  {
    id: "type-c-to-type-c-cable",
    title: "Type-C to Type-C Cable",
    category: "chargers",
    price: 60,
    stock: 45,
    image: "assets/type-c-to-type-c-cable.png",
    rating: 4.3,
    reviewsCount: 310,
    badge: "Original",
    tagline: "Type-C cable. 60W.",
    specs: { length: "1m", build: "TPE", power: "60W Max", speed: "USB 2.0", sync: "Yes" }
  },
  {
    id: "macbook-charger",
    title: "MacBook Pro Charger",
    category: "chargers",
    price: 350,
    stock: 10,
    image: "assets/macbook-charger.png",
    rating: 4.7,
    reviewsCount: 22,
    badge: "In shop",
    tagline: "96W USB-C MacBook charger.",
    specs: { output: "96W PD", port: "USB-C", cables: "Not Inc.", weight: "180g", safety: "Over-Volt" }
  },
  {
    id: "magsafe-battery-pack",
    title: "MagSafe Battery Pack",
    category: "accessories",
    price: 170,
    stock: 18,
    image: "assets/battery pack.jpg",
    rating: 4.9,
    reviewsCount: 18,
    badge: "In shop",
    tagline: "MagSafe power bank. 5000mAh.",
    specs: { capacity: "5k mAh", snap: "Instant", charging: "Pass-thru", tech: "Lithium", thickness: "11mm" }
  },
  {
    id: "powerbank-high-cap",
    title: "High-Capacity Wireless Powerbank",
    category: "accessories",
    price: 300,
    stock: 25,
    image: "assets/wireless powerbank.webp",
    rating: 4.6,
    reviewsCount: 115,
    badge: "Wireless",
    tagline: "10,000mAh wireless power bank.",
    specs: { capacity: "10k mAh", wireless: "7.5W", ports: "2 Output", display: "LED Digital", weight: "220g" }
  },
  {
    id: "ps4-slim",
    title: "PlayStation 4 Slim",
    category: "playstation",
    price: 0,
    stock: 0,
    image: "assets/ps 4 slim.webp",
    rating: 4.5,
    reviewsCount: 12,
    badge: "Ask price",
    tagline: "PS4 Slim. Ask on WhatsApp.",
    specs: { storage: "500GB/1TB", resolution: "1080p", controllers: "1 Blue", power: "165W", color: "Black" }
  },
  {
    id: "ps4-pro",
    title: "PlayStation 4 Pro Console",
    category: "playstation",
    price: 0,
    stock: 0,
    image: "assets/ps4 pro.webp",
    rating: 4.6,
    reviewsCount: 8,
    badge: "Ask price",
    tagline: "PS4 Pro. Ask on WhatsApp.",
    specs: { storage: "1TB HDD", resolution: "4K native", hdr: "Supported", audio: "Optical Out", wifi: "5GHz" }
  },
  {
    id: "ps5-slim",
    title: "PlayStation 5 Slim",
    category: "playstation",
    price: 7500,
    stock: 4,
    image: "assets/ps5 slim.webp",
    rating: 5.0,
    reviewsCount: 24,
    badge: "New",
    tagline: "1TB. 4K.",
    specs: { storage: "1TB SSD", resolution: "4K 120Hz", type: "Disc/Digital", build: "Compact", tech: "Ray Tracing" }
  },
  {
    id: "ps5-standard",
    title: "PlayStation 5 Standard Edition",
    category: "playstation",
    price: 6500,
    stock: 7,
    image: "assets/standard.webp",
    rating: 4.9,
    reviewsCount: 19,
    badge: "In stock",
    tagline: "825GB disc console.",
    specs: { storage: "825GB SSD", resolution: "4K HDR", controllers: "1 Inc.", port: "HDMI 2.1", tech: "Tempest 3D" }
  },
  {
    id: "ps5-pro",
    title: "PlayStation 5 Pro Console",
    category: "playstation",
    price: 9000,
    stock: 3,
    image: "assets/ps5 pro.webp",
    rating: 5.0,
    reviewsCount: 4,
    badge: "In shop",
    tagline: "2TB PS5 Pro.",
    specs: { storage: "2TB SSD", resolution: "8K 60Hz", pssr: "AI Scaling", gpu: "Enhanced", build: "Pro Tower" }
  },
  {
    id: "ps5-dualsense",
    title: "PS5 DualSense Controller",
    category: "controllers",
    price: 1050,
    stock: 12,
    image: "assets/ps5 control.webp",
    rating: 4.8,
    reviewsCount: 56,
    badge: "Original",
    tagline: "Original PS5 pad.",
    specs: { haptics: "Adaptive Triggers", feedback: "Haptic", battery: "1560mAh", tech: "Bluetooth 5.1", weight: "280g" }
  },
  {
    id: "ps4-dualshock",
    title: "PS4 DualShock 4 Controller",
    category: "controllers",
    price: 160,
    stock: 15,
    image: "assets/ps4 controller.webp",
    rating: 4.7,
    reviewsCount: 92,
    badge: "Best seller",
    tagline: "Original PS4 pad.",
    specs: { touch: "2-Point Pad", light: "Integrated Bar", battery: "1000mAh", tech: "Bluetooth 2.1", weight: "210g" }
  },
  {
    id: "quadrapod",
    title: "AI Face Tracking Quadrapod",
    category: "videography",
    price: 280,
    stock: 20,
    image: "assets/quadrapod.webp",
    rating: 4.5,
    reviewsCount: 31,
    badge: "Promo",
    tagline: "Auto face-tracking stand.",
    specs: { rotation: "360 Loop", tracking: "AI Vision", mount: "Tripod Opt", battery: "15hrs", payload: "3kg" }
  },
  {
    id: "gaming-phone-cooler",
    title: "AeroActive Gaming Phone Cooler",
    category: "gaming",
    price: 350,
    oldPrice: 450,
    stock: 15,
    image: "assets/gaming-phone-cooler.png",
    rating: 4.8,
    reviewsCount: 42,
    badge: "In shop",
    tagline: "Phone cooler for gaming.",
    specs: { cooling: "Peltier Tech", fanSpeed: "Up to 5500 RPM", rgb: "Aura Sync", weight: "78g", ports: "Dual Type-C" }
  },
  {
    id: "video-capture-card",
    title: "4K Ultra Stream Capture Card",
    category: "videography",
    price: 650,
    oldPrice: 850,
    stock: 8,
    image: "assets/video-capture-card.png",
    rating: 4.9,
    reviewsCount: 29,
    badge: "Promo",
    tagline: "4K capture card.",
    specs: { input: "HDMI 2.0", output: "HDMI Passthrough", capture: "4K 60fps / 1080p 120fps", interface: "USB 3.0", latency: "Zero-Latency" }
  }
];

// --- APP STATE MANAGEMENT ---
let cart = [];
let activeCategory = "all";
let searchQuery = "";
let currentCheckoutType = "whatsapp"; // 'whatsapp' or 'paystack'

// Pre-configured WhatsApp Business Number (Centuryboy Shop dispatch)
const WHATSAPP_PHONE = "233540639091";
const INSTAGRAM_URL = "https://www.instagram.com/gadgetbosss_/";
const TIKTOK_URL = "https://www.tiktok.com/@gadgetbosss";

const DELIVERY_ZONES = [
  {
    id: "pickup",
    label: "Pickup at Tudu",
    fee: 0,
    door: true,
    aliases: ["pickup", "pick up", "shop", "store", "tudu", "tobinco"],
  },
  {
    id: "core",
    label: "Core Accra",
    fee: 40,
    door: true,
    aliases: [
      "east legon", "osu", "labone", "cantonments", "cantonment", "ridge",
      "dansoman", "lapaz", "la paz", "spintex", "madina", "adabraka",
      "kaneshie", "tesano", "dzorwulu", "abelemkpe", "airport residential",
      "accra central", "makola", "circle", "nima", "kanda", "labadi",
      "roman ridge", "kokomlemle", "darkuman", "odorkor", "korle bu",
    ],
  },
  {
    id: "near",
    label: "Near outskirts",
    fee: 50,
    door: true,
    aliases: ["adenta", "haatso", "ashaley botwe", "ashale botwe", "dome", "taifa", "agbogba", "frafraha"],
  },
  {
    id: "far",
    label: "Far outskirts",
    fee: 60,
    door: true,
    aliases: ["kwabenya", "pokuase", "oyibi", "amasaman", "abokobi"],
  },
  {
    id: "tier1",
    label: "Far Greater Accra",
    fee: 70,
    door: true,
    aliases: ["kasoa", "tema", "ashaiman", "ashiaman"],
  },
  {
    id: "tier2",
    label: "Far Greater Accra",
    fee: 80,
    door: true,
    aliases: ["nsawam", "dawhenya", "buduburam", "prampram", "kpone", "afienya"],
  },
  {
    id: "outside",
    label: "Outside Accra · station send",
    fee: 30,
    door: false,
    aliases: [
      "ada", "kumasi", "takoradi", "sekondi", "volta", "ho", "cape coast",
      "tamale", "sunyani", "koforidua", "wa", "techiman", "winneba",
      "hohoe", "bolgatanga", "tarkwa",
    ],
  },
];

function normalizePlace(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function quoteDelivery(location, pickup) {
  if (pickup) {
    return {
      id: "pickup",
      label: "Pickup at Tudu",
      fee: 0,
      door: true,
      matched: true,
      note: "Pickup at Tudu is free.",
    };
  }
  const text = normalizePlace(location);
  if (!text) {
    return { matched: false, fee: null, label: "", note: "Type your area. The delivery fee fills in." };
  }
  let best = null;
  let bestLen = 0;
  DELIVERY_ZONES.forEach((zone) => {
    zone.aliases.forEach((alias) => {
      if (text.includes(alias) && alias.length >= bestLen) {
        best = zone;
        bestLen = alias.length;
      }
    });
  });
  if (!best && (text === "accra" || text.endsWith(" accra"))) {
    best = DELIVERY_ZONES.find((zone) => zone.id === "core");
  }
  if (!best) {
    return {
      matched: false,
      fee: null,
      label: "",
      note: "We could not place that area. Use a name like East Legon, Kasoa or Kumasi.",
    };
  }
  return {
    ...best,
    matched: true,
    note: best.door
      ? `${best.label} · GH₵${best.fee}`
      : `${best.label} · GH₵${best.fee}. This is station send, not door-to-door.`,
  };
}

function cartItemsTotal() {
  return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
}

function checkoutDeliveryState() {
  const pickup = !!(document.getElementById("cust-pickup") && document.getElementById("cust-pickup").checked);
  const locationInput = document.getElementById("cust-location");
  const location = locationInput ? locationInput.value.trim() : "";
  return quoteDelivery(location, pickup);
}

function formatCheckoutLocation(location, quote, pickup) {
  if (pickup) return "Pickup — Tudu, beside Tobinco Pharmacy";
  if (quote.matched) {
    const kind = quote.door ? "Delivery" : "Station send";
    return `${location} · ${kind} GH₵${quote.fee} (${quote.label})`;
  }
  return location;
}

function refreshCheckoutDelivery() {
  const pickupBox = document.getElementById("cust-pickup");
  const locationGroup = document.getElementById("cust-location-group");
  const locationInput = document.getElementById("cust-location");
  const note = document.getElementById("delivery-fee-note");
  const pickup = !!(pickupBox && pickupBox.checked);
  if (locationGroup) locationGroup.hidden = pickup;
  if (locationInput) {
    locationInput.required = !pickup;
    if (pickup) locationInput.value = "Pickup at Tudu";
  }
  const itemsTotal = cartItemsTotal();
  const quote = checkoutDeliveryState();
  const deliveryEl = document.getElementById("summary-delivery-price");
  const itemsPriceEl = document.getElementById("summary-items-price");
  if (itemsPriceEl) itemsPriceEl.textContent = formatGhs(itemsTotal, 0);
  if (deliveryEl) {
    deliveryEl.textContent = quote.matched ? formatGhs(quote.fee, 0) : "—";
  }
  if (note) note.textContent = quote.note;
  if (summaryTotalPrice) {
    summaryTotalPrice.innerText = quote.matched
      ? formatGhs(itemsTotal + quote.fee, 0)
      : formatGhs(itemsTotal, 0);
  }
}


// --- WISHLIST STATE VAULT ---
let wishlist = [];

// --- DOM ELEMENT REFERENCES ---
const productsGrid = document.getElementById("products-catalog-grid");
const featuredProductSlot = document.getElementById("featured-product-slot");
const featuredDropTitle = document.getElementById("featured-drop-title");
const FEATURED_DROP_ID = "airpods-pro-3";
const categoriesContainer = document.getElementById("categories-container");
const searchBarInput = document.getElementById("search-bar-input");
const headerCategorySelect = document.getElementById("header-category-select");
const headerSearchTrigger = document.getElementById("header-search-trigger");
const wishlistTrigger = document.getElementById("wishlist-trigger");
const wishlistBadgeCount = document.getElementById("wishlist-badge-count");

const headerCartCount = document.getElementById("header-cart-count");
const cartOverlayWrapper = document.getElementById("cart-overlay-wrapper");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartSubtotalPrice = document.getElementById("cart-subtotal-price");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartDrawerTrigger = document.getElementById("cart-drawer-trigger");

const checkoutWhatsappBtn = document.getElementById("checkout-whatsapp-btn");
const checkoutPaystackBtn = document.getElementById("checkout-paystack-btn");

const checkoutModalOverlay = document.getElementById("checkout-modal-overlay");
const closeCheckoutModalBtn = document.getElementById("close-checkout-modal-btn");
const checkoutModalTitle = document.getElementById("checkout-modal-title");
const checkoutDetailsForm = document.getElementById("checkout-details-form");
const modalSubmitBtn = document.getElementById("modal-submit-btn");

const productDetailOverlay = document.getElementById("product-detail-overlay");
const closeProductDetailBtn = document.getElementById("close-product-detail-btn");
const productDetailImage = document.getElementById("product-detail-image");
const productDetailTitle = document.getElementById("product-detail-title");
const productDetailTagline = document.getElementById("product-detail-tagline");
const productDetailPrice = document.getElementById("product-detail-price");
const productDetailEstimate = document.getElementById("product-detail-estimate");
const productDetailSpecs = document.getElementById("product-detail-specs");
const productDetailAddToCart = document.getElementById("product-detail-add-to-cart");

const summaryItemsCount = document.getElementById("summary-items-count");
const summaryTotalPrice = document.getElementById("summary-total-price");

const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeIconSun = document.getElementById("theme-icon-sun");
const themeIconMoon = document.getElementById("theme-icon-moon");

const stickyBottomBar = document.getElementById("sticky-bottom-bar");
const stickyCartItemsText = document.getElementById("sticky-cart-items-text");
const stickyCartTotalPrice = document.getElementById("sticky-cart-total-price");
const stickyCheckoutTrigger = document.getElementById("sticky-checkout-trigger");

const newsletterForm = document.getElementById("newsletter-subscription-form");
let activeProductDetail = null;

// --- VERIFICATION MODAL + ACCOUNT DRAWER REFERENCES ---
const myPurchasesTrigger = document.getElementById("my-purchases-trigger");
const trackOrderTrigger = document.getElementById("track-order-trigger");
const accountTrigger = document.getElementById("account-trigger");

const verifyModalOverlay = document.getElementById("verify-modal-overlay");
const verifyModalPanel = document.getElementById("verify-modal-panel");
const closeVerifyModalBtn = document.getElementById("close-verify-modal-btn");
const verifyIntro = document.getElementById("verify-intro");
const verifyPhoneForm = document.getElementById("verify-phone-form");
const verifyPhoneInput = document.getElementById("verify-phone-input");
const verifySendBtn = document.getElementById("verify-send-btn");
const verifyCodeForm = document.getElementById("verify-code-form");
const verifyMaskedPhone = document.getElementById("verify-masked-phone");
const verifyEditPhoneBtn = document.getElementById("verify-edit-phone-btn");
const verifyOtpGroup = document.getElementById("verify-otp-group");
const verifyOtpBoxes = Array.prototype.slice.call(document.querySelectorAll(".verify-otp-box"));
const verifyCountdown = document.getElementById("verify-countdown");
const verifyResendBtn = document.getElementById("verify-resend-btn");
const verifyCodeBtn = document.getElementById("verify-code-btn");
const verifySuccess = document.getElementById("verify-success");
const verifySuccessText = document.getElementById("verify-success-text");
const verifyStatus = document.getElementById("verify-status");

const accountOverlayWrapper = document.getElementById("account-overlay-wrapper");
const accountDrawerPanel = document.getElementById("account-drawer-panel");
const accountDrawerTitle = document.getElementById("account-drawer-title");
const accountDrawerSub = document.getElementById("account-drawer-sub");
const accountDrawerBody = document.getElementById("account-drawer-body");
const accountDrawerFooter = document.getElementById("account-drawer-footer");
const accountBackBtn = document.getElementById("account-back-btn");
const closeAccountBtn = document.getElementById("close-account-btn");
const accountSignoutBtn = document.getElementById("account-signout-btn");
const custPhoneVerifiedBadge = document.getElementById("cust-phone-verified-badge");
const checkoutReceiptOverlay = document.getElementById("checkout-receipt-overlay");
const checkoutReceiptTitle = document.getElementById("checkout-receipt-title");
const checkoutReceiptKicker = document.getElementById("checkout-receipt-kicker");
const checkoutReceiptNumber = document.getElementById("checkout-receipt-number");
const checkoutReceiptDate = document.getElementById("checkout-receipt-date");
const checkoutReceiptCustomer = document.getElementById("checkout-receipt-customer");
const checkoutReceiptRef = document.getElementById("checkout-receipt-ref");
const checkoutReceiptItems = document.getElementById("checkout-receipt-items");
const checkoutReceiptSubtotal = document.getElementById("checkout-receipt-subtotal");
const checkoutReceiptDeliveryRow = document.getElementById("checkout-receipt-delivery-row");
const checkoutReceiptDelivery = document.getElementById("checkout-receipt-delivery");
const checkoutReceiptTotal = document.getElementById("checkout-receipt-total");
const checkoutReceiptPaid = document.getElementById("checkout-receipt-paid");
const checkoutReceiptPrintBtn = document.getElementById("checkout-receipt-print");
const checkoutReceiptTrackBtn = document.getElementById("checkout-receipt-track");
const checkoutReceiptWhatsappBtn = document.getElementById("checkout-receipt-whatsapp");
const checkoutReceiptCloseBtn = document.getElementById("checkout-receipt-close");

// --- APP INITIALIZATION ---
async function hydratePublicConfig() {
  const env = window.__GADGETBOSS_ENV__ || {};
  const needsPaystack = !env.PAYSTACK_PUBLIC_KEY;
  const needsSupabase = !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY;
  if (!needsPaystack && !needsSupabase) return;

  for (const url of ["/api/public-config"]) {
    try {
      const res = await fetch(url);
      if (res.status === 404) continue;
      const data = await res.json().catch(() => ({}));
      window.__GADGETBOSS_ENV__ = window.__GADGETBOSS_ENV__ || {};
      if (needsPaystack && data.PAYSTACK_PUBLIC_KEY) {
        window.__GADGETBOSS_ENV__.PAYSTACK_PUBLIC_KEY = data.PAYSTACK_PUBLIC_KEY;
      }
      if (needsSupabase && data.SUPABASE_URL) {
        window.__GADGETBOSS_ENV__.SUPABASE_URL = data.SUPABASE_URL;
      }
      if (needsSupabase && data.SUPABASE_ANON_KEY) {
        window.__GADGETBOSS_ENV__.SUPABASE_ANON_KEY = data.SUPABASE_ANON_KEY;
      }
      return;
    } catch {
      continue;
    }
  }
}

async function init() {
  await hydratePublicConfig();

  // Load Theme
  const savedTheme = localStorage.getItem("gadgetboss-theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    themeIconSun.style.display = "block";
    themeIconMoon.style.display = "none";
  }

  // Load Cart
  const savedCart = localStorage.getItem("gadgetboss-cart");
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }

  // Load Wishlist
  const savedWishlist = localStorage.getItem("gadgetboss-wishlist");
  if (savedWishlist) {
    try {
      wishlist = JSON.parse(savedWishlist);
    } catch (e) {
      wishlist = [];
    }
  }
  wishlistBadgeCount.textContent = wishlist.length;

  await hydrateCatalogueFromSupabase();
  renderCategories();
  renderProducts();
  renderCart();
  setupEventListeners();
  setupAuthEventListeners();
  subscribeLiveInventory();
  
  // Initialize Lucide Icons
  lucide.createIcons();
}

async function hydrateCatalogueFromSupabase() {
  const Sync = window.GadgetBossSync;
  if (!window.__GB_CATALOGUE_SEED__) {
    window.__GB_CATALOGUE_SEED__ = PRODUCTS.map((p) => ({ ...p, specs: { ...(p.specs || {}) } }));
  }
  const localById = Object.fromEntries(window.__GB_CATALOGUE_SEED__.map((p) => [p.id, p]));

  // 1) Supabase shared DB (when configured)
  if (Sync && Sync.isSyncConfigured()) {
    try {
      const remote = await Sync.fetchWebsiteProducts();
      if (remote.length) {
        PRODUCTS = remote.map((r) => {
          const local = localById[r.id] || {};
          return {
            ...local,
            ...r,
            badge: local.badge || r.badge,
            tagline: local.tagline || r.tagline,
            rating: local.rating || r.rating || 4.8,
            reviewsCount: local.reviewsCount || r.reviewsCount || 0,
            specs: Object.keys(r.specs || {}).length ? r.specs : (local.specs || {}),
          };
        });
        return;
      }
    } catch (err) {
      console.warn('[storefront] Supabase catalogue hydrate failed', err);
    }
  }

  // 2) POS-published catalogue (same browser / origin) — works without Supabase
  if (Sync && Sync.loadPublishedCatalogue) {
    const published = Sync.loadPublishedCatalogue();
    if (published.length) {
      published.forEach((r) => {
        if (r.websiteVisible === false) {
          delete localById[r.id];
          return;
        }
        const local = localById[r.id] || {};
        localById[r.id] = {
          ...local,
          ...r,
          title: r.title || local.title,
          price: Number(r.price),
          stock: Number(r.stock),
          image: r.image || local.image,
          badge: local.badge || r.badge,
          tagline: local.tagline || r.tagline,
          category: r.category || local.category,
          rating: local.rating || r.rating || 4.8,
          reviewsCount: local.reviewsCount || 0,
          specs: Object.keys(r.specs || {}).length ? r.specs : (local.specs || {}),
        };
      });
      PRODUCTS = Object.values(localById);
    }
  }
}

function subscribeLiveInventory() {
  const Sync = window.GadgetBossSync;
  if (!Sync) return;

  const refresh = async () => {
    await hydrateCatalogueFromSupabase();
    cart = cart.map((item) => {
      const live = PRODUCTS.find((p) => p.id === item.product.id);
      return live ? { ...item, product: live } : item;
    }).filter((item) => item.product && !(item.product.outOfStock && item.product.price > 0));
    saveCart();
    renderProducts();
    renderCart();
    lucide.createIcons();
  };

  if (Sync.isSyncConfigured()) {
    Sync.subscribeProducts(refresh);
    Sync.subscribeInventoryMovements(refresh);
  }
  if (Sync.subscribeCatalogue) {
    Sync.subscribeCatalogue(refresh);
  }
}

function setActiveCategory(category) {
  activeCategory = category;
  headerCategorySelect.value = category;

  document.querySelectorAll(".nav-cat-item").forEach(item => {
    item.classList.toggle("active", item.getAttribute("data-category") === category);
  });

  renderCategories();
  renderProducts();
}

function openCatalogCategory(category) {
  searchQuery = "";
  if (searchBarInput) searchBarInput.value = "";
  setActiveCategory(category);
  const targetSec = document.getElementById("catalog");
  if (targetSec) {
    targetSec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// CRM writes are deliberately disabled until a verified checkout backend exists.
// Search and wishlist interactions stay on-device rather than posting anonymous data.
function logLeadToCRM() {
  return;
}

// --- SETUP EVENT LISTENERS ---
function setupEventListeners() {
  // Futuristic Audio Synthesis for Premium Welcome Button
  function playFuturisticWelcomeChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Synthesize high-fidelity layered frequencies
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.18);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(554.37, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1108.73, audioCtx.currentTime + 0.18);
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.6);
      osc2.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn("AudioContext block:", e);
    }
  }

  // Wide Search & Filter Event Listeners
  headerSearchTrigger.addEventListener("click", () => {
    searchQuery = searchBarInput.value.trim().toLowerCase();
    renderProducts();
    if (searchQuery) logLeadToCRM(searchQuery, null);
  });

  searchBarInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      searchQuery = searchBarInput.value.trim().toLowerCase();
      renderProducts();
      if (searchQuery) logLeadToCRM(searchQuery, null);
    }
  });

  searchBarInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderProducts();
  });

  headerCategorySelect.addEventListener("change", (e) => {
    setActiveCategory(e.target.value);
  });

  // Secondary Horizontal Category Navigation clicks
  const navCatItems = document.querySelectorAll(".nav-cat-item");
  navCatItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      openCatalogCategory(item.getAttribute("data-category"));
    });
  });

  // Collection Banner clicks → matching catalog category
  const bannerCards = document.querySelectorAll(".banner-card");
  bannerCards.forEach(card => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const category = card.getAttribute("data-category");
      if (category) openCatalogCategory(category);
    });
  });

  // Wishlist Action Modal Trigger
  wishlistTrigger.addEventListener("click", () => {
    if (wishlist.length === 0) {
      alert("Wishlist is empty. Tap the heart on a product to save it.");
    } else {
      const itemsList = wishlist.map(id => {
        const p = PRODUCTS.find(prod => prod.id === id);
        if (!p) return "";
        return `- ${p.title} (${p.price > 0 ? 'GHS ' + p.price.toLocaleString() : 'Ask price'})`;
      }).filter(Boolean).join("\n");
      alert(`Wishlist\n\n${itemsList}\n\nAdd them to your cart when you are ready.`);
    }
  });

  // Theme Toggler
  themeToggleBtn.addEventListener("click", toggleTheme);

  // Cart Drawer open/close
  cartDrawerTrigger.addEventListener("click", () => toggleCartDrawer(true));
  closeCartBtn.addEventListener("click", () => toggleCartDrawer(false));
  cartOverlayWrapper.addEventListener("click", (e) => {
    if (e.target === cartOverlayWrapper) toggleCartDrawer(false);
  });

  // Sticky Bar Trigger
  stickyCheckoutTrigger.addEventListener("click", () => {
    if (!cart.length) return;
    startGatedCheckout("paystack");
  });

  // checkout actions — startGatedCheckout confirms the phone number first when
  // OTP login is live, then opens the same checkout modal as before.
  checkoutPaystackBtn.addEventListener("click", () => startGatedCheckout("paystack"));
  checkoutWhatsappBtn.addEventListener("click", () => startGatedCheckout("whatsapp"));

  closeCheckoutModalBtn.addEventListener("click", closeCheckoutModal);
  checkoutModalOverlay.addEventListener("click", (e) => {
    if (e.target === checkoutModalOverlay) closeCheckoutModal();
  });

  checkoutDetailsForm.addEventListener("submit", handleCheckoutSubmit);
  const pickupBox = document.getElementById("cust-pickup");
  const locationInput = document.getElementById("cust-location");
  if (pickupBox) pickupBox.addEventListener("change", refreshCheckoutDelivery);
  if (locationInput) {
    locationInput.addEventListener("input", refreshCheckoutDelivery);
    locationInput.addEventListener("change", refreshCheckoutDelivery);
  }

  closeProductDetailBtn.addEventListener("click", closeProductDetail);
  productDetailOverlay.addEventListener("click", (e) => {
    if (e.target === productDetailOverlay) closeProductDetail();
  });
  productDetailAddToCart.addEventListener("click", () => {
    if (activeProductDetail) {
      addToCart(activeProductDetail.id);
      closeProductDetail();
    }
  });

  // Newsletter Form
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("newsletter-email").value;
    alert(`Got it. We will write to ${email} when new stock comes in.`);
    newsletterForm.reset();
  });

  // Handle sticky bar scroll revealing
  window.addEventListener("scroll", handleScroll);
}

// --- VISUAL THEME CONTROLLER ---
function toggleTheme() {
  const isLight = document.body.classList.toggle("light-mode");
  if (isLight) {
    themeIconSun.style.display = "block";
    themeIconMoon.style.display = "none";
    localStorage.setItem("gadgetboss-theme", "light");
  } else {
    themeIconSun.style.display = "none";
    themeIconMoon.style.display = "block";
    localStorage.setItem("gadgetboss-theme", "dark");
  }
}

// --- RENDER CATEGORY BAR TABS ---
const POPULAR_CATEGORY_ORDER = ["airpods", "chargers"];

function categoryRank(category) {
  const i = POPULAR_CATEGORY_ORDER.indexOf(String(category || "").toLowerCase());
  return i === -1 ? POPULAR_CATEGORY_ORDER.length : i;
}

function sortPopularProducts(products) {
  return products.slice().sort((a, b) => {
    const diff = categoryRank(a.category) - categoryRank(b.category);
    if (diff !== 0) return diff;
    return String(a.title || "").localeCompare(String(b.title || ""), undefined, { sensitivity: "base" });
  });
}

function orderedCatalogCategories() {
  const found = ["all", ...new Set(PRODUCTS.map((p) => p.category))];
  const preferred = ["all", ...POPULAR_CATEGORY_ORDER];
  return [
    ...preferred.filter((cat) => found.includes(cat)),
    ...found.filter((cat) => !preferred.includes(cat)),
  ];
}

function renderCategories() {
  const categories = orderedCatalogCategories();
  const categoryMeta = {
    all: { icon: "layout-grid", label: "All" },
    airpods: { icon: "headphones", label: "Airpods" },
    chargers: { icon: "bolt", label: "Chargers" },
    accessories: { icon: "sparkles", label: "Accessories" },
    playstation: { icon: "gamepad-2", label: "Playstation" },
    gaming: { icon: "joystick", label: "Gaming" },
    controllers: { icon: "mouse-pointer-2", label: "Controllers" },
    videography: { icon: "camera", label: "Videography" }
  };
  
  categoriesContainer.innerHTML = categories.map(cat => {
    const isActive = cat === activeCategory;
    const meta = categoryMeta[cat] || {
      icon: "tag",
      label: cat.charAt(0).toUpperCase() + cat.slice(1)
    };
    return `
      <button class="tab-btn ${isActive ? 'active' : ''}" data-category="${cat}">
        ${meta.label}
      </button>
    `;
  }).join("");

  // Add click events to category buttons
  const tabButtons = categoriesContainer.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      setActiveCategory(btn.getAttribute("data-category"));
    });
  });
}

// --- RENDER PRODUCTS GRID ---
function renderProducts() {
  const filtered = PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery) || 
                          p.tagline.toLowerCase().includes(searchQuery) ||
                          p.category.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    if (featuredProductSlot) {
      featuredProductSlot.innerHTML = `
        <div class="featured-empty">
          <p>Nothing in this category right now.</p>
        </div>
      `;
    }
    productsGrid.innerHTML = `
      <div class="no-results">
        <p>Nothing matches that search.</p>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px;">Try another name, or tap All.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const heroProduct = activeCategory === "all"
    ? (PRODUCTS.find((p) => p.id === FEATURED_DROP_ID) || filtered[0])
    : (filtered.find((p) => p.id === FEATURED_DROP_ID) || filtered[0]);
  const browseProducts = activeCategory === "all" ? sortPopularProducts(filtered) : filtered;

  if (featuredProductSlot && heroProduct) {
    if (featuredDropTitle) {
      featuredDropTitle.textContent = heroProduct.title || "AirPods Pro 3";
    }
    const heroPrice = heroProduct.price === 0
      ? "Price on Request"
      : new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(heroProduct.price);
    featuredProductSlot.innerHTML = `
      <article class="featured-product-card product-card" data-id="${heroProduct.id}" role="button" tabindex="0" aria-label="Open details for ${heroProduct.title}">
        <div class="featured-product-media">
          <img src="${heroProduct.image}" alt="${heroProduct.title}" class="featured-product-image">
          <span class="featured-availability">${heroProduct.price > 0 ? "In stock in Accra" : "Ask on WhatsApp"}</span>
          <button class="featured-quick-add" data-id="${heroProduct.id}" aria-label="Add ${heroProduct.title}">Add</button>
        </div>
        <div class="featured-product-body">
          <div class="featured-badges">
            <span class="featured-badge">${heroProduct.badge}</span>
            <span class="featured-badge outline">${heroProduct.category}</span>
          </div>
          <h3 class="featured-title">${heroProduct.title}</h3>
          <p class="featured-tagline">${heroProduct.tagline}</p>
          <div class="featured-meta">
            <span class="featured-price">${heroPrice}</span>
          </div>
          <button class="featured-buy-btn" data-id="${heroProduct.id}">Buy</button>
        </div>
      </article>
    `;
  }

  productsGrid.innerHTML = browseProducts.map(prod => {
    // Badge styling
    let badgeClass = "prod-badge";
    const badgeUpper = String(prod.badge || "").toUpperCase();
    if (badgeUpper.includes("LIMIT") || badgeUpper.includes("1ST")) {
      badgeClass += " limited";
    } else if (badgeUpper.includes("BEST") || badgeUpper.includes("NEW")) {
      badgeClass += " best";
    } else if (badgeUpper.includes("ORIGINAL") || badgeUpper.includes("PROMO") || badgeUpper.includes("SEALED")) {
      badgeClass += " new";
    }
    const badgeLabel = prod.badge || "";

    // Localized formatting (Ghana GHS)
    let priceFormatted = "";
    const isOutOfStock = !!(prod.outOfStock || (typeof prod.stock === 'number' && prod.stock <= 0 && prod.price > 0));
    let isContactOnly = prod.price === 0;

    if (isContactOnly) {
      priceFormatted = "Price on Request";
    } else if (isOutOfStock) {
      priceFormatted = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(prod.price);
    } else {
      priceFormatted = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(prod.price);
    }

    return `
      <div class="product-card vault-thumb-card" data-id="${prod.id}" role="button" tabindex="0" aria-label="Open details for ${prod.title}">
        <div class="prod-img-container vault-thumb-image">
          <span class="${badgeClass}">${isOutOfStock ? 'OUT OF STOCK' : badgeLabel}</span>
          <button class="card-wishlist-pin ${wishlist.includes(prod.id) ? 'pinned' : ''}" data-id="${prod.id}" aria-label="Pin to Wishlist">${wishlist.includes(prod.id) ? "♥" : "♡"}</button>
          <img src="${prod.image}" alt="${prod.title}" class="prod-img">
        </div>
        
        <span class="prod-category">${prod.category}</span>
        <h3 class="prod-title">${prod.title}</h3>
        <p class="prod-tagline">${prod.tagline}</p>
        
        <div class="prod-footer">
          <div class="prod-price-area">
            <span class="price-ghs">${priceFormatted}</span>
          </div>
          
          ${isContactOnly ? `
            <a href="https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(`Hi GADGETBO$$, I'm interested in the ${prod.title}. Is it available, and what is the price?`)}" target="_blank" class="btn-add-cart inquire-whatsapp-btn" style="color: var(--accent-blue); border-color: rgba(var(--accent-blue-rgb), 0.3); text-decoration: none; display: flex; align-items: center; gap: 8px;">
              <span>Ask on WhatsApp</span>
            </a>
          ` : isOutOfStock ? `
            <button class="btn-add-cart" disabled aria-disabled="true" style="opacity: 0.55; cursor: not-allowed;">
              <span>OUT OF STOCK</span>
            </button>
          ` : `
            <button class="btn-add-cart add-to-cart-btn" data-id="${prod.id}">
              <span>Add to cart</span>
            </button>
          `}
        </div>
      </div>
    `;
  }).join("");

  lucide.createIcons();

  // Add click handlers for Add to Cart
  const addButtons = productsGrid.querySelectorAll(".add-to-cart-btn");
  addButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.getAttribute("data-id");
      addToCart(prodId);
    });
  });

  // Add click handlers for Wishlist Pins
  const wishlistPins = productsGrid.querySelectorAll(".card-wishlist-pin");
  wishlistPins.forEach(pin => {
    pin.addEventListener("click", (e) => {
      e.stopPropagation();
      const prodId = pin.getAttribute("data-id");
      toggleWishlist(prodId, pin);
    });
  });

  const productCards = productsGrid.querySelectorAll(".product-card");
  productCards.forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".btn-add-cart") || e.target.closest(".card-wishlist-pin") || e.target.closest("a")) {
        return;
      }
      const prodId = card.getAttribute("data-id");
      openProductDetail(prodId);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProductDetail(card.getAttribute("data-id"));
      }
    });
  });

  const featuredQuickAdds = featuredProductSlot ? featuredProductSlot.querySelectorAll("[data-id]") : [];
  featuredQuickAdds.forEach(btn => {
    const productId = btn.getAttribute("data-id");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(productId);
    });
  });

  if (featuredProductSlot) {
    const featuredCard = featuredProductSlot.querySelector(".featured-product-card");
    if (featuredCard) {
      featuredCard.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        openProductDetail(featuredCard.getAttribute("data-id"));
      });
      featuredCard.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProductDetail(featuredCard.getAttribute("data-id"));
        }
      });
    }
  }
}

// --- CART LOGIC CONTROLLERS ---
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  if (product.price <= 0) return;
  if (product.outOfStock || (typeof product.stock === 'number' && product.stock <= 0)) {
    alert('This item is currently out of stock.');
    return;
  }

  const existing = cart.find(item => item.product.id === productId);
  const nextQty = (existing ? existing.quantity : 0) + 1;
  if (typeof product.stock === 'number' && nextQty > product.stock) {
    alert(`Only ${product.stock} left in stock.`);
    return;
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ product, quantity: 1 });
  }

  saveCart();
  renderCart();
  
  // Automatically slide open the drawer
  toggleCartDrawer(true);
}

// --- WISHLIST LOGIC CONTROLLERS ---
function toggleWishlist(productId, pinElement) {
  const index = wishlist.indexOf(productId);
  if (index > -1) {
    wishlist.splice(index, 1);
    pinElement.classList.remove("pinned");
    const icon = pinElement.querySelector("i");
    if (icon) icon.setAttribute("style", "width: 16px; height: 16px; fill: none;");
  } else {
    wishlist.push(productId);
    pinElement.classList.add("pinned");
    const icon = pinElement.querySelector("i");
    if (icon) icon.setAttribute("style", "width: 16px; height: 16px; fill: currentColor;");
    
    // Log to CRM SQLite DB
    const prod = PRODUCTS.find(p => p.id === productId);
    if (prod) {
      logLeadToCRM(null, `Wishlist Pin: ${prod.title}`);
    }
  }

  // Save to local storage
  localStorage.setItem("gadgetboss-wishlist", JSON.stringify(wishlist));

  // Update wishlist badge count
  wishlistBadgeCount.textContent = wishlist.length;
}

function updateCartQuantity(productId, amount) {
  const item = cart.find(i => i.product.id === productId);
  if (!item) return;

  const newQty = item.quantity + amount;
  if (newQty <= 0) {
    cart = cart.filter(i => i.product.id !== productId);
  } else {
    item.quantity = newQty;
  }

  saveCart();
  renderCart();
}

function removeCartItem(productId) {
  cart = cart.filter(item => item.product.id !== productId);
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem("gadgetboss-cart", JSON.stringify(cart));
}

function renderCart() {
  // Compute totals
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Update navbar badge count
  headerCartCount.innerText = totalCount;
  headerCartCount.style.display = totalCount > 0 ? "flex" : "none";

  // Update sticky bottom bar values
  stickyCartItemsText.innerText = `${totalCount} ${totalCount === 1 ? 'Item' : 'Items'} selected`;
  stickyCartTotalPrice.innerText = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(totalPrice);

  // Update cart drawer body
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-message">
        <div>
          <h4 style="font-weight: 700; margin-bottom: 6px;">Your cart is empty</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Add something from the shop.</p>
        </div>
      </div>
    `;
    cartSubtotalPrice.innerText = "GHS 0.00";
    
    // Hide sticky bottom bar if empty
    stickyBottomBar.classList.remove("active");
  } else {
    cartItemsContainer.innerHTML = cart.map(item => {
      const ghsFormatted = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(item.product.price * item.quantity);
      return `
        <div class="cart-item">
          <img src="${item.product.image}" alt="${item.product.title}" class="cart-item-img">
          <div class="cart-item-details">
            <div>
              <h4 class="cart-item-title">${item.product.title}</h4>
              <span class="cart-item-price">${ghsFormatted}</span>
            </div>
            
            <div class="cart-item-controls">
              <div class="quantity-selector">
                <button class="btn-qty btn-minus" data-id="${item.product.id}">-</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="btn-qty btn-plus" data-id="${item.product.id}">+</button>
              </div>
              
              <button class="btn-remove-item" data-id="${item.product.id}">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    cartSubtotalPrice.innerText = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(totalPrice);
    
    // Handle sticky bottom bar display based on scroll
    handleScroll();
  }

  lucide.createIcons();

  // Attach control events in cart list
  const minusButtons = cartItemsContainer.querySelectorAll(".btn-minus");
  const plusButtons = cartItemsContainer.querySelectorAll(".btn-plus");
  const removeButtons = cartItemsContainer.querySelectorAll(".btn-remove-item");

  minusButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      updateCartQuantity(id, -1);
    });
  });

  plusButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      updateCartQuantity(id, 1);
    });
  });

  removeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      removeCartItem(id);
    });
  });
}

// --- CART SLIDEOUT DRAWER TRANSITION ---
function toggleCartDrawer(open) {
  if (open) {
    cartOverlayWrapper.classList.add("active");
  } else {
    cartOverlayWrapper.classList.remove("active");
  }
}

function formatGhs(amount, minimumFractionDigits) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: typeof minimumFractionDigits === 'number' ? minimumFractionDigits : 0
  }).format(Number(amount) || 0);
}

function formatProductPrice(product) {
  if (product.price === 0) return "Price on Request";
  return formatGhs(product.price);
}

function formatSpecLabel(key) {
  return String(key || "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function openProductDetail(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  activeProductDetail = product;

  const price = formatProductPrice(product);
  const estimate = product.price === 0
    ? "Contact us on WhatsApp for live pricing and availability."
    : "";

  productDetailImage.src = product.image;
  productDetailImage.alt = product.title;
  productDetailTitle.textContent = product.title;
  productDetailTagline.textContent = product.tagline;
  productDetailPrice.textContent = price;
  productDetailEstimate.textContent = estimate;

  const specEntries = Object.entries(product.specs || {});
  productDetailSpecs.innerHTML = specEntries.map(([label, value]) => `
    <div class="product-detail-spec">
      <div>
        <span class="product-detail-spec-label">${escapeHtml(formatSpecLabel(label))}</span>
        <span class="product-detail-spec-value">${escapeHtml(String(value))}</span>
      </div>
    </div>
  `).join("");

  productDetailAddToCart.style.display = product.price === 0 ? "none" : "inline-flex";

  productDetailOverlay.classList.add("active");
  lucide.createIcons();
}

function closeProductDetail() {
  productDetailOverlay.classList.remove("active");
  activeProductDetail = null;
}

// --- STICKY BOTTOM BAR POSITIONING ON SCROLL ---
function handleScroll() {
  if (cart.length === 0) {
    stickyBottomBar.classList.remove("active");
    return;
  }

  const revealAfter = window.matchMedia("(max-width: 768px)").matches ? 80 : 500;
  if (window.scrollY > revealAfter) {
    stickyBottomBar.classList.add("active");
  } else {
    stickyBottomBar.classList.remove("active");
  }
}

// --- CHECKOUT DETAILED MODAL CONTROLLERS ---
function getPaystackPublicKey() {
  return (window.__GADGETBOSS_ENV__ && window.__GADGETBOSS_ENV__.PAYSTACK_PUBLIC_KEY) || "";
}

function paystackChannelsForProvider(provider) {
  if (provider === "card") return ["card"];
  if (provider === "mtn" || provider === "telecel" || provider === "airteltigo") return ["mobile_money"];
  return ["card", "mobile_money"];
}

function paymentMethodForProvider(provider) {
  return provider === "card" ? "Card" : "MoMo";
}

async function recordOnlineOrder({ name, email, phone, location, paymentMethod, status, idempotencyKey, paymentReference, notes }) {
  const Sync = window.GadgetBossSync;
  const customerPhone = normalizeGhanaPhone(phone) || String(phone || "").trim();
  if (!(Sync && Sync.isSyncConfigured())) {
    return { ok: true, receiptNo: "", orderId: "" };
  }
  const result = await Sync.completeOrder({
    idempotencyKey,
    source: "ONLINE",
    status,
    paymentMethod,
    customerName: name,
    customerPhone,
    customerEmail: email,
    customerLocation: location,
    notes: notes || "",
    paymentReference: paymentReference || "",
    items: cart.map((item) => ({
      productId: item.product.id,
      qty: item.quantity,
      unitPrice: item.product.price,
      costPrice: item.product.costPrice || 0,
    })),
  });
  if (!result.ok) {
    const detail = (result.products || []).map((p) => `${p.name || p.product_id}: need ${p.requested}, have ${p.available}`).join("\n");
    return {
      ok: false,
      error: result.error === "INSUFFICIENT_STOCK"
        ? `Some items are no longer available:\n${detail}`
        : (result.error || "Could not place order"),
    };
  }
  return { ok: true, receiptNo: result.receipt_no || "", orderId: result.order_id || "" };
}

async function verifyPaystackPayment(reference, amountPesewas) {
  const endpoints = ["/api/paystack/verify", "/api/paystack-verify"];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, amount: amountPesewas, currency: "GHS" }),
      });
      if (res.status === 404) continue;
      const data = await res.json().catch(() => ({}));
      if (data.configured === false) return { configured: false, verified: false };
      if (data.verified) return { configured: true, verified: true, data };
      if (res.ok === false || data.verified === false) {
        return { configured: true, verified: false, error: data.error || "Payment could not be verified." };
      }
    } catch (err) {
      continue;
    }
  }
  return { configured: false, verified: false };
}

function startPaystackCheckout({ name, email, phone, location, provider, totalPrice, deliveryFee, deliveryLabel }) {
  const publicKey = getPaystackPublicKey();
  if (!publicKey) {
    alert("Paystack is not configured yet. Add your Paystack public key to window.__GADGETBOSS_ENV__.PAYSTACK_PUBLIC_KEY in index.html (Dashboard → Settings → API Keys).");
    return;
  }
  if (typeof PaystackPop === "undefined") {
    alert("Paystack failed to load. Check your connection and try again.");
    return;
  }

  const amountPesewas = Math.round(Number(totalPrice) * 100);
  if (!(amountPesewas > 0)) {
    alert("This cart total cannot be charged. Please order via WhatsApp for price-on-request items.");
    return;
  }

  const reference = `GB-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const handler = PaystackPop.setup({
    key: publicKey,
    email,
    amount: amountPesewas,
    currency: "GHS",
    ref: reference,
    label: name,
    channels: paystackChannelsForProvider(provider),
    metadata: {
      custom_fields: [
        { display_name: "Customer", variable_name: "customer_name", value: name },
        { display_name: "Phone", variable_name: "phone", value: phone },
        { display_name: "Delivery", variable_name: "location", value: location },
        { display_name: "Delivery fee", variable_name: "delivery_fee", value: String(deliveryFee || 0) },
      ],
    },
    callback: function (response) {
      finalizePaystackOrder({
        name,
        email,
        phone,
        location,
        provider,
        totalPrice,
        amountPesewas,
        deliveryFee,
        deliveryLabel,
        reference: (response && response.reference) || reference,
      });
    },
    onClose: function () {},
  });
  handler.openIframe();
}

async function finalizePaystackOrder({ name, email, phone, location, provider, totalPrice, amountPesewas, reference, deliveryFee, deliveryLabel }) {
  const verification = await verifyPaystackPayment(reference, amountPesewas);
  const publicKey = getPaystackPublicKey();
  if (publicKey) {
    if (!verification.configured) {
      alert(
        `Paystack is not fully configured on the server yet.\n\nYour payment reference: ${reference}\nPlease send this to GADGETBO$$ on WhatsApp so we can confirm your order manually.`
      );
      return;
    }
    if (!verification.verified) {
      alert(verification.error || "Paystack payment was not verified. Your card/MoMo was not captured for this order.");
      return;
    }
  }

  const cartSnapshot = cart.map((item) => ({
    product: { id: item.product.id, title: item.product.title, price: item.product.price },
    quantity: item.quantity,
  }));
  localStorage.setItem("gadgetboss-last-checkout", JSON.stringify(cartSnapshot));
  const totalPriceFormatted = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 0 }).format(totalPrice);

  let receiptNo = "";
  try {
    const recorded = await recordOnlineOrder({
      name,
      email,
      phone,
      location,
      paymentMethod: paymentMethodForProvider(provider),
      status: "CONFIRMED",
      notes: `Delivery GH₵${deliveryFee || 0} · ${deliveryLabel || ""}`,
      idempotencyKey: `paystack-${reference}`,
      paymentReference: reference,
    });
    if (!recorded.ok) {
      alert(`${recorded.error}\n\nPayment reference: ${reference}\nPlease send this reference to GADGETBO$$ on WhatsApp so we can confirm your order.`);
      return;
    }
    receiptNo = recorded.receiptNo;
    await claimCheckoutSession({ phone, reference, receiptNo });
    cart = [];
    saveCart();
    renderCart();
    await hydrateCatalogueFromSupabase();
    renderProducts();
    showCheckoutReceipt({
      paid: true,
      name,
      email,
      phone,
      location,
      receiptNo,
      orderId: recorded.orderId,
      paymentReference: reference,
      paymentMethod: paymentMethodForProvider(provider),
      totalFormatted: totalPriceFormatted,
      total: totalPrice,
      items: cartSnapshot,
      deliveryFee,
      deliveryLabel,
      createdAt: new Date().toISOString(),
    });
    return;
  } catch (err) {
    console.error(err);
    alert(`Payment succeeded, but the order could not be saved automatically.\nPaystack ref: ${reference}\n${err.message || err}`);
    return;
  }
}

// --- CHECKOUT DETAILED MODAL CONTROLLERS ---
function openCheckoutModal(type) {
  if (cart.length === 0) return;

  currentCheckoutType = type;
  toggleCartDrawer(false);
  
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItemsTotal();
  summaryItemsCount.innerText = `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;
  applyVerifiedCustomerToCheckoutForm();
  refreshCheckoutDelivery();

  const momoFields = document.getElementById("momo-fields-container");
  
  if (type === "whatsapp") {
    checkoutModalTitle.innerText = "WhatsApp Order Details";
    modalSubmitBtn.className = "btn-modal-action whatsapp";
    modalSubmitBtn.innerHTML = `Send WhatsApp order`;
    momoFields.style.display = "none";
  } else {
    checkoutModalTitle.innerText = "Pay with Paystack";
    modalSubmitBtn.className = "btn-modal-action paystack";
    modalSubmitBtn.innerHTML = `Pay now`;
    momoFields.style.display = "block";
  }

  checkoutModalOverlay.classList.add("active");
  lucide.createIcons();
}

function closeCheckoutModal() {
  checkoutModalOverlay.classList.remove("active");
}

// --- SUBMIT CHECKOUT FORM LOGIC ---
async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  // Extract values
  const name = document.getElementById("cust-name").value.trim();
  const email = document.getElementById("cust-email").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const pickup = !!(document.getElementById("cust-pickup") && document.getElementById("cust-pickup").checked);
  const locationRaw = document.getElementById("cust-location").value.trim();
  const quote = quoteDelivery(locationRaw, pickup);
  if (!quote.matched) {
    alert(quote.note || "Type a delivery area we know, or pick up at Tudu.");
    return;
  }
  const location = formatCheckoutLocation(locationRaw, quote, pickup);
  const itemsTotal = cartItemsTotal();
  const totalPrice = itemsTotal + quote.fee;
  const totalPriceFormatted = formatGhs(totalPrice, 0);

  if (!cart.length) {
    alert('Your cart is empty.');
    return;
  }

  closeCheckoutModal();

  if (currentCheckoutType === "paystack") {
    const provider = document.getElementById("cust-momo-provider").value || "all";
    startPaystackCheckout({ name, email, phone, location, provider, totalPrice, deliveryFee: quote.fee, deliveryLabel: quote.label });
    return;
  }

  if (currentCheckoutType === "whatsapp") {
    let receiptNo = '';
    const cartSnapshot = cart.map((item) => ({
      product: { id: item.product.id, title: item.product.title, price: item.product.price },
      quantity: item.quantity,
    }));
    localStorage.setItem('gadgetboss-last-checkout', JSON.stringify(cartSnapshot));

    try {
      const recorded = await recordOnlineOrder({
        name,
        email,
        phone,
        location,
        paymentMethod: 'MoMo',
        status: 'PENDING',
        notes: `Delivery GH₵${quote.fee} · ${quote.label}`,
        idempotencyKey: `online-${(crypto.randomUUID && crypto.randomUUID()) || Date.now()}-${phone}`,
      });
      if (!recorded.ok) {
        alert(recorded.error);
        await hydrateCatalogueFromSupabase();
        renderProducts();
        return;
      }
      receiptNo = recorded.receiptNo;
      await claimCheckoutSession({ phone, receiptNo });
      if (receiptNo) {
        cart = [];
        saveCart();
        renderCart();
        await hydrateCatalogueFromSupabase();
        renderProducts();
      }
      showCheckoutReceipt({
        paid: false,
        name,
        email,
        phone,
        location,
        receiptNo,
        orderId: recorded.orderId,
        paymentReference: "",
        paymentMethod: "MoMo",
        totalFormatted: totalPriceFormatted,
        total: totalPrice,
        items: cartSnapshot,
        deliveryFee: quote.fee,
        deliveryLabel: quote.label,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
      alert('Could not reserve stock for this order. Please try again.\n' + (err.message || err));
      return;
    }
    return;
  }
}

// --- CUSTOMER VERIFICATION (HUBTEL OTP) ---
// The HttpOnly session cookie set by /api/auth/* is the only authority on who is
// signed in. Everything cached below is display state for this page load only.
const AUTH_API = {
  session: "/api/auth/session",
  requestOtp: "/api/auth/request-otp",
  verifyOtp: "/api/auth/verify-otp",
  resendOtp: "/api/auth/resend-otp",
  logout: "/api/auth/logout",
  claimOrder: "/api/auth/claim-order",
  orders: "/api/account/orders"
};

const VERIFY_INTRO_CHECKOUT = "One quick step: confirm the number on your phone. It secures your order against mix-ups and lets you track the delivery later.";
const VERIFY_INTRO_ORDERS = "Confirm your number to pull up the orders placed with it.";
const VERIFY_INTRO_TRACKING = "Confirm your number to see live delivery tracking for your orders.";

const authState = {
  loaded: false,
  configured: null, // OTP send available
  ordersAvailable: false,
  authenticated: false,
  phone: "",
  maskedPhone: "",
  customer: null
};

let lastCheckoutReceipt = null;

const verifyFlow = {
  open: false,
  busy: false,
  expired: false,
  intent: "checkout",
  phone: "",
  maskedPhone: "",
  successText: "",
  onVerified: null,
  expiryDeadline: 0,
  resendDeadline: 0,
  tickHandle: null,
  lastFocus: null
};

let sessionRequest = null;
let checkoutGateBusy = false;

// Returns { reachable, status, data }. `reachable: false` means the endpoint is
// missing, offline, or answered with something that is not JSON — in every one of
// those cases the caller must fail open rather than block the customer.
async function apiRequest(url, options) {
  const opts = options || {};
  const init = { method: opts.method || "GET", credentials: "same-origin" };
  if (opts.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(opts.body);
  }
  try {
    const res = await fetch(url, init);
    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      data = null;
    }
    if (!data || typeof data !== "object") {
      return { reachable: false, status: res.status, data: null };
    }
    return { reachable: true, status: res.status, data: data };
  } catch (err) {
    return { reachable: false, status: 0, data: null };
  }
}

function digitsOnly(value) {
  return String(value === undefined || value === null ? "" : value).replace(/\D/g, "");
}

// Accepts 024 123 4567, 0241234567, 241234567, +233241234567 and 233241234567.
// Returns "" when it is clearly not a Ghana mobile number. The server does the
// authoritative normalisation; this only decides when to enable the button.
function normalizeGhanaPhone(value) {
  let digits = digitsOnly(value);
  if (digits.length === 13 && digits.indexOf("2330") === 0) {
    digits = digits.slice(4);
  } else if (digits.length === 12 && digits.indexOf("233") === 0) {
    digits = digits.slice(3);
  } else if (digits.length === 10 && digits.charAt(0) === "0") {
    digits = digits.slice(1);
  }
  if (!/^[2-5]\d{8}$/.test(digits)) return "";
  return "+233" + digits;
}

function toLocalGhanaPhone(value) {
  const normalized = normalizeGhanaPhone(value);
  if (normalized) return "0" + normalized.slice(4);
  return digitsOnly(value).slice(0, 10);
}

function maskPhoneNumber(phone) {
  const value = String(phone || "");
  if (value.length < 5) return value;
  return value.slice(0, -4).replace(/\d/g, "*") + value.slice(-4);
}

function escapeHtml(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function applySessionPayload(data) {
  authState.loaded = true;
  authState.configured = data.configured === true;
  if (typeof data.ordersAvailable === "boolean") {
    authState.ordersAvailable = data.ordersAvailable;
  }
  authState.authenticated = !!data.authenticated;

  if (!authState.authenticated) {
    authState.phone = "";
    authState.maskedPhone = "";
    authState.customer = null;
    return;
  }

  authState.phone = data.phone || "";
  authState.maskedPhone = data.maskedPhone || maskPhoneNumber(authState.phone);
  if (data.customer) authState.customer = data.customer;
}

function markAuthUnavailable() {
  authState.loaded = true;
  authState.configured = false;
  authState.ordersAvailable = false;
  authState.authenticated = false;
  authState.phone = "";
  authState.maskedPhone = "";
  authState.customer = null;
}

function getSession() {
  if (authState.loaded) return Promise.resolve(authState);
  if (sessionRequest) return sessionRequest;
  sessionRequest = apiRequest(AUTH_API.session).then((res) => {
    if (res.reachable && res.data) {
      applySessionPayload(res.data);
    } else {
      markAuthUnavailable();
    }
    sessionRequest = null;
    return authState;
  });
  return sessionRequest;
}

async function claimCheckoutSession({ phone, reference, receiptNo }) {
  const normalized = normalizeGhanaPhone(phone) || phone;
  const res = await apiRequest(AUTH_API.claimOrder, {
    method: "POST",
    body: { phone: normalized, reference: reference || "", receiptNo: receiptNo || "" },
  });
  if (res.reachable && res.data && res.data.ok) {
    applySessionPayload(res.data);
    applyVerifiedCustomerToCheckoutForm();
    return true;
  }
  return false;
}

function closeCheckoutReceipt() {
  if (checkoutReceiptOverlay) checkoutReceiptOverlay.classList.remove("active");
}

function buildCheckoutWhatsappMessage(receipt) {
  const items = receipt.items || [];
  let messageText = receipt.paid
    ? `Hi GADGETBO$$,\n\nI have paid via Paystack.\n`
    : `Hi GADGETBO$$,\n\nI would like to place an order.\n\n`;
  if (receipt.receiptNo) messageText += `Order ref: ${receipt.receiptNo}\n`;
  if (receipt.paymentReference) messageText += `Paystack ref: ${receipt.paymentReference}\n`;
  messageText += `Name: ${receipt.name || ""}\nPhone: ${receipt.phone || ""}\n`;
  if (receipt.email) messageText += `Email: ${receipt.email}\n`;
  messageText += `Location: ${receipt.location || ""}\n\nItems:\n`;
  items.forEach((item, idx) => {
    const itemPrice = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 0 }).format(item.product.price * item.quantity);
    messageText += `${idx + 1}. ${item.product.title} x ${item.quantity} — ${itemPrice}\n`;
  });
  if (receipt.deliveryFee != null) {
    messageText += `\nDelivery: ${formatGhs(receipt.deliveryFee, 0)}`;
    if (receipt.deliveryLabel) messageText += ` (${receipt.deliveryLabel})`;
    messageText += `\n`;
  }
  messageText += `\nTotal: ${receipt.totalFormatted || ""}\nThank you.`;
  return messageText;
}

function slipDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${dd}-${mm}-${yyyy} ${h}:${min} ${ap}`;
}

function slipAmt(n) {
  return Number(n || 0).toFixed(2);
}

function shopReceiptLines(receipt) {
  return (receipt.items || []).map((item) => {
    if (item && item.product) {
      const qty = Number(item.quantity || item.qty || 1);
      const price = Number(item.product.price || item.unitPrice || 0);
      const total = item.lineTotal != null ? Number(item.lineTotal) : price * qty;
      return { name: item.product.title || "Item", qty, price, total };
    }
    const qty = Number(item.qty || item.quantity || 1);
    const total = Number(item.lineTotal || 0);
    const price = item.unitPrice != null ? Number(item.unitPrice) : (qty ? total / qty : 0);
    return { name: item.productName || item.name || "Item", qty, price, total };
  });
}

function fillShopReceiptSlip(receipt) {
  const lines = shopReceiptLines(receipt);
  const itemsTotal = lines.reduce((sum, line) => sum + Number(line.total || 0), 0);
  const delivery = Number(receipt.deliveryFee || 0);
  const grand = receipt.total != null ? Number(receipt.total) : itemsTotal + delivery;
  const paidLabel = receipt.paid
    ? (receipt.paymentMethod || "Paid")
    : (receipt.paymentMethod ? `${receipt.paymentMethod} · unpaid` : "Unpaid");

  if (checkoutReceiptNumber) {
    checkoutReceiptNumber.textContent = receipt.receiptNo
      ? `Sales Receipt No. #${receipt.receiptNo}`
      : "Sales Receipt No. #pending";
  }
  if (checkoutReceiptDate) checkoutReceiptDate.textContent = slipDate(receipt.createdAt);
  if (checkoutReceiptCustomer) {
    const bits = [receipt.name, receipt.phone].filter(Boolean);
    checkoutReceiptCustomer.textContent = bits.join(" · ");
    checkoutReceiptCustomer.hidden = !bits.length;
  }
  if (checkoutReceiptItems) {
    checkoutReceiptItems.innerHTML = lines.map((line, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(line.name)}</td>
        <td>${escapeHtml(line.qty)}</td>
        <td>${slipAmt(line.price)}</td>
        <td>${slipAmt(line.total)}</td>
      </tr>
    `).join("");
  }
  if (checkoutReceiptSubtotal) checkoutReceiptSubtotal.textContent = slipAmt(itemsTotal);
  if (checkoutReceiptDeliveryRow) checkoutReceiptDeliveryRow.hidden = !(delivery > 0);
  if (checkoutReceiptDelivery) checkoutReceiptDelivery.textContent = slipAmt(delivery);
  if (checkoutReceiptTotal) checkoutReceiptTotal.textContent = `GH₵${slipAmt(grand)}`;
  if (checkoutReceiptPaid) checkoutReceiptPaid.textContent = paidLabel;
}

function showCheckoutReceipt(receipt) {
  lastCheckoutReceipt = receipt;
  if (!checkoutReceiptOverlay) {
    alert((receipt.paid ? "Payment received. " : "Order saved. ") + "Receipt: " + (receipt.receiptNo || "pending"));
    return;
  }
  if (checkoutReceiptTitle) checkoutReceiptTitle.textContent = receipt.paid ? "Payment received" : "Order reserved";
  if (checkoutReceiptKicker) {
    checkoutReceiptKicker.textContent = receipt.paid
      ? "Keep this receipt. Track it any time under My Purchases."
      : "Stock is reserved. Send this receipt on WhatsApp to finish payment.";
  }
  if (checkoutReceiptRef) {
    checkoutReceiptRef.textContent = receipt.paymentReference ? ("Paystack ref: " + receipt.paymentReference) : "";
    checkoutReceiptRef.hidden = !receipt.paymentReference;
  }
  fillShopReceiptSlip(receipt);
  if (checkoutReceiptWhatsappBtn) {
    checkoutReceiptWhatsappBtn.textContent = receipt.paid ? "Send receipt on WhatsApp" : "Continue on WhatsApp";
  }
  if (checkoutReceiptTrackBtn) checkoutReceiptTrackBtn.hidden = !!receipt.hideTrack;
  checkoutReceiptOverlay.classList.add("active");
  lucide.createIcons();
}

function openTrackedCheckoutReceipt() {
  const target = lastCheckoutReceipt;
  closeCheckoutReceipt();
  const orderKey = target && (target.orderId || target.receiptNo);
  requestAccountView("track", orderKey);
}

// The single gate: run `onVerified` immediately when OTP login is off/unreachable
// or the customer is already verified, otherwise verify first and then continue.
async function requireVerifiedSession(options) {
  const opts = options || {};
  const proceed = typeof opts.onVerified === "function" ? opts.onVerified : function () {};
  const session = await getSession();

  if (!session.configured || session.authenticated) {
    proceed();
    return;
  }

  openVerifyModal({
    intent: opts.intent,
    intro: opts.intro,
    successText: opts.successText,
    onVerified: proceed
  });
}

function setVerifyStatus(message, tone) {
  verifyStatus.textContent = message || "";
  verifyStatus.className = "verify-status" + (message && tone ? " is-" + tone : "");
}

function showVerifyStep(step) {
  verifyPhoneForm.hidden = step !== "phone";
  verifyCodeForm.hidden = step !== "code";
  verifySuccess.hidden = step !== "success";
}

function setVerifyBusy(busy, target) {
  verifyFlow.busy = !!busy;
  const activeBtn = target === "code" ? verifyCodeBtn : verifySendBtn;
  [verifySendBtn, verifyCodeBtn].forEach((btn) => btn.classList.remove("is-loading"));
  if (busy && target !== "resend") activeBtn.classList.add("is-loading");

  verifyPhoneInput.disabled = !!busy;
  verifyOtpBoxes.forEach((box) => { box.disabled = !!busy; });
  verifyEditPhoneBtn.disabled = !!busy;

  if (busy) {
    verifySendBtn.disabled = true;
    verifyCodeBtn.disabled = true;
    verifyResendBtn.disabled = true;
  } else {
    syncVerifyPhoneButton();
    syncVerifyCodeButton();
    updateVerifyTimers();
  }
}

function syncVerifyPhoneButton() {
  verifySendBtn.disabled = verifyFlow.busy || !normalizeGhanaPhone(verifyPhoneInput.value);
}

function syncVerifyCodeButton() {
  verifyCodeBtn.disabled = verifyFlow.busy || verifyFlow.expired || otpValue().length !== verifyOtpBoxes.length;
}

function otpValue() {
  return verifyOtpBoxes.map((box) => digitsOnly(box.value)).join("");
}

function setOtpValue(value) {
  const chars = digitsOnly(value).slice(0, verifyOtpBoxes.length).split("");
  verifyOtpBoxes.forEach((box, idx) => { box.value = chars[idx] || ""; });
}

function focusOtpBox(index) {
  const bounded = Math.max(0, Math.min(verifyOtpBoxes.length - 1, index));
  const box = verifyOtpBoxes[bounded];
  if (!box) return;
  box.focus();
  if (box.select) box.select();
}

function formatCountdown(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

function secondsUntil(deadline) {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function updateVerifyTimers() {
  // Nothing to count while the customer is still on the phone-entry step.
  if (verifyCodeForm.hidden || !verifyFlow.expiryDeadline) return;

  const codeLeft = secondsUntil(verifyFlow.expiryDeadline);
  const resendLeft = secondsUntil(verifyFlow.resendDeadline);

  if (codeLeft > 0) {
    verifyCountdown.textContent = "Expires in " + formatCountdown(codeLeft);
    verifyCountdown.classList.remove("is-expired");
  } else {
    verifyCountdown.textContent = "Code expired";
    verifyCountdown.classList.add("is-expired");
    if (!verifyFlow.expired) {
      verifyFlow.expired = true;
      setVerifyStatus("That code has expired. Tap resend to get a fresh one.", "error");
      syncVerifyCodeButton();
    }
  }

  if (verifyFlow.busy) return;

  if (resendLeft > 0) {
    verifyResendBtn.disabled = true;
    verifyResendBtn.textContent = "Resend in " + formatCountdown(resendLeft);
  } else {
    verifyResendBtn.disabled = false;
    verifyResendBtn.textContent = "Resend code";
  }
}

function startVerifyTicker() {
  stopVerifyTicker();
  updateVerifyTimers();
  verifyFlow.tickHandle = window.setInterval(updateVerifyTimers, 500);
}

function stopVerifyTicker() {
  if (verifyFlow.tickHandle) {
    window.clearInterval(verifyFlow.tickHandle);
    verifyFlow.tickHandle = null;
  }
}

function openVerifyModal(options) {
  const opts = options || {};
  verifyFlow.onVerified = typeof opts.onVerified === "function" ? opts.onVerified : null;
  verifyFlow.intent = opts.intent || "checkout";
  verifyFlow.successText = opts.successText || "Number verified.";
  verifyFlow.expired = false;
  verifyFlow.expiryDeadline = 0;
  verifyFlow.resendDeadline = 0;
  verifyFlow.lastFocus = document.activeElement;

  verifyIntro.textContent = opts.intro || VERIFY_INTRO_CHECKOUT;

  const seed = opts.phone || authState.phone || verifyFlow.phone;
  if (seed) verifyPhoneInput.value = toLocalGhanaPhone(seed);

  setOtpValue("");
  setVerifyStatus("", "");
  showVerifyStep("phone");
  stopVerifyTicker();
  setVerifyBusy(false);

  toggleCartDrawer(false);
  verifyModalOverlay.classList.add("active");
  verifyFlow.open = true;
  syncVerifyPhoneButton();
  window.setTimeout(() => {
    if (verifyFlow.open) verifyPhoneInput.focus();
  }, 80);
  lucide.createIcons();
}

function closeVerifyModal(options) {
  const opts = options || {};
  verifyModalOverlay.classList.remove("active");
  verifyFlow.open = false;
  stopVerifyTicker();
  setVerifyBusy(false);

  const cancelled = opts.keepPending !== true;
  if (cancelled) verifyFlow.onVerified = null;

  if (opts.restoreFocus !== false && verifyFlow.lastFocus && verifyFlow.lastFocus.focus) {
    verifyFlow.lastFocus.focus();
  }
  verifyFlow.lastFocus = null;

  // Backing out of verification should land the customer back on their cart
  // rather than on a bare page.
  if (cancelled && verifyFlow.intent === "checkout" && cart.length) {
    toggleCartDrawer(true);
  }
}

function continueAfterVerification() {
  const next = verifyFlow.onVerified;
  verifyFlow.onVerified = null;
  if (typeof next === "function") next();
}

// Any dead end in the OTP flow hands the customer straight back to the flow they
// asked for, so a broken auth API can never cost the shop a sale.
function abandonVerificationAndContinue() {
  markAuthUnavailable();
  closeVerifyModal({ keepPending: true, restoreFocus: false });
  continueAfterVerification();
}

async function sendVerificationCode(isResend) {
  if (verifyFlow.busy) return;
  if (!verifyFlow.phone) return;

  setVerifyBusy(true, isResend ? "resend" : "phone");
  setVerifyStatus(isResend ? "Sending a new code…" : "Sending your code…", "info");

  const res = isResend
    ? await apiRequest(AUTH_API.resendOtp, { method: "POST", body: {} })
    : await apiRequest(AUTH_API.requestOtp, { method: "POST", body: { phone: verifyFlow.phone } });

  if (!res.reachable || !res.data || res.data.configured === false) {
    abandonVerificationAndContinue();
    return;
  }

  setVerifyBusy(false);
  const data = res.data;

  if (!data.ok) {
    const retryAfter = Number(data.retryAfterSeconds);
    if (retryAfter > 0) {
      verifyFlow.resendDeadline = Date.now() + retryAfter * 1000;
      updateVerifyTimers();
    }
    setVerifyStatus(data.error || "We could not send that code. Please try again.", "error");
    // A resend can fail because the whole challenge is gone; step 1 is the only
    // way out of that, so take the customer back rather than leaving them stuck.
    if (isResend && data.expired) {
      stopVerifyTicker();
      verifyFlow.expired = false;
      verifyFlow.expiryDeadline = 0;
      setOtpValue("");
      showVerifyStep("phone");
      syncVerifyPhoneButton();
      verifyPhoneInput.focus();
    }
    return;
  }

  verifyFlow.phone = data.phone || verifyFlow.phone;
  verifyFlow.maskedPhone = data.maskedPhone || maskPhoneNumber(verifyFlow.phone);
  verifyFlow.expiryDeadline = Date.now() + (Number(data.expiresInSeconds) || 300) * 1000;
  verifyFlow.resendDeadline = Date.now() + (Number(data.resendInSeconds) || 30) * 1000;
  verifyFlow.expired = false;

  verifyMaskedPhone.textContent = verifyFlow.maskedPhone;
  setOtpValue("");
  showVerifyStep("code");
  startVerifyTicker();
  syncVerifyCodeButton();
  setVerifyStatus(isResend ? "New code sent." : "Code sent by SMS. Enter it below.", "info");
  window.setTimeout(() => {
    if (verifyFlow.open && !verifyCodeForm.hidden) focusOtpBox(0);
  }, 60);
}

async function submitVerificationCode() {
  if (verifyFlow.busy) return;
  const code = otpValue();
  if (code.length !== verifyOtpBoxes.length) {
    setVerifyStatus("Enter all 4 digits of the code.", "error");
    return;
  }

  setVerifyBusy(true, "code");
  setVerifyStatus("Checking your code…", "info");

  const res = await apiRequest(AUTH_API.verifyOtp, { method: "POST", body: { code: code } });

  if (!res.reachable || !res.data || res.data.configured === false) {
    abandonVerificationAndContinue();
    return;
  }

  setVerifyBusy(false);
  const data = res.data;

  if (!data.ok) {
    setOtpValue("");
    if (data.expired) {
      verifyFlow.expired = true;
      verifyFlow.expiryDeadline = Date.now();
      setVerifyStatus(data.error || "That code has expired. Tap resend to get a fresh one.", "error");
    } else {
      let message = data.error || "That code is not correct.";
      if (typeof data.attemptsLeft === "number") {
        message += " " + data.attemptsLeft + (data.attemptsLeft === 1 ? " attempt" : " attempts") + " left.";
      }
      setVerifyStatus(message, "error");
    }
    verifyOtpGroup.classList.add("is-invalid");
    window.setTimeout(() => verifyOtpGroup.classList.remove("is-invalid"), 600);
    updateVerifyTimers();
    syncVerifyCodeButton();
    if (!verifyFlow.expired) focusOtpBox(0);
    return;
  }

  authState.loaded = true;
  authState.configured = true;
  authState.authenticated = true;
  authState.phone = data.phone || verifyFlow.phone;
  authState.maskedPhone = data.maskedPhone || maskPhoneNumber(authState.phone);
  authState.customer = data.customer || null;

  stopVerifyTicker();
  setVerifyStatus("", "");
  verifySuccessText.textContent = verifyFlow.successText || "Number verified.";
  showVerifyStep("success");
  lucide.createIcons();

  window.setTimeout(() => {
    closeVerifyModal({ keepPending: true, restoreFocus: false });
    continueAfterVerification();
  }, 850);
}

// --- CHECKOUT GATE ---
function startGatedCheckout(type) {
  if (!cart.length) return;
  if (checkoutGateBusy) return;
  checkoutGateBusy = true;

  requireVerifiedSession({
    intent: "checkout",
    intro: VERIFY_INTRO_CHECKOUT,
    successText: type === "whatsapp"
      ? "Number verified. Opening your WhatsApp order…"
      : "Number verified. Opening secure checkout…",
    onVerified: () => openCheckoutModal(type)
  }).catch(() => {
    // A gate that throws must still let the customer buy.
    openCheckoutModal(type);
  }).then(() => {
    checkoutGateBusy = false;
  });
}

function applyVerifiedCustomerToCheckoutForm() {
  const phoneInput = document.getElementById("cust-phone");
  if (!phoneInput) return;

  if (authState.authenticated && authState.phone) {
    phoneInput.value = authState.phone;
    phoneInput.readOnly = true;
    phoneInput.classList.add("is-verified");
    if (custPhoneVerifiedBadge) custPhoneVerifiedBadge.hidden = false;
  } else {
    phoneInput.readOnly = false;
    phoneInput.classList.remove("is-verified");
    if (custPhoneVerifiedBadge) custPhoneVerifiedBadge.hidden = true;
  }

  const customer = authState.customer;
  if (!customer) return;
  const savedLocation = String(customer.location || "").split(" · ")[0];
  [["cust-name", customer.name], ["cust-email", customer.email], ["cust-location", savedLocation]]
    .forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (field && value && !field.value.trim()) field.value = value;
    });
}

// --- ACCOUNT DRAWER (ORDERS, TRACKING, REORDER) ---
const accountState = {
  mode: "orders",
  view: "list",
  orders: null,
  activeOrder: null,
  focusOrderId: null,
  lastFocus: null
};

const ORDER_STATUS_TONE = {
  DELIVERED: "success",
  COMPLETED: "success",
  CONFIRMED: "success",
  PAID: "success",
  DISPATCHED: "info",
  SHIPPED: "info",
  PACKED: "info",
  PENDING: "warn",
  AWAITING_PAYMENT: "warn",
  CANCELLED: "danger",
  REFUNDED: "danger",
  FAILED: "danger"
};

function orderStatusTone(status) {
  const key = String(status || "").toUpperCase().replace(/[\s-]+/g, "_");
  return ORDER_STATUS_TONE[key] || "info";
}

function prettifyStatus(status) {
  const text = String(status || "Pending").replace(/[_-]+/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatOrderDate(value, withTime) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  const dateText = date.toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
  if (!withTime) return dateText;
  return dateText + ", " + date.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" });
}

function orderLines(order) {
  return Array.isArray(order && order.items) ? order.items : [];
}

function orderItemCount(order) {
  return orderLines(order).reduce((sum, line) => sum + (Number(line.qty) || 0), 0);
}

function requestAccountView(mode, focusOrderId) {
  requireVerifiedSession({
    intent: "account",
    intro: mode === "track" ? VERIFY_INTRO_TRACKING : VERIFY_INTRO_ORDERS,
    successText: "Number verified. Loading your orders…",
    onVerified: () => openAccountDrawer(mode, focusOrderId)
  });
}

function openAccountDrawer(mode, focusOrderId) {
  accountState.mode = mode === "track" ? "track" : "orders";
  accountState.view = "list";
  accountState.activeOrder = null;
  accountState.focusOrderId = focusOrderId || null;
  accountState.lastFocus = document.activeElement;

  toggleCartDrawer(false);
  accountBackBtn.hidden = true;
  accountDrawerTitle.textContent = accountState.mode === "track" ? "Track Order" : "My Purchases";
  updateAccountSubtitle();
  accountOverlayWrapper.classList.add("active");
  window.setTimeout(() => {
    if (accountOverlayWrapper.classList.contains("active")) closeAccountBtn.focus();
  }, 80);

  if (authState.authenticated) {
    loadAccountOrders({
      autoTrack: accountState.mode === "track" && !accountState.focusOrderId,
      focusOrderId: accountState.focusOrderId,
    });
    return;
  }
  if (authState.configured) {
    renderAccountSignedOut();
    return;
  }
  if (authState.ordersAvailable || lastCheckoutReceipt) {
    renderAccountClaim();
    return;
  }
  renderAccountUnavailable();
}

function closeAccountDrawer() {
  accountOverlayWrapper.classList.remove("active");
  if (accountState.lastFocus && accountState.lastFocus.focus) accountState.lastFocus.focus();
  accountState.lastFocus = null;
}

function updateAccountSubtitle() {
  if (authState.authenticated && authState.maskedPhone) {
    accountDrawerSub.textContent = "Signed in as " + authState.maskedPhone;
  } else {
    accountDrawerSub.textContent = "";
  }
  accountDrawerFooter.hidden = !authState.authenticated;
}

function renderAccountSkeletons() {
  accountDrawerBody.innerHTML = "<div class=\"account-skeleton-list\">" +
    "<div class=\"account-skeleton-card\"></div>".repeat(3) +
    "</div>";
}

function renderAccountNotice(icon, title, text, action) {
  accountDrawerBody.innerHTML = `
    <div class="account-empty">
      <h4 class="account-empty-title">${escapeHtml(title)}</h4>
      <p class="account-empty-text">${escapeHtml(text)}</p>
      ${action || ""}
    </div>
  `;
  lucide.createIcons();
}

// Resets the drawer chrome so a notice never inherits the "Order Details" header.
function resetAccountHeader() {
  accountState.view = "list";
  accountBackBtn.hidden = true;
  accountDrawerTitle.textContent = accountState.mode === "track" ? "Track Order" : "My Purchases";
}

function renderAccountUnavailable() {
  resetAccountHeader();
  accountDrawerFooter.hidden = true;
  renderAccountNotice(
    "package",
    "Order tracking is not live yet",
    "We are still switching on self-service order history. Send us your name or receipt number on WhatsApp and we will tell you exactly where your delivery is.",
    `<a class="account-btn-solid" href="https://wa.me/${WHATSAPP_PHONE}" target="_blank" rel="noreferrer">Ask us on WhatsApp</a>`
  );
}

function renderAccountSignedOut() {
  resetAccountHeader();
  accountDrawerFooter.hidden = true;
  renderAccountNotice(
    "shield-check",
    "Verify your number",
    "Confirm the number you ordered with and your purchase history appears here.",
    `<button type="button" class="account-btn-solid" id="account-verify-btn">Verify my number</button>`
  );
  const btn = document.getElementById("account-verify-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      closeAccountDrawer();
      requestAccountView(accountState.mode, accountState.focusOrderId);
    });
  }
}

function renderAccountClaim() {
  resetAccountHeader();
  accountDrawerFooter.hidden = true;
  const seedPhone = lastCheckoutReceipt && lastCheckoutReceipt.phone
    ? toLocalGhanaPhone(lastCheckoutReceipt.phone)
    : "";
  const seedReceipt = (lastCheckoutReceipt && lastCheckoutReceipt.receiptNo) || "";
  accountDrawerBody.innerHTML = `
    <div class="account-empty">
      <h4 class="account-empty-title">Find your receipt</h4>
      <p class="account-empty-text">Enter the WhatsApp number and receipt from checkout to open My Purchases and tracking.</p>
      <form id="account-claim-form" class="account-claim-form">
        <label class="modal-label" for="account-claim-phone">WhatsApp number</label>
        <input id="account-claim-phone" class="modal-input" type="tel" inputmode="numeric" required placeholder="054 123 4567" value="${escapeHtml(seedPhone)}">
        <label class="modal-label" for="account-claim-receipt">Receipt number</label>
        <input id="account-claim-receipt" class="modal-input" type="text" required placeholder="GB-A1B2C3D4" value="${escapeHtml(seedReceipt)}">
        <p class="verify-status" id="account-claim-status" role="status"></p>
        <button type="submit" class="account-btn-solid" id="account-claim-btn">Show my order</button>
      </form>
    </div>
  `;
  lucide.createIcons();
  const form = document.getElementById("account-claim-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const statusEl = document.getElementById("account-claim-status");
      const phone = document.getElementById("account-claim-phone").value;
      const receiptNo = document.getElementById("account-claim-receipt").value.trim();
      const btn = document.getElementById("account-claim-btn");
      if (btn) btn.disabled = true;
      const ok = await claimCheckoutSession({ phone, receiptNo });
      if (btn) btn.disabled = false;
      if (!ok) {
        if (statusEl) statusEl.textContent = "No order matches that number and receipt.";
        return;
      }
      updateAccountSubtitle();
      loadAccountOrders({
        autoTrack: accountState.mode === "track" && !receiptNo,
        focusOrderId: accountState.focusOrderId || receiptNo,
      });
    });
  }
}

async function loadAccountOrders(options) {
  const opts = options || {};
  renderAccountSkeletons();

  const res = await apiRequest(AUTH_API.orders);

  if (!res.reachable || !res.data) {
    markAuthUnavailable();
    updateAccountSubtitle();
    renderAccountUnavailable();
    return;
  }

  const data = res.data;

  if (res.status === 401) {
    authState.authenticated = false;
    authState.customer = null;
    updateAccountSubtitle();
    if (authState.configured) renderAccountSignedOut();
    else renderAccountClaim();
    return;
  }
  if (data.configured === false) {
    markAuthUnavailable();
    updateAccountSubtitle();
    renderAccountUnavailable();
    return;
  }
  if (!data.ok) {
    renderAccountNotice("alert-triangle", "We could not load your orders", data.error || "Please try again in a moment.",
      `<button type="button" class="account-btn-solid" id="account-retry-btn">Try again</button>`);
    const retry = document.getElementById("account-retry-btn");
    if (retry) retry.addEventListener("click", () => loadAccountOrders());
    return;
  }

  accountState.orders = Array.isArray(data.orders) ? data.orders : [];

  const focusId = opts.focusOrderId || accountState.focusOrderId;
  if (focusId) {
    const match = accountState.orders.find((order) =>
      String(order.id) === String(focusId) || String(order.receiptNo) === String(focusId)
    );
    if (match) {
      openAccountOrderDetail(match.id);
      return;
    }
    openAccountOrderDetail(focusId);
    return;
  }
  if (opts.autoTrack && accountState.orders.length) {
    openAccountOrderDetail(accountState.orders[0].id);
    return;
  }
  renderAccountOrders();
}

function renderAccountOrders() {
  accountState.view = "list";
  accountBackBtn.hidden = true;
  accountDrawerTitle.textContent = accountState.mode === "track" ? "Track Order" : "My Purchases";
  updateAccountSubtitle();

  const orders = accountState.orders || [];
  if (!orders.length) {
    renderAccountNotice(
      "shopping-bag",
      "No orders yet",
      "Once you check out, every order shows up here with its delivery progress.",
      `<button type="button" class="account-btn-solid" id="account-browse-btn">Back to the shop</button>`
    );
    accountDrawerFooter.hidden = !authState.authenticated;
    const browse = document.getElementById("account-browse-btn");
    if (browse) {
      browse.addEventListener("click", () => {
        closeAccountDrawer();
        const target = document.getElementById("catalog");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    return;
  }

  accountDrawerBody.innerHTML = orders.map((order) => {
    const count = orderItemCount(order);
    return `
      <article class="account-order-card" data-order-id="${escapeHtml(order.id)}">
        <div class="account-order-top">
          <span class="account-order-receipt">${escapeHtml(order.receiptNo || order.id)}</span>
          <span class="account-status-badge is-${orderStatusTone(order.status)}">${escapeHtml(prettifyStatus(order.status))}</span>
        </div>
        <p class="account-order-meta">
          <span>${escapeHtml(formatOrderDate(order.createdAt))}</span>
          <span class="account-meta-dot">•</span>
          <span>${count} ${count === 1 ? "item" : "items"}</span>
          ${order.paymentMethod ? `<span class="account-meta-dot">•</span><span>${escapeHtml(order.paymentMethod)}</span>` : ""}
        </p>
        <div class="account-order-bottom">
          <span class="account-order-total">${escapeHtml(formatGhs(order.total, 2))}</span>
          <div class="account-order-actions">
            <button type="button" class="account-btn-ghost" data-action="view" data-order-id="${escapeHtml(order.id)}">Details &amp; tracking</button>
            <button type="button" class="account-btn-solid" data-action="reorder" data-order-id="${escapeHtml(order.id)}">Reorder</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  bindAccountOrderActions();
}

function bindAccountOrderActions() {
  accountDrawerBody.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-order-id");
      if (btn.getAttribute("data-action") === "reorder") {
        reorderFromOrderId(id);
      } else {
        openAccountOrderDetail(id);
      }
    });
  });
}

async function openAccountOrderDetail(orderId) {
  if (!orderId) return;
  accountState.view = "detail";
  accountBackBtn.hidden = false;
  accountDrawerTitle.textContent = "Order Details";
  renderAccountSkeletons();

  const res = await apiRequest(AUTH_API.orders + "/" + encodeURIComponent(orderId));

  if (!res.reachable || !res.data) {
    markAuthUnavailable();
    updateAccountSubtitle();
    renderAccountUnavailable();
    return;
  }
  if (res.status === 401) {
    authState.authenticated = false;
    authState.customer = null;
    updateAccountSubtitle();
    renderAccountSignedOut();
    return;
  }
  // A guessed or foreign id must never render as somebody's order.
  if (res.status === 404 || !res.data.ok || !res.data.order) {
    renderAccountNotice("search-x", "Order not found", res.data.error || "We could not find that order on your number.",
      `<button type="button" class="account-btn-solid" id="account-back-to-list">Back to my orders</button>`);
    const back = document.getElementById("account-back-to-list");
    if (back) back.addEventListener("click", () => renderAccountOrders());
    return;
  }

  accountState.activeOrder = res.data.order;
  renderAccountOrderDetail(res.data.order);
}

function renderAccountOrderDetail(order) {
  const tracking = order.tracking || {};
  const steps = Array.isArray(tracking.steps) ? tracking.steps : [];
  const items = orderLines(order);

  const metaBits = [formatOrderDate(order.createdAt, true), order.paymentMethod, order.customerLocation]
    .filter(Boolean)
    .map((bit) => escapeHtml(bit))
    .join(" <span class=\"account-meta-dot\">•</span> ");

  const payRef = order.paymentReference
    ? `<p class="account-order-meta">Paystack ref: ${escapeHtml(order.paymentReference)}</p>`
    : "";

  accountDrawerBody.innerHTML = `
    <div class="account-detail">
      <div class="account-detail-head">
        <span class="account-order-receipt">${escapeHtml(order.receiptNo || order.id)}</span>
        <span class="account-status-badge is-${orderStatusTone(tracking.status || order.status)}">${escapeHtml(prettifyStatus(tracking.status || order.status))}</span>
      </div>
      <p class="account-order-meta">${metaBits}</p>
      ${payRef}

      ${steps.length ? `
        <h4 class="account-section-title">Delivery tracking</h4>
        <ol class="account-timeline">
          ${steps.map((step) => `
            <li class="account-timeline-step ${step.done ? "is-done" : "is-pending"}">
              <span class="account-timeline-dot"></span>
              <span class="account-timeline-label">${escapeHtml(step.label || step.key || "")}</span>
              <span class="account-timeline-at">${step.at ? escapeHtml(formatOrderDate(step.at, true)) : (step.done ? "" : "Pending")}</span>
            </li>
          `).join("")}
        </ol>
      ` : ""}

      <h4 class="account-section-title">Items</h4>
      <ul class="account-line-items">
        ${items.length ? items.map((line) => `
          <li class="account-line-item">
            <span class="account-line-name">${escapeHtml(line.productName || line.productId)}<span class="account-line-qty">× ${escapeHtml(line.qty)}</span></span>
            <span class="account-line-total">${escapeHtml(formatGhs(line.lineTotal, 2))}</span>
          </li>
        `).join("") : `<li class="account-line-item"><span class="account-line-name">No line items recorded.</span></li>`}
      </ul>

      <div class="payment-summary account-detail-summary">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${escapeHtml(formatGhs(order.subtotal === undefined || order.subtotal === null ? order.total : order.subtotal, 2))}</span>
        </div>
        <div class="summary-row">
          <span>Total paid</span>
          <span style="color: var(--accent-blue);">${escapeHtml(formatGhs(order.total, 2))}</span>
        </div>
      </div>

      <button type="button" class="btn-modal-action verify account-detail-reorder" id="account-print-receipt">
        <span>Print receipt</span>
      </button>
      <button type="button" class="btn-modal-action verify account-detail-reorder" data-action="reorder" data-order-id="${escapeHtml(order.id)}">
        <span>Reorder these items</span>
      </button>
    </div>
  `;

  bindAccountOrderActions();
  const printBtn = document.getElementById("account-print-receipt");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      showCheckoutReceipt(receiptFromAccountOrder(order));
    });
  }
  lucide.createIcons();
}

function receiptFromAccountOrder(order) {
  const items = orderLines(order);
  const itemsTotal = items.reduce((sum, line) => sum + Number(line.lineTotal || 0), 0);
  const deliveryFee = Math.max(0, Number(order.total || 0) - itemsTotal);
  return {
    paid: /confirm|paid|complete/i.test(String(order.status || "")),
    name: order.customerName || "",
    phone: "",
    location: order.customerLocation || "",
    receiptNo: order.receiptNo,
    orderId: order.id,
    paymentReference: order.paymentReference || "",
    paymentMethod: order.paymentMethod || "",
    items,
    deliveryFee,
    createdAt: order.createdAt,
    total: order.total,
    hideTrack: false,
  };
}

function reorderFromOrderId(orderId) {
  const order = (accountState.activeOrder && String(accountState.activeOrder.id) === String(orderId))
    ? accountState.activeOrder
    : (accountState.orders || []).find((o) => String(o.id) === String(orderId));
  if (!order) return;
  reorderFromOrder(order);
}

// Reorder goes through addToCart so stock rules, badges and persistence stay in
// one place; anything gone from the catalogue is reported instead of silently lost.
function reorderFromOrder(order) {
  const lines = orderLines(order);
  const unavailable = [];
  const partial = [];
  let addedTotal = 0;

  lines.forEach((line) => {
    const product = PRODUCTS.find((p) => p.id === line.productId);
    const soldOut = !product || product.price <= 0 || product.outOfStock ||
      (typeof product.stock === "number" && product.stock <= 0);
    if (soldOut) {
      unavailable.push(line.productName || line.productId);
      return;
    }

    const wanted = Math.max(1, Number(line.qty) || 1);
    let added = 0;
    for (let i = 0; i < wanted; i++) {
      const existing = cart.find((item) => item.product.id === product.id);
      const nextQty = (existing ? existing.quantity : 0) + 1;
      if (typeof product.stock === "number" && nextQty > product.stock) break;
      addToCart(product.id);
      added++;
    }
    addedTotal += added;
    if (added < wanted) partial.push((line.productName || product.title) + " (" + added + " of " + wanted + ")");
  });

  const notes = [];
  if (!addedTotal) {
    notes.push("None of the items from this order are available right now.");
  }
  if (unavailable.length) notes.push("No longer available: " + unavailable.join(", ") + ".");
  if (partial.length) notes.push("Limited stock: " + partial.join(", ") + ".");

  closeAccountDrawer();
  if (notes.length) alert("REORDER\n\n" + notes.join("\n"));
  if (addedTotal) toggleCartDrawer(true);
}

async function handleAccountSignOut() {
  accountSignoutBtn.disabled = true;
  await apiRequest(AUTH_API.logout, { method: "POST", body: {} });
  accountSignoutBtn.disabled = false;

  authState.authenticated = false;
  authState.phone = "";
  authState.maskedPhone = "";
  authState.customer = null;
  accountState.orders = null;
  accountState.activeOrder = null;

  applyVerifiedCustomerToCheckoutForm();
  closeAccountDrawer();
}

// --- VERIFICATION + ACCOUNT EVENT WIRING ---
function setupAuthEventListeners() {
  if (myPurchasesTrigger) myPurchasesTrigger.addEventListener("click", () => requestAccountView("orders"));
  if (trackOrderTrigger) trackOrderTrigger.addEventListener("click", () => requestAccountView("track"));
  if (accountTrigger) accountTrigger.addEventListener("click", () => requestAccountView("orders"));

  closeVerifyModalBtn.addEventListener("click", () => closeVerifyModal());
  verifyModalOverlay.addEventListener("click", (e) => {
    if (e.target === verifyModalOverlay) closeVerifyModal();
  });

  if (checkoutReceiptCloseBtn) checkoutReceiptCloseBtn.addEventListener("click", closeCheckoutReceipt);
  if (checkoutReceiptOverlay) {
    checkoutReceiptOverlay.addEventListener("click", (e) => {
      if (e.target === checkoutReceiptOverlay) closeCheckoutReceipt();
    });
  }
  if (checkoutReceiptPrintBtn) checkoutReceiptPrintBtn.addEventListener("click", () => window.print());
  if (checkoutReceiptTrackBtn) checkoutReceiptTrackBtn.addEventListener("click", openTrackedCheckoutReceipt);
  if (checkoutReceiptWhatsappBtn) {
    checkoutReceiptWhatsappBtn.addEventListener("click", () => {
      if (!lastCheckoutReceipt) return;
      window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(buildCheckoutWhatsappMessage(lastCheckoutReceipt))}`, "_blank");
    });
  }

  verifyPhoneInput.addEventListener("input", syncVerifyPhoneButton);
  verifyPhoneForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const normalized = normalizeGhanaPhone(verifyPhoneInput.value);
    if (!normalized) {
      setVerifyStatus("That does not look like a Ghana mobile number.", "error");
      return;
    }
    verifyFlow.phone = normalized;
    sendVerificationCode(false);
  });

  verifyCodeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitVerificationCode();
  });

  verifyEditPhoneBtn.addEventListener("click", () => {
    stopVerifyTicker();
    verifyFlow.expired = false;
    setOtpValue("");
    setVerifyStatus("", "");
    showVerifyStep("phone");
    if (verifyFlow.phone) verifyPhoneInput.value = toLocalGhanaPhone(verifyFlow.phone);
    syncVerifyPhoneButton();
    verifyPhoneInput.focus();
  });

  verifyResendBtn.addEventListener("click", () => sendVerificationCode(true));

  verifyOtpBoxes.forEach((box, index) => {
    box.addEventListener("input", () => {
      const typed = digitsOnly(box.value);
      if (typed.length > 1) {
        // Paste or SMS autofill landing in a single box: spread it across the group.
        const chars = typed.slice(0, verifyOtpBoxes.length - index).split("");
        chars.forEach((char, offset) => {
          const target = verifyOtpBoxes[index + offset];
          if (target) target.value = char;
        });
        focusOtpBox(index + chars.length);
      } else {
        box.value = typed;
        if (typed) focusOtpBox(index + 1);
      }
      syncVerifyCodeButton();
      if (!verifyCodeBtn.disabled && otpValue().length === verifyOtpBoxes.length) {
        submitVerificationCode();
      }
    });

    box.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !box.value && index > 0) {
        e.preventDefault();
        verifyOtpBoxes[index - 1].value = "";
        focusOtpBox(index - 1);
        syncVerifyCodeButton();
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusOtpBox(index - 1);
      } else if (e.key === "ArrowRight" && index < verifyOtpBoxes.length - 1) {
        e.preventDefault();
        focusOtpBox(index + 1);
      }
    });

    box.addEventListener("paste", (e) => {
      const pasted = (e.clipboardData || window.clipboardData);
      if (!pasted) return;
      e.preventDefault();
      setOtpValue(digitsOnly(pasted.getData("text")));
      focusOtpBox(verifyOtpBoxes.length - 1);
      syncVerifyCodeButton();
      if (!verifyCodeBtn.disabled) submitVerificationCode();
    });

    box.addEventListener("focus", () => {
      if (box.select) box.select();
    });
  });

  closeAccountBtn.addEventListener("click", closeAccountDrawer);
  accountOverlayWrapper.addEventListener("click", (e) => {
    if (e.target === accountOverlayWrapper) closeAccountDrawer();
  });
  accountBackBtn.addEventListener("click", () => {
    accountState.activeOrder = null;
    renderAccountOrders();
  });
  accountSignoutBtn.addEventListener("click", handleAccountSignOut);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (verifyFlow.open) {
        closeVerifyModal();
      } else if (accountOverlayWrapper.classList.contains("active")) {
        closeAccountDrawer();
      }
      return;
    }
    if (e.key !== "Tab") return;
    if (verifyFlow.open) {
      trapOverlayFocus(verifyModalPanel, e);
    } else if (accountOverlayWrapper.classList.contains("active")) {
      trapOverlayFocus(accountDrawerPanel, e);
    }
  });
}

function trapOverlayFocus(container, event) {
  if (!container) return;
  const candidates = container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const focusable = Array.prototype.filter.call(candidates, (el) => el.offsetParent !== null);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

// Start app
document.addEventListener("DOMContentLoaded", init);
