import { openAdminModal } from './admin.js';

const CART_STORAGE_KEY = 'olov_mobile_cart_v1';

const state = {
  products: [],
  loading: true,
  selectedCategory: 'all',
  selectedBrand: 'all',
  sortBy: 'featured',
  searchQuery: '',
  quickAddedId: null,
  cart: loadCart(),
};

const dom = {
  catalogGrid: document.getElementById('catalog-grid'),
  catalogCount: document.getElementById('catalog-count'),
  brandSelect: document.getElementById('catalog-brand'),
  sortSelect: document.getElementById('catalog-sort'),
  searchInput: document.getElementById('catalog-search'),
  categoryTabs: document.getElementById('category-tabs'),
  cartCountLabel: document.getElementById('cart-count-label'),
  modalRoot: document.getElementById('modal-root'),
  mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
  mobileMenuPanel: document.getElementById('mobile-menu-panel'),
  mobileIconOpen: document.getElementById('mobile-menu-icon-open'),
  mobileIconClose: document.getElementById('mobile-menu-icon-close'),
};

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

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  } catch {
    // Ignore storage quota issues
  }
  updateCartCounter();
}

function updateCartCounter() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (dom.cartCountLabel) {
    dom.cartCountLabel.textContent = `Savat (${totalCount})`;
  }
}

function createPhoneImage(src, alt, imgClassName) {
  const wrap = el('div', { className: 'relative w-full h-full flex items-center justify-center' });
  const fallback = el(
    'div',
    {
      className:
        'hidden w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-500 rounded-xl p-4 text-center',
    },
    el('span', { className: 'text-xs font-bold text-zinc-800' }, alt),
    el('span', { className: 'text-[11px] text-zinc-500 mt-0.5' }, 'OLOV MOBILE')
  );
  const img = el('img', {
    src,
    alt,
    referrerPolicy: 'no-referrer',
    className: imgClassName,
  });
  img.addEventListener('error', () => {
    img.style.display = 'none';
    fallback.classList.remove('hidden');
  });
  wrap.appendChild(img);
  wrap.appendChild(fallback);
  return wrap;
}

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (Array.isArray(data.products)) {
      state.products = data.products;
      syncBrandSelect();
    }
  } catch {
    // Keep existing catalog if offline
  } finally {
    state.loading = false;
    renderCatalog();
  }
}

function syncBrandSelect() {
  if (!dom.brandSelect) return;
  const brands = Array.from(new Set(state.products.map((p) => p.brand))).sort();
  const current = state.selectedBrand;
  const options = [
    el('option', { value: 'all', selected: current === 'all' }, 'Barcha brendlar'),
    ...brands.map((b) => el('option', { value: b, selected: current === b }, b)),
  ];
  dom.brandSelect.replaceChildren(...options);
}

function getFilteredProducts() {
  const list = state.products.filter((p) => {
    if (state.selectedCategory !== 'all' && p.category !== state.selectedCategory) return false;
    if (state.selectedBrand !== 'all' && p.brand !== state.selectedBrand) return false;
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (state.sortBy === 'price-asc') {
    return [...list].sort((a, b) => a.priceUzs - b.priceUzs);
  }
  if (state.sortBy === 'price-desc') {
    return [...list].sort((a, b) => b.priceUzs - a.priceUzs);
  }
  return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
}

function addToCart(product, storage, color, openDrawer = false) {
  const idx = state.cart.findIndex(
    (i) => i.productId === product.id && i.storage === storage && i.color === color
  );
  if (idx !== -1) {
    state.cart[idx].quantity = Math.min(10, state.cart[idx].quantity + 1);
  } else {
    state.cart.push({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      storage,
      color,
      unitPriceUzs: product.priceUzs,
      quantity: 1,
    });
  }
  saveCart();
  state.quickAddedId = product.id;
  renderCatalog();
  window.setTimeout(() => {
    if (state.quickAddedId === product.id) {
      state.quickAddedId = null;
      renderCatalog();
    }
  }, 1100);
  if (openDrawer) {
    openCartDrawer();
  }
}

function renderCatalog() {
  if (!dom.catalogGrid) return;

  if (state.loading) {
    dom.catalogGrid.replaceChildren(
      ...Array.from({ length: 6 }).map(() =>
        el('div', { className: 'h-96 rounded-2xl border border-zinc-200 bg-zinc-50 animate-pulse' })
      )
    );
    return;
  }

  const items = getFilteredProducts();
  if (dom.catalogCount) {
    dom.catalogCount.textContent = `Ko‘rsatilmoqda: ${items.length} ta smartfon`;
  }

  if (items.length === 0) {
    dom.catalogGrid.className = 'block';
    dom.catalogGrid.replaceChildren(
      el(
        'div',
        { className: 'py-16 text-center rounded-3xl border border-zinc-200 bg-zinc-50 space-y-3' },
        el('p', { className: 'text-lg font-bold text-zinc-950' }, 'Qidiruv bo‘yicha telefon topilmadi'),
        el(
          'button',
          {
            type: 'button',
            className: 'px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold cursor-pointer',
            onClick: () => {
              state.selectedCategory = 'all';
              state.selectedBrand = 'all';
              state.searchQuery = '';
              if (dom.searchInput) dom.searchInput.value = '';
              syncBrandSelect();
              updateCategoryTabStyles();
              renderCatalog();
            },
          },
          'Filtrlarni tozalash'
        )
      )
    );
    return;
  }

  dom.catalogGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
  const cards = items.map((phone) => {
    const isJustAdded = state.quickAddedId === phone.id;
    return el(
      'article',
      {
        className:
          'product-card group rounded-2xl bg-white border border-zinc-200 hover:border-zinc-950 flex flex-col justify-between overflow-hidden',
      },
      el(
        'button',
        {
          type: 'button',
          className:
            'block w-full aspect-[4/3] bg-zinc-50 p-5 overflow-hidden cursor-pointer border-b border-zinc-100',
          onClick: () => openProductModal(phone),
        },
        createPhoneImage(
          phone.imageUrl,
          phone.name,
          'w-full h-full object-contain group-hover:scale-105 transition-transform duration-300'
        )
      ),
      el(
        'div',
        { className: 'p-5 flex-1 flex flex-col justify-between gap-4' },
        el(
          'div',
          null,
          el(
            'div',
            { className: 'flex items-center gap-2 text-xs text-zinc-500' },
            el('span', { className: 'font-bold text-zinc-800 uppercase' }, phone.brand),
            el('span', { 'aria-hidden': 'true' }, '·'),
            el('span', null, phone.specs.chip),
            el('span', { 'aria-hidden': 'true' }, '·'),
            el(
              'span',
              { className: phone.stock > 0 ? 'text-emerald-700' : 'text-rose-600' },
              phone.stock > 0 ? `${phone.stock} dona` : 'Tugagan'
            )
          ),
          el(
            'h3',
            { className: 'text-lg font-bold text-zinc-950 mt-1.5' },
            el(
              'button',
              {
                type: 'button',
                className: 'text-left hover:text-orange-600 transition-colors cursor-pointer',
                onClick: () => openProductModal(phone),
              },
              phone.name
            )
          ),
          el('p', { className: 'text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed' }, phone.description)
        ),
        el(
          'div',
          { className: 'space-y-3 pt-2 border-t border-zinc-100' },
          el(
            'div',
            { className: 'flex items-baseline gap-2.5' },
            el(
              'span',
              { className: 'text-lg font-extrabold font-mono text-zinc-950 tabular-nums' },
              formatUzs(phone.priceUzs)
            ),
            phone.oldPriceUzs
              ? el(
                  'span',
                  { className: 'text-xs font-mono text-zinc-400 line-through tabular-nums' },
                  formatUzs(phone.oldPriceUzs)
                )
              : null
          ),
          el(
            'div',
            { className: 'flex items-center gap-2' },
            el(
              'button',
              {
                type: 'button',
                className:
                  'flex-1 py-2.5 px-3 rounded-xl border border-zinc-300 hover:border-zinc-950 text-xs font-bold text-zinc-900 transition-colors cursor-pointer whitespace-nowrap shrink-0',
                onClick: () => openProductModal(phone),
              },
              'Batafsil'
            ),
            el(
              'button',
              {
                type: 'button',
                disabled: phone.stock <= 0,
                className: `flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0 ${
                  isJustAdded
                    ? 'bg-zinc-950 text-orange-400'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`,
                onClick: () =>
                  addToCart(
                    phone,
                    phone.storageOptions[0] || '256 GB',
                    phone.colorOptions[0] || 'Qora',
                    false
                  ),
              },
              isJustAdded ? 'Qo‘shildi ✓' : 'Savatga qo‘shish'
            )
          )
        )
      )
    );
  });

  dom.catalogGrid.replaceChildren(...cards);
}

function updateCategoryTabStyles() {
  if (!dom.categoryTabs) return;
  dom.categoryTabs.querySelectorAll('.cat-tab').forEach((btn) => {
    const active = btn.getAttribute('data-category') === state.selectedCategory;
    btn.className = `cat-tab px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
      active ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
    }`;
  });
}

function closeModals() {
  dom.modalRoot.replaceChildren();
}

function openProductModal(product) {
  let selectedStorage = product.storageOptions[0] || '256 GB';
  let selectedColor = product.colorOptions[0] || 'Qora';
  let addedFeedback = false;

  function renderModal() {
    const overlay = el('div', {
      className: 'fixed inset-0 z-50 bg-zinc-950/75 flex items-center justify-center p-4 overflow-y-auto',
      onClick: closeModals,
    });

    const card = el(
      'div',
      {
        className:
          'modal-card w-full max-w-4xl bg-white text-zinc-950 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2',
        onClick: (e) => e.stopPropagation(),
      },
      el(
        'div',
        {
          className:
            'bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-200 p-6 sm:p-8 flex items-center justify-center relative min-h-[260px]',
        },
        createPhoneImage(product.imageUrl, product.name, 'w-full max-h-[380px] object-contain rounded-2xl'),
        el(
          'button',
          {
            type: 'button',
            'aria-label': 'Yopish',
            className: 'md:hidden absolute top-4 right-4 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-xs font-bold text-zinc-700 cursor-pointer',
            onClick: closeModals,
          },
          '✕'
        )
      ),
      el(
        'div',
        { className: 'p-6 sm:p-8 flex flex-col justify-between gap-6' },
        el(
          'div',
          { className: 'space-y-4' },
          el(
            'div',
            { className: 'flex items-start justify-between gap-4' },
            el(
              'div',
              null,
              el(
                'p',
                { className: 'text-xs font-semibold tracking-wider text-orange-600 uppercase' },
                `${product.brand} · ${product.stock > 0 ? `Mavjud (${product.stock} dona)` : 'Tugagan'}`
              ),
              el('h2', { className: 'text-2xl sm:text-3xl font-extrabold text-zinc-950 mt-1' }, product.name)
            ),
            el(
              'button',
              {
                type: 'button',
                'aria-label': 'Yopish',
                className: 'hidden md:flex px-2.5 py-1 rounded-full hover:bg-zinc-100 text-sm font-bold text-zinc-500 hover:text-zinc-950 cursor-pointer',
                onClick: closeModals,
              },
              '✕'
            )
          ),
          el(
            'div',
            { className: 'flex items-baseline gap-3' },
            el('span', { className: 'text-2xl font-extrabold font-mono text-zinc-950 tabular-nums' }, formatUzs(product.priceUzs)),
            product.oldPriceUzs
              ? el('span', { className: 'text-sm font-mono text-zinc-400 line-through tabular-nums' }, formatUzs(product.oldPriceUzs))
              : null
          ),
          el('p', { className: 'text-sm text-zinc-600 leading-relaxed' }, product.description),
          el(
            'div',
            { className: 'space-y-2' },
            el('p', { className: 'text-xs font-semibold text-zinc-700' }, 'Xotira hajmi'),
            el(
              'div',
              { className: 'flex flex-wrap gap-2' },
              product.storageOptions.map((st) =>
                el(
                  'button',
                  {
                    type: 'button',
                    className: `px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedStorage === st
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`,
                    onClick: () => {
                      selectedStorage = st;
                      renderModal();
                    },
                  },
                  st
                )
              )
            )
          ),
          el(
            'div',
            { className: 'space-y-2' },
            el('p', { className: 'text-xs font-semibold text-zinc-700' }, 'Rang'),
            el(
              'div',
              { className: 'flex flex-wrap gap-2' },
              product.colorOptions.map((col) =>
                el(
                  'button',
                  {
                    type: 'button',
                    className: `px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedColor === col
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`,
                    onClick: () => {
                      selectedColor = col;
                      renderModal();
                    },
                  },
                  col
                )
              )
            )
          ),
          el(
            'div',
            { className: 'grid grid-cols-2 gap-2.5 pt-3 border-t border-zinc-100 text-xs text-zinc-700' },
            el('div', { className: 'truncate' }, `Ekran: ${product.specs.display}`),
            el('div', { className: 'truncate' }, `Protsessor: ${product.specs.chip}`),
            el('div', { className: 'truncate' }, `Kamera: ${product.specs.camera}`),
            el('div', { className: 'truncate' }, `Batareya: ${product.specs.battery}`)
          )
        ),
        el(
          'div',
          { className: 'flex flex-col sm:flex-row gap-3 pt-2' },
          el(
            'button',
            {
              type: 'button',
              disabled: product.stock <= 0,
              className:
                'flex-1 py-3.5 px-5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0',
              onClick: () => {
                addToCart(product, selectedStorage, selectedColor, false);
                addedFeedback = true;
                renderModal();
                window.setTimeout(() => {
                  addedFeedback = false;
                  if (dom.modalRoot.firstChild) renderModal();
                }, 1200);
              },
            },
            addedFeedback ? 'Savatga qo‘shildi ✓' : 'Savatga qo‘shish'
          ),
          el(
            'button',
            {
              type: 'button',
              disabled: product.stock <= 0,
              className:
                'flex-1 py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0',
              onClick: () => {
                closeModals();
                addToCart(product, selectedStorage, selectedColor, true);
              },
            },
            'Hoziroq buyurtma'
          )
        )
      )
    );

    overlay.appendChild(card);
    dom.modalRoot.replaceChildren(overlay);
  }

  renderModal();
}

function openCartDrawer() {
  let paymentMethod = 'Naqd';
  let submitting = false;
  let errorMsg = '';
  let confirmedOrder = null;

  let draftName = '';
  let draftPhone = '+998 ';
  let draftCity = 'Toshkent';
  let draftAddress = '';
  let draftNote = '';

  function renderDrawer() {
    const totalUzs = state.cart.reduce((sum, i) => sum + i.unitPriceUzs * i.quantity, 0);
    const overlay = el('div', {
      className: 'fixed inset-0 z-50 flex justify-end bg-zinc-950/70',
      onClick: closeModals,
    });

    const aside = el('aside', {
      className:
        'drawer-panel w-full max-w-lg bg-white text-zinc-950 h-full flex flex-col border-l border-zinc-200 shadow-2xl',
      onClick: (e) => e.stopPropagation(),
    });

    const drawerHeader = el(
      'div',
      { className: 'px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-950 text-white' },
      el(
        'h2',
        { className: 'text-lg font-bold' },
        confirmedOrder ? 'Buyurtma rasmiylashtirildi' : `Savat (${state.cart.length})`
      ),
      el(
        'button',
        {
          type: 'button',
          'aria-label': 'Yopish',
          className: 'px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-bold cursor-pointer',
          onClick: closeModals,
        },
        '✕'
      )
    );

    const body = el('div', { className: 'flex-1 overflow-y-auto p-6 space-y-6' });

    if (confirmedOrder) {
      body.appendChild(
        el(
          'div',
          { className: 'space-y-5' },
          el(
            'div',
            { className: 'p-6 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-center' },
            el('p', { className: 'text-xs font-mono font-bold text-orange-600' }, `BUYURTMA RAQAMI: #${confirmedOrder.orderCode}`),
            el('h3', { className: 'text-2xl font-extrabold text-zinc-950' }, `Rahmat, ${confirmedOrder.customerName}!`),
            el(
              'p',
              { className: 'text-sm text-zinc-600' },
              `Buyurtmangiz qabul qilindi. Operatorlarimiz tez orada ${confirmedOrder.phone} raqamiga qo‘ng‘iroq qiladi.`
            ),
            el(
              'p',
              { className: 'pt-2 text-xs font-semibold text-zinc-700' },
              confirmedOrder.telegramSent
                ? '✓ Telegram kanalga real vaqt rejimida yuborildi'
                : `Telegram holati: ${confirmedOrder.telegramInfo}`
            )
          ),
          el(
            'div',
            { className: 'p-4 rounded-2xl border border-zinc-200 space-y-2 text-sm' },
            el('p', { className: 'font-bold text-zinc-950' }, 'Chek tafsilotlari'),
            confirmedOrder.items.map((it) =>
              el(
                'div',
                { className: 'flex justify-between text-zinc-700 gap-2' },
                el('span', null, `${it.name} (${it.storage}, ${it.color}) × ${it.quantity}`),
                el('span', { className: 'font-mono font-semibold tabular-nums shrink-0' }, formatUzs(it.lineTotalUzs))
              )
            ),
            el(
              'div',
              { className: 'pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-950' },
              el('span', null, 'Jami summa:'),
              el('span', { className: 'font-mono text-orange-600 tabular-nums' }, formatUzs(confirmedOrder.totalUzs))
            )
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'w-full py-3.5 rounded-xl bg-zinc-950 text-white font-bold text-sm hover:bg-zinc-800 cursor-pointer',
              onClick: closeModals,
            },
            'Do‘konga qaytish'
          )
        )
      );
    } else if (state.cart.length === 0) {
      body.appendChild(
        el(
          'div',
          { className: 'py-16 text-center space-y-3' },
          el('p', { className: 'text-base font-bold text-zinc-900' }, 'Savatingiz hozircha bo‘sh'),
          el('p', { className: 'text-sm text-zinc-500' }, 'Katalogdan yoqqan smartfonni tanlab, savatga qo‘shing.')
        )
      );
    } else {
      const cartList = el(
        'div',
        { className: 'space-y-3' },
        state.cart.map((item, idx) =>
          el(
            'div',
            { className: 'p-3.5 rounded-2xl border border-zinc-200 flex items-center gap-3.5' },
            el('img', {
              src: item.imageUrl,
              alt: item.name,
              referrerPolicy: 'no-referrer',
              className: 'w-16 h-16 rounded-xl object-cover bg-zinc-100 shrink-0',
            }),
            el(
              'div',
              { className: 'flex-1 min-w-0' },
              el('p', { className: 'text-sm font-bold text-zinc-950 truncate' }, item.name),
              el('p', { className: 'text-xs text-zinc-500' }, `${item.storage} · ${item.color}`),
              el(
                'p',
                { className: 'text-sm font-mono font-bold text-orange-600 tabular-nums mt-1' },
                formatUzs(item.unitPriceUzs * item.quantity)
              )
            ),
            el(
              'div',
              { className: 'flex flex-col items-end gap-2' },
              el(
                'button',
                {
                  type: 'button',
                  className: 'text-xs font-semibold text-zinc-400 hover:text-rose-600 cursor-pointer',
                  onClick: () => {
                    state.cart.splice(idx, 1);
                    saveCart();
                    renderDrawer();
                  },
                },
                'O‘chirish'
              ),
              el(
                'div',
                { className: 'flex items-center gap-1.5 border border-zinc-200 rounded-lg px-1.5 py-0.5' },
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'px-1.5 py-0.5 text-xs font-bold text-zinc-600 hover:text-zinc-950 cursor-pointer',
                    onClick: () => {
                      state.cart[idx].quantity -= 1;
                      if (state.cart[idx].quantity <= 0) state.cart.splice(idx, 1);
                      saveCart();
                      renderDrawer();
                    },
                  },
                  '−'
                ),
                el('span', { className: 'text-xs font-mono font-bold w-5 text-center tabular-nums' }, String(item.quantity)),
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'px-1.5 py-0.5 text-xs font-bold text-zinc-600 hover:text-zinc-950 cursor-pointer',
                    onClick: () => {
                      state.cart[idx].quantity = Math.min(10, state.cart[idx].quantity + 1);
                      saveCart();
                      renderDrawer();
                    },
                  },
                  '+'
                )
              )
            )
          )
        )
      );

      const nameInput = el('input', {
        type: 'text',
        required: true,
        value: draftName,
        placeholder: 'Masalan: Jasur Karimov',
        className: 'w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm',
        onInput: (e) => { draftName = e.target.value; },
      });

      const phoneInput = el('input', {
        type: 'tel',
        required: true,
        value: draftPhone,
        placeholder: '+998 90 123 45 67',
        className: 'w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm font-mono',
        onInput: (e) => { draftPhone = e.target.value; },
      });

      const cities = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Farg‘ona', 'Namangan', 'Xorazm', 'Qashqadaryo'];
      const citySelect = el(
        'select',
        {
          className: 'w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm bg-white',
          onChange: (e) => { draftCity = e.target.value; },
        },
        cities.map((c) => el('option', { value: c, selected: draftCity === c }, c))
      );

      const addrInput = el('input', {
        type: 'text',
        required: true,
        value: draftAddress,
        placeholder: 'Tuman, ko‘cha, uy raqami...',
        className: 'w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm',
        onInput: (e) => { draftAddress = e.target.value; },
      });

      const noteInput = el('input', {
        type: 'text',
        value: draftNote,
        placeholder: 'Masalan: Kechki 18:00 dan keyin...',
        className: 'w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm',
        onInput: (e) => { draftNote = e.target.value; },
      });

      const checkoutForm = el(
        'form',
        {
          id: 'checkout-form',
          className: 'space-y-4 pt-4 border-t border-zinc-200',
          onSubmit: async (e) => {
            e.preventDefault();
            if (state.cart.length === 0) return;
            errorMsg = '';
            submitting = true;
            renderDrawer();
            try {
              const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerName: draftName,
                  phone: draftPhone,
                  city: draftCity,
                  address: draftAddress,
                  paymentMethod,
                  note: draftNote,
                  items: state.cart.map((i) => ({
                    productId: i.productId,
                    storage: i.storage,
                    color: i.color,
                    quantity: i.quantity,
                  })),
                }),
              });
              const data = await res.json();
              if (!res.ok || !data.order) {
                errorMsg = data.error || 'Buyurtma yuborishda xatolik yuz berdi.';
              } else {
                confirmedOrder = data.order;
                state.cart = [];
                saveCart();
                void fetchProducts();
              }
            } catch {
              errorMsg = 'Server bilan aloqa o‘rnatilmadi. Qayta urinib ko‘ring.';
            } finally {
              submitting = false;
              renderDrawer();
            }
          },
        },
        el('h3', { className: 'text-base font-bold text-zinc-950' }, 'Yetkazib berish ma’lumotlari'),
        el('div', null, el('label', { className: 'block text-xs font-semibold text-zinc-700 mb-1' }, 'Ismingiz *'), nameInput),
        el(
          'div',
          { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3' },
          el('div', null, el('label', { className: 'block text-xs font-semibold text-zinc-700 mb-1' }, 'Telefon raqam *'), phoneInput),
          el('div', null, el('label', { className: 'block text-xs font-semibold text-zinc-700 mb-1' }, 'Shahar / Viloyat *'), citySelect)
        ),
        el('div', null, el('label', { className: 'block text-xs font-semibold text-zinc-700 mb-1' }, 'Aniq manzil *'), addrInput),
        el(
          'div',
          null,
          el('label', { className: 'block text-xs font-semibold text-zinc-700 mb-1' }, 'To‘lov turi'),
          el(
            'div',
            { className: 'grid grid-cols-3 gap-2' },
            ['Naqd', 'Karta', 'Muddatli to‘lov'].map((pm) =>
              el(
                'button',
                {
                  type: 'button',
                  className: `py-2 px-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    paymentMethod === pm
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                  }`,
                  onClick: () => {
                    paymentMethod = pm;
                    renderDrawer();
                  },
                },
                pm
              )
            )
          )
        ),
        el('div', null, el('label', { className: 'block text-xs font-semibold text-zinc-700 mb-1' }, 'Qo‘shimcha izoh'), noteInput),
        errorMsg ? el('p', { className: 'text-xs font-medium text-rose-600' }, errorMsg) : null
      );

      body.appendChild(cartList);
      body.appendChild(checkoutForm);
    }

    aside.appendChild(drawerHeader);
    aside.appendChild(body);

    if (!confirmedOrder && state.cart.length > 0) {
      aside.appendChild(
        el(
          'div',
          { className: 'p-6 border-t border-zinc-200 bg-zinc-50 space-y-3' },
          el(
            'div',
            { className: 'flex items-center justify-between' },
            el('span', { className: 'text-sm font-medium text-zinc-600' }, 'Jami to‘lov:'),
            el('span', { className: 'text-xl font-extrabold font-mono text-zinc-950 tabular-nums' }, formatUzs(totalUzs))
          ),
          el(
            'button',
            {
              type: 'submit',
              form: 'checkout-form',
              disabled: submitting,
              className:
                'w-full py-3.5 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer',
            },
            submitting ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash'
          )
        )
      );
    }

    overlay.appendChild(aside);
    dom.modalRoot.replaceChildren(overlay);
  }

  renderDrawer();
}

function openTrackModal() {
  let codeValue = '';
  let loading = false;
  let errorMsg = '';
  let result = null;

  function renderTrack() {
    const overlay = el('div', {
      className: 'fixed inset-0 z-50 bg-zinc-950/75 flex items-center justify-center p-4',
      onClick: closeModals,
    });

    const input = el('input', {
      type: 'text',
      value: codeValue,
      placeholder: 'Masalan: OM-1001',
      className: 'flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 focus:outline-none text-sm font-mono uppercase',
      onInput: (e) => { codeValue = e.target.value; },
    });

    const card = el(
      'div',
      {
        className: 'modal-card w-full max-w-md bg-white text-zinc-950 rounded-3xl border border-zinc-200 p-6 space-y-5 shadow-2xl',
        onClick: (e) => e.stopPropagation(),
      },
      el(
        'div',
        { className: 'flex items-center justify-between' },
        el('h2', { className: 'text-xl font-extrabold text-zinc-950' }, 'Buyurtmani kuzatish'),
        el(
          'button',
          {
            type: 'button',
            'aria-label': 'Yopish',
            className: 'px-2 py-1 rounded-lg hover:bg-zinc-100 text-zinc-500 font-bold cursor-pointer',
            onClick: closeModals,
          },
          '✕'
        )
      ),
      el(
        'form',
        {
          className: 'flex gap-2',
          onSubmit: async (e) => {
            e.preventDefault();
            if (!codeValue.trim()) return;
            loading = true;
            errorMsg = '';
            result = null;
            renderTrack();
            try {
              const res = await fetch(`/api/orders/track/${encodeURIComponent(codeValue.trim())}`);
              const data = await res.json();
              if (!res.ok || !data.order) {
                errorMsg = data.error || 'Buyurtma topilmadi.';
              } else {
                result = data.order;
              }
            } catch {
              errorMsg = 'Server bilan aloqa xatosi.';
            } finally {
              loading = false;
              renderTrack();
            }
          },
        },
        input,
        el(
          'button',
          {
            type: 'submit',
            disabled: loading,
            className:
              'px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm cursor-pointer whitespace-nowrap shrink-0',
          },
          loading ? '...' : 'Tekshirish'
        )
      ),
      errorMsg ? el('p', { className: 'text-xs font-medium text-rose-600' }, errorMsg) : null,
      result
        ? el(
            'div',
            { className: 'p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-sm' },
            el(
              'div',
              { className: 'flex items-center justify-between' },
              el('span', { className: 'font-mono font-bold text-zinc-950' }, `#${result.orderCode}`),
              el('span', { className: 'font-bold text-orange-600' }, result.status)
            ),
            el(
              'div',
              { className: 'space-y-1 text-xs text-zinc-600' },
              result.items.map((it) => el('p', null, `• ${it.name} (${it.storage}) × ${it.quantity}`))
            ),
            el(
              'div',
              { className: 'pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-950' },
              el('span', null, 'Jami:'),
              el('span', { className: 'font-mono tabular-nums' }, formatUzs(result.totalUzs))
            )
          )
        : null
    );

    overlay.appendChild(card);
    dom.modalRoot.replaceChildren(overlay);
  }

  renderTrack();
}

function toggleMobileMenu(forceState) {
  if (!dom.mobileMenuPanel) return;
  const open = typeof forceState === 'boolean' ? forceState : dom.mobileMenuPanel.classList.contains('hidden');
  dom.mobileMenuPanel.classList.toggle('hidden', !open);
  dom.mobileIconOpen?.classList.toggle('hidden', open);
  dom.mobileIconClose?.classList.toggle('hidden', !open);
  dom.mobileMenuToggle?.setAttribute('aria-expanded', String(open));
}

function bindEvents() {
  dom.categoryTabs?.querySelectorAll('.cat-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedCategory = btn.getAttribute('data-category') || 'all';
      updateCategoryTabStyles();
      renderCatalog();
    });
  });

  dom.searchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderCatalog();
  });

  dom.brandSelect?.addEventListener('change', (e) => {
    state.selectedBrand = e.target.value;
    renderCatalog();
  });

  dom.sortSelect?.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderCatalog();
  });

  document.getElementById('header-cart-btn')?.addEventListener('click', openCartDrawer);
  document.getElementById('nav-track-btn')?.addEventListener('click', openTrackModal);
  document.getElementById('hero-track-btn')?.addEventListener('click', openTrackModal);
  document.getElementById('footer-track-btn')?.addEventListener('click', openTrackModal);

  const launchAdmin = () =>
    openAdminModal({
      modalRoot: dom.modalRoot,
      onClose: closeModals,
      onProductsUpdated: () => void fetchProducts(),
    });

  document.getElementById('nav-admin-btn')?.addEventListener('click', launchAdmin);
  document.getElementById('footer-admin-btn')?.addEventListener('click', launchAdmin);

  dom.mobileMenuToggle?.addEventListener('click', () => toggleMobileMenu());
  document.querySelectorAll('[data-mobile-close]').forEach((link) => {
    link.addEventListener('click', () => toggleMobileMenu(false));
  });
  document.getElementById('mobile-track-btn')?.addEventListener('click', () => {
    toggleMobileMenu(false);
    openTrackModal();
  });
  document.getElementById('mobile-admin-btn')?.addEventListener('click', () => {
    toggleMobileMenu(false);
    launchAdmin();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.modalRoot.childElementCount > 0) {
      closeModals();
    }
  });
}

updateCartCounter();
bindEvents();
renderCatalog();
void fetchProducts();
