import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const VALID_CATEGORIES = ['flagman', 'biznes', 'bukiluvchan', 'hamyonbop'];
const VALID_STATUSES = [
  'Yangi',
  'Tasdiqlandi',
  'Yetkazilmoqda',
  'Yetkazildi',
  'Bekor qilindi',
];
const VALID_PAYMENTS = ['Naqd', 'Karta', 'Muddatli to‘lov'];

const SEED_PRODUCTS = [
  {
    id: 'ph-iphone-16-pro',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    category: 'flagman',
    priceUzs: 16450000,
    oldPriceUzs: 17200000,
    stock: 12,
    storageOptions: ['256 GB', '512 GB', '1 TB'],
    colorOptions: ['Qora Titan', 'Oq Titan', 'Olovrang Bronza'],
    specs: {
      display: '6.9" Super Retina XDR 120Hz',
      chip: 'A18 Pro Bionic',
      camera: '48 MP Fusion + 5x Telefoto',
      battery: '4685 mAh · 30W MagSafe',
    },
    description:
      'Titan korpus, professional darajadagi 4K 120fps video va yuqori unumdorlikka ega eng so‘nggi flagman smartfon.',
    imageUrl: '/src/assets/images/phone_pro_titanium_1795242059850.jpg',
    featured: true,
  },
  {
    id: 'ph-aura-ultra-orange',
    name: 'Aura X9 Ultra Orange Edition',
    brand: 'Xiaomi',
    category: 'flagman',
    priceUzs: 11890000,
    oldPriceUzs: 12600000,
    stock: 9,
    storageOptions: ['256 GB', '512 GB'],
    colorOptions: ['Olovrang Teri', 'Qora Karbon'],
    specs: {
      display: '6.78" LTPO AMOLED 144Hz',
      chip: 'Snapdragon 8 Elite',
      camera: '200 MP Leica Quad',
      battery: '5500 mAh · 120W HyperCharge',
    },
    description:
      'Imzoli olovrang va qora karbon dizayn, 19 daqiqada 100% quvvatlanish hamda 200 megapikselli Leica optikasi.',
    imageUrl: '/src/assets/images/phone_ultra_orange_1795242059196.jpg',
    featured: true,
  },
  {
    id: 'ph-galaxy-z-fold-6',
    name: 'Galaxy Z Fold 6 Obsidian',
    brand: 'Samsung',
    category: 'bukiluvchan',
    priceUzs: 19200000,
    stock: 6,
    storageOptions: ['512 GB', '1 TB'],
    colorOptions: ['Qora Obsidian', 'Kumush Oq'],
    specs: {
      display: '7.6" Dynamic AMOLED 2X',
      chip: 'Snapdragon 8 Gen 3',
      camera: '50 MP OIS + 12 MP Ultra',
      battery: '4400 mAh · 45W',
    },
    description:
      'Cho‘ntagingizga sig‘adigan planshet: ko‘p oynali ish rejimi, S-Pen qo‘llab-quvvatlashi va mustahkam bukiluvchi sharnir.',
    imageUrl: '/src/assets/images/phone_fold_obsidian_1795242059367.jpg',
    featured: true,
  },
  {
    id: 'ph-luna-air-white',
    name: 'Luna Air S15 Pearl White',
    brand: 'Nothing',
    category: 'hamyonbop',
    priceUzs: 6490000,
    oldPriceUzs: 7100000,
    stock: 18,
    storageOptions: ['128 GB', '256 GB'],
    colorOptions: ['Marvarid Oq', 'Mat Qora'],
    specs: {
      display: '6.67" OLED 120Hz',
      chip: 'Dimensity 8300 Ultra',
      camera: '50 MP Sony IMX890',
      battery: '5000 mAh · 67W',
    },
    description:
      'Yengil alyuminiy rom, tiniq marvarid oq korpus va kundalik tezlik uchun mukammal narx-sifat nisbati.',
    imageUrl: '/src/assets/images/phone_air_white_1795242059176.jpg',
    featured: false,
  },
  {
    id: 'ph-s25-ultra-black',
    name: 'Galaxy S25 Ultra Titanium',
    brand: 'Samsung',
    category: 'biznes',
    priceUzs: 15750000,
    stock: 10,
    storageOptions: ['256 GB', '512 GB', '1 TB'],
    colorOptions: ['Qora Titan', 'Oq Titan'],
    specs: {
      display: '6.8" QHD+ Dynamic AMOLED',
      chip: 'Snapdragon 8 Elite for Galaxy',
      camera: '200 MP + 100x Space Zoom',
      battery: '5000 mAh · 45W',
    },
    description:
      'Biznes va ijodkorlar uchun o‘rnatilgan S-Pen qalami, aks ettirmaydigan Gorilla Armor oynasi va uzoq avtonomiya.',
    imageUrl: '/src/assets/images/phone_pro_titanium_1795242059850.jpg',
    featured: false,
  },
  {
    id: 'ph-pixel-9-pro',
    name: 'Pixel 9 Pro Porcelain',
    brand: 'Google',
    category: 'biznes',
    priceUzs: 12300000,
    stock: 8,
    storageOptions: ['256 GB', '512 GB'],
    colorOptions: ['Oq Chinni', 'Qora Obsidiyan'],
    specs: {
      display: '6.3" Super Actua LTPO',
      chip: 'Google Tensor G4',
      camera: '50 MP + 48 MP Periskop',
      battery: '4700 mAh · 45W',
    },
    description:
      'Tabiiy rangli portret suratlar, toza Android tizimi va 7 yillik rasmiy xavfsizlik yangilanishlari.',
    imageUrl: '/src/assets/images/phone_air_white_1795242059176.jpg',
    featured: false,
  },
  {
    id: 'ph-oneplus-13-blaze',
    name: 'OnePlus 13 Blaze Edition',
    brand: 'OnePlus',
    category: 'flagman',
    priceUzs: 10950000,
    stock: 14,
    storageOptions: ['256 GB', '512 GB'],
    colorOptions: ['Olovrang', 'Qora'],
    specs: {
      display: '6.82" 2K ProXDR 120Hz',
      chip: 'Snapdragon 8 Elite',
      camera: '50 MP Hasselblad Triple',
      battery: '6000 mAh · 100W SuperVOOC',
    },
    description:
      '6000 mAh sig‘imli kremniy-uglerodli akkumulyator va Hasselblad kalibratsiyali tezkor kamera tizimi.',
    imageUrl: '/src/assets/images/phone_ultra_orange_1795242059196.jpg',
    featured: false,
  },
  {
    id: 'ph-redmi-note-14-pro',
    name: 'Redmi Note 14 Pro+',
    brand: 'Xiaomi',
    category: 'hamyonbop',
    priceUzs: 4850000,
    oldPriceUzs: 5300000,
    stock: 22,
    storageOptions: ['256 GB', '512 GB'],
    colorOptions: ['Qora', 'Oq', 'Olovrang'],
    specs: {
      display: '6.67" Curved AMOLED 120Hz',
      chip: 'Snapdragon 7s Gen 3',
      camera: '200 MP OIS',
      battery: '5110 mAh · 120W',
    },
    description:
      'IP68 suv va changdan himoya, egilgan AMOLED ekran hamda hamyonbop narxda flagman imkoniyatlar.',
    imageUrl: '/src/assets/images/phone_pro_titanium_1795242059850.jpg',
    featured: false,
  },
];

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.orders)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed data
  }
  return {
    products: [...SEED_PRODUCTS],
    orders: [],
    orderSeq: 1001,
  };
}

function saveStore(state) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Non-fatal in read-only environments
  }
}

const store = loadStore();

// Server-side in-memory credentials (never saved as plaintext to disk)
let adminPassHash = null;
const runtimeTelegram = {
  botToken: '',
  channelId: '',
};

function getTelegramCredentials() {
  const envToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const envChannel = (process.env.TELEGRAM_CHANNEL_ID || '').trim();
  if (envToken && envChannel) {
    return { botToken: envToken, channelId: envChannel, source: 'env' };
  }
  if (runtimeTelegram.botToken && runtimeTelegram.channelId) {
    return {
      botToken: runtimeTelegram.botToken,
      channelId: runtimeTelegram.channelId,
      source: 'runtime',
    };
  }
  return { botToken: '', channelId: '', source: 'none' };
}

function maskToken(token) {
  if (!token || token.length < 10) return '';
  return `${token.slice(0, 5)}••••${token.slice(-4)}`;
}

async function sendTelegramMessage(text) {
  const creds = getTelegramCredentials();
  if (!creds.botToken || !creds.channelId) {
    return {
      sent: false,
      info: 'Telegram bot token yoki kanal ID sozlanmagan (Admin panel -> Telegram Bot bo‘limidan ulang)',
    };
  }

  try {
    const endpoint = `https://api.telegram.org/bot${encodeURIComponent(creds.botToken)}/sendMessage`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: creds.channelId,
        text,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      return {
        sent: false,
        info: data.description || `Telegram API xatosi (${response.status})`,
      };
    }
    return { sent: true, info: 'Telegram kanalga real vaqt rejimida yuborildi' };
  } catch (err) {
    return {
      sent: false,
      info: err instanceof Error ? err.message : 'Tarmoq xatosi',
    };
  }
}

function formatPriceUzs(val) {
  return `${Number(val).toLocaleString('uz-UZ')} so‘m`;
}

function formatOrderTelegramText(order) {
  const lines = [
    `🔥 YANGI BUYURTMA #${order.orderCode}`,
    `━━━━━━━━━━━━━━━━━━`,
    `👤 Mijoz: ${order.customerName}`,
    `📞 Telefon: ${order.phone}`,
    `📍 Manzil: ${order.city}, ${order.address}`,
    `💳 To‘lov turi: ${order.paymentMethod}`,
  ];
  if (order.note) {
    lines.push(`📝 Izoh: ${order.note}`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`📱 Mahsulotlar:`);
  order.items.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. ${item.name} (${item.storage}, ${item.color}) × ${item.quantity} = ${formatPriceUzs(item.lineTotalUzs)}`
    );
  });
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 JAMI SUMMA: ${formatPriceUzs(order.totalUzs)}`);
  lines.push(`🕒 Vaqt: ${new Date(order.createdAt).toLocaleString('uz-UZ')}`);
  lines.push(`📌 Holat: ${order.status}`);
  return lines.join('\n');
}

function signAdminToken() {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match || !verifyAdminToken(match[1])) {
    res.status(401).json({ error: 'Ruxsat rad etildi. Iltimos, admin tizimiga kiring.' });
    return;
  }
  next();
}

function isSafeImageUrl(url) {
  if (typeof url !== 'string') return false;
  if (url.startsWith('/src/assets/images/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // ==========================================
  // PUBLIC API ROUTES
  // ==========================================
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/products', (_req, res) => {
    res.json({ products: store.products });
  });

  app.post('/api/orders', async (req, res) => {
    const body = req.body || {};
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
    const paymentMethod = VALID_PAYMENTS.includes(body.paymentMethod)
      ? body.paymentMethod
      : 'Naqd';

    if (customerName.length < 2 || customerName.length > 80) {
      res.status(400).json({ error: 'Ismingizni to‘g‘ri kiriting (kamida 2 ta harf).' });
      return;
    }
    if (!/^[+\d\s()-]{7,20}$/.test(phone)) {
      res.status(400).json({ error: 'Telefon raqamingizni to‘g‘ri formatda kiriting.' });
      return;
    }
    if (city.length < 2 || address.length < 4) {
      res.status(400).json({ error: 'Shahar va yetkazib berish manzilini to‘liq kiriting.' });
      return;
    }
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
      res.status(400).json({ error: 'Savat bo‘sh yoki noto‘g‘ri.' });
      return;
    }

    const verifiedItems = [];
    let totalUzs = 0;

    for (const rawItem of body.items) {
      if (!rawItem || typeof rawItem !== 'object') {
        res.status(400).json({ error: 'Buyurtma tarkibi noto‘g‘ri.' });
        return;
      }
      const productId = typeof rawItem.productId === 'string' ? rawItem.productId : '';
      const quantity =
        typeof rawItem.quantity === 'number' && Number.isInteger(rawItem.quantity)
          ? rawItem.quantity
          : 0;
      const storage = typeof rawItem.storage === 'string' ? rawItem.storage.trim() : '';
      const color = typeof rawItem.color === 'string' ? rawItem.color.trim() : '';

      const product = store.products.find((p) => p.id === productId);
      if (!product) {
        res.status(404).json({ error: 'Tanlangan telefon topilmadi.' });
        return;
      }
      if (quantity < 1 || quantity > 10) {
        res.status(400).json({ error: `${product.name} uchun miqdor noto‘g‘ri.` });
        return;
      }
      if (product.stock < quantity) {
        res.status(409).json({
          error: `${product.name} omborda yetarli emas (qoldiq: ${product.stock} dona).`,
        });
        return;
      }

      const safeStorage = product.storageOptions.includes(storage)
        ? storage
        : product.storageOptions[0];
      const safeColor = product.colorOptions.includes(color)
        ? color
        : product.colorOptions[0];

      const lineTotalUzs = product.priceUzs * quantity;
      totalUzs += lineTotalUzs;
      verifiedItems.push({
        productId: product.id,
        name: product.name,
        storage: safeStorage,
        color: safeColor,
        unitPriceUzs: product.priceUzs,
        quantity,
        lineTotalUzs,
      });
    }

    for (const line of verifiedItems) {
      const prod = store.products.find((p) => p.id === line.productId);
      if (prod) prod.stock = Math.max(0, prod.stock - line.quantity);
    }

    const orderCode = `OM-${store.orderSeq++}`;
    const newOrder = {
      id: crypto.randomUUID(),
      orderCode,
      customerName,
      phone,
      city,
      address,
      paymentMethod,
      note,
      items: verifiedItems,
      totalUzs,
      status: 'Yangi',
      telegramSent: false,
      telegramInfo: '',
      createdAt: Date.now(),
    };

    const tgResult = await sendTelegramMessage(formatOrderTelegramText(newOrder));
    newOrder.telegramSent = tgResult.sent;
    newOrder.telegramInfo = tgResult.info;

    store.orders.unshift(newOrder);
    saveStore(store);

    res.status(201).json({ order: newOrder });
  });

  app.get('/api/orders/track/:code', (req, res) => {
    const code = String(req.params.code || '').trim().toUpperCase();
    const found = store.orders.find((o) => o.orderCode === code);
    if (!found) {
      res.status(404).json({ error: 'Ushbu raqamli buyurtma topilmadi.' });
      return;
    }
    res.json({
      order: {
        orderCode: found.orderCode,
        status: found.status,
        totalUzs: found.totalUzs,
        items: found.items,
        createdAt: found.createdAt,
        telegramSent: found.telegramSent,
      },
    });
  });

  // ==========================================
  // ADMIN AUTH ROUTES
  // ==========================================
  app.get('/api/admin/auth-status', (_req, res) => {
    const envPass = (process.env.ADMIN_PASSCODE || '').trim();
    res.json({
      configured: Boolean(envPass || adminPassHash),
      envLocked: Boolean(envPass),
    });
  });

  app.post('/api/admin/setup', (req, res) => {
    const envPass = (process.env.ADMIN_PASSCODE || '').trim();
    if (envPass || adminPassHash) {
      res.status(409).json({ error: 'Admin paroli allaqachon o‘rnatilgan.' });
      return;
    }
    const { passcode } = req.body || {};
    if (typeof passcode !== 'string' || passcode.trim().length < 6) {
      res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(passcode.trim(), salt, 64).toString('hex');
    adminPassHash = { salt, hash };
    res.json({ token: signAdminToken() });
  });

  app.post('/api/admin/login', (req, res) => {
    const { passcode } = req.body || {};
    if (typeof passcode !== 'string' || !passcode) {
      res.status(400).json({ error: 'Parolni kiriting.' });
      return;
    }

    const envPass = (process.env.ADMIN_PASSCODE || '').trim();
    if (envPass) {
      const a = Buffer.from(passcode.trim());
      const b = Buffer.from(envPass);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        res.status(401).json({ error: 'Parol noto‘g‘ri.' });
        return;
      }
      res.json({ token: signAdminToken() });
      return;
    }

    if (!adminPassHash) {
      res.status(400).json({ error: 'Avval birinchi martalik admin parolini yarating.' });
      return;
    }

    const derived = crypto.scryptSync(passcode.trim(), adminPassHash.salt, 64);
    const stored = Buffer.from(adminPassHash.hash, 'hex');
    if (derived.length !== stored.length || !crypto.timingSafeEqual(derived, stored)) {
      res.status(401).json({ error: 'Parol noto‘g‘ri.' });
      return;
    }

    res.json({ token: signAdminToken() });
  });

  // ==========================================
  // PROTECTED ADMIN ROUTES
  // ==========================================
  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    res.json({ orders: store.orders });
  });

  app.patch('/api/admin/orders/:id', requireAdmin, async (req, res) => {
    const order = store.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Buyurtma topilmadi.' });
      return;
    }
    const { status, notifyTelegram } = req.body || {};
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Noto‘g‘ri buyurtma holati.' });
      return;
    }

    order.status = status;
    saveStore(store);

    if (notifyTelegram === true) {
      const msg = `📦 BUYURTMA HOLATI YANGILANDI\nRaqam: #${order.orderCode}\nMijoz: ${order.customerName}\nYangi holat: ${order.status}`;
      await sendTelegramMessage(msg);
    }

    res.json({ order });
  });

  app.post('/api/admin/orders/:id/resend-telegram', requireAdmin, async (req, res) => {
    const order = store.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Buyurtma topilmadi.' });
      return;
    }
    const result = await sendTelegramMessage(formatOrderTelegramText(order));
    order.telegramSent = result.sent;
    order.telegramInfo = result.info;
    saveStore(store);
    res.json({ order, result });
  });

  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const b = req.body || {};
    const name = typeof b.name === 'string' ? b.name.trim() : '';
    const brand = typeof b.brand === 'string' ? b.brand.trim() : '';
    const category = VALID_CATEGORIES.includes(b.category) ? b.category : 'flagman';
    const priceUzs = Number(b.priceUzs);
    const stock = Number(b.stock);
    const description = typeof b.description === 'string' ? b.description.trim() : '';
    const imageUrl =
      typeof b.imageUrl === 'string' && isSafeImageUrl(b.imageUrl.trim())
        ? b.imageUrl.trim()
        : '/src/assets/images/phone_pro_titanium_1795242059850.jpg';

    if (name.length < 2 || brand.length < 2 || !Number.isFinite(priceUzs) || priceUzs <= 0) {
      res.status(400).json({ error: 'Telefon nomi, brendi va narxini to‘g‘ri kiriting.' });
      return;
    }

    const storageOptions =
      Array.isArray(b.storageOptions) && b.storageOptions.length > 0
        ? b.storageOptions.map((s) => String(s).trim()).filter(Boolean)
        : ['256 GB', '512 GB'];
    const colorOptions =
      Array.isArray(b.colorOptions) && b.colorOptions.length > 0
        ? b.colorOptions.map((c) => String(c).trim()).filter(Boolean)
        : ['Qora', 'Olovrang', 'Oq'];

    const product = {
      id: `ph-${crypto.randomUUID().slice(0, 8)}`,
      name,
      brand,
      category,
      priceUzs: Math.round(priceUzs),
      stock: Number.isFinite(stock) && stock >= 0 ? Math.round(stock) : 5,
      storageOptions,
      colorOptions,
      specs: {
        display: typeof b.display === 'string' && b.display.trim() ? b.display.trim() : '6.7" AMOLED 120Hz',
        chip: typeof b.chip === 'string' && b.chip.trim() ? b.chip.trim() : 'Flagship Pro Chip',
        camera: typeof b.camera === 'string' && b.camera.trim() ? b.camera.trim() : '50 MP OIS',
        battery: typeof b.battery === 'string' && b.battery.trim() ? b.battery.trim() : '5000 mAh',
      },
      description: description || `${brand} ${name} rasmiy kafolatli smartfoni.`,
      imageUrl,
      featured: Boolean(b.featured),
    };

    store.products.unshift(product);
    saveStore(store);
    res.status(201).json({ product });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const product = store.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Mahsulot topilmadi.' });
      return;
    }
    const b = req.body || {};
    if (typeof b.name === 'string' && b.name.trim().length >= 2) product.name = b.name.trim();
    if (typeof b.brand === 'string' && b.brand.trim().length >= 2) product.brand = b.brand.trim();
    if (VALID_CATEGORIES.includes(b.category)) {
      product.category = b.category;
    }
    if (b.priceUzs !== undefined && Number.isFinite(Number(b.priceUzs)) && Number(b.priceUzs) > 0) {
      product.priceUzs = Math.round(Number(b.priceUzs));
    }
    if (b.stock !== undefined && Number.isFinite(Number(b.stock)) && Number(b.stock) >= 0) {
      product.stock = Math.round(Number(b.stock));
    }
    if (typeof b.featured === 'boolean') product.featured = b.featured;

    saveStore(store);
    res.json({ product });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Mahsulot topilmadi.' });
      return;
    }
    store.products.splice(idx, 1);
    saveStore(store);
    res.json({ ok: true });
  });

  app.get('/api/admin/telegram-status', requireAdmin, (_req, res) => {
    const creds = getTelegramCredentials();
    res.json({
      configured: Boolean(creds.botToken && creds.channelId),
      source: creds.source,
      maskedToken: maskToken(creds.botToken),
      channelId: creds.channelId,
    });
  });

  app.post('/api/admin/telegram-config', requireAdmin, async (req, res) => {
    const { botToken, channelId, sendTest } = req.body || {};
    const tokenStr = typeof botToken === 'string' ? botToken.trim() : '';
    const chanStr = typeof channelId === 'string' ? channelId.trim() : '';

    if (tokenStr && !/^\d{6,15}:[A-Za-z0-9_-]{20,64}$/.test(tokenStr)) {
      res.status(400).json({ error: 'Bot token formati noto‘g‘ri.' });
      return;
    }
    if (chanStr && !/^(-\d{5,20}|@[A-Za-z0-9_]{4,32})$/.test(chanStr)) {
      res.status(400).json({ error: 'Kanal ID formati noto‘g‘ri (-100... yoki @kanal).' });
      return;
    }

    if (tokenStr) runtimeTelegram.botToken = tokenStr;
    if (chanStr) runtimeTelegram.channelId = chanStr;

    let testResult = null;
    if (sendTest === true) {
      testResult = await sendTelegramMessage(
        '✅ OLOV MOBILE: Telegram bot va kanal muvaffaqiyatli ulandi! Barcha yangi buyurtmalar real vaqt rejimida shu kanalga keladi.'
      );
    }

    const creds = getTelegramCredentials();
    res.json({
      status: {
        configured: Boolean(creds.botToken && creds.channelId),
        source: creds.source,
        maskedToken: maskToken(creds.botToken),
        channelId: creds.channelId,
      },
      testResult,
    });
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OLOV MOBILE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
