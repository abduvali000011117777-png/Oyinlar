import { FormEvent, useState } from 'react';
import { CheckCircle2, Minus, Plus, Send, ShoppingBag, Trash2, X } from 'lucide-react';
import { CartItem, OrderRecord, PaymentMethod } from '../types/store';
import { formatUzs } from './ProductDetailModal';

interface CartCheckoutDrawerProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onOrderCreated: (order: OrderRecord) => void;
}

export default function CartCheckoutDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onOrderCreated,
}: CartCheckoutDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [city, setCity] = useState('Toshkent');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Naqd');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  if (!open) return null;

  const totalUzs = items.reduce((sum, i) => sum + i.unitPriceUzs * i.quantity, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          city,
          address,
          paymentMethod,
          note,
          items: items.map((i) => ({
            productId: i.productId,
            storage: i.storage,
            color: i.color,
            quantity: i.quantity,
          })),
        }),
      });
      const data = (await res.json()) as { order?: OrderRecord; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || 'Buyurtma yuborishda xatolik yuz berdi.');
      } else {
        setConfirmedOrder(data.order);
        onOrderCreated(data.order);
        setCustomerName('');
        setAddress('');
        setNote('');
      }
    } catch {
      setError('Server bilan aloqa o‘rnatilmadi. Qayta urinib ko‘ring.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/70" onClick={onClose}>
      <aside
        className="w-full max-w-lg bg-white text-zinc-950 h-full flex flex-col border-l border-zinc-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold">
              {confirmedOrder ? 'Buyurtma rasmiylashtirildi' : `Savat (${items.length})`}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              onClose();
            }}
            aria-label="Yopish"
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {confirmedOrder ? (
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-center">
                <CheckCircle2 className="w-12 h-12 text-orange-500 mx-auto" />
                <p className="text-xs font-mono font-bold text-orange-600">
                  BUYURTMA RAQAMI: #{confirmedOrder.orderCode}
                </p>
                <h3 className="text-2xl font-extrabold text-zinc-950">
                  Rahmat, {confirmedOrder.customerName}!
                </h3>
                <p className="text-sm text-zinc-600">
                  Buyurtmangiz qabul qilindi. Operatorlarimiz tez orada {confirmedOrder.phone} raqamiga qo‘ng‘iroq qiladi.
                </p>
                <div className="pt-2 text-xs font-medium text-zinc-700">
                  {confirmedOrder.telegramSent
                    ? '✓ Telegram kanalga real vaqt rejimida yuborildi'
                    : `Telegram holati: ${confirmedOrder.telegramInfo}`}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 space-y-2 text-sm">
                <p className="font-bold text-zinc-950">Chek tafsilotlari</p>
                {confirmedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-zinc-700 gap-2">
                    <span>
                      {it.name} ({it.storage}, {it.color}) × {it.quantity}
                    </span>
                    <span className="font-mono font-semibold tabular-nums shrink-0">
                      {formatUzs(it.lineTotalUzs)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-950">
                  <span>Jami summa:</span>
                  <span className="font-mono text-orange-600 tabular-nums">
                    {formatUzs(confirmedOrder.totalUzs)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  onClose();
                }}
                className="w-full py-3.5 rounded-xl bg-zinc-950 text-white font-bold text-sm hover:bg-zinc-800 cursor-pointer"
              >
                Do‘konga qaytish
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto" />
              <p className="text-base font-bold text-zinc-900">Savatingiz hozircha bo‘sh</p>
              <p className="text-sm text-zinc-500">
                Katalogdan yoqqan smartfonni tanlab, savatga qo‘shing.
              </p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${item.storage}-${item.color}`}
                    className="p-3.5 rounded-2xl border border-zinc-200 flex items-center gap-3.5"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover bg-zinc-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-950 truncate">{item.name}</p>
                      <p className="text-xs text-zinc-500">
                        {item.storage} · {item.color}
                      </p>
                      <p className="text-sm font-mono font-bold text-orange-600 tabular-nums mt-1">
                        {formatUzs(item.unitPriceUzs * item.quantity)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        aria-label="O‘chirish"
                        className="text-zinc-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1.5 border border-zinc-200 rounded-lg px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(idx, -1)}
                          className="p-1 text-zinc-600 hover:text-zinc-950 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-mono font-bold w-5 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(idx, 1)}
                          className="p-1 text-zinc-600 hover:text-zinc-950 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-zinc-200">
                <h3 className="text-base font-bold text-zinc-950">Yetkazib berish ma’lumotlari</h3>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Ismingiz *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Masalan: Jasur Karimov"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Telefon raqam *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Shahar / Viloyat *
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm bg-white"
                    >
                      <option value="Toshkent">Toshkent</option>
                      <option value="Samarqand">Samarqand</option>
                      <option value="Buxoro">Buxoro</option>
                      <option value="Andijon">Andijon</option>
                      <option value="Farg‘ona">Farg‘ona</option>
                      <option value="Namangan">Namangan</option>
                      <option value="Xorazm">Xorazm</option>
                      <option value="Qashqadaryo">Qashqadaryo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Aniq manzil *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Tuman, ko‘cha, uy raqami..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    To‘lov turi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Naqd', 'Karta', 'Muddatli to‘lov'] as PaymentMethod[]).map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                          paymentMethod === pm
                            ? 'bg-zinc-950 text-white border-zinc-950'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Qo‘shimcha izoh
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Masalan: Kechki 18:00 dan keyin..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm"
                  />
                </div>

                {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
              </form>
            </>
          )}
        </div>

        {!confirmedOrder && items.length > 0 && (
          <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-600">Jami to‘lov:</span>
              <span className="text-xl font-extrabold font-mono text-zinc-950 tabular-nums">
                {formatUzs(totalUzs)}
              </span>
            </div>
            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash'}</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
