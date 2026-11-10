const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5001);
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
const fallbackOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (fallbackOrigins.includes(origin)) return true;

  return /^(https?:\/\/)?([a-z0-9-]+\.)*vercel\.app$/.test(origin)
    || /^(https?:\/\/)?([a-z0-9-]+\.)*netlify\.app$/.test(origin)
    || /^(https?:\/\/)?localhost(:\d+)?$/.test(origin)
    || /^(https?:\/\/)?127\.0\.0\.1(:\d+)?$/.test(origin);
};

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: '2mb' }));

const defaultProducts = [];

const defaultOrders = [
  { id: 101, date: '2026-11-10', total: 58, items: [{ name: 'Fresh Basil Salad', qty: 2, price: 10 }, { name: 'Beef Burger', qty: 1, price: 10 }, { name: 'Chicken Burger', qty: 2, price: 10 }], customer: 'Nadia', paymentMethod: 'Card' },
  { id: 102, date: '2026-11-09', total: 46, items: [{ name: 'Onion Rings', qty: 2, price: 10 }, { name: 'Vegetable Pizza', qty: 2, price: 10 }], customer: 'Rafi', paymentMethod: 'Cash' },
  { id: 103, date: '2026-11-08', total: 34, items: [{ name: 'Fish & Chips', qty: 2, price: 10 }, { name: 'Fresh Tomatoes', qty: 1, price: 10 }], customer: 'Walk-in Guest', paymentMethod: 'Mobile' }
];

const defaultSettings = {
  taxRate: 0,
  serviceCharge: 0,
  autoPrint: true,
  lowStockAlert: true
};

const memoryStore = {
  products: [...defaultProducts],
  orders: [...defaultOrders],
  settings: { ...defaultSettings }
};

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, default: '' }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  date: { type: String, required: true },
  total: { type: Number, required: true },
  customer: { type: String, default: 'Walk-in Guest' },
  paymentMethod: { type: String, default: 'Cash' },
  tableId: { type: Number, default: null },
  tableName: { type: String, default: '' },
  items: [{ name: String, qty: Number, price: Number }]
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
  taxRate: { type: Number, default: 0 },
  serviceCharge: { type: Number, default: 0 },
  autoPrint: { type: Boolean, default: true },
  lowStockAlert: { type: Boolean, default: true }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function connectMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/retrobit-pos';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');

    const productCount = await Product.countDocuments();
    if (productCount === 0 && defaultProducts.length > 0) {
      await Product.insertMany(defaultProducts);
    }

    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create(defaultSettings);
    }

    const adminUserCount = await User.countDocuments({ email: process.env.ADMIN_EMAIL || 'admin@retrobit.com' });
    if (adminUserCount === 0) {
      await User.create({
        email: process.env.ADMIN_EMAIL || 'admin@retrobit.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin'
      });
    }
  } catch (error) {
    console.warn('MongoDB unavailable, using in-memory fallback.');
    console.warn(error.message);
  }
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

async function readProducts() {
  if (isDatabaseReady()) {
    return Product.find({}).sort({ id: 1 }).lean();
  }
  return [...memoryStore.products];
}

async function readOrders() {
  if (isDatabaseReady()) {
    return Order.find({}).sort({ id: -1 }).lean();
  }
  return [...memoryStore.orders];
}

async function readSettings() {
  if (isDatabaseReady()) {
    const settings = await Settings.findOne();
    return settings || { ...defaultSettings };
  }
  return { ...memoryStore.settings };
}

async function ensureOrderSeed() {
  if (!isDatabaseReady()) return;
  const count = await Order.countDocuments();
  if (count === 0) {
    await Order.insertMany(defaultOrders);
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, database: isDatabaseReady() ? 'mongodb' : 'memory-fallback', message: 'RetroBit API is running' });
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const payload = req.body;
    const product = {
      id: Number(payload.id ?? Date.now()),
      name: payload.name,
      price: Number(payload.price),
      category: payload.category,
      image: payload.image || ''
    };

    if (isDatabaseReady()) {
      const created = await Product.create(product);
      return res.status(201).json(created);
    }

    memoryStore.products = [...memoryStore.products.filter((item) => item.id !== product.id), product];
    return res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    const updatedData = {
      ...payload,
      id,
      price: Number(payload.price)
    };

    if (isDatabaseReady()) {
      const updated = await Product.findOneAndUpdate({ id }, updatedData, { new: true, upsert: true });
      return res.json(updated);
    }

    memoryStore.products = memoryStore.products.map((product) => product.id === id ? { ...product, ...updatedData } : product);
    return res.json(memoryStore.products.find((product) => product.id === id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isDatabaseReady()) {
      await Product.deleteOne({ id });
      return res.json({ ok: true, deletedId: id });
    }

    memoryStore.products = memoryStore.products.filter((product) => product.id !== id);
    return res.json({ ok: true, deletedId: id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await readOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const payload = req.body;
    const order = {
      id: Number(payload.id ?? Date.now()),
      date: payload.date || new Date().toISOString().slice(0, 10),
      total: Number(payload.total || 0),
      customer: payload.customer || 'Walk-in Guest',
      paymentMethod: payload.paymentMethod || 'Cash',
      tableId: payload.tableId ?? null,
      tableName: payload.tableName || '',
      items: Array.isArray(payload.items) ? payload.items : []
    };

    if (isDatabaseReady()) {
      const created = await Order.create(order);
      return res.status(201).json(created);
    }

    memoryStore.orders = [order, ...memoryStore.orders];
    return res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await readSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const payload = req.body;
    const settings = {
      taxRate: Number(payload.taxRate || 0),
      serviceCharge: Number(payload.serviceCharge || 0),
      autoPrint: Boolean(payload.autoPrint),
      lowStockAlert: Boolean(payload.lowStockAlert)
    };

    if (isDatabaseReady()) {
      const updated = await Settings.findOneAndUpdate({}, settings, { new: true, upsert: true });
      return res.json(updated);
    }

    memoryStore.settings = settings;
    return res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim();
    const normalizedPassword = String(password || '');

    if (isDatabaseReady()) {
      const user = await User.findOne({ email: normalizedEmail, password: normalizedPassword });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      return res.json({ ok: true, user: { email: user.email, role: user.role } });
    }

    if (normalizedEmail === (process.env.ADMIN_EMAIL || 'admin@retrobit.com') && normalizedPassword === (process.env.ADMIN_PASSWORD || 'admin123')) {
      return res.json({ ok: true, user: { email: normalizedEmail, role: 'admin' } });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ name: 'RetroBit POS API', status: 'online' });
});

connectMongo();
ensureOrderSeed();

app.listen(PORT, () => {
  console.log(`RetroBit API listening on http://localhost:${PORT}`);
});
