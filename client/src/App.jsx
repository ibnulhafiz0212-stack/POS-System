import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/+$/, '');

const fallbackProducts = [
  { id: 1, name: 'Shrimp Basil Salad', price: 10, category: 'Salads', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=500&q=80' },
  { id: 2, name: 'Onion Rings', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=80' },
  { id: 3, name: 'Smoked Bacon', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=500&q=80' },
  { id: 4, name: 'Fresh Tomatoes', price: 10, category: 'Salads', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=500&q=80' },
  { id: 5, name: 'Chicken Burger', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80' },
  { id: 6, name: 'Red Onion Rings', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80' },
  { id: 7, name: 'Beef Burger', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=500&q=80' },
  { id: 8, name: 'Grilled Burger', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=500&q=80' },
  { id: 9, name: 'Vegetable Pizza', price: 10, category: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80' },
  { id: 10, name: 'Fresh Basil Salad', price: 10, category: 'Salads', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=500&q=80' },
  { id: 11, name: 'Fish & Chips', price: 10, category: 'Rice', image: 'https://images.unsplash.com/photo-1574484284002-1f1234f9d9d8?auto=format&fit=crop&w=500&q=80' },
  { id: 12, name: 'Berry Smoothie', price: 12, category: 'Beverages', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=500&q=80' }
];

const fallbackOrders = [
  { id: 101, date: '2026-11-10', total: 58, items: [{ name: 'Fresh Basil Salad', qty: 2, price: 10 }, { name: 'Beef Burger', qty: 1, price: 10 }, { name: 'Chicken Burger', qty: 2, price: 10 }] },
  { id: 102, date: '2026-11-09', total: 46, items: [{ name: 'Onion Rings', qty: 2, price: 10 }, { name: 'Vegetable Pizza', qty: 2, price: 10 }] },
  { id: 103, date: '2026-11-08', total: 34, items: [{ name: 'Fish & Chips', qty: 2, price: 10 }, { name: 'Fresh Tomatoes', qty: 1, price: 10 }] }
];

const defaultSettings = { taxRate: 0, serviceCharge: 0, autoPrint: true, lowStockAlert: true };
const fallbackCurrentOrder = [
  { id: 1, name: 'Fresh Basil Salad', price: 10, qty: 2 },
  { id: 7, name: 'Beef Burger', price: 10, qty: 1 },
  { id: 5, name: 'Chicken Burger', price: 10, qty: 2 }
];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const safeJSON = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [orders, setOrders] = useState(fallbackOrders);
  const [settings, setSettings] = useState(defaultSettings);
  const [currentOrder, setCurrentOrder] = useState(fallbackCurrentOrder);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [view, setView] = useState('pos');
  const [pendingView, setPendingView] = useState('admin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [drafts, setDrafts] = useState(() => safeJSON('retrobitDrafts', []));
  const [loginForm, setLoginForm] = useState({ email: 'admin@retrobit.com', password: 'admin123' });
  const [productForm, setProductForm] = useState({ id: '', name: '', category: '', price: '', image: '' });
  const [tableFilter, setTableFilter] = useState('all');
  const [selectedTableId, setSelectedTableId] = useState(1);
  const [tables, setTables] = useState(() => safeJSON('retrobitTables', [
    { id: 1, name: 'Table 1', status: 'occupied', seats: 2, notes: 'VIP check-in' },
    { id: 2, name: 'Table 2', status: 'available', seats: 4, notes: 'Ready for order' },
    { id: 3, name: 'Table 3', status: 'reserved', seats: 6, notes: 'Reservation at 7:30 PM' },
    { id: 4, name: 'Table 4', status: 'available', seats: 2, notes: 'Quick table' },
    { id: 5, name: 'Table 5', status: 'occupied', seats: 4, notes: 'Family group' },
    { id: 6, name: 'Table 6', status: 'available', seats: 8, notes: 'Large party ready' },
  ]));
  const [reservations, setReservations] = useState(() => safeJSON('retrobitReservations', [
    { id: 1, guest: 'Nadia', phone: '+8801700000000', date: '2026-11-10', time: '19:30', seats: 4, table: 'Table 3', status: 'Confirmed' },
    { id: 2, guest: 'Rafi', phone: '+8801888888888', date: '2026-11-10', time: '20:00', seats: 2, table: 'Table 1', status: 'Pending' },
  ]));
  const [reservationForm, setReservationForm] = useState({
    guest: '',
    phone: '',
    date: new Date().toISOString().slice(0, 10),
    time: '19:00',
    seats: '2',
    table: 'Table 2',
  });

  const categories = useMemo(() => ['all', ...new Set(products.map((product) => product.category))], [products]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = !term || product.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, productSearch, selectedCategory]);

  const subtotal = currentOrder.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const productDiscount = 0;
  const extraDiscount = 0;
  const couponDiscount = 0;
  const taxAmount = subtotal * (Number(settings.taxRate || 0) / 100);
  const serviceFee = subtotal * (Number(settings.serviceCharge || 0) / 100);
  const grandTotal = subtotal - productDiscount - extraDiscount - couponDiscount + taxAmount + serviceFee;

  const dashboardStats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const average = orders.length ? revenue / orders.length : 0;
    return {
      revenue,
      orderCount: orders.length,
      averageTicket: average,
      productCount: products.length,
    };
  }, [orders, products]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsResponse, ordersResponse, settingsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products`),
          fetch(`${API_BASE_URL}/api/orders`),
          fetch(`${API_BASE_URL}/api/settings`),
        ]);

        if (productsResponse.ok) {
          const fetchedProducts = await productsResponse.json();
          setProducts(fetchedProducts);
        }

        if (ordersResponse.ok) {
          const fetchedOrders = await ordersResponse.json();
          setOrders(fetchedOrders);
        }

        if (settingsResponse.ok) {
          const fetchedSettings = await settingsResponse.json();
          setSettings(fetchedSettings);
        }
      } catch {
        setProducts(safeJSON('retrobitProducts', fallbackProducts));
        setOrders(safeJSON('retrobitOrders', fallbackOrders));
        setSettings(safeJSON('retrobitSettings', defaultSettings));
        setCurrentOrder(safeJSON('retrobitCurrentOrder', fallbackCurrentOrder));
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('retrobitProducts', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('retrobitOrders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('retrobitCurrentOrder', JSON.stringify(currentOrder));
  }, [currentOrder]);

  useEffect(() => {
    localStorage.setItem('retrobitSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('retrobitDrafts', JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem('retrobitTables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('retrobitReservations', JSON.stringify(reservations));
  }, [reservations]);

  const openProtectedView = (target) => {
    if ((target === 'admin' || target === 'reports' || target === 'settings') && !isLoggedIn) {
      setPendingView(target);
      setLoginModalOpen(true);
      return;
    }

    setView(target);
  };

  const addToOrder = (productId) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    setCurrentOrder((prev) => {
      const item = prev.find((entry) => entry.id === productId);
      if (item) {
        return prev.map((entry) =>
          entry.id === productId ? { ...entry, qty: Number(entry.qty) + 1 } : entry
        );
      }

      return [...prev, { id: product.id, name: product.name, price: Number(product.price), qty: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCurrentOrder((prev) => {
      const next = prev
        .map((item) => (item.id === productId ? { ...item, qty: Number(item.qty) + delta } : item))
        .filter((item) => Number(item.qty) > 0);
      return next;
    });
  };

  const resetCurrentOrder = () => {
    setCurrentOrder([]);
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      id: Number(productForm.id || Date.now()),
      name: productForm.name,
      category: productForm.category,
      price: Number(productForm.price),
      image: productForm.image,
    };

    try {
      const url = productForm.id ? `${API_BASE_URL}/api/products/${productForm.id}` : `${API_BASE_URL}/api/products`;
      const method = productForm.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedProduct = await response.json();
        setProducts((prev) => {
          if (productForm.id) {
            return prev.map((item) => (item.id === Number(productForm.id) ? savedProduct : item));
          }
          return [...prev, savedProduct];
        });
      } else {
        setProducts((prev) => {
          if (productForm.id) {
            return prev.map((item) => (item.id === Number(productForm.id) ? { ...item, ...payload } : item));
          }
          return [...prev, payload];
        });
      }
    } catch {
      setProducts((prev) => {
        if (productForm.id) {
          return prev.map((item) => (item.id === Number(productForm.id) ? { ...item, ...payload } : item));
        }
        return [...prev, payload];
      });
    }

    setProductForm({ id: '', name: '', category: '', price: '', image: '' });
  };

  const handleEditProduct = (product) => {
    setProductForm({
      id: String(product.id),
      name: product.name,
      category: product.category,
      price: String(product.price),
      image: product.image || '',
    });
  };

  const handleDeleteProduct = async (productId) => {
    const targetId = Number(productId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${targetId}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        setProducts((prev) => prev.filter((item) => item.id !== targetId));
      } else {
        setProducts((prev) => prev.filter((item) => item.id !== targetId));
      }
    } catch {
      setProducts((prev) => prev.filter((item) => item.id !== targetId));
    }
  };

  const saveDraft = () => {
    const draft = {
      id: Date.now(),
      name: `Draft ${drafts.length + 1}`,
      createdAt: new Date().toLocaleString(),
      items: currentOrder,
    };

    setDrafts((prev) => [draft, ...prev]);
    setDraftModalOpen(true);
  };

  const restoreDraft = (draft) => {
    setCurrentOrder(draft.items ?? []);
    setDraftModalOpen(false);
    setView('pos');
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      if (!response.ok) {
        alert('Login failed. Use admin@retrobit.com / admin123');
        return;
      }

      setIsLoggedIn(true);
      setLoginModalOpen(false);
      setView(pendingView || 'admin');
    } catch {
      if (loginForm.email === 'admin@retrobit.com' && loginForm.password === 'admin123') {
        setIsLoggedIn(true);
        setLoginModalOpen(false);
        setView(pendingView || 'admin');
        return;
      }

      alert('Login failed. Use admin@retrobit.com / admin123');
    }
  };

  const submitOrder = async () => {
    const orderPayload = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      total: grandTotal,
      items: currentOrder,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        const createdOrder = await response.json();
        setOrders((prev) => [createdOrder, ...prev]);
      } else {
        setOrders((prev) => [orderPayload, ...prev]);
      }
    } catch {
      setOrders((prev) => [orderPayload, ...prev]);
    }

    setCurrentOrder([]);
    alert('Order saved successfully.');
  };

  const tableStats = useMemo(() => ({
    total: tables.length,
    available: tables.filter((table) => table.status === 'available').length,
    occupied: tables.filter((table) => table.status === 'occupied').length,
    reserved: tables.filter((table) => table.status === 'reserved').length,
  }), [tables]);

  const filteredTables = useMemo(() => {
    if (tableFilter === 'all') return tables;
    return tables.filter((table) => table.status === tableFilter);
  }, [tableFilter, tables]);

  const handleTableStatusChange = (tableId, nextStatus) => {
    setTables((prev) => prev.map((table) => (
      table.id === tableId ? { ...table, status: nextStatus } : table
    )));
  };

  const handleTableSelect = (tableId) => setSelectedTableId(tableId);

  const handleReservationSubmit = (event) => {
    event.preventDefault();
    const reservation = {
      id: Date.now(),
      guest: reservationForm.guest,
      phone: reservationForm.phone,
      date: reservationForm.date,
      time: reservationForm.time,
      seats: Number(reservationForm.seats),
      table: reservationForm.table,
      status: 'Confirmed',
    };

    setReservations((prev) => [reservation, ...prev]);
    setTables((prev) => prev.map((table) => (
      table.name === reservationForm.table ? { ...table, status: 'reserved' } : table
    )));
    setReservationForm({
      guest: '',
      phone: '',
      date: new Date().toISOString().slice(0, 10),
      time: '19:00',
      seats: '2',
      table: 'Table 2',
    });
    alert('Reservation created successfully.');
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '⌂' },
    { key: 'pos', label: 'POS', icon: '◫' },
    { key: 'table', label: 'Table', icon: '▣' },
    { key: 'reservations', label: 'Reservations', icon: '✦' },
    { key: 'admin', label: 'Admin', icon: '⚙' },
    { key: 'reports', label: 'Reports', icon: '◍' },
    { key: 'settings', label: 'Settings', icon: '⚙' },
  ];

  const salesBars = [38, 50, 60, 72, 55, 80, 68];

  return (
    <div className="min-h-screen bg-[#dfe0e7] p-5 lg:p-8">
      <div className="mx-auto flex min-h-[820px] max-w-[1400px] overflow-hidden rounded-[28px] border border-slate-300/80 bg-[#f5f5f5] shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
        <aside className="hidden w-[250px] flex-col border-r border-[#d7d3d1] bg-[#f4f3f2] lg:flex">
          <div className="flex items-center gap-3 border-b border-[#d7d3d1] px-4 py-5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#f7a62b] via-[#e76f35] to-[#cc5b2d] text-lg font-extrabold text-white rotate-45">
              <span className="-rotate-45">R</span>
            </div>
            <div className="text-[22px] font-bold tracking-[-0.04em] text-slate-800">RetroBit</div>
          </div>

          <div className="flex items-center gap-3 px-4 py-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#d4a788] to-[#6a4a3a] text-sm font-bold text-white">S</div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Saiful Talukdar</div>
              <div className="text-xs text-slate-500">Product Designer</div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-2">
            {navItems.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => openProtectedView(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] transition ${
                  view === key ? 'bg-slate-200 font-semibold text-slate-900 shadow-inner' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="w-5 text-center text-base">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setLoginModalOpen(true)}
            className="flex items-center gap-3 border-t border-[#d7d3d1] px-4 py-4 text-left text-sm font-medium text-slate-700"
          >
            <span className="text-base">⇠</span>
            <span>{isLoggedIn ? 'Logged in' : 'Login'}</span>
          </button>
        </aside>

        <main className="flex-1 bg-[#f3f3f3]">
          <header className="flex items-center justify-between border-b border-[#d7d3d1] bg-[#f9f9f9]/80 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3 rounded-xl border border-[#d7d3d1] bg-white/20 px-3 py-2 text-slate-500 shadow-sm lg:w-[420px]">
              <span className="text-lg">⌕</span>
              <input className="w-full bg-transparent text-sm text-slate-700 outline-none" value="Search (Ctrl+/)" readOnly />
            </div>
            <div className="flex items-center gap-3">
              <button className="grid h-9 w-9 place-items-center rounded-full border border-[#d7d3d1] bg-white/40 text-slate-600" type="button">◐</button>
              <button className="grid h-9 w-9 place-items-center rounded-full border border-[#d7d3d1] bg-white/40 text-slate-600" type="button">☼</button>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#b98e78] to-[#684c41] text-sm font-bold text-white">S</div>
            </div>
          </header>

          <div className="space-y-6 p-4 lg:p-6">
            <div className="flex flex-col gap-4 rounded-2xl bg-white/50 px-4 py-4 shadow-sm ring-1 ring-slate-200/80 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-[-0.04em] text-slate-900 lg:text-[2rem]">
                  {view === 'dashboard' ? 'Dashboard Overview' : view === 'admin' ? 'Admin Panel' : view === 'reports' ? 'Reports' : view === 'settings' ? 'Settings' : view === 'table' ? 'Table Management' : view === 'reservations' ? 'Reservations' : 'Point of Sale (POS)'}
                </h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span>Dashboard</span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">{view === 'dashboard' ? 'Dashboard' : view === 'admin' ? 'Admin' : view === 'reports' ? 'Reports' : view === 'settings' ? 'Settings' : view === 'table' ? 'Table' : view === 'reservations' ? 'Reservations' : 'POS'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={resetCurrentOrder} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">+ New</button>
                <button type="button" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">QR Menu Orders</button>
                <button type="button" onClick={() => setDraftModalOpen(true)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">Draft List</button>
                <button type="button" onClick={() => setView('table')} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">Table Order</button>
              </div>
            </div>

            {view === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Total Revenue', value: currency.format(dashboardStats.revenue), trend: '+12.4% vs last week' },
                    { label: 'Total Orders', value: dashboardStats.orderCount, trend: '+8.1% this week' },
                    { label: 'Average Ticket', value: currency.format(dashboardStats.averageTicket), trend: '-2.3% from yesterday' },
                    { label: 'Product Count', value: dashboardStats.productCount, trend: '+3 new items' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
                      <div className="text-sm text-slate-500">{item.label}</div>
                      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{item.value}</div>
                      <div className="mt-2 text-xs font-medium text-emerald-600">{item.trend}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-800">Sales Overview</h2>
                      <button type="button" className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">This Week</button>
                    </div>
                    <div className="flex h-52 items-end gap-3">
                      {salesBars.map((height, index) => (
                        <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                          <div className="w-full rounded-t-2xl bg-gradient-to-t from-orange-400 to-orange-200" style={{ height: `${height}%` }} />
                          <span className="text-[10px] uppercase text-slate-500">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-800">Recent Orders</h2>
                      <button type="button" className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">View All</button>
                    </div>
                    <div className="space-y-3">
                      {orders.slice(0, 4).map((order) => (
                        <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <div>
                            <div className="text-sm font-semibold text-slate-800">#{order.id}</div>
                            <div className="text-xs text-slate-500">{order.date}</div>
                          </div>
                          <div className="text-sm font-semibold text-slate-700">{currency.format(order.total)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'pos' && (
              <div className="grid gap-5 xl:grid-cols-[1.7fr_0.95fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <span className="text-slate-400">⌕</span>
                      <input
                        className="w-full bg-transparent text-sm text-slate-700 outline-none"
                        placeholder="Search in products"
                        value={productSearch}
                        onChange={(event) => setProductSearch(event.target.value)}
                      />
                    </div>
                    <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category === 'all' ? 'All Category' : category}</option>
                      ))}
                    </select>
                    <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none">
                      <option>Select Brand</option>
                    </select>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                          selectedCategory === category ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {category === 'all' ? 'Show All' : category}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map((product) => (
                      <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                        <div className="h-36 overflow-hidden bg-slate-200">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-3">
                          <h3 className="text-base font-semibold text-slate-800">{product.name}</h3>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-base font-bold text-slate-900">{currency.format(product.price)}</span>
                            <button type="button" onClick={() => addToOrder(product.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-lg font-semibold text-white">+</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="text-slate-400">⌕</span>
                      <input className="w-full bg-transparent text-sm text-slate-700 outline-none" placeholder="Search in Existing" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
                      <span>Order #<span className="font-bold text-slate-900">20</span></span>
                    </div>

                    <div className="space-y-2">
                      {currentOrder.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">No items selected</div>
                      ) : (
                        currentOrder.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                              <div className="text-xs text-slate-500">{currency.format(item.price)} each</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => updateQuantity(item.id, -1)} className="grid h-7 w-7 place-items-center rounded-md bg-slate-200 text-slate-600">-</button>
                              <span className="min-w-6 text-center text-sm font-semibold text-slate-800">{item.qty}</span>
                              <button type="button" onClick={() => updateQuantity(item.id, 1)} className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-white">+</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
                      <div className="flex items-center justify-between"><span>Sub total</span><strong className="text-slate-900">{currency.format(subtotal)}</strong></div>
                      <div className="flex items-center justify-between"><span>Product Discount</span><strong className="text-slate-900">{currency.format(productDiscount)}</strong></div>
                      <div className="flex items-center justify-between"><span>Extra Discount</span><strong className="text-slate-900">{currency.format(extraDiscount)}</strong></div>
                      <div className="flex items-center justify-between"><span>Coupon discount</span><strong className="text-slate-900">{currency.format(couponDiscount)}</strong></div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-900"><span>Total</span><span>{currency.format(grandTotal)}</span></div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => alert('KOT sent to kitchen.')} className="rounded-xl bg-[#111827] px-3 py-2.5 text-sm font-semibold text-white">KOT & Print</button>
                    <button type="button" onClick={saveDraft} className="rounded-xl bg-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700">Draft</button>
                    <button type="button" onClick={submitOrder} className="rounded-xl bg-[#f28a2d] px-3 py-2.5 text-sm font-semibold text-white sm:col-span-2">Bill & Payment</button>
                    <button type="button" className="rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white sm:col-span-2">Bill & Print</button>
                  </div>
                </aside>
              </div>
            )}

            {view === 'table' && (
              <div className="grid gap-5 xl:grid-cols-[1.45fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Table Layout</h2>
                      <p className="text-sm text-slate-500">Manage floor activity in real time.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['all', 'available', 'occupied', 'reserved'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setTableFilter(status)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                            tableFilter === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredTables.map((table) => {
                      const isSelected = selectedTableId === table.id;
                      const statusTone = table.status === 'available'
                        ? 'border-emerald-200 bg-emerald-50'
                        : table.status === 'occupied'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-violet-200 bg-violet-50';

                      return (
                        <div
                          key={table.id}
                          onClick={() => handleTableSelect(table.id)}
                          className={`cursor-pointer rounded-2xl border p-4 transition ${statusTone} ${isSelected ? 'ring-2 ring-slate-900/10 shadow-md' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-slate-800">{table.name}</span>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                              table.status === 'available' ? 'bg-emerald-600 text-white' :
                              table.status === 'occupied' ? 'bg-amber-500 text-white' :
                              'bg-violet-600 text-white'
                            }`}>{table.status}</span>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                            <span>Seats</span>
                            <strong className="text-slate-900">{table.seats}</strong>
                          </div>

                          <div className="mt-3 text-xs text-slate-500">{table.notes}</div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleTableStatusChange(table.id, 'available')} className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm">Available</button>
                            <button type="button" onClick={() => handleTableStatusChange(table.id, 'occupied')} className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700">Occupied</button>
                            <button type="button" onClick={() => handleTableStatusChange(table.id, 'reserved')} className="rounded-lg bg-violet-100 px-2.5 py-1.5 text-[10px] font-semibold text-violet-700">Reserved</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-800">Live Floor Stats</h2>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Total tables</span><strong className="text-slate-900">{tableStats.total}</strong></div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Occupied</span><strong className="text-slate-900">{tableStats.occupied}</strong></div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Reserved</span><strong className="text-slate-900">{tableStats.reserved}</strong></div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Available</span><strong className="text-slate-900">{tableStats.available}</strong></div>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Selected table</div>
                    <div className="mt-2 text-lg font-bold text-slate-900">
                      {tables.find((table) => table.id === selectedTableId)?.name || 'No table selected'}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {tables.find((table) => table.id === selectedTableId)?.status || 'No status'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'reservations' && (
              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">Reservation List</h2>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">{reservations.length} bookings</span>
                  </div>
                  <div className="space-y-3">
                    {reservations.map((reservation) => (
                      <div key={reservation.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-base font-semibold text-slate-800">{reservation.guest}</div>
                          <div className="text-xs text-slate-500">{reservation.date} • {reservation.time} • {reservation.table}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-700">{reservation.seats} guests</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{reservation.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-800">New Reservation</h2>
                  <form className="space-y-4" onSubmit={handleReservationSubmit}>
                    <label className="block text-sm font-medium text-slate-700">
                      Guest Name
                      <input value={reservationForm.guest} onChange={(event) => setReservationForm((prev) => ({ ...prev, guest: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none" required />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Phone
                      <input value={reservationForm.phone} onChange={(event) => setReservationForm((prev) => ({ ...prev, phone: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none" required />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Date
                        <input type="date" value={reservationForm.date} onChange={(event) => setReservationForm((prev) => ({ ...prev, date: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none" required />
                      </label>
                      <label className="block text-sm font-medium text-slate-700">
                        Time
                        <input type="time" value={reservationForm.time} onChange={(event) => setReservationForm((prev) => ({ ...prev, time: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none" required />
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Guests
                        <select value={reservationForm.seats} onChange={(event) => setReservationForm((prev) => ({ ...prev, seats: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none">
                          <option value="2">2</option>
                          <option value="4">4</option>
                          <option value="6">6</option>
                          <option value="8">8</option>
                        </select>
                      </label>
                      <label className="block text-sm font-medium text-slate-700">
                        Table
                        <select value={reservationForm.table} onChange={(event) => setReservationForm((prev) => ({ ...prev, table: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none">
                          {tables.map((table) => (
                            <option key={table.id} value={table.name}>{table.name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Save Reservation</button>
                  </form>
                </div>
              </div>
            )}

            {view === 'admin' && (
              <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-800">Add / Edit Product</h2>
                  <form className="space-y-4" onSubmit={handleProductSubmit}>
                    <label className="block text-sm font-medium text-slate-700">
                      Product Name
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none"
                        value={productForm.name}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Enter product name"
                        required
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Category
                      <select
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none"
                        value={productForm.category}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Rice">Rice</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Salads">Salads</option>
                        <option value="Soup">Soup</option>
                        <option value="Pizza">Pizza</option>
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Price
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none"
                        value={productForm.price}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Image URL
                      <input
                        type="url"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none"
                        value={productForm.image}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, image: event.target.value }))}
                        placeholder="https://example.com/image.jpg"
                      />
                    </label>
                    <div className="flex gap-3">
                      <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Save Product</button>
                      <button type="button" onClick={() => setProductForm({ id: '', name: '', category: '', price: '', image: '' })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
                    </div>
                  </form>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">Inventory</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{products.length} items</span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-left text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Category</th>
                          <th className="px-4 py-3 font-medium">Price</th>
                          <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {products.map((product) => (
                          <tr key={product.id} className="align-middle">
                            <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                            <td className="px-4 py-3 text-slate-600">{product.category}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{currency.format(product.price)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleEditProduct(product)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
                                <button type="button" onClick={() => handleDeleteProduct(product.id)} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {view === 'reports' && (
              <div className="grid gap-5 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-slate-500">Sales</div>
                  <div className="mt-3 text-3xl font-bold text-slate-900">{currency.format(dashboardStats.revenue)}</div>
                  <div className="mt-2 text-xs font-medium text-emerald-600">+12.4% vs last week</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-slate-500">Orders</div>
                  <div className="mt-3 text-3xl font-bold text-slate-900">{orders.length}</div>
                  <div className="mt-2 text-xs font-medium text-emerald-600">+8.1% this week</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-slate-500">Best Seller</div>
                  <div className="mt-3 text-2xl font-bold text-slate-900">Chicken Burger</div>
                  <div className="mt-2 text-xs font-medium text-slate-500">Top performing item</div>
                </div>
              </div>
            )}

            {view === 'settings' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-lg font-semibold text-slate-800">Store Settings</h2>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Tax Rate (%)
                    <input
                      type="number"
                      value={settings.taxRate}
                      onChange={(event) => setSettings((prev) => ({ ...prev, taxRate: Number(event.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Service Charge (%)
                    <input
                      type="number"
                      value={settings.serviceCharge}
                      onChange={(event) => setSettings((prev) => ({ ...prev, serviceCharge: Number(event.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none"
                    />
                  </label>
                </div>

                <div className="mt-6 space-y-3">
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                    <span>Auto print</span>
                    <input type="checkbox" checked={settings.autoPrint} onChange={(event) => setSettings((prev) => ({ ...prev, autoPrint: event.target.checked }))} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                    <span>Low stock alert</span>
                    <input type="checkbox" checked={settings.lowStockAlert} onChange={(event) => setSettings((prev) => ({ ...prev, lowStockAlert: event.target.checked }))} />
                  </label>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch(`${API_BASE_URL}/api/settings`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(settings),
                        });
                        alert('Settings saved successfully.');
                      } catch {
                        alert('Settings updated locally.');
                      }
                    }}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.14em] text-slate-500">Admin Login</div>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">Welcome back</h2>
              </div>
              <button type="button" onClick={() => setLoginModalOpen(false)} className="text-xl text-slate-600">×</button>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none"
                  required
                />
              </label>

              <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                Login to continue
              </button>
            </form>
          </div>
        </div>
      )}

      {draftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Saved Drafts</h2>
              <button type="button" onClick={() => setDraftModalOpen(false)} className="text-xl text-slate-600">×</button>
            </div>
            <div className="space-y-3">
              {drafts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No drafts saved yet.</div>
              ) : (
                drafts.map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div>
                      <div className="font-semibold text-slate-800">{draft.name}</div>
                      <div className="text-xs text-slate-500">{draft.createdAt}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => restoreDraft(draft)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Restore</button>
                      <button type="button" onClick={() => setDrafts((prev) => prev.filter((item) => item.id !== draft.id))} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
