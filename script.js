const STORAGE_KEYS = {
  products: 'retrobitProducts',
  orders: 'retrobitOrders',
  currentOrder: 'retrobitCurrentOrder',
  settings: 'retrobitSettings',
  drafts: 'retrobitDrafts'
};

const defaultProducts = [
  { id: 1, name: 'Shrimp Basil Salad', price: 10, category: 'Salads', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=500&q=80' },
  { id: 2, name: 'Onion Rings', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=80' },
  { id: 3, name: 'Smoked Bacon', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=500&q=80' },
  { id: 4, name: 'Fresh Tomatoes', price: 10, category: 'Salads', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=500&q=80' },
  { id: 5, name: 'Chicken Burger', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80' },
  { id: 6, name: 'Red Onion Rings', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80' },
  { id: 7, name: 'Beef Burger', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=500&q=80' },
  { id: 8, name: 'Grilled Burger', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=500&q=80' },
  { id: 9, name: 'Chicken Burger', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80' },
  { id: 10, name: 'Fresh Basil Salad', price: 10, category: 'Salads', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=500&q=80' },
  { id: 11, name: 'Vegetable Pizza', price: 10, category: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80' },
  { id: 12, name: 'Fish & Chips', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1574484284002-1f1234f9d9d8?auto=format&fit=crop&w=500&q=80' }
];

const defaultOrders = [
  {
    id: 101,
    date: '2026-11-10',
    total: 58,
    items: [
      { name: 'Fresh Basil Salad', qty: 2, price: 10 },
      { name: 'Beef Burger', qty: 1, price: 10 },
      { name: 'Chicken Burger', qty: 2, price: 10 }
    ]
  },
  {
    id: 102,
    date: '2026-11-09',
    total: 46,
    items: [
      { name: 'Onion Rings', qty: 2, price: 10 },
      { name: 'Vegetable Pizza', qty: 2, price: 10 }
    ]
  },
  {
    id: 103,
    date: '2026-11-08',
    total: 34,
    items: [
      { name: 'Fish & Chips', qty: 2, price: 10 },
      { name: 'Fresh Tomatoes', qty: 1, price: 10 }
    ]
  }
];

const state = {
  products: loadFromStorage(STORAGE_KEYS.products, defaultProducts),
  orders: loadFromStorage(STORAGE_KEYS.orders, defaultOrders),
  currentOrder: loadFromStorage(STORAGE_KEYS.currentOrder, [
    { id: 1, name: 'Fresh Basil Salad', price: 10, qty: 2 },
    { id: 7, name: 'Beef Burger', price: 10, qty: 1 },
    { id: 5, name: 'Chicken Burger', price: 10, qty: 2 }
  ]),
  selectedCategory: 'all',
  currentView: 'pos',
  productSearch: '',
  settings: loadFromStorage(STORAGE_KEYS.settings, {
    taxRate: 0,
    serviceCharge: 0,
    autoPrint: true,
    lowStockAlert: true
  }),
  drafts: loadFromStorage(STORAGE_KEYS.drafts, []),
  isLoggedIn: false,
  pendingView: 'pos'
};

const productGrid = document.getElementById('productGrid');
const orderItemsContainer = document.getElementById('orderItems');
const subTotalEl = document.getElementById('subTotal');
const productDiscountEl = document.getElementById('productDiscount');
const extraDiscountEl = document.getElementById('extraDiscount');
const couponDiscountEl = document.getElementById('couponDiscount');
const grandTotalEl = document.getElementById('grandTotal');
const categoryFilter = document.getElementById('categoryFilter');
const categoryNav = document.getElementById('categoryNav');
const productSearch = document.getElementById('productSearch');
const dashboardRevenue = document.getElementById('dashboardRevenue');
const dashboardOrders = document.getElementById('dashboardOrders');
const dashboardAverage = document.getElementById('dashboardAverage');
const dashboardProducts = document.getElementById('dashboardProducts');
const salesBars = document.getElementById('salesBars');
const recentOrdersList = document.getElementById('recentOrdersList');
const adminProductTable = document.getElementById('adminProductTable');
const adminSalesList = document.getElementById('adminSalesList');
const reportSalesTotal = document.getElementById('reportSalesTotal');
const reportOrdersCount = document.getElementById('reportOrdersCount');
const reportBestSeller = document.getElementById('reportBestSeller');
const topProductsList = document.getElementById('topProductsList');
const productForm = document.getElementById('productForm');
const workspaceHeader = document.getElementById('workspaceHeader');
const orderNumber = document.getElementById('orderNumber');
const loginModal = document.getElementById('loginModal');
const loginTrigger = document.getElementById('loginTrigger');
const loginLabel = document.getElementById('loginLabel');
const settingsForm = document.getElementById('settingsForm');

function loadFromStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCategories() {
  return ['all', ...new Set(state.products.map((product) => product.category))];
}

function setView(viewName) {
  if ((viewName === 'admin' || viewName === 'reports' || viewName === 'settings') && !state.isLoggedIn) {
    state.pendingView = viewName;
    openLoginModal();
    return;
  }

  state.currentView = viewName;
  document.querySelectorAll('.view-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `${viewName}View`);
  });

  document.querySelectorAll('.nav-item[data-view]').forEach((navItem) => {
    const isActive = navItem.dataset.view === viewName;
    navItem.classList.toggle('active', isActive);
    navItem.classList.toggle('selected', isActive);
  });

  const viewLabels = {
    dashboard: { title: 'Dashboard Overview', crumb: 'Dashboard' },
    pos: { title: 'Point of Sale (POS)', crumb: 'Pos' },
    admin: { title: 'Admin Panel', crumb: 'Admin' },
    reports: { title: 'Reports', crumb: 'Reports' },
    settings: { title: 'Settings', crumb: 'Setting' }
  };

  const label = viewLabels[viewName] || viewLabels.pos;
  workspaceHeader.innerHTML = `
    <div>
      <h1>${label.title}</h1>
      <div class="breadcrumbs">
        <span>Dashboard</span>
        <span class="sep">•</span>
        <span class="active">${label.crumb}</span>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-btn" type="button" id="newOrderBtn">+ New</button>
      <button class="secondary-btn" type="button">QR Menu Orders</button>
      <button class="secondary-btn" type="button" id="draftListBtn">Draft List</button>
      <button class="secondary-btn" type="button">Table Order</button>
    </div>
  `;

  document.getElementById('newOrderBtn')?.addEventListener('click', resetCurrentOrder);
  document.getElementById('draftListBtn')?.addEventListener('click', openDrafts);
}

function renderCategories() {
  const categories = getCategories();
  categoryNav.innerHTML = categories
    .map((category) => {
      const label = category === 'all' ? 'Show All' : category;
      const isActive = state.selectedCategory === category;
      return `<button class="category-btn ${isActive ? 'active' : ''}" data-category="${category}">${label}</button>`;
    })
    .join('');

  categoryFilter.innerHTML = `<option value="all">All Category</option>${categories
    .filter((category) => category !== 'all')
    .map((category) => `<option value="${category}">${category}</option>`)
    .join('')}`;

  categoryFilter.value = state.selectedCategory;

  categoryNav.querySelectorAll('.category-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedCategory = button.dataset.category;
      renderCategories();
      renderProducts();
    });
  });
}

function renderProducts() {
  const searchTerm = state.productSearch.trim().toLowerCase();
  const filteredProducts = state.products.filter((product) => {
    const matchesCategory = state.selectedCategory === 'all' || product.category === state.selectedCategory;
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  productGrid.innerHTML = '';

  if (!filteredProducts.length) {
    productGrid.innerHTML = '<div class="empty-state">No products match your search.</div>';
    return;
  }

  filteredProducts.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80'}" alt="${product.name}" />
      </div>
      <h3 class="product-name">${product.name}</h3>
      <div class="product-footer">
        <span class="product-price">$${Number(product.price).toFixed(2)}</span>
        <button class="add-btn" data-id="${product.id}" aria-label="Add ${product.name}">+</button>
      </div>
    `;

    productGrid.appendChild(card);
  });

  document.querySelectorAll('.add-btn').forEach((button) => {
    button.addEventListener('click', () => addToOrder(Number(button.dataset.id)));
  });
}

function addToOrder(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const existing = state.currentOrder.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.currentOrder.push({ id: product.id, name: product.name, price: Number(product.price), qty: 1 });
  }

  saveToStorage(STORAGE_KEYS.currentOrder, state.currentOrder);
  renderOrder();
}

function changeQty(productId, delta) {
  const item = state.currentOrder.find((entry) => entry.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    const index = state.currentOrder.findIndex((entry) => entry.id === productId);
    state.currentOrder.splice(index, 1);
  }

  saveToStorage(STORAGE_KEYS.currentOrder, state.currentOrder);
  renderOrder();
}

function removeItem(productId) {
  const index = state.currentOrder.findIndex((entry) => entry.id === productId);
  if (index >= 0) {
    state.currentOrder.splice(index, 1);
    saveToStorage(STORAGE_KEYS.currentOrder, state.currentOrder);
    renderOrder();
  }
}

function renderOrder() {
  orderItemsContainer.innerHTML = '';

  if (!state.currentOrder.length) {
    orderItemsContainer.innerHTML = '<div class="empty-order">No items added yet.</div>';
  }

  state.currentOrder.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'order-item';
    row.innerHTML = `
      <div class="item-main">
        <div class="item-name">${item.name}</div>
        <div class="item-price-line">
          <span class="item-price">$${(item.price * item.qty).toFixed(2)}</span>
          <div class="qty-control">
            <button class="qty-btn" type="button" data-action="decrease" data-id="${item.id}">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" type="button" data-action="increase" data-id="${item.id}">+</button>
          </div>
        </div>
      </div>
      <button class="delete-btn" type="button" data-id="${item.id}" aria-label="Remove ${item.name}">✕</button>
    `;

    orderItemsContainer.appendChild(row);
  });

  orderNumber.textContent = Math.max(20, state.orders.length + 1);

  document.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.id);
      const action = button.dataset.action;
      changeQty(id, action === 'increase' ? 1 : -1);
    });
  });

  document.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', () => removeItem(Number(button.dataset.id)));
  });

  updateTotals();
}

function updateTotals() {
  const subtotal = state.currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);
  const productDiscount = 0;
  const extraDiscount = 0;
  const couponDiscount = 0;
  const total = subtotal - productDiscount - extraDiscount - couponDiscount;

  subTotalEl.textContent = `$${subtotal.toFixed(2)}`;
  productDiscountEl.textContent = `$${productDiscount.toFixed(2)}`;
  extraDiscountEl.textContent = `$${extraDiscount.toFixed(2)}`;
  couponDiscountEl.textContent = `$${couponDiscount.toFixed(2)}`;
  grandTotalEl.textContent = `$${total.toFixed(2)}`;
}

function getSalesSummary() {
  const totalRevenue = state.orders.reduce((sum, order) => sum + Number(order.total), 0);
  const average = state.orders.length ? totalRevenue / state.orders.length : 0;
  return {
    totalRevenue,
    totalOrders: state.orders.length,
    average,
    productCount: state.products.length
  };
}

function renderDashboard() {
  const summary = getSalesSummary();
  dashboardRevenue.textContent = `$${summary.totalRevenue.toFixed(2)}`;
  dashboardOrders.textContent = String(summary.totalOrders);
  dashboardAverage.textContent = `$${summary.average.toFixed(2)}`;
  dashboardProducts.textContent = String(summary.productCount);

  const values = [
    summary.totalRevenue * 0.3,
    summary.totalRevenue * 0.5,
    summary.totalRevenue * 0.6,
    summary.totalRevenue * 0.45,
    summary.totalRevenue * 0.7,
    summary.totalRevenue * 0.66,
    summary.totalRevenue * 0.8
  ];

  salesBars.innerHTML = values
    .map((value, index) => {
      const height = Math.max(18, Math.min(100, (value / Math.max(...values, 1)) * 100));
      return `
        <div class="bar-col">
          <div class="bar-value" style="height:${height}%"></div>
          <span>${['M','T','W','T','F','S','S'][index]}</span>
        </div>
      `;
    })
    .join('');

  recentOrdersList.innerHTML = state.orders
    .slice(0, 4)
    .map((orderItem) => `
      <div class="order-row">
        <div>
          <strong>#${String(orderItem.id).slice(-4)}</strong>
          <span>${orderItem.items.length} items</span>
        </div>
        <div class="amount">$${Number(orderItem.total).toFixed(2)}</div>
      </div>
    `)
    .join('');
}

function renderReports() {
  const summary = getSalesSummary();
  reportSalesTotal.textContent = `$${summary.totalRevenue.toFixed(2)}`;
  reportOrdersCount.textContent = String(summary.totalOrders);

  const counts = {};
  state.orders.forEach((orderItem) => {
    orderItem.items.forEach((item) => {
      counts[item.name] = (counts[item.name] || 0) + item.qty;
    });
  });

  const bestSeller = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  reportBestSeller.textContent = bestSeller ? bestSeller[0] : '-';

  topProductsList.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => `
      <div class="top-product-row">
        <span>${name}</span>
        <strong>${qty} sold</strong>
      </div>
    `)
    .join('');
}

function renderSettings() {
  document.getElementById('taxRateInput').value = state.settings.taxRate || 0;
  document.getElementById('serviceChargeInput').value = state.settings.serviceCharge || 0;
  document.getElementById('autoPrintToggle').checked = !!state.settings.autoPrint;
  document.getElementById('lowStockToggle').checked = !!state.settings.lowStockAlert;
}

function renderAdminTable() {
  adminProductTable.innerHTML = state.products
    .map((product) => `
      <tr>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>$${Number(product.price).toFixed(2)}</td>
        <td>
          <div class="row-actions">
            <button class="mini-link" type="button" data-edit-id="${product.id}">Edit</button>
            <button class="mini-link danger" type="button" data-delete-id="${product.id}">Delete</button>
          </div>
        </td>
      </tr>
    `)
    .join('');

  adminProductTable.querySelectorAll('[data-edit-id]').forEach((button) => {
    button.addEventListener('click', () => populateProductForm(Number(button.dataset.editId)));
  });

  adminProductTable.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => deleteProduct(Number(button.dataset.deleteId)));
  });
}

function renderAdminSales() {
  adminSalesList.innerHTML = state.orders
    .slice(0, 5)
    .map((orderItem) => `
      <div class="sales-item">
        <div>
          <strong>Order #${orderItem.id}</strong>
          <span>${orderItem.date}</span>
        </div>
        <div class="amount">$${Number(orderItem.total).toFixed(2)}</div>
      </div>
    `)
    .join('');
}

function populateProductForm(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productImage').value = product.image || '';
  setView('admin');
}

function deleteProduct(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  state.products = state.products.filter((item) => item.id !== productId);
  state.currentOrder = state.currentOrder.filter((item) => item.id !== productId);
  saveToStorage(STORAGE_KEYS.products, state.products);
  saveToStorage(STORAGE_KEYS.currentOrder, state.currentOrder);
  renderCategories();
  renderProducts();
  renderOrder();
  renderAdminTable();
  renderDashboard();
}

function handleProductSubmit(event) {
  event.preventDefault();

  const id = Number(document.getElementById('productId').value) || Date.now();
  const product = {
    id,
    name: document.getElementById('productName').value.trim(),
    category: document.getElementById('productCategory').value,
    price: Number(document.getElementById('productPrice').value),
    image: document.getElementById('productImage').value || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80'
  };

  if (!product.name || !product.category || Number.isNaN(product.price)) {
    return;
  }

  const existingIndex = state.products.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    state.products[existingIndex] = product;
  } else {
    state.products.push(product);
  }

  saveToStorage(STORAGE_KEYS.products, state.products);
  renderCategories();
  renderProducts();
  renderAdminTable();
  renderDashboard();
  productForm.reset();
  document.getElementById('productId').value = '';
}

function finalizeOrder() {
  if (!state.currentOrder.length) return;

  const subtotal = state.currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * (Number(state.settings.taxRate || 0) / 100);
  const serviceCharge = subtotal * (Number(state.settings.serviceCharge || 0) / 100);
  const total = subtotal + tax + serviceCharge;

  state.orders.unshift({
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    total,
    items: state.currentOrder.map((item) => ({ name: item.name, qty: item.qty, price: item.price }))
  });

  saveToStorage(STORAGE_KEYS.orders, state.orders);
  state.currentOrder = [];
  saveToStorage(STORAGE_KEYS.currentOrder, state.currentOrder);
  renderOrder();
  renderDashboard();
  renderReports();
  renderAdminSales();
}

function resetCurrentOrder() {
  state.currentOrder = [];
  saveToStorage(STORAGE_KEYS.currentOrder, state.currentOrder);
  renderOrder();
}

function openDrafts() {
  const drafts = state.drafts.length ? state.drafts : [{ name: 'No saved drafts', items: [] }];
  const message = drafts
    .map((draft, index) => `${index + 1}. ${draft.name || `Draft ${index + 1}`} (${draft.items?.length || 0} items)`)
    .join('\n');
  alert(message);
}

function openLoginModal() {
  loginModal.classList.remove('hidden');
  loginModal.setAttribute('aria-hidden', 'false');
}

function closeLoginModal() {
  loginModal.classList.add('hidden');
  loginModal.setAttribute('aria-hidden', 'true');
}

function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (email === 'admin@retrobit.com' && password === 'admin123') {
    state.isLoggedIn = true;
    loginLabel.textContent = 'Logout';
    closeLoginModal();
    const nextView = state.pendingView || state.currentView || 'pos';
    state.pendingView = 'pos';
    setView(nextView);
    return;
  }

  alert('Invalid credentials. Use admin@retrobit.com / admin123');
}

function handleLogout() {
  state.isLoggedIn = false;
  state.pendingView = 'pos';
  loginLabel.textContent = 'Login';
  setView('pos');
}

function saveSettings(event) {
  event.preventDefault();
  state.settings = {
    taxRate: Number(document.getElementById('taxRateInput').value || 0),
    serviceCharge: Number(document.getElementById('serviceChargeInput').value || 0),
    autoPrint: document.getElementById('autoPrintToggle').checked,
    lowStockAlert: document.getElementById('lowStockToggle').checked
  };
  saveToStorage(STORAGE_KEYS.settings, state.settings);
  alert('Settings saved successfully.');
}

function attachEvents() {
  document.querySelectorAll('.nav-item[data-view]').forEach((navItem) => {
    navItem.addEventListener('click', () => setView(navItem.dataset.view));
  });

  loginTrigger.addEventListener('click', () => {
    if (state.isLoggedIn) {
      handleLogout();
      return;
    }
    openLoginModal();
  });

  document.getElementById('closeLoginModal').addEventListener('click', closeLoginModal);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  settingsForm.addEventListener('submit', saveSettings);

  productSearch.addEventListener('input', (event) => {
    state.productSearch = event.target.value;
    renderProducts();
  });

  categoryFilter.addEventListener('change', (event) => {
    state.selectedCategory = event.target.value;
    renderCategories();
    renderProducts();
  });

  productForm.addEventListener('submit', handleProductSubmit);
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    productForm.reset();
    document.getElementById('productId').value = '';
  });
  document.getElementById('billPaymentBtn').addEventListener('click', finalizeOrder);
  document.getElementById('billPrintBtn').addEventListener('click', finalizeOrder);
  document.getElementById('draftBtn').addEventListener('click', () => {
    state.drafts.unshift({
      name: `Draft ${state.drafts.length + 1}`,
      items: [...state.currentOrder],
      savedAt: new Date().toISOString()
    });
    saveToStorage(STORAGE_KEYS.drafts, state.drafts);
    alert('Draft saved successfully.');
  });
  document.getElementById('kotPrintBtn').addEventListener('click', () => {
    alert('KOT sent to kitchen.');
  });
  document.getElementById('refreshProductsBtn').addEventListener('click', () => {
    renderProducts();
    renderAdminTable();
  });
}

attachEvents();
renderCategories();
renderProducts();
renderOrder();
renderDashboard();
renderReports();
renderAdminTable();
renderAdminSales();
renderSettings();
setView('pos');
