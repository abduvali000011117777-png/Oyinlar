import { useState } from 'react';
import { Check, Cpu, HardDrive, Battery, Camera, ShoppingBag, X, Zap } from 'lucide-react';
import { PhoneProduct } from '../types/store';

interface ProductDetailModalProps {
  product: PhoneProduct;
  onClose: () => void;
  onAddToCart: (product: PhoneProduct, storage: string, color: string, openDrawer?: boolean) => void;
}

export function formatUzs(amount: number): string {
  return `${amount.toLocaleString('uz-UZ')} so‘m`;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedStorage, setSelectedStorage] = useState(product.storageOptions[0] || '256 GB');
  const [selectedColor, setSelectedColor] = useState(product.colorOptions[0] || 'Qora');
  const [addedFeedback, setAddedFeedback] = useState(false);

  const handleAdd = (buyNow = false) => {
    onAddToCart(product, selectedStorage, selectedColor, buyNow);
    if (!buyNow) {
      setAddedFeedback(true);
      window.setTimeout(() => setAddedFeedback(false), 1400);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/75 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white text-zinc-950 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Product Image Stage */}
        <div className="bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-200 p-6 sm:p-8 flex items-center justify-center relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full max-h-[380px] object-contain rounded-2xl"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="md:hidden absolute top-4 right-4 p-2 rounded-full bg-white border border-zinc-200 text-zinc-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wider text-orange-600 uppercase">
                  {product.brand} · {product.stock > 0 ? `Mavjud (${product.stock} dona)` : 'Tugagan'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 mt-1">
                  {product.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Yopish"
                className="hidden md:flex p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold font-mono text-zinc-950 tabular-nums">
                {formatUzs(product.priceUzs)}
              </span>
              {product.oldPriceUzs && (
                <span className="text-sm font-mono text-zinc-400 line-through tabular-nums">
                  {formatUzs(product.oldPriceUzs)}
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>

            {/* Storage selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-700">Xotira hajmi</p>
              <div className="flex flex-wrap gap-2">
                {product.storageOptions.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStorage(st)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedStorage === st
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-700">Rang</p>
              <div className="flex flex-wrap gap-2">
                {product.colorOptions.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedColor === col
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* Specs summary */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-100 text-xs">
              <div className="flex items-center gap-2 text-zinc-700">
                <HardDrive className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate">{product.specs.display}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700">
                <Cpu className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate">{product.specs.chip}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700">
                <Camera className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate">{product.specs.camera}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700">
                <Battery className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate">{product.specs.battery}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => handleAdd(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
            >
              {addedFeedback ? <Check className="w-4 h-4 text-orange-400" /> : <ShoppingBag className="w-4 h-4" />}
              <span>{addedFeedback ? 'Savatga qo‘shildi' : 'Savatga qo‘shish'}</span>
            </button>

            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => handleAdd(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Zap className="w-4 h-4" />
              <span>Hoziroq buyurtma</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
