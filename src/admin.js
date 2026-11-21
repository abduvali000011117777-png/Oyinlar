// Pure JavaScript Admin Panel Module (Zero TypeScript)

const IMAGE_PRESETS = [
  { label: 'Qora Titan Pro', url: '/src/assets/images/phone_pro_titanium_1795242059850.jpg' },
  { label: 'Olovrang Ultra', url: '/src/assets/images/phone_ultra_orange_1795242059196.jpg' },
  { label: 'Bukiluvchi Obsidian', url: '/src/assets/images/phone_fold_obsidian_1795242059367.jpg' },
  { label: 'Marvarid Oq Air', url: '/src/assets/images/phone_air_white_1795242059176.jpg' },
];

const ORDER_STATUSES = ['Yangi', 'Tasdiqlandi', 'Yetkazilmoqda', 'Yetkazildi', 'Bekor qilindi'];

function el(tag, props, ...children) {
  const node = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (k === 'className') node.className = v;
      else if (k === 'onClick') node.addEventListener('click', v);
      else if (k === 'onChange') node.addEventListener('change', v);
      else if (k === 'onInput') node.addEventListener('input', v);
      else if (k === 'onSubmit') node.addEventListener('submit', v);
      else if (k === 'value') node.value = v;
      else if (k === 'disabled') node.disabled = Boolean(v);
      else if (k === 'required') node.required = Boolean(v);
      else if (k === 'selected') node.selected = Boolean(v);
      else if (k in node && k !== 'list' && k !== 'form') node[k] = v;
      else node.setAttribute(k, v);
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function formatUzs(amount) {
  return `${Number(amount).toLocaleString('uz-UZ')} so‘m`;
}

export function openAdminModal({ modalRoot, onClose, onProductsUpdated }) {
  const state = {
    authStatus: null,
    adminToken: '',
    authError: '',
    authLoading: false,
    tab: 'orders',
    orders: [],
    products: [],
    tgStatus: null,
    productMsg: '',
    tgFeedback: '',
    tgBusy: false,
  };

  async function initAuth() {
    try {
      const res = await fetch('/api/admin/auth-status');
      state.authStatus = await res.json();
    } catch {
      state.authStatus = { configured: true, envLocked: false };
    }
    render();
  }

  async function loadAdminData() {
    if (!state.adminToken) return;
    const headers = { Authorization: `Bearer ${state.adminToken}` };
    const [ordRes, prodRes, tgRes] = await Promise.all([
      fetch('/api/admin/orders', { headers }),
      fetch('/api/products'),
      fetch('/api/admin/telegram-status', { headers }),
    ]);
    if (ordRes.status === 401) {
      state.adminToken = '';
      render();
      return;
    }
    const ordData = await ordRes.json();
    const prodData = await prodRes.json();
    const tgData = await tgRes.json();
    state.orders = ordData.orders || [];
    state.products = prodData.products || [];
    state.tgStatus = tgData;
    render();
  }

  function closePanel() {
    modalRoot.replaceChildren();
    onClose();
  }

  function render() {
    const overlay = el('div', {
      className: 'fixed inset-0 z-50 bg-zinc-950/90 flex flex-col overflow-y-auto text-zinc-950',
    });

    const header = el(
      'header',
      {
        className:
          'bg-zinc-950 text-white border-b border-zinc-800 px-4 sm:px-8 h-16 flex items-center justify-between gap-4 sticky top-0 z-20',
      },
      el(
        'div',
        { className: 'flex items-center gap-3' },
        el('span', { className: 'w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block shrink-0' }),
        el('h2', { className: 'text-lg font-extrabold tracking-tight' }, 'OLOV MOBILE · Admin Panel')
      ),
      el(
        'div',
        { className: 'flex items-center gap-3' },
        state.adminToken
          ? el(
              'button',
              {
                type: 'button',
                className:
                  'px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer',
                onClick: () => {
                  state.adminToken = '';
                  render();
                },
              },
              'Chiqish'
            )
          : null,
        el(
          'button',
          {
            type: 'button',
            className:
              'px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white cursor-pointer',
            onClick: closePanel,
          },
          'Do‘konga qaytish'
        )
      )
    );

    const main = el('main', {
      className: 'flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8',
    });

    if (!state.adminToken) {
      const isSetup = state.authStatus && !state.authStatus.configured;
      const passInput = el('input', {
        type: 'password',
        required: true,
        minLength: isSetup ? 6 : 1,
        placeholder: '••••••••',
        className:
          'w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm',
      });

      const authForm = el(
        'form',
        {
          className: 'space-y-4',
          onSubmit: async (e) => {
            e.preventDefault();
            state.authError = '';
            state.authLoading = true;
            const passcode = passInput.value;
            render();
            try {
              const endpoint = isSetup ? '/api/admin/setup' : '/api/admin/login';
              const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode }),
              });
              const data = await res.json();
              if (!res.ok || !data.token) {
                state.authError = data.error || 'Kirish amalga oshmadi.';
              } else {
                state.adminToken = data.token;
                await loadAdminData();
                return;
              }
            } catch {
              state.authError = 'Server bilan aloqa xatosi.';
            } finally {
              state.authLoading = false;
              render();
            }
          },
        },
        el(
          'div',
          null,
          el('label', { className: 'block text-xs font-semibold text-zinc-700 mb-1' }, 'Admin paroli'),
          passInput,
          state.authError ? el('p', { className: 'text-xs text-rose-600 mt-2' }, state.authError) : null
        ),
        el(
          'button',
          {
            type: 'submit',
            disabled: state.authLoading,
            className:
              'w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm cursor-pointer disabled:opacity-50',
          },
          state.authLoading
            ? 'Tekshirilmoqda...'
            : isSetup
              ? 'Parolni saqlash va kirish'
              : 'Kirish'
        )
      );

      main.appendChild(
        el(
          'div',
          {
            className:
              'max-w-md mx-auto mt-10 bg-white rounded-3xl border border-zinc-200 p-7 sm:p-9 shadow-2xl space-y-5 modal-card',
          },
          el(
            'div',
            null,
            el(
              'h3',
              { className: 'text-2xl font-extrabold text-zinc-950' },
              isSetup ? 'Admin parolini o‘rnatish' : 'Admin panelga kirish'
            ),
            el(
              'p',
              { className: 'text-sm text-zinc-600 mt-1' },
              isSetup
                ? 'Birinchi marta kirayotganingiz uchun kamida 6 ta belgidan iborat admin parolini yarating.'
                : 'Buyurtmalar, mahsulotlar va Telegram botni boshqarish uchun parolni kiriting.'
            )
          ),
          authForm
        )
      );
    } else {
      const totalRevenue = state.orders
        .filter((o) => o.status !== 'Bekor qilindi')
        .reduce((sum, o) => sum + o.totalUzs, 0);
      const newOrdersCount = state.orders.filter((o) => o.status === 'Yangi').length;
      const deliveredCount = state.orders.filter((o) => o.status === 'Yetkazildi').length;

      const kpiRow = el(
        'div',
        { className: 'grid grid-cols-2 lg:grid-cols-4 gap-4' },
        el(
          'div',
          { className: 'p-5 rounded-2xl bg-white border border-zinc-200' },
          el('p', { className: 'text-xs text-zinc-500' }, 'Umumiy savdo'),
          el(
            'p',
            { className: 'text-xl font-extrabold font-mono text-zinc-950 tabular-nums mt-1' },
            formatUzs(totalRevenue)
          )
        ),
        el(
          'div',
          { className: 'p-5 rounded-2xl bg-white border border-zinc-200' },
          el('p', { className: 'text-xs text-zinc-500' }, 'Yangi buyurtmalar'),
          el(
            'p',
            { className: 'text-xl font-extrabold font-mono text-orange-600 tabular-nums mt-1' },
            `${newOrdersCount} ta`
          )
        ),
        el(
          'div',
          { className: 'p-5 rounded-2xl bg-white border border-zinc-200' },
          el('p', { className: 'text-xs text-zinc-500' }, 'Yetkazilgan'),
          el(
            'p',
            { className: 'text-xl font-extrabold font-mono text-emerald-600 tabular-nums mt-1' },
            `${deliveredCount} ta`
          )
        ),
        el(
          'div',
          { className: 'p-5 rounded-2xl bg-white border border-zinc-200' },
          el('p', { className: 'text-xs text-zinc-500' }, 'Katalogdagi modellar'),
          el(
            'p',
            { className: 'text-xl font-extrabold font-mono text-zinc-950 tabular-nums mt-1' },
            `${state.products.length} ta`
          )
        )
      );

      const tabs = [
        { id: 'orders', label: `Buyurtmalar (${state.orders.length})` },
        { id: 'products', label: `Mahsulotlar (${state.products.length})` },
        { id: 'telegram', label: 'Telegram Bot' },
      ];

      const tabBar = el(
        'div',
        { className: 'flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-zinc-200' },
        el(
          'div',
          { className: 'flex items-center gap-1' },
          tabs.map((t) =>
            el(
              'button',
              {
                type: 'button',
                className: `px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  state.tab === t.id
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`,
                onClick: () => {
                  state.tab = t.id;
                  render();
                },
              },
              t.label
            )
          )
        ),
        el(
          'button',
          {
            type: 'button',
            className: 'px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer',
            onClick: () => void loadAdminData(),
          },
          'Yangilash'
        )
      );

      let tabContent;

      if (state.tab === 'orders') {
        if (state.orders.length === 0) {
          tabContent = el(
            'div',
            { className: 'bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-2' },
            el('p', { className: 'text-base font-bold text-zinc-900' }, 'Hali buyurtmalar kelib tushmagan'),
            el(
              'p',
              { className: 'text-sm text-zinc-500' },
              'Mijozlar savat orqali buyurtma berganda ular shu yerda va Telegram kanalingizda darhol paydo bo‘ladi.'
            )
          );
        } else {
          tabContent = el(
            'div',
            { className: 'bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-200 overflow-hidden' },
            state.orders.map((ord) => {
              const statusSelect = el(
                'select',
                {
                  className:
                    'px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold bg-white focus:border-orange-500 focus:outline-none',
                  onChange: async (e) => {
                    const res = await fetch(`/api/admin/orders/${ord.id}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${state.adminToken}`,
                      },
                      body: JSON.stringify({ status: e.target.value, notifyTelegram: true }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      state.orders = state.orders.map((o) => (o.id === ord.id ? data.order : o));
                      render();
                    }
                  },
                },
                ORDER_STATUSES.map((st) =>
                  el('option', { value: st, selected: ord.status === st }, st)
                )
              );

              return el(
                'div',
                { className: 'p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4' },
                el(
                  'div',
                  { className: 'space-y-1.5' },
                  el(
                    'div',
                    { className: 'flex flex-wrap items-center gap-2 text-xs' },
                    el('span', { className: 'font-mono font-bold text-orange-600' }, `#${ord.orderCode}`),
                    el('span', { 'aria-hidden': 'true' }, '·'),
                    el('span', { className: 'text-zinc-500' }, new Date(ord.createdAt).toLocaleString('uz-UZ')),
                    el('span', { 'aria-hidden': 'true' }, '·'),
                    el(
                      'span',
                      { className: ord.telegramSent ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold' },
                      ord.telegramSent ? 'Telegramga yuborilgan' : 'Telegramga yuborilmagan'
                    )
                  ),
                  el('p', { className: 'text-base font-bold text-zinc-950' }, `${ord.customerName} — ${ord.phone}`),
                  el(
                    'p',
                    { className: 'text-xs text-zinc-600' },
                    `${ord.city}, ${ord.address} · To‘lov: ${ord.paymentMethod}`
                  ),
                  el(
                    'div',
                    { className: 'text-xs text-zinc-700 pt-1 flex flex-wrap gap-3' },
                    ord.items.map((it) => el('span', null, `• ${it.name} (${it.storage}, ${it.color}) × ${it.quantity}`))
                  )
                ),
                el(
                  'div',
                  { className: 'flex flex-wrap items-center gap-3 shrink-0' },
                  el(
                    'span',
                    { className: 'text-base font-extrabold font-mono text-zinc-950 tabular-nums' },
                    formatUzs(ord.totalUzs)
                  ),
                  statusSelect,
                  el(
                    'button',
                    {
                      type: 'button',
                      className:
                        'px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 cursor-pointer',
                      onClick: async () => {
                        const res = await fetch(`/api/admin/orders/${ord.id}/resend-telegram`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${state.adminToken}` },
                        });
                        if (res.ok) {
                          const data = await res.json();
                          state.orders = state.orders.map((o) => (o.id === ord.id ? data.order : o));
                          render();
                        }
                      },
                    },
                    'Telegramga yuborish'
                  )
                )
              );
            })
          );
        }
      } else if (state.tab === 'products') {
        const nameIn = el('input', {
          type: 'text',
          required: true,
          placeholder: 'Model nomi (masalan: iPhone 16 Pro)',
          className: 'w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm',
        });
        const brandIn = el('input', {
          type: 'text',
          required: true,
          value: 'Apple',
          placeholder: 'Brend',
          className: 'w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm',
        });
        const catIn = el(
          'select',
          { className: 'w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm bg-white' },
          el('option', { value: 'flagman' }, 'Flagman'),
          el('option', { value: 'biznes' }, 'Biznes'),
          el('option', { value: 'bukiluvchan' }, 'Bukiluvchi'),
          el('option', { value: 'hamyonbop' }, 'Hamyonbop')
        );
        const priceIn = el('input', {
          type: 'number',
          required: true,
          min: '100000',
          value: '12500000',
          placeholder: 'Narxi (so‘m)',
          className: 'w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm font-mono',
        });
        const stockIn = el('input', {
          type: 'number',
          required: true,
          min: '0',
          value: '10',
          placeholder: 'Soni',
          className: 'w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm font-mono',
        });
        const imgIn = el(
          'select',
          { className: 'w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm bg-white' },
          IMAGE_PRESETS.map((p) => el('option', { value: p.url }, `Rasm: ${p.label}`))
        );
        const descIn = el('textarea', {
          rows: 2,
          placeholder: 'Qisqacha tavsif...',
          className: 'w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm',
        });

        const addForm = el(
          'form',
          {
            className: 'lg:col-span-4 bg-white rounded-2xl border border-zinc-200 p-5 space-y-3.5',
            onSubmit: async (e) => {
              e.preventDefault();
              state.productMsg = '';
              const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${state.adminToken}`,
                },
                body: JSON.stringify({
                  name: nameIn.value,
                  brand: brandIn.value,
                  category: catIn.value,
                  priceUzs: Number(priceIn.value),
                  stock: Number(stockIn.value),
                  imageUrl: imgIn.value,
                  description: descIn.value,
                  featured: true,
                }),
              });
              const data = await res.json();
              if (!res.ok || !data.product) {
                state.productMsg = data.error || 'Saqlashda xatolik.';
              } else {
                state.products = [data.product, ...state.products];
                state.productMsg = 'Yangi telefon katalogga qo‘shildi.';
                onProductsUpdated();
              }
              render();
            },
          },
          el('h3', { className: 'text-base font-bold text-zinc-950' }, 'Yangi telefon qo‘shish'),
          nameIn,
          el('div', { className: 'grid grid-cols-2 gap-2' }, brandIn, catIn),
          el('div', { className: 'grid grid-cols-2 gap-2' }, priceIn, stockIn),
          imgIn,
          descIn,
          state.productMsg ? el('p', { className: 'text-xs font-medium text-emerald-600' }, state.productMsg) : null,
          el(
            'button',
            {
              type: 'submit',
              className: 'w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm cursor-pointer',
            },
            'Katalogga qo‘shish'
          )
        );

        const productList = el(
          'div',
          { className: 'lg:col-span-8 bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-200' },
          state.products.map((p) =>
            el(
              'div',
              { className: 'p-4 flex items-center justify-between gap-4' },
              el(
                'div',
                { className: 'flex items-center gap-3.5 min-w-0' },
                el('img', {
                  src: p.imageUrl,
                  alt: p.name,
                  referrerPolicy: 'no-referrer',
                  className: 'w-14 h-14 rounded-xl object-cover bg-zinc-100 shrink-0',
                }),
                el(
                  'div',
                  { className: 'min-w-0' },
                  el('p', { className: 'text-sm font-bold text-zinc-950 truncate' }, p.name),
                  el(
                    'p',
                    { className: 'text-xs text-zinc-500' },
                    `${p.brand} · ${formatUzs(p.priceUzs)}`
                  )
                )
              ),
              el(
                'div',
                { className: 'flex items-center gap-2 shrink-0' },
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'w-7 h-7 rounded-lg border border-zinc-300 text-xs font-bold hover:bg-zinc-100 cursor-pointer',
                    onClick: async () => {
                      const nextStock = Math.max(0, p.stock - 1);
                      const res = await fetch(`/api/admin/products/${p.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${state.adminToken}`,
                        },
                        body: JSON.stringify({ stock: nextStock }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        state.products = state.products.map((item) => (item.id === p.id ? data.product : item));
                        onProductsUpdated();
                        render();
                      }
                    },
                  },
                  '-'
                ),
                el('span', { className: 'text-xs font-mono font-bold w-12 text-center tabular-nums' }, `${p.stock} ta`),
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'w-7 h-7 rounded-lg border border-zinc-300 text-xs font-bold hover:bg-zinc-100 cursor-pointer',
                    onClick: async () => {
                      const nextStock = p.stock + 1;
                      const res = await fetch(`/api/admin/products/${p.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${state.adminToken}`,
                        },
                        body: JSON.stringify({ stock: nextStock }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        state.products = state.products.map((item) => (item.id === p.id ? data.product : item));
                        onProductsUpdated();
                        render();
                      }
                    },
                  },
                  '+'
                ),
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'px-2.5 py-1 text-xs font-semibold text-zinc-500 hover:text-rose-600 cursor-pointer ml-1',
                    onClick: async () => {
                      const res = await fetch(`/api/admin/products/${p.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${state.adminToken}` },
                      });
                      if (res.ok) {
                        state.products = state.products.filter((item) => item.id !== p.id);
                        onProductsUpdated();
                        render();
                      }
                    },
                  },
                  'O‘chirish'
                )
              )
            )
          )
        );

        tabContent = el('div', { className: 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' }, addForm, productList);
      } else {
        const tokenInput = el('input', {
          type: 'password',
          placeholder: 'BotFather tokenini kiriting (123456:ABC...)',
          className:
            'w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-mono focus:border-orange-500 focus:outline-none',
        });
        const channelInput = el('input', {
          type: 'text',
          value: state.tgStatus?.channelId || '',
          placeholder: '-100... yoki @kanal_nomi',
          className:
            'w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-mono focus:border-orange-500 focus:outline-none',
        });

        const tgForm = el(
          'form',
          {
            className: 'space-y-4',
            onSubmit: async (e) => {
              e.preventDefault();
              state.tgFeedback = '';
              state.tgBusy = true;
              const botToken = tokenInput.value;
              const channelId = channelInput.value;
              render();
              try {
                const res = await fetch('/api/admin/telegram-config', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.adminToken}`,
                  },
                  body: JSON.stringify({ botToken, channelId, sendTest: true }),
                });
                const data = await res.json();
                if (!res.ok) {
                  state.tgFeedback = data.error || 'Sozlashda xatolik yuz berdi.';
                } else {
                  if (data.status) state.tgStatus = data.status;
                  state.tgFeedback = data.testResult?.sent
                    ? 'Saqlandi va Telegram kanalga test xabar yuborildi!'
                    : `Saqlandi, lekin test xabar yuborilmadi: ${data.testResult?.info ?? ''}`;
                }
              } catch {
                state.tgFeedback = 'Tarmoq xatosi.';
              } finally {
                state.tgBusy = false;
                render();
              }
            },
          },
          el(
            'div',
            null,
            el('label', { className: 'block text-xs font-semibold text-zinc-700 mb-1' }, 'Telegram Bot Token'),
            tokenInput
          ),
          el(
            'div',
            null,
            el('label', { className: 'block text-xs font-semibold text-zinc-700 mb-1' }, 'Kanal ID (yoki @kanal_nomi)'),
            channelInput
          ),
          state.tgFeedback ? el('p', { className: 'text-xs font-medium text-orange-600' }, state.tgFeedback) : null,
          el(
            'button',
            {
              type: 'submit',
              disabled: state.tgBusy,
              className:
                'inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm cursor-pointer disabled:opacity-50',
            },
            state.tgBusy ? 'Tekshirilmoqda...' : 'Saqlash va Test xabar yuborish'
          )
        );

        tabContent = el(
          'div',
          { className: 'max-w-xl bg-white rounded-2xl border border-zinc-200 p-6 space-y-5' },
          el(
            'div',
            { className: 'flex items-start justify-between gap-4' },
            el(
              'div',
              null,
              el('h3', { className: 'text-lg font-bold text-zinc-950' }, 'Telegram Bot va Kanal ulanishi'),
              el(
                'p',
                { className: 'text-xs text-zinc-500 mt-1' },
                'Har bir yangi buyurtma avtomatik ravishda ko‘rsatilgan Telegram kanalga real vaqtda yuboriladi.'
              )
            ),
            state.tgStatus?.configured
              ? el('span', { className: 'text-xs font-bold text-emerald-600 shrink-0' }, 'Ulangan ✓')
              : null
          ),
          state.tgStatus
            ? el(
                'div',
                { className: 'p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1 font-mono' },
                el(
                  'p',
                  null,
                  `Holat: ${state.tgStatus.configured ? 'Faol' : 'Sozlanmagan'} (${state.tgStatus.source})`
                ),
                state.tgStatus.maskedToken ? el('p', null, `Token: ${state.tgStatus.maskedToken}`) : null,
                state.tgStatus.channelId ? el('p', null, `Kanal ID: ${state.tgStatus.channelId}`) : null
              )
            : null,
          tgForm
        );
      }

      main.appendChild(el('div', { className: 'space-y-6' }, kpiRow, tabBar, tabContent));
    }

    overlay.appendChild(header);
    overlay.appendChild(main);
    modalRoot.replaceChildren(overlay);
  }

  render();
  void initAuth();
}
