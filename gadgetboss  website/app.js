// --- PRODUCT DATABASE (100% Centuryboy Hub Authenticity) ---
const PRODUCTS = [
  {
    id: "airpods-pro-3",
    title: "AirPods Pro 3 Vault Edition",
    category: "airpods",
    price: 340,
    oldPrice: 500,
    stock: 12,
    image: "assets/airpods-pro-3.jpg",
    rating: 5.0,
    reviewsCount: 128,
    badge: "IOS 26 VERIFIED",
    tagline: "H2 Apple Silicon, Custom Driver, 30h MagSafe",
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
    badge: "BEST SELLER",
    tagline: "Adaptive Transparency, Low-Distortion Audio",
    specs: { driver: "Low-Distortion", battery: "6hrs (30hrs w/ Case)", chip: "H2 Chip", charging: "Lightning / MagSafe", transparency: "Adaptive" }
  },
  {
    id: "airpods-pro-v1",
    title: "AirPods Pro V1 Elite",
    category: "airpods",
    price: 160,
    oldPrice: 200,
    stock: 3,
    image: "assets/airpods-pro-v1.jpg",
    rating: 4.7,
    reviewsCount: 89,
    badge: "V.1 LIMITED",
    tagline: "Active Noise Cancellation, Smart H1 Chip",
    specs: { driver: "High-Excursion", battery: "4.5hrs (24hrs w/ Case)", chip: "H1 Chip", charging: "Lightning", anc: "Active" }
  },
  {
    id: "airpods-3",
    title: "AirPods 3 Premium",
    category: "airpods",
    price: 170,
    oldPrice: 230,
    stock: 15,
    image: "assets/airpods-3-new.webp",
    rating: 4.8,
    reviewsCount: 64,
    badge: "POPULAR",
    tagline: "Personalized Spatial Audio, Sweat-Resistant",
    specs: { audio: "Spatial Audio", battery: "6hrs Total", design: "Contoured", water: "IPX4", charging: "MagSafe Inc." }
  },
  {
    id: "airpods-4",
    title: "AirPods 4 Edition",
    category: "airpods",
    price: 260,
    oldPrice: 350,
    stock: 20,
    image: "assets/airpods4.jpg",
    rating: 4.5,
    reviewsCount: 156,
    badge: "BUDGET",
    tagline: "Instant Device Switch, Optical Sensor Detect",
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
    badge: "ELITE PRODUCTS",
    tagline: "40mm Dynamic Driver, High-Fidelity ANC Audio",
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
    badge: "ORIGINAL",
    tagline: "20W Max Power Delivery, Secure Fast Charging",
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
    badge: "MFI CERTIFIED",
    tagline: "MFi Certified Braided Cable, 30W Charging",
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
    badge: "ORIGINAL",
    tagline: "TPE High-Speed Sync, 60W Power Delivery",
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
    badge: "PREMIUM",
    tagline: "96W PD Power Source, Smart Current Safeguard",
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
    badge: "HOT",
    tagline: "5k mAh MagSafe Power Bank, Pass-Through Charging",
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
    badge: "WIRELESS",
    tagline: "10k mAh Wireless, Digital LED Indicator",
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
    badge: "CONTACT FOR PRICE",
    tagline: "500GB/1TB Console, 1 DualShock Controller",
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
    badge: "CONTACT FOR PRICE",
    tagline: "1TB 4K UHD Console, Enhanced 5GHz Wifi",
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
    badge: "NEW ARRIVAL",
    tagline: "1TB High-Speed SSD Console, 4K 120Hz Output",
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
    badge: "IN STOCK",
    tagline: "825GB SSD, Native 4K HDR 120Hz Output",
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
    badge: "PREMIUM",
    tagline: "2TB SSD, Native 8K 60Hz, AI PSSR Scaling",
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
    badge: "ORIGINAL",
    tagline: "Haptic Feedback, Responsive Adaptive Triggers",
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
    badge: "BEST SELLER",
    tagline: "2-Point Touch Pad, Integrated Light Bar",
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
    badge: "PROMO",
    tagline: "360° Auto Rotation, Smart AI Face Tracking",
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
    badge: "HOT DROP",
    tagline: "Peltier Cooling Fan, RGB Aura Sync",
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
    badge: "PROMO",
    tagline: "4K 60fps Passthrough, Zero-Latency Streaming",
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


// --- WISHLIST STATE VAULT ---
let wishlist = [];

// --- DOM ELEMENT REFERENCES ---
const productsGrid = document.getElementById("products-catalog-grid");
const featuredProductSlot = document.getElementById("featured-product-slot");
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
const productDetailBodycopy = document.getElementById("product-detail-bodycopy");
const productDetailPrice = document.getElementById("product-detail-price");
const productDetailEstimate = document.getElementById("product-detail-estimate");
const productDetailSpecs = document.getElementById("product-detail-specs");
const productDetailAddToCart = document.getElementById("product-detail-add-to-cart");
const productDetailWhatsApp = document.getElementById("product-detail-whatsapp");
const productDetailPlatform = document.getElementById("product-detail-platform");
const productDetailRelease = document.getElementById("product-detail-release");
const productDetailPriceSide = document.getElementById("product-detail-price-side");

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

// --- APP INITIALIZATION ---
function init() {
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

  renderCategories();
  renderProducts();
  renderCart();
  setupEventListeners();
  
  // Initialize Lucide Icons
  lucide.createIcons();
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
      const category = item.getAttribute("data-category");
      setActiveCategory(category);

      // Scroll to Catalog section smoothly
      const targetSec = document.getElementById("catalog");
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Collection Banner clicks
  const bannerCards = document.querySelectorAll(".banner-card");
  bannerCards.forEach(card => {
    card.addEventListener("click", (e) => {
      const category = card.getAttribute("data-category");
      setActiveCategory(category);
    });
  });

  // Wishlist Action Modal Trigger
  wishlistTrigger.addEventListener("click", () => {
    if (wishlist.length === 0) {
      alert("💖 YOUR WISHLIST\nYour luxury wishlist is currently empty. Explore the catalog drops below to select custom hardware!");
    } else {
      const itemsList = wishlist.map(id => {
        const p = PRODUCTS.find(prod => prod.id === id);
        if (!p) return "";
        return `- ${p.title} (${p.price > 0 ? 'GHS ' + p.price.toLocaleString() : 'Inquire Now'})`;
      }).filter(Boolean).join("\n");
      alert(`💖 YOUR WISHLIST\nYou have serial-pinned the following verified products to your wishlist:\n\n${itemsList}\n\nAdd them to your cart when you are ready to check out!`);
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
    toggleCartDrawer(true);
  });

  // checkout actions
  checkoutWhatsappBtn.addEventListener("click", () => openCheckoutModal("whatsapp"));

  closeCheckoutModalBtn.addEventListener("click", closeCheckoutModal);
  checkoutModalOverlay.addEventListener("click", (e) => {
    if (e.target === checkoutModalOverlay) closeCheckoutModal();
  });

  checkoutDetailsForm.addEventListener("submit", handleCheckoutSubmit);

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
    alert(`🎯 WELCOME TO THE INNER CIRCLE!\nYour email (${email}) has been authorized for GADGETBO$$ drops notifications.`);
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
function renderCategories() {
  const categories = ["all", ...new Set(PRODUCTS.map(p => p.category))];
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
        <span class="tab-icon-wrap">
          <i data-lucide="${meta.icon}"></i>
        </span>
        <span class="tab-text">${meta.label}</span>
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
          <p>No products match the current vault filter.</p>
        </div>
      `;
    }
    productsGrid.innerHTML = `
      <div class="no-results">
        <i data-lucide="alert-triangle" style="width: 48px; height: 48px; color: var(--accent-gold); margin-bottom: 16px;"></i>
        <p>No high-end tech matching your parameters inside the vault.</p>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px;">Try refining your query or resetting filter tabs.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const heroProduct = filtered[0];
  const browseProducts = filtered;

  if (featuredProductSlot && heroProduct) {
    const heroPrice = heroProduct.price === 0
      ? "Price on Request"
      : new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(heroProduct.price);
    featuredProductSlot.innerHTML = `
      <article class="featured-product-card product-card" data-id="${heroProduct.id}" role="button" tabindex="0" aria-label="Open details for ${heroProduct.title}">
        <div class="featured-product-media">
          <img src="${heroProduct.image}" alt="${heroProduct.title}" class="featured-product-image">
          <span class="featured-availability">${heroProduct.price > 0 ? "Accra Vault Available" : "Contact for Availability"}</span>
          <button class="featured-quick-add" data-id="${heroProduct.id}" aria-label="Quick add ${heroProduct.title}">
            <i data-lucide="plus"></i>
          </button>
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
          <button class="featured-buy-btn" data-id="${heroProduct.id}">
            <span>BUY</span>
            <i data-lucide="shopping-bag"></i>
          </button>
        </div>
      </article>
    `;
  }

  productsGrid.innerHTML = browseProducts.map(prod => {
    // Badge styling
    let badgeClass = "prod-badge";
    const badgeUpper = prod.badge.toUpperCase();
    if (badgeUpper.includes("LIMIT") || badgeUpper.includes("ELITE") || badgeUpper.includes("VERIFIED")) {
      badgeClass += " limited";
    } else if (badgeUpper.includes("BEST") || badgeUpper.includes("HOT") || badgeUpper.includes("ARRIVAL")) {
      badgeClass += " best";
    } else if (badgeUpper.includes("NEW") || badgeUpper.includes("ORIGINAL") || badgeUpper.includes("PROMO")) {
      badgeClass += " new";
    }
    const badgeLabel = badgeUpper;

    // Localized formatting (Ghana GHS)
    let priceFormatted = "";
    let isContactOnly = prod.price === 0;

    if (isContactOnly) {
      priceFormatted = "Price on Request";
    } else {
      priceFormatted = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(prod.price);
    }

    return `
      <div class="product-card vault-thumb-card" data-id="${prod.id}" role="button" tabindex="0" aria-label="Open details for ${prod.title}">
        <div class="prod-img-container vault-thumb-image">
          <span class="${badgeClass}">${badgeLabel}</span>
          <button class="card-wishlist-pin ${wishlist.includes(prod.id) ? 'pinned' : ''}" data-id="${prod.id}" aria-label="Pin to Wishlist">
            <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${wishlist.includes(prod.id) ? 'currentColor' : 'none'};"></i>
          </button>
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
            <a href="https://wa.me/${WHATSAPP_PHONE}?text=Hi%20Centuryboy!%20I'm%20interested%20in%20the%20${encodeURIComponent(prod.title)}.%20Please%20let%20me%20know%20the%20current%20price%20and%20availability!" target="_blank" class="btn-add-cart inquire-whatsapp-btn" style="color: var(--accent-gold); border-color: rgba(var(--accent-gold-rgb), 0.3); text-decoration: none; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="message-square" style="width: 16px; height: 16px;"></i>
              <span>INQUIRE NOW</span>
            </a>
          ` : `
            <button class="btn-add-cart add-to-cart-btn" data-id="${prod.id}">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
              <span>ADD TO CART</span>
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

  const existing = cart.find(item => item.product.id === productId);
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
        <i data-lucide="shopping-bag" style="width: 64px; height: 64px; color: var(--text-muted);"></i>
        <div>
          <h4 style="font-weight: 700; margin-bottom: 6px;">Your Cart is Empty</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Browse the storefront drops catalog and add items.</p>
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
              
              <button class="btn-remove-item" data-id="${item.product.id}">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                <span>Remove</span>
              </button>
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

function formatProductPrice(product) {
  if (product.price === 0) return "Price on Request";
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(product.price);
}

function openProductDetail(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  activeProductDetail = product;

  const price = formatProductPrice(product);
  const estimate = product.price === 0
    ? "Contact us on WhatsApp for live pricing and availability."
    : "";

  const platformLabel = product.category === "playstation" ? "PS5" : product.category === "airpods" ? "iOS" : product.category.charAt(0).toUpperCase() + product.category.slice(1);
  productDetailImage.src = product.image;
  productDetailImage.alt = product.title;
  productDetailTitle.textContent = product.title;
  productDetailTagline.textContent = product.tagline;
  productDetailBodycopy.textContent = product.price === 0
    ? "Contact our vault for availability, pricing, and delivery timing."
    : "Premium finish. Smooth performance. Built for the GadgetBO$$ vault experience.";
  productDetailPrice.textContent = price;
  productDetailEstimate.textContent = estimate;
  productDetailPlatform.textContent = platformLabel;
  productDetailRelease.textContent = "Fall 2026";
  productDetailPriceSide.textContent = price;

  const specEntries = [
    ["Futuristic Design", "Premium finish"],
    ["Built-in Microphone", product.specs?.microphone || "High clarity"],
    ["Haptic Feedback", product.specs?.feedback || "Responsive"],
    ["Fast Charge", product.specs?.charging || "USB-C"]
  ];
  productDetailSpecs.innerHTML = specEntries.map(([label, value], idx) => `
    <div class="product-detail-spec">
      <span class="product-detail-spec-icon"><i data-lucide="${["gamepad-2","mic","sparkles","zap"][idx]}"></i></span>
      <div>
        <span class="product-detail-spec-label">${label}</span>
        <span class="product-detail-spec-value">${value}</span>
      </div>
    </div>
  `).join("");

  productDetailWhatsApp.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(`Hi! I'm interested in ${product.title}. Please share price, stock and delivery details.`)}`;
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

  // Only show if user has scrolled past hero block (approx 500px)
  if (window.scrollY > 500) {
    stickyBottomBar.classList.add("active");
  } else {
    stickyBottomBar.classList.remove("active");
  }
}

// --- CHECKOUT DETAILED MODAL CONTROLLERS ---
function openCheckoutModal(type) {
  if (cart.length === 0) return;
  if (type !== "whatsapp") {
    alert("Online payment is temporarily unavailable while secure Paystack verification is being configured. Please order via WhatsApp.");
    return;
  }
  
  currentCheckoutType = type;
  toggleCartDrawer(false); // Close cart panel
  
  // Format summary details
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const priceFormatted = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(totalPrice);

  summaryItemsCount.innerText = `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;
  summaryTotalPrice.innerText = priceFormatted;

  // Custom styling based on checkout category
  const momoFields = document.getElementById("momo-fields-container");
  
  if (type === "whatsapp") {
    checkoutModalTitle.innerText = "WhatsApp Order Credentials";
    modalSubmitBtn.className = "btn-modal-action whatsapp";
    modalSubmitBtn.innerHTML = `
      <i data-lucide="message-square"></i>
      <span>COMPILE WHATSAPP BILL</span>
    `;
    momoFields.style.display = "none"; // No MOMO networks choice needed on this form, WhatsApp direct setup handles
  } else {
    checkoutModalTitle.innerText = "Secure Paystack Credentials";
    modalSubmitBtn.className = "btn-modal-action paystack";
    modalSubmitBtn.innerHTML = `
      <i data-lucide="credit-card"></i>
      <span>INITIATE SECURE PAYMENTS</span>
    `;
    momoFields.style.display = "block"; // Choose MoMo provider
  }

  checkoutModalOverlay.classList.add("active");
  lucide.createIcons();
}

function closeCheckoutModal() {
  checkoutModalOverlay.classList.remove("active");
}

// --- SUBMIT CHECKOUT FORM LOGIC ---
function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  // Extract values
  const name = document.getElementById("cust-name").value.trim();
  const email = document.getElementById("cust-email").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalPriceFormatted = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(totalPrice);

  closeCheckoutModal();

  if (currentCheckoutType === "whatsapp") {
    // Compile WhatsApp message string
    let messageText = `🔥 *GADGETBO$$ ORDER* 🔥\n`;
    messageText += `=========================\n\n`;
    messageText += `👤 *Client Name:* ${name}\n`;
    messageText += `✉️ *Client Email:* ${email}\n`;
    messageText += `📞 *WhatsApp Contact:* ${phone}\n\n`;
    messageText += `📦 *HARDWARE CART BASKET:*\n`;
    
    cart.forEach((item, idx) => {
      const itemPrice = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(item.product.price * item.quantity);
      messageText += `${idx + 1}. *${item.product.title}* x ${item.quantity} (${itemPrice})\n`;
    });
    
    messageText += `\n=========================\n`;
    messageText += `💰 *TOTAL PAYABLE:* ${totalPriceFormatted}\n`;
    messageText += `🚚 *SHIPPING:* Insured Express Delivery (Free)\n\n`;
    messageText += `Please verify my hardware drop and send the processing credentials! 🚀`;

    // Encode text query
    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedText}`;

    window.open(whatsappUrl, "_blank");
    return;
  }

  alert("Online card and mobile-money checkout is temporarily unavailable. Please use WhatsApp to request an order.");
}

// Start app
document.addEventListener("DOMContentLoaded", init);
