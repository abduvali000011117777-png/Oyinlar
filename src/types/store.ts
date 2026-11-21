export type PhoneCategory = 'flagman' | 'biznes' | 'bukiluvchan' | 'hamyonbop';

export type OrderStatus =
  | 'Yangi'
  | 'Tasdiqlandi'
  | 'Yetkazilmoqda'
  | 'Yetkazildi'
  | 'Bekor qilindi';

export type PaymentMethod = 'Naqd' | 'Karta' | 'Muddatli to‘lov';

export interface PhoneProduct {
  id: string;
  name: string;
  brand: string;
  category: PhoneCategory;
  priceUzs: number;
  oldPriceUzs?: number;
  stock: number;
  storageOptions: string[];
  colorOptions: string[];
  specs: {
    display: string;
    chip: string;
    camera: string;
    battery: string;
  };
  description: string;
  imageUrl: string;
  featured: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  brand: string;
  imageUrl: string;
  storage: string;
  color: string;
  unitPriceUzs: number;
  quantity: number;
}

export interface OrderItemSummary {
  productId: string;
  name: string;
  storage: string;
  color: string;
  unitPriceUzs: number;
  quantity: number;
  lineTotalUzs: number;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  paymentMethod: PaymentMethod;
  note: string;
  items: OrderItemSummary[];
  totalUzs: number;
  status: OrderStatus;
  telegramSent: boolean;
  telegramInfo: string;
  createdAt: number;
}

export interface TelegramConfigStatus {
  configured: boolean;
  source: 'env' | 'runtime' | 'none';
  maskedToken: string;
  channelId: string;
}
