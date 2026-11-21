import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  OrderRecord,
  OrderStatus,
  PhoneCategory,
  PhoneProduct,
  TelegramConfigStatus,
} from '../types/store';
import { formatUzs } from './ProductDetailModal';

interface AdminPanelProps {
  onClose: () => void;
  onProductsUpdated: () => void;
}

const IMAGE_PRESETS = [
  {
    label: 'Qora Titan Pro',
    url: '/src/assets/images/phone_pro_titanium_1795242059850.jpg',
  },
  {
    label: 'Olovrang Ultra',
    url: '/src/assets/images/phone_ultra_orange_1795242059196.jpg',
  },
  {
    label: 'Bukiluvchi Obsidian',
    url: '/src/assets/images/phone_fold_obsidian_1795242059367.jpg',
  },
  {
    label: 'Marvarid Oq Air',
    url: '/src/assets/images/phone_air_white_1795242059176.jpg',
  },
];

const ORDER_STATUSES: OrderStatus[] = [
  'Yangi',
  'Tasdiqlandi',
  'Yetkazilmoqda',
  'Yetkazildi',
  'Bekor qilindi',
];

export default function AdminPanel({ onClose, onProductsUpdated }: AdminPanelProps) {
  const [authStatus, setAuthStatus] = useState<{ configured: boolean; envLocked: boolean } | null>(
    null
  );
  const [adminToken, setAdminToken] = useState<string>('');
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<'orders' | 'products' | 'telegram'>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<PhoneProduct[]>([]);
  const [tgStatus, setTgStatus] = useState<TelegramConfigStatus | null>(null);

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('Apple');
  const [newCategory, setNewCategory] = useState<PhoneCategory>('flagman');
  const [newPrice, setNewPrice] = useState('12500000');
  const [newStock, setNewStock] = useState('10');
  const [newImage, setNewImage] = useState(IMAGE_PRESETS[1].url);
  const [newDesc, setNewDesc] = useState('');
  const [productMsg, setProductMsg] = useState('');

  // Telegram Form State
  const [botTokenInput, setBotTokenInput] = useState('');
  const [channelIdInput, setChannelIdInput] = useState('');
  const [tgFeedback, setTgFeedback] = useState('');
  const [tgBusy, setTgBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth-status')
      .then((r) => r.json())
      .then((data) => setAuthStatus(data))
      .catch(() => setAuthStatus({ configured: true, envLocked: false }));
  }, []);

  const loadAdminData = useCallback(async (token: string) => {
    const headers = { Authorization: `Bearer ${token}` };
    const [ordRes, prodRes, tgRes] = await Promise.all([
      fetch('/api/admin/orders', { headers }),
      fetch('/api/products'),
      fetch('/api/admin/telegram-status', { headers }),
    ]);
    if (ordRes.status === 401) {
      setAdminToken('');
      return;
    }
    const ordData = (await ordRes.json()) as { orders?: OrderRecord[] };
    const prodData = (await prodRes.json()) as { products?: PhoneProduct[] };
    const tgData = (await tgRes.json()) as TelegramConfigStatus;

    setOrders(ordData.orders || []);
    setProducts(prodData.products || []);
    setTgStatus(tgData);
    if (tgData.channelId) setChannelIdInput(tgData.channelId);
  }, []);

  useEffect(() => {
    if (adminToken) {
      void loadAdminData(adminToken);
    }
  }, [adminToken, loadAdminData]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const endpoint = authStatus?.configured ? '/api/admin/login' : '/api/admin/setup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Kirish amalga oshmadi.');
      } else {
        setAdminToken(data.token);
        setPasscode('');
      }
    } catch {
      setAuthError('Server bilan aloqa xatosi.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status, notifyTelegram: true }),
    });
    if (res.ok) {
      const data = (await res.json()) as { order: OrderRecord };
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    }
  };

  const handleResendTelegram = async (orderId: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}/resend-telegram`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { order: OrderRecord };
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    setProductMsg('');
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: newName,
        brand: newBrand,
        category: newCategory,
        priceUzs: Number(newPrice),
        stock: Number(newStock),
        imageUrl: newImage,
        description: newDesc,
        featured: true,
      }),
    });
    const data = (await res.json()) as { product?: PhoneProduct; error?: string };
    if (!res.ok || !data.product) {
      setProductMsg(data.error || 'Saqlashda xatolik.');
      return;
    }
    setProducts((prev) => [data.product!, ...prev]);
    setNewName('');
    setNewDesc('');
    setProductMsg('Yangi telefon katalogga qo‘shildi.');
    onProductsUpdated();
  };

  const handleQuickStockAdjust = async (product: PhoneProduct, delta: number) => {
    const nextStock = Math.max(0, product.stock + delta);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ stock: nextStock }),
    });
    if (res.ok) {
      const data = (await res.json()) as { product: PhoneProduct };
      setProducts((prev) => prev.map((p) => (p.id === product.id ? data.product : p)));
      onProductsUpdated();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      onProductsUpdated();
    }
  };

  const handleSaveTelegram = async (e: FormEvent) => {
    e.preventDefault();
    setTgFeedback('');
    setTgBusy(true);
    try {
      const res = await fetch('/api/admin/telegram-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          botToken: botTokenInput,
          channelId: channelIdInput,
          sendTest: true,
        }),
      });
      const data = (await res.json()) as {
        status?: TelegramConfigStatus;
        testResult?: { sent: boolean; info: string };
        error?: string;
      };
      if (!res.ok) {
        setTgFeedback(data.error || 'Sozlashda xatolik yuz berdi.');
      } else {
        if (data.status) setTgStatus(data.status);
        setBotTokenInput('');
        setTgFeedback(
          data.testResult?.sent
            ? 'Saqlandi va Telegram kanalga test xabar yuborildi!'
            : `Saqlandi, lekin test xabar yuborilmadi: ${data.testResult?.info ?? ''}`
        );
      }
    } catch {
      setTgFeedback('Tarmoq xatosi.');
    } finally {
      setTgBusy(false);
    }
  };

  const totalRevenue = orders
    .filter((o) => o.status !== 'Bekor qilindi')
    .reduce((sum, o) => sum + o.totalUzs, 0);
  const newOrdersCount = orders.filter((o) => o.status === 'Yangi').length;
  const deliveredCount = orders.filter((o) => o.status === 'Yetkazildi').length;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 flex flex-col overflow-y-auto text-zinc-950">
      <header className="bg-zinc-950 text-white border-b border-zinc-800 px-4 sm:px-8 h-16 flex items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-extrabold tracking-tight">OLOV MOBILE · Admin Panel</h2>
        </div>

        <div className="flex items-center gap-3">
          {adminToken && (
            <button
              type="button"
              onClick={() => setAdminToken('')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Do‘konga qaytish</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        {!adminToken ? (
          <div className="max-w-md mx-auto mt-10 bg-white rounded-3xl border border-zinc-200 p-7 sm:p-9 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            {authStatus && !authStatus.configured ? (
              <>
                <div>
                  <h3 className="text-2xl font-extrabold text-zinc-950">
                    Admin parolini o‘rnatish
                  </h3>
                  <p className="text-sm text-zinc-600 mt-1">
                    Birinchi marta kirayotganingiz uchun kamida 6 ta belgidan iborat admin parolini yarating.
                  </p>
                </div>
              </>
            ) : (
              <div>
                <h3 className="text-2xl font-extrabold text-zinc-950">Admin panelga kirish</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  Buyurtmalar, mahsulotlar va Telegram botni boshqarish uchun parolni kiriting.
                </p>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Admin paroli
                </label>
                <input
                  type="password"
                  required
                  minLength={authStatus && !authStatus.configured ? 6 : 1}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm"
                />
                {authError && <p className="text-xs text-rose-600 mt-2">{authError}</p>}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm cursor-pointer disabled:opacity-50"
              >
                {authLoading
                  ? 'Tekshirilmoqda...'
                  : authStatus && !authStatus.configured
                    ? 'Parolni saqlash va kirish'
                    : 'Kirish'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-zinc-200">
                <p className="text-xs text-zinc-500">Umumiy savdo</p>
                <p className="text-xl font-extrabold font-mono text-zinc-950 tabular-nums mt-1">
                  {formatUzs(totalRevenue)}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-zinc-200">
                <p className="text-xs text-zinc-500">Yangi buyurtmalar</p>
                <p className="text-xl font-extrabold font-mono text-orange-600 tabular-nums mt-1">
                  {newOrdersCount} ta
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-zinc-200">
                <p className="text-xs text-zinc-500">Yetkazilgan</p>
                <p className="text-xl font-extrabold font-mono text-emerald-600 tabular-nums mt-1">
                  {deliveredCount} ta
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-zinc-200">
                <p className="text-xs text-zinc-500">Katalogdagi modellar</p>
                <p className="text-xl font-extrabold font-mono text-zinc-950 tabular-nums mt-1">
                  {products.length} ta
                </p>
              </div>
            </div>

            {/* Segmented Tab Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-zinc-200">
              <div className="flex items-center gap-1">
                {[
                  { id: 'orders' as const, label: `Buyurtmalar (${orders.length})` },
                  { id: 'products' as const, label: `Mahsulotlar (${products.length})` },
                  { id: 'telegram' as const, label: 'Telegram Bot' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      tab === t.id
                        ? 'bg-zinc-950 text-white'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void loadAdminData(adminToken)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yangilash</span>
              </button>
            </div>

            {/* TAB 1: ORDERS */}
            {tab === 'orders' && (
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                {orders.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <Package className="w-10 h-10 text-zinc-300 mx-auto" />
                    <p className="text-base font-bold text-zinc-900">Hali buyurtmalar kelib tushmagan</p>
                    <p className="text-sm text-zinc-500">
                      Mijozlar savat orqali buyurtma berganda ular shu yerda va Telegram kanalingizda darhol paydo bo‘ladi.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200">
                    {orders.map((ord) => (
                      <div key={ord.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-orange-600">#{ord.orderCode}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-zinc-500">
                              {new Date(ord.createdAt).toLocaleString('uz-UZ')}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className={ord.telegramSent ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                              {ord.telegramSent ? 'Telegramga yuborilgan' : 'Telegramga yuborilmagan'}
                            </span>
                          </div>
                          <p className="text-base font-bold text-zinc-950">
                            {ord.customerName} — <span className="font-mono">{ord.phone}</span>
                          </p>
                          <p className="text-xs text-zinc-600">
                            {ord.city}, {ord.address} · To‘lov: {ord.paymentMethod}
                          </p>
                          <div className="text-xs text-zinc-700 pt-1">
                            {ord.items.map((it, idx) => (
                              <span key={idx} className="mr-3">
                                • {it.name} ({it.storage}, {it.color}) × {it.quantity}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <span className="text-base font-extrabold font-mono text-zinc-950 tabular-nums">
                            {formatUzs(ord.totalUzs)}
                          </span>

                          <select
                            value={ord.status}
                            onChange={(e) =>
                              void handleOrderStatusChange(ord.id, e.target.value as OrderStatus)
                            }
                            className="px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold bg-white focus:border-orange-500 focus:outline-none"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => void handleResendTelegram(ord.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 text-orange-600" />
                            <span>Telegramga yuborish</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PRODUCTS */}
            {tab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <form
                  onSubmit={handleAddProduct}
                  className="lg:col-span-4 bg-white rounded-2xl border border-zinc-200 p-5 space-y-3.5"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-600" />
                    <h3 className="text-base font-bold text-zinc-950">Yangi telefon qo‘shish</h3>
                  </div>

                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Model nomi (masalan: iPhone 16 Pro)"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      placeholder="Brend"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm"
                    />
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as PhoneCategory)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm bg-white"
                    >
                      <option value="flagman">Flagman</option>
                      <option value="biznes">Biznes</option>
                      <option value="bukiluvchan">Bukiluvchi</option>
                      <option value="hamyonbop">Hamyonbop</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      min="100000"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Narxi (so‘m)"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm font-mono"
                    />
                    <input
                      type="number"
                      required
                      min="0"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      placeholder="Soni"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm font-mono"
                    />
                  </div>
                  <select
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm bg-white"
                  >
                    {IMAGE_PRESETS.map((p) => (
                      <option key={p.url} value={p.url}>
                        Rasm: {p.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Qisqacha tavsif..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm"
                  />

                  {productMsg && <p className="text-xs font-medium text-emerald-600">{productMsg}</p>}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm cursor-pointer"
                  >
                    Katalogga qo‘shish
                  </button>
                </form>

                <div className="lg:col-span-8 bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-200">
                  {products.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover bg-zinc-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-950 truncate">{p.name}</p>
                          <p className="text-xs text-zinc-500">
                            {p.brand} · <span className="font-mono font-semibold text-zinc-900">{formatUzs(p.priceUzs)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleQuickStockAdjust(p, -1)}
                          className="w-7 h-7 rounded-lg border border-zinc-300 text-xs font-bold hover:bg-zinc-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold w-12 text-center tabular-nums">
                          {p.stock} ta
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleQuickStockAdjust(p, 1)}
                          className="w-7 h-7 rounded-lg border border-zinc-300 text-xs font-bold hover:bg-zinc-100 cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteProduct(p.id)}
                          aria-label="O‘chirish"
                          className="p-2 text-zinc-400 hover:text-rose-600 cursor-pointer ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TELEGRAM BOT CONFIG */}
            {tab === 'telegram' && (
              <div className="max-w-xl bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-950">Telegram Bot va Kanal ulanishi</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Har bir yangi buyurtma avtomatik ravishda ko‘rsatilgan Telegram kanalga real vaqtda yuboriladi.
                    </p>
                  </div>
                  {tgStatus?.configured && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      Ulangan
                    </span>
                  )}
                </div>

                {tgStatus && (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1 font-mono">
                    <p>
                      Holat: <span className="font-bold">{tgStatus.configured ? 'Faol' : 'Sozlanmagan'}</span> ({tgStatus.source})
                    </p>
                    {tgStatus.maskedToken && <p>Token: {tgStatus.maskedToken}</p>}
                    {tgStatus.channelId && <p>Kanal ID: {tgStatus.channelId}</p>}
                  </div>
                )}

                <form onSubmit={handleSaveTelegram} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Telegram Bot Token
                    </label>
                    <input
                      type="password"
                      value={botTokenInput}
                      onChange={(e) => setBotTokenInput(e.target.value)}
                      placeholder="BotFather tokenini kiriting (123456:ABC...)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-mono focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Kanal ID (yoki @kanal_nomi)
                    </label>
                    <input
                      type="text"
                      value={channelIdInput}
                      onChange={(e) => setChannelIdInput(e.target.value)}
                      placeholder="-100..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-mono focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  {tgFeedback && <p className="text-xs font-medium text-orange-600">{tgFeedback}</p>}

                  <button
                    type="submit"
                    disabled={tgBusy}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-orange-400" />
                    <span>{tgBusy ? 'Tekshirilmoqda...' : 'Saqlash va Test xabar yuborish'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
