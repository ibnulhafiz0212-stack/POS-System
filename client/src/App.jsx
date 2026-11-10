import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/+$/, '');

const fallbackProducts = [];

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

const slugify = (value) => String(value || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
const buildTableQrValue = (table) => `retrobit://table/${table.id}/${slugify(table.name || 'table')}`;
const buildProductQrValue = (product) => `retrobit://product/${product.id}/${slugify(product.name || 'product')}`;

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [orders, setOrders] = useState(fallbackOrders);
  const [settings, setSettings] = useState(defaultSettings);
  const [currentOrder, setCurrentOrder] = useState(fallbackCurrentOrder);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billPreview, setBillPreview] = useState(null);
  const [view, setView] = useState('pos');
  const [pendingView, setPendingView] = useState('admin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [drafts, setDrafts] = useState(() => safeJSON('retrobitDrafts', []));
  const [qrScanValue, setQrScanValue] = useState('');
  const [qrCodeModal, setQrCodeModal] = useState(null);
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
  const [tableOrders, setTableOrders] = useState(() => safeJSON('retrobitTableOrders', {}));
  const [newTableForm, setNewTableForm] = useState({ name: 'Table 7', seats: '4', notes: 'Ready for new guests' });
  const [newTableModalOpen, setNewTableModalOpen] = useState(false);
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

  useEffect(() => {
    localStorage.setItem('retrobitTableOrders', JSON.stringify(tableOrders));
  }, [tableOrders]);

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

    const finalId = Number(productForm.id || Date.now());
    const payload = {
      id: finalId,
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

  const handleGoogleLogin = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    if (googleClientId && window.google?.accounts?.id) {
      const callback = (response) => {
        const payload = response?.credential ? JSON.parse(atob(response.credential.split('.')[1] || '')) : {};
        if (payload.email) {
          setLoginForm((prev) => ({ ...prev, email: payload.email }));
        }
        setIsLoggedIn(true);
        setLoginModalOpen(false);
        setView(pendingView || 'admin');
      };

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback,
      });
      window.google.accounts.id.prompt();
      return;
    }

    setIsLoggedIn(true);
    setLoginModalOpen(false);
    setView(pendingView || 'admin');
    alert('Google login is ready. Add VITE_GOOGLE_CLIENT_ID in your env to enable real Google OAuth.');
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

  const buildBillPreview = (items = currentOrder) => {
    const itemSubtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
    const tax = itemSubtotal * (Number(settings.taxRate || 0) / 100);
    const service = itemSubtotal * (Number(settings.serviceCharge || 0) / 100);
    const total = itemSubtotal + tax + service;

    return {
      orderNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString(),
      customer: customerName || 'Walk-in Guest',
      paymentMethod,
      items,
      subtotal: itemSubtotal,
      tax,
      service,
      total,
    };
  };

  const submitOrder = async () => {
    if (!currentOrder.length) {
      alert('Please add at least one item before finalizing the bill.');
      return;
    }

    const orderPayload = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      total: grandTotal,
      items: currentOrder,
      customer: customerName,
      paymentMethod,
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

    setBillPreview(buildBillPreview());
    setBillModalOpen(true);
    setCurrentOrder([]);
    setCustomerName('Walk-in Guest');
    setPaymentMethod('Cash');
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

  const selectedTable = tables.find((table) => table.id === selectedTableId) || null;
  const selectedTableOrder = tableOrders[selectedTableId] || [];
  const selectedTableSubtotal = selectedTableOrder.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const qrProducts = useMemo(() => products.map((product) => ({
    ...product,
    qrValue: product.qrValue || buildProductQrValue(product),
  })), [products]);
  const qrTables = useMemo(() => tables.map((table) => ({
    ...table,
    qrValue: table.qrValue || buildTableQrValue(table),
  })), [tables]);

  const handleQrScan = (value) => {
    const rawValue = (value || '').trim();
    if (!rawValue) {
      alert('Scan or paste a valid table or product QR code first.');
      return;
    }

    const tableMatch = rawValue.match(/retrobit:\/\/table\/(\d+)(?:\/|$)/i);
    if (tableMatch) {
      const tableId = Number(tableMatch[1]);
      const targetTable = tables.find((table) => table.id === tableId) || tables[0];
      if (!targetTable) {
        alert('The scanned table was not found.');
        return;
      }
      setSelectedTableId(targetTable.id);
      setView('table');
      setQrScanValue('');
      alert(`Table ${targetTable.name} selected from QR.`);
      return;
    }

    const productMatch = rawValue.match(/retrobit:\/\/product\/(\d+)(?:\/|$)/i);
    if (productMatch) {
      const productId = Number(productMatch[1]);
      const product = products.find((item) => item.id === productId);
      if (!product) {
        alert('The scanned product was not found in inventory.');
        return;
      }
      if (selectedTable) {
        addToTableOrder(product.id);
      } else {
        addToOrder(product.id);
      }
      setQrScanValue('');
      alert(`${product.name} added from QR.`);
      return;
    }

    alert('Unsupported QR code. Use a valid RetroBit table or product QR.');
  };

  const handleTableStatusChange = (tableId, nextStatus) => {
    setTables((prev) => prev.map((table) => (
      table.id === tableId ? { ...table, status: nextStatus } : table
    )));
  };

  const handleTableSelect = (tableId) => setSelectedTableId(tableId);

  const handleDeleteTable = (tableId) => {
    if (tables.length <= 1) {
      alert('At least one table must remain in the restaurant floor plan.');
      return;
    }

    const targetTable = tables.find((table) => table.id === tableId);
    setTables((prev) => prev.filter((table) => table.id !== tableId));
    setTableOrders((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });

    if (selectedTableId === tableId) {
      const nextTable = tables.find((table) => table.id !== tableId);
      setSelectedTableId(nextTable ? nextTable.id : 1);
    }

    if (targetTable) {
      alert(`${targetTable.name} was removed from the floor plan.`);
    }
  };

  const handleNewTableSubmit = (event) => {
    event.preventDefault();
    const cleanName = newTableForm.name.trim();
    const seats = Number(newTableForm.seats) || 2;
    const notes = newTableForm.notes.trim() || 'Ready for new guests';
    if (!cleanName) return;

    const newTable = {
      id: Date.now(),
      name: cleanName,
      status: 'available',
      seats,
      notes,
    };

    setTables((prev) => [...prev, newTable]);
    setTableOrders((prev) => ({ ...prev, [newTable.id]: [] }));
    setSelectedTableId(newTable.id);
    setNewTableForm({ name: `Table ${tables.length + 2}`, seats: '4', notes: 'Ready for new guests' });
    setNewTableModalOpen(false);
    setTableFilter('all');
  };

  const addToTableOrder = (productId) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const targetTableId = selectedTableId;
    setTableOrders((prev) => {
      const existing = prev[targetTableId] || [];
      const item = existing.find((entry) => entry.id === productId);
      const nextItems = item
        ? existing.map((entry) => entry.id === productId ? { ...entry, qty: Number(entry.qty) + 1 } : entry)
        : [...existing, { id: product.id, name: product.name, price: Number(product.price), qty: 1 }];

      return { ...prev, [targetTableId]: nextItems };
    });

    setTables((prev) => prev.map((table) => (
      table.id === targetTableId ? { ...table, status: 'occupied' } : table
    )));
  };

  const updateTableOrderQuantity = (productId, delta) => {
    setTableOrders((prev) => {
      const current = prev[selectedTableId] || [];
      const nextItems = current
        .map((item) => (item.id === productId ? { ...item, qty: Number(item.qty) + delta } : item))
        .filter((item) => Number(item.qty) > 0);

      return { ...prev, [selectedTableId]: nextItems };
    });
  };

  const submitTableOrder = () => {
    const items = tableOrders[selectedTableId] || [];
    if (!items.length) {
      alert('Please add at least one item to the selected table before submitting the order.');
      return;
    }

    const orderPayload = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      total: selectedTableSubtotal,
      items,
      tableId: selectedTableId,
      tableName: selectedTable?.name || 'Table',
    };

    setOrders((prev) => [orderPayload, ...prev]);
    setTableOrders((prev) => ({ ...prev, [selectedTableId]: [] }));
    setTables((prev) => prev.map((table) => (
      table.id === selectedTableId ? { ...table, status: 'occupied' } : table
    )));
    alert(`Order sent for ${selectedTable?.name || 'selected table'}.`);
  };

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
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#d4a788] to-[#6a4a3a] text-sm font-bold text-white">A</div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Restaurant Admin</div>
              <div className="text-xs text-slate-500">Operations</div>
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
                <button
                  type="button"
                  onClick={() => {
                    if (view === 'table') {
                      setNewTableModalOpen(true);
                      return;
                    }
                    resetCurrentOrder();
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  {view === 'table' ? '+ New Table' : '+ New'}
                </button>
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
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
                      <input
                        value={qrScanValue}
                        onChange={(event) => setQrScanValue(event.target.value)}
                        placeholder="Scan QR"
                        className="w-32 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                      />
                      <button type="button" onClick={() => handleQrScan(qrScanValue)} className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Scan</button>
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
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        No products available yet. Add a product from the admin panel to start taking orders.
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
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
                      ))
                    )}
                  </div>
                </div>

                <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="text-slate-400">⌕</span>
                      <input className="w-full bg-transparent text-sm text-slate-700 outline-none" placeholder="Search in Existing" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <label className="block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                        Customer
                        <input
                          value={customerName}
                          onChange={(event) => setCustomerName(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none"
                          placeholder="Walk-in Guest"
                        />
                      </label>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <label className="block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                        Payment
                        <select
                          value={paymentMethod}
                          onChange={(event) => setPaymentMethod(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Mobile">Mobile Wallet</option>
                          <option value="Split">Split Payment</option>
                        </select>
                      </label>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
                      <span>Order #<span className="font-bold text-slate-900">{Date.now().toString().slice(-4)}</span></span>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Open</span>
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
                    <button type="button" onClick={() => {
                      if (!currentOrder.length) {
                        alert('Please add at least one item before opening the bill preview.');
                        return;
                      }
                      setBillPreview(buildBillPreview());
                      setBillModalOpen(true);
                    }} className="rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white sm:col-span-2">Bill & Print</button>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setNewTableModalOpen(true)} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">+ New Table</button>
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
                            <button type="button" onClick={(event) => { event.stopPropagation(); handleDeleteTable(table.id); }} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-semibold text-red-600">Remove</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-slate-800">Live Floor Stats</h2>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Total tables</span><strong className="text-slate-900">{tableStats.total}</strong></div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Occupied</span><strong className="text-slate-900">{tableStats.occupied}</strong></div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Reserved</span><strong className="text-slate-900">{tableStats.reserved}</strong></div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Available</span><strong className="text-slate-900">{tableStats.available}</strong></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Selected table</div>
                    <div className="mt-2 text-lg font-bold text-slate-900">
                      {selectedTable?.name || 'No table selected'}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {selectedTable?.status || 'No status'} • {selectedTable?.seats || 0} seats
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Table Order</h3>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedTable) {
                            alert('Please select a table first.');
                            return;
                          }
                          setQrCodeModal({
                            type: 'table',
                            table: { ...selectedTable, qrValue: buildTableQrValue(selectedTable) },
                          });
                        }}
                        className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                      >
                        Table QR
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedTableOrder.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-sm text-slate-500">No items added yet</div>
                      ) : (
                        selectedTableOrder.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                              <div className="text-xs text-slate-500">{currency.format(item.price)} each</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => updateTableOrderQuantity(item.id, -1)} className="grid h-7 w-7 place-items-center rounded-md bg-slate-200 text-slate-600">-</button>
                              <span className="min-w-6 text-center text-sm font-semibold text-slate-800">{item.qty}</span>
                              <button type="button" onClick={() => updateTableOrderQuantity(item.id, 1)} className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-white">+</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between"><span>Subtotal</span><strong className="text-slate-900">{currency.format(selectedTableSubtotal)}</strong></div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2">
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Quick add items</div>
                      <div className="space-y-2">
                        {products.slice(0, 5).map((product) => (
                          <div key={product.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-2">
                            <div>
                              <div className="text-xs font-semibold text-slate-800">{product.name}</div>
                              <div className="text-[10px] text-slate-500">{currency.format(product.price)}</div>
                            </div>
                            <button type="button" onClick={() => addToTableOrder(product.id)} className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white">Add</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setTableOrders((prev) => ({ ...prev, [selectedTableId]: [] }))} className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Clear</button>
                      <button type="button" onClick={submitTableOrder} className="rounded-xl bg-[#f28a2d] px-3 py-2 text-xs font-semibold text-white">Send Order</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {newTableModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">Add New Table</h2>
                    <button type="button" onClick={() => setNewTableModalOpen(false)} className="text-sm font-medium text-slate-500">Close</button>
                  </div>
                  <form className="space-y-4" onSubmit={handleNewTableSubmit}>
                    <label className="block text-sm font-medium text-slate-700">
                      Table Name
                      <input value={newTableForm.name} onChange={(event) => setNewTableForm((prev) => ({ ...prev, name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none" required />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Seats
                        <input type="number" min="1" value={newTableForm.seats} onChange={(event) => setNewTableForm((prev) => ({ ...prev, seats: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none" required />
                      </label>
                      <label className="block text-sm font-medium text-slate-700">
                        Status
                        <input value="Available" readOnly className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none" />
                      </label>
                    </div>
                    <label className="block text-sm font-medium text-slate-700">
                      Notes
                      <input value={newTableForm.notes} onChange={(event) => setNewTableForm((prev) => ({ ...prev, notes: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 outline-none" />
                    </label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setNewTableModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
                      <button type="submit" className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Create Table</button>
                    </div>
                  </form>
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
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{products.length} items</span>
                    </div>
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
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">{product.name}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{product.category}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{currency.format(product.price)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button type="button" onClick={() => setQrCodeModal({ type: 'product', product: { ...product, qrValue: product.qrValue || buildProductQrValue(product) } })} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">QR</button>
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

      {billModalOpen && billPreview && (
       <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
         <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
           <div className="mb-4 flex items-center justify-between">
             <div>
               <div className="text-xl font-bold text-slate-900">RetroBit Restaurant</div>
               <div className="text-xs text-slate-500">{billPreview.date}</div>
             </div>
             <button type="button" onClick={() => setBillModalOpen(false)} className="text-sm font-medium text-slate-500">Close</button>
           </div>

           <div className="mb-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
             <div className="flex items-center justify-between"><span>Bill No.</span><strong>{billPreview.orderNumber}</strong></div>
             <div className="mt-1 flex items-center justify-between"><span>Customer</span><strong>{billPreview.customer}</strong></div>
             <div className="mt-1 flex items-center justify-between"><span>Payment</span><strong>{billPreview.paymentMethod}</strong></div>
           </div>

           <div className="space-y-2">
             {billPreview.items.map((item) => (
               <div key={`${item.id}-${item.name}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                 <div>
                   <div className="font-semibold text-slate-800">{item.name}</div>
                   <div className="text-xs text-slate-500">Qty: {item.qty}</div>
                 </div>
                 <div className="font-semibold text-slate-800">{currency.format(Number(item.price) * Number(item.qty))}</div>
               </div>
             ))}
           </div>

           <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
             <div className="flex items-center justify-between"><span>Subtotal</span><strong className="text-slate-900">{currency.format(billPreview.subtotal)}</strong></div>
             <div className="flex items-center justify-between"><span>Tax</span><strong className="text-slate-900">{currency.format(billPreview.tax)}</strong></div>
             <div className="flex items-center justify-between"><span>Service</span><strong className="text-slate-900">{currency.format(billPreview.service)}</strong></div>
             <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-900"><span>Total</span><span>{currency.format(billPreview.total)}</span></div>
           </div>

           <div className="mt-5 flex gap-3">
             <button type="button" onClick={() => setBillModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Close</button>
             <button type="button" onClick={() => window.print()} className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Print Bill</button>
           </div>
         </div>
       </div>
      )}

      {qrCodeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{qrCodeModal.type === 'table' ? 'Table QR' : 'Product QR'}</div>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{qrCodeModal.type === 'table' ? (qrCodeModal.table?.name || 'Selected table') : (qrCodeModal.product?.name || 'Product')}</h2>
              </div>
              <button type="button" onClick={() => setQrCodeModal(null)} className="text-sm font-medium text-slate-500">Close</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex justify-center rounded-xl bg-white p-3">
                <QRCodeSVG value={qrCodeModal.type === 'table' ? (qrCodeModal.table?.qrValue || buildTableQrValue(qrCodeModal.table)) : (qrCodeModal.product?.qrValue || buildProductQrValue(qrCodeModal.product))} size={180} includeMargin />
              </div>
              <div className="mt-4 break-all text-center text-xs text-slate-600">
                {qrCodeModal.type === 'table' ? (qrCodeModal.table?.qrValue || buildTableQrValue(qrCodeModal.table)) : (qrCodeModal.product?.qrValue || buildProductQrValue(qrCodeModal.product))}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setQrCodeModal(null)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Close</button>
              <button type="button" onClick={() => window.print()} className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Print QR</button>
            </div>
          </div>
        </div>
      )}

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

            <div className="space-y-4">
              <button type="button" onClick={handleGoogleLogin} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="text-base">G</span>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="mt-4 space-y-4">
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
