import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import AdminPanel from './components/AdminPanel';
import CartCheckoutDrawer from './components/CartCheckoutDrawer';
import OrderTrackModal from './components/OrderTrackModal';
import ProductDetailModal, { formatUzs } from './components/ProductDetailModal';
import { CartItem, PhoneCategory, PhoneProduct } from './types/store';

const HERO_IMAGE = '/src/assets/images/hero_flagship_phones_1795242059725.jpg';

const CATEGORY_TABS: Array<{ id: 'all' | PhoneCategory; label: string }> = [
  { id: 'all', label: 'Barchasi' },
  { id: 'flagman', label: 'Flagman' },
  { id: 'biznes', label: 'Biznes' },
  { id: 'bukiluvchan', label: 'Bukiluvchi' },
  { id: 'hamyonbop', label: 'Hamyonbop' },
];

export default function App() {
  const [products, setProducts] = useState<PhoneProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | PhoneCategory>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [searchQuery, setSearchQuery] = useState('');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PhoneProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('olov_mobile_cart_v1');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('olov_mobile_cart_v1', JSON.stringify(cart));
    } catch {
      // Ignore storage quota issues
    }
  }, [cart]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = (await res.json()) as { products?: PhoneProduct[] };
      if (Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch {
      // Keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const brands = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.brand)));
    return unique.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.priceUzs - b.priceUzs);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.priceUzs - a.priceUzs);
    }
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [products, selectedCategory, selectedBrand, searchQuery, sortBy]);

  const addToCart = (
    product: PhoneProduct,
    storage: string,
    color: string,
    openDrawer = false
  ) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === product.id && i.storage === storage && i.color === color
      );
      if (idx !== -1) {
        return prev.map((item, i) =>
          i === idx ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          imageUrl: product.imageUrl,
          storage,
          color,
          unitPriceUzs: product.priceUzs,
          quantity: 1,
        },
      ];
    });

    setQuickAddedId(product.id);
    window.setTimeout(() => setQuickAddedId(null), 1100);
    if (openDrawer) setCartOpen(true);
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, i) =>
          i === index ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col">
      {/* Strict 3-Zone Black Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#bosh-sahifa"
            className="text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            OLOV <span className="text-orange-500">MOBILE</span>
          </a>

          {/* Zone 2: Desktop Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <a href="#bosh-sahifa" className="hover:text-orange-400 transition-colors whitespace-nowrap shrink-0">
              Bosh sahifa
            </a>
            <a href="#katalog" className="hover:text-orange-400 transition-colors whitespace-nowrap shrink-0">
              Katalog
            </a>
            <button
              type="button"
              onClick={() => setTrackOpen(true)}
              className="hover:text-orange-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Kuzatuv
            </button>
            <a href="#afzalliklar" className="hover:text-orange-400 transition-colors whitespace-nowrap shrink-0">
              Afzalliklar
            </a>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="hover:text-orange-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Admin
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="tabular-nums">Savat ({totalCartCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Menyuni ochish"
              className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Interactive Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-2 text-sm font-medium">
            <a
              href="#bosh-sahifa"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-zinc-200 hover:text-orange-400"
            >
              Bosh sahifa
            </a>
            <a
              href="#katalog"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-zinc-200 hover:text-orange-400"
            >
              Telefonlar katalogi
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setTrackOpen(true);
              }}
              className="block w-full text-left py-2 text-zinc-200 hover:text-orange-400 cursor-pointer"
            >
              Buyurtmani kuzatish
            </button>
            <a
              href="#afzalliklar"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-zinc-200 hover:text-orange-400"
            >
              Afzalliklar va kafolat
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAdminOpen(true);
              }}
              className="block w-full text-left py-2 text-orange-400 font-bold cursor-pointer"
            >
              Admin panel
            </button>
          </div>
        )}
      </header>

      {/* SECTION 1: HERO (JET BLACK + ORANGE + WHITE CONTRAST) */}
      <section id="bosh-sahifa" className="bg-zinc-950 text-white border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 lg:py-16 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs sm:text-sm font-bold tracking-wide text-orange-500">
                O‘ZBEKISTON ONLINE TELEFON BOZORI
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] [text-wrap:balance]">
                Yangi avlod smartfonlari — bir zumda qo‘lingizda
              </h1>
              <p className="text-base sm:text-lg text-zinc-300 max-w-xl leading-relaxed">
                Rasmiy IMEI ro‘yxatdan o‘tgan original flagmanlar, shaffof narxlar va Telegram kanal orqali real vaqt rejimida tasdiqlanadigan tezkor yetkazib berish.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#katalog"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Katalogni ko‘rish</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setTrackOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Buyurtmani tekshirish</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 min-h-[280px]">
              <img
                src={HERO_IMAGE}
                alt="OLOV MOBILE flagman smartfonlar kolleksiyasi"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover lg:h-full"
              />
            </div>
          </div>

          {/* 4-Column Guarantee Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-zinc-800/80">
            <div>
              <p className="text-lg font-extrabold font-mono text-orange-500 tabular-nums">12 oy</p>
              <p className="text-xs text-zinc-400 mt-0.5">Rasmiy servis kafolati</p>
            </div>
            <div>
              <p className="text-lg font-extrabold font-mono text-white tabular-nums">2 soat</p>
              <p className="text-xs text-zinc-400 mt-0.5">Toshkent bo‘ylab tezkor yetkazish</p>
            </div>
            <div>
              <p className="text-lg font-extrabold font-mono text-white tabular-nums">IMEI 100%</p>
              <p className="text-xs text-zinc-400 mt-0.5">Rasmiy ro‘yxatdan o‘tgan</p>
            </div>
            <div>
              <p className="text-lg font-extrabold font-mono text-orange-500 tabular-nums">Real vaqt</p>
              <p className="text-xs text-zinc-400 mt-0.5">Telegram orqali tezkor qabul</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHITE CATALOG WITH INTERACTIVE MENU & FILTERS */}
      <section id="katalog" className="bg-white text-zinc-950 py-14 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-wide text-orange-600">SMARTFONLAR KATALOGI</p>
              <h2 className="text-3xl font-extrabold text-zinc-950 mt-1">
                O‘zingizga mos modelni tanlang
              </h2>
            </div>
            <p className="text-sm text-zinc-500 tabular-nums">
              Ko‘rsatilmoqda: {filteredProducts.length} ta smartfon
            </p>
          </div>

          {/* Interactive Menu & Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CATEGORY_TABS.map((tab) => {
                const active = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-zinc-950 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Model yoki brend..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>

              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold bg-white focus:border-orange-500 focus:outline-none"
              >
                <option value="all">Barcha brendlar</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
                }
                className="px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold bg-white focus:border-orange-500 focus:outline-none"
              >
                <option value="featured">Ommabop</option>
                <option value="price-asc">Arzondan qimmatga</option>
                <option value="price-desc">Qimmatdan arzonga</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl border border-zinc-200 bg-zinc-50 animate-pulse"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center rounded-3xl border border-zinc-200 bg-zinc-50 space-y-3">
              <p className="text-lg font-bold text-zinc-950">Qidiruv bo‘yicha telefon topilmadi</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedBrand('all');
                  setSearchQuery('');
                }}
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold cursor-pointer"
              >
                Filtrlarni tozalash
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((phone) => {
                const isJustAdded = quickAddedId === phone.id;
                return (
                  <article
                    key={phone.id}
                    className="group rounded-2xl bg-white border border-zinc-200 hover:border-zinc-950 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(phone)}
                      className="block w-full aspect-[4/3] bg-zinc-50 p-5 overflow-hidden cursor-pointer border-b border-zinc-100"
                    >
                      <img
                        src={phone.imageUrl}
                        alt={phone.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="font-bold text-zinc-800 uppercase">{phone.brand}</span>
                          <span aria-hidden="true">·</span>
                          <span>{phone.specs.chip}</span>
                          <span aria-hidden="true">·</span>
                          <span className={phone.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                            {phone.stock > 0 ? `${phone.stock} dona` : 'Tugagan'}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-zinc-950 mt-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(phone)}
                            className="text-left hover:text-orange-600 transition-colors cursor-pointer"
                          >
                            {phone.name}
                          </button>
                        </h3>

                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                          {phone.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-zinc-100">
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-lg font-extrabold font-mono text-zinc-950 tabular-nums">
                            {formatUzs(phone.priceUzs)}
                          </span>
                          {phone.oldPriceUzs && (
                            <span className="text-xs font-mono text-zinc-400 line-through tabular-nums">
                              {formatUzs(phone.oldPriceUzs)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(phone)}
                            className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-300 hover:border-zinc-950 text-xs font-bold text-zinc-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Batafsil
                          </button>
                          <button
                            type="button"
                            disabled={phone.stock <= 0}
                            onClick={() =>
                              addToCart(
                                phone,
                                phone.storageOptions[0] || '256 GB',
                                phone.colorOptions[0] || 'Qora',
                                false
                              )
                            }
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0 ${
                              isJustAdded
                                ? 'bg-zinc-950 text-orange-400'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                            }`}
                          >
                            {isJustAdded ? 'Qo‘shildi ✓' : 'Savatga qo‘shish'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: PROCESS / TRUST (BLACK CONTRAST BAND) */}
      <section id="afzalliklar" className="bg-zinc-950 text-white py-14 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-wide text-orange-500">ISHONCHLI TIZIM</p>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              Onlayn buyurtma qanday ishlaydi?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <p className="text-sm font-mono font-bold text-orange-500">01.</p>
              <h3 className="text-lg font-bold text-white">Model va xotirani tanlang</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Katalogdan smartfon xotira hajmi va rangini belgilab savatga qo‘shing.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <p className="text-sm font-mono font-bold text-orange-500">02.</p>
              <h3 className="text-lg font-bold text-white">Real vaqt Telegram tasdig‘i</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Buyurtmangiz shu zahoti Telegram kanalga va admin panelga yuboriladi.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <p className="text-sm font-mono font-bold text-orange-500">03.</p>
              <h3 className="text-lg font-bold text-white">Eshikkacha yetkazib berish</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Buyurtmani tekshirib olganingizdan so‘ng naqd, karta yoki muddatli to‘lov qilasiz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-zinc-400 py-8 px-4 sm:px-8 border-t border-zinc-900 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-white">
              OLOV <span className="text-orange-500">MOBILE</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              <span>+998 (71) 200-00-00</span>
            </span>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setTrackOpen(true)}
              className="hover:text-white cursor-pointer"
            >
              Buyurtmani kuzatish
            </button>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="hover:text-orange-400 font-semibold cursor-pointer"
            >
              Admin boshqaruv paneli
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      <CartCheckoutDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onOrderCreated={() => {
          setCart([]);
          void fetchProducts();
        }}
      />

      {trackOpen && <OrderTrackModal onClose={() => setTrackOpen(false)} />}

      {adminOpen && (
        <AdminPanel
          onClose={() => setAdminOpen(false)}
          onProductsUpdated={() => void fetchProducts()}
        />
      )}
    </div>
  );
}
