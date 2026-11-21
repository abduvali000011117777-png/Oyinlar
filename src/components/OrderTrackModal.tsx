import { FormEvent, useState } from 'react';
import { Search, X } from 'lucide-react';
import { OrderItemSummary, OrderStatus } from '../types/store';
import { formatUzs } from './ProductDetailModal';

interface OrderTrackModalProps {
  onClose: () => void;
}

interface TrackedOrder {
  orderCode: string;
  status: OrderStatus;
  totalUzs: number;
  items: OrderItemSummary[];
  createdAt: number;
  telegramSent: boolean;
}

export default function OrderTrackModal({ onClose }: OrderTrackModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TrackedOrder | null>(null);

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(code.trim())}`);
      const data = (await res.json()) as { order?: TrackedOrder; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || 'Buyurtma topilmadi.');
      } else {
        setResult(data.order);
      }
    } catch {
      setError('Server bilan aloqa xatosi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white text-zinc-950 rounded-3xl border border-zinc-200 p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-zinc-950">Buyurtmani kuzatish</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleTrack} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Masalan: OM-1001"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm font-mono uppercase"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? '...' : 'Tekshirish'}</span>
          </button>
        </form>

        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

        {result && (
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-zinc-950">#{result.orderCode}</span>
              <span className="font-bold text-orange-600">{result.status}</span>
            </div>
            <div className="space-y-1 text-xs text-zinc-600">
              {result.items.map((it, i) => (
                <p key={i}>
                  • {it.name} ({it.storage}) × {it.quantity}
                </p>
              ))}
            </div>
            <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-950">
              <span>Jami:</span>
              <span className="font-mono tabular-nums">{formatUzs(result.totalUzs)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
