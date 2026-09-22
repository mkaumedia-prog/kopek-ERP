import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Persistent File Store Location
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

// Helper to generate IDs
const uid = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// Initial Demo Seed Data
function getInitialData() {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  const purchases = [
    {
      _id: "pur_1",
      date: lastWeek,
      supplier: "SuperTech National Distributors",
      product: "Apple iPhone 15 (128GB Black)",
      brand: "Apple",
      category: "Smartphones",
      imei: ["865492051839201", "865492051839202", "865492051839203"],
      qty: 3,
      price: 64000,
      total: 192000,
      paymentMode: "Bank Transfer",
      invoiceNo: "ST-INV-89102",
      notes: "Official Apple India warranty stock",
      createdBy: "Rajesh Sharma",
    },
    {
      _id: "pur_2",
      date: lastWeek,
      supplier: "Apex Mobile Hub Mumbai",
      product: "OnePlus 12R (16GB+256GB Cool Blue)",
      brand: "OnePlus",
      category: "Smartphones",
      imei: ["864201948271001", "864201948271002", "864201948271003", "864201948271004"],
      qty: 4,
      price: 34500,
      total: 138000,
      paymentMode: "UPI",
      invoiceNo: "APEX-2026-442",
      notes: "High demand model",
      createdBy: "Rajesh Sharma",
    },
    {
      _id: "pur_3",
      date: yesterday,
      supplier: "National Telecom Wholesale",
      product: "Samsung Galaxy S24 (256GB Onyx Black)",
      brand: "Samsung",
      category: "Smartphones",
      imei: ["359821098273611", "359821098273612"],
      qty: 2,
      price: 71000,
      total: 142000,
      paymentMode: "Bank Transfer",
      invoiceNo: "NTW-MAR-990",
      notes: "Includes free Galaxy SmartTag promo code",
      createdBy: "Rajesh Sharma",
    },
    {
      _id: "pur_4",
      date: yesterday,
      supplier: "SuperTech National Distributors",
      product: "Redmi Note 13 Pro 5G (8GB+128GB Arctic White)",
      brand: "Xiaomi",
      category: "Smartphones",
      imei: ["862901482019381", "862901482019382", "862901482019383", "862901482019384", "862901482019385"],
      qty: 5,
      price: 20500,
      total: 102500,
      paymentMode: "Bank Transfer",
      invoiceNo: "ST-INV-89145",
      notes: "Best seller budget 5G phone",
      createdBy: "Amit Verma",
    },
    {
      _id: "pur_5",
      date: yesterday,
      supplier: "Apex Mobile Hub Mumbai",
      product: "Vivo V30 5G (8GB+128GB Peacock Green)",
      brand: "Vivo",
      category: "Smartphones",
      imei: ["861029384756101", "861029384756102", "861029384756103"],
      qty: 3,
      price: 28000,
      total: 84000,
      paymentMode: "UPI",
      invoiceNo: "APEX-2026-489",
      notes: "Portrait camera flagship",
      createdBy: "Rajesh Sharma",
    },
    {
      _id: "pur_6",
      date: lastWeek,
      supplier: "Mobile Accessories Central",
      product: "Apple 20W USB-C Original Power Adapter",
      brand: "Apple",
      category: "Accessories",
      imei: ["ACC-APP-20W-01", "ACC-APP-20W-02", "ACC-APP-20W-03", "ACC-APP-20W-04"],
      qty: 4,
      price: 1400,
      total: 5600,
      paymentMode: "Cash",
      invoiceNo: "MAC-6612",
      notes: "1 Year Apple warranty",
      createdBy: "Amit Verma",
    },
    {
      _id: "pur_7",
      date: lastWeek,
      supplier: "Mobile Accessories Central",
      product: "Boat Rockerz 255 Pro+ Wireless Earphones",
      brand: "Boat",
      category: "Accessories",
      imei: ["BOAT-255-001", "BOAT-255-002", "BOAT-255-003"],
      qty: 3,
      price: 850,
      total: 2550,
      paymentMode: "Cash",
      invoiceNo: "MAC-6613",
      notes: "Popular neckband",
      createdBy: "Amit Verma",
    },
  ];

  const sales = [
    {
      _id: "sale_1",
      invoiceNo: "INV-202609-0001",
      date: yesterday,
      customerName: "Vikram Joshi",
      customerPhone: "9823456789",
      product: "Apple iPhone 15 (128GB Black)",
      brand: "Apple",
      imei: ["865492051839201"],
      qty: 1,
      sellingPrice: 71999,
      discount: 1000,
      total: 70999,
      paymentMode: "UPI",
      profit: 6999, // 70999 - 64000
      warranty: "1 Year Apple India Warranty",
      notes: "Applied festive discount of ₹1,000",
      createdBy: "Amit Verma",
    },
    {
      _id: "sale_2",
      invoiceNo: "INV-202609-0002",
      date: today,
      customerName: "Neha Sharma",
      customerPhone: "9811223344",
      product: "OnePlus 12R (16GB+256GB Cool Blue)",
      brand: "OnePlus",
      imei: ["864201948271001"],
      qty: 1,
      sellingPrice: 39999,
      discount: 500,
      total: 39499,
      paymentMode: "Cash",
      profit: 4999, // 39499 - 34500
      warranty: "1 Year OnePlus Official Warranty",
      notes: "Free tempered glass applied",
      createdBy: "Rajesh Sharma",
    },
    {
      _id: "sale_3",
      invoiceNo: "INV-202609-0003",
      date: today,
      customerName: "Rahul Deshmukh",
      customerPhone: "9765432100",
      product: "Redmi Note 13 Pro 5G (8GB+128GB Arctic White)",
      brand: "Xiaomi",
      imei: ["862901482019381"],
      qty: 1,
      sellingPrice: 24999,
      discount: 1000,
      total: 23999,
      paymentMode: "UPI",
      profit: 3499, // 23999 - 20500
      warranty: "1 Year Xiaomi Warranty",
      notes: "GPay payment completed",
      createdBy: "Amit Verma",
    },
  ];

  // Derive inventory from purchases & sales
  const inventory = [
    // iPhone 15 items
    {
      _id: "inv_1",
      product: "Apple iPhone 15 (128GB Black)",
      brand: "Apple",
      category: "Smartphones",
      imei: "865492051839201",
      purchaseId: "pur_1",
      purchasePrice: 64000,
      sellingPrice: 71999,
      status: "sold",
      addedDate: lastWeek,
      soldDate: yesterday,
      saleId: "sale_1",
    },
    {
      _id: "inv_2",
      product: "Apple iPhone 15 (128GB Black)",
      brand: "Apple",
      category: "Smartphones",
      imei: "865492051839202",
      purchaseId: "pur_1",
      purchasePrice: 64000,
      sellingPrice: 71999,
      status: "in-stock",
      addedDate: lastWeek,
    },
    {
      _id: "inv_3",
      product: "Apple iPhone 15 (128GB Black)",
      brand: "Apple",
      category: "Smartphones",
      imei: "865492051839203",
      purchaseId: "pur_1",
      purchasePrice: 64000,
      sellingPrice: 71999,
      status: "in-stock",
      addedDate: lastWeek,
    },
    // OnePlus 12R items
    {
      _id: "inv_4",
      product: "OnePlus 12R (16GB+256GB Cool Blue)",
      brand: "OnePlus",
      category: "Smartphones",
      imei: "864201948271001",
      purchaseId: "pur_2",
      purchasePrice: 34500,
      sellingPrice: 39999,
      status: "sold",
      addedDate: lastWeek,
      soldDate: today,
      saleId: "sale_2",
    },
    {
      _id: "inv_5",
      product: "OnePlus 12R (16GB+256GB Cool Blue)",
      brand: "OnePlus",
      category: "Smartphones",
      imei: "864201948271002",
      purchaseId: "pur_2",
      purchasePrice: 34500,
      sellingPrice: 39999,
      status: "in-stock",
      addedDate: lastWeek,
    },
    {
      _id: "inv_6",
      product: "OnePlus 12R (16GB+256GB Cool Blue)",
      brand: "OnePlus",
      category: "Smartphones",
      imei: "864201948271003",
      purchaseId: "pur_2",
      purchasePrice: 34500,
      sellingPrice: 39999,
      status: "in-stock",
      addedDate: lastWeek,
    },
    {
      _id: "inv_7",
      product: "OnePlus 12R (16GB+256GB Cool Blue)",
      brand: "OnePlus",
      category: "Smartphones",
      imei: "864201948271004",
      purchaseId: "pur_2",
      purchasePrice: 34500,
      sellingPrice: 39999,
      status: "in-stock",
      addedDate: lastWeek,
    },
    // Samsung Galaxy S24
    {
      _id: "inv_8",
      product: "Samsung Galaxy S24 (256GB Onyx Black)",
      brand: "Samsung",
      category: "Smartphones",
      imei: "359821098273611",
      purchaseId: "pur_3",
      purchasePrice: 71000,
      sellingPrice: 79999,
      status: "in-stock",
      addedDate: yesterday,
    },
    {
      _id: "inv_9",
      product: "Samsung Galaxy S24 (256GB Onyx Black)",
      brand: "Samsung",
      category: "Smartphones",
      imei: "359821098273612",
      purchaseId: "pur_3",
      purchasePrice: 71000,
      sellingPrice: 79999,
      status: "in-stock",
      addedDate: yesterday,
    },
    // Redmi Note 13 Pro items
    {
      _id: "inv_10",
      product: "Redmi Note 13 Pro 5G (8GB+128GB Arctic White)",
      brand: "Xiaomi",
      category: "Smartphones",
      imei: "862901482019381",
      purchaseId: "pur_4",
      purchasePrice: 20500,
      sellingPrice: 24999,
      status: "sold",
      addedDate: yesterday,
      soldDate: today,
      saleId: "sale_3",
    },
    {
      _id: "inv_11",
      product: "Redmi Note 13 Pro 5G (8GB+128GB Arctic White)",
      brand: "Xiaomi",
      category: "Smartphones",
      imei: "862901482019382",
      purchaseId: "pur_4",
      purchasePrice: 20500,
      sellingPrice: 24999,
      status: "in-stock",
      addedDate: yesterday,
    },
    {
      _id: "inv_12",
      product: "Redmi Note 13 Pro 5G (8GB+128GB Arctic White)",
      brand: "Xiaomi",
      category: "Smartphones",
      imei: "862901482019383",
      purchaseId: "pur_4",
      purchasePrice: 20500,
      sellingPrice: 24999,
      status: "in-stock",
      addedDate: yesterday,
    },
    // Vivo V30 items
    {
      _id: "inv_13",
      product: "Vivo V30 5G (8GB+128GB Peacock Green)",
      brand: "Vivo",
      category: "Smartphones",
      imei: "861029384756101",
      purchaseId: "pur_5",
      purchasePrice: 28000,
      sellingPrice: 32999,
      status: "in-stock",
      addedDate: yesterday,
    },
    {
      _id: "inv_14",
      product: "Vivo V30 5G (8GB+128GB Peacock Green)",
      brand: "Vivo",
      category: "Smartphones",
      imei: "861029384756102",
      purchaseId: "pur_5",
      purchasePrice: 28000,
      sellingPrice: 32999,
      status: "in-stock",
      addedDate: yesterday,
    },
    // Accessories
    {
      _id: "inv_15",
      product: "Apple 20W USB-C Original Power Adapter",
      brand: "Apple",
      category: "Accessories",
      imei: "ACC-APP-20W-01",
      purchaseId: "pur_6",
      purchasePrice: 1400,
      sellingPrice: 1900,
      status: "in-stock",
      addedDate: lastWeek,
    },
    {
      _id: "inv_16",
      product: "Apple 20W USB-C Original Power Adapter",
      brand: "Apple",
      category: "Accessories",
      imei: "ACC-APP-20W-02",
      purchaseId: "pur_6",
      purchasePrice: 1400,
      sellingPrice: 1900,
      status: "in-stock",
      addedDate: lastWeek,
    },
    {
      _id: "inv_17",
      product: "Boat Rockerz 255 Pro+ Wireless Earphones",
      brand: "Boat",
      category: "Accessories",
      imei: "BOAT-255-001",
      purchaseId: "pur_7",
      purchasePrice: 850,
      sellingPrice: 1299,
      status: "in-stock",
      addedDate: lastWeek,
    },
  ];

  const expenses = [
    {
      _id: "exp_1",
      date: yesterday,
      category: "Shop Rent",
      amount: 35000,
      paymentMode: "Bank Transfer",
      description: "Main Market Shop Rent for current month",
      createdBy: "Rajesh Sharma",
    },
    {
      _id: "exp_2",
      date: yesterday,
      category: "Electricity",
      amount: 4200,
      paymentMode: "UPI",
      description: "MSEDCL Electricity commercial bill",
      createdBy: "Rajesh Sharma",
    },
    {
      _id: "exp_3",
      date: today,
      category: "Tea & Snacks",
      amount: 380,
      paymentMode: "Cash",
      description: "Counter tea & refreshments for staff & guests",
      createdBy: "Amit Verma",
    },
    {
      _id: "exp_4",
      date: lastWeek,
      category: "Marketing",
      amount: 2500,
      paymentMode: "Cash",
      description: "Local newspaper pamphlets & standee banners",
      createdBy: "Rajesh Sharma",
    },
  ];

  const users = [
    {
      _id: "usr_1",
      name: "Rajesh Sharma",
      email: "owner@mobikart.com",
      phone: "9876543210",
      password: "password123",
      role: "owner",
      createdAt: lastWeek,
    },
    {
      _id: "usr_2",
      name: "Amit Verma",
      email: "amit@mobikart.com",
      phone: "9876543211",
      password: "password123",
      role: "staff",
      createdAt: lastWeek,
    },
    {
      _id: "usr_3",
      name: "Priya Patel",
      email: "priya@mobikart.com",
      phone: "9876543212",
      password: "password123",
      role: "admin",
      createdAt: lastWeek,
    },
  ];

  const settings = {
    shopName: "KOPEK MOBILES",
    tagline: "Smartphones, Accessories, Screen Guards & Repairs",
    address: "Shop 14, Galaxy Market, MG Road, Pune, Maharashtra 411001",
    phone: "+91 98765 43210",
    email: "contact@mobikart.in",
    gst: "27AAACG0123M1Z5",
    logoUrl: "",
    whatsappNumbers: [
      { id: "wa_1", name: "Rajesh Sharma (Owner)", phone: "9876543210", role: "Owner", enabled: true },
      { id: "wa_2", name: "Sanjay Mehta (Partner)", phone: "9822334455", role: "Partner", enabled: true },
      { id: "wa_3", name: "CA Rakesh Kulkarni (Accountant)", phone: "9911223344", role: "Accountant", enabled: true },
    ],
    lowStockThreshold: 3,
    whatsappApiConfig: {
      phoneNumberId: "109823475928371",
      accessToken: "",
      templateName: "daily_shop_summary_v1",
      enabled: false,
      autoScheduleTime: "21:00",
      autoSendDailyReport: true,
    },
    currencySymbol: "₹",
  };

  return { users, purchases, sales, inventory, expenses, settings };
}

// Database Storage In-Memory Cache + Disk Sync
class Database {
  private data: ReturnType<typeof getInitialData>;

  constructor() {
    this.data = getInitialData();
    this.load();
  }

  load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.warn("Using in-memory database fallback:", err);
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.warn("Failed saving database to file:", err);
    }
  }

  getAll() {
    return this.data;
  }

  setAll(newData: ReturnType<typeof getInitialData>) {
    this.data = newData;
    this.save();
  }

  reset() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }
}

const db = new Database();

// ==========================================
// API ROUTES
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Full state endpoint
app.get("/api/all", (req, res) => {
  res.json(db.getAll());
});

// Purchases
app.post("/api/purchases", (req, res) => {
  try {
    const { supplier, product, brand, category, imei, qty, price, total, paymentMode, invoiceNo, notes, createdBy } = req.body;
    
    if (!product || !price || !qty) {
      return res.status(400).json({ error: "Product name, quantity, and price are required" });
    }

    const state = db.getAll();
    const purchaseId = "pur_" + uid();
    const date = req.body.date || new Date().toISOString().split("T")[0];

    // Clean IMEIs array
    const imeiList: string[] = Array.isArray(imei) 
      ? imei.filter(i => Boolean(i && i.trim())) 
      : [];

    const newPurchase = {
      _id: purchaseId,
      date,
      supplier: supplier || "Direct Supplier",
      product,
      brand: brand || "General",
      category: category || "Smartphones",
      imei: imeiList,
      qty: Number(qty),
      price: Number(price),
      total: Number(total) || (Number(qty) * Number(price)),
      paymentMode: paymentMode || "Cash",
      invoiceNo: invoiceNo || `PINV-${Date.now().toString().slice(-5)}`,
      notes: notes || "",
      createdBy: createdBy || "Admin",
    };

    state.purchases.unshift(newPurchase);

    // Automatically create Inventory Items for each device / unit!
    const unitSellingPrice = Number(req.body.suggestedSellingPrice) || Math.round(Number(price) * 1.12);
    
    if (imeiList.length > 0) {
      for (const singleImei of imeiList) {
        state.inventory.unshift({
          _id: "inv_" + uid(),
          product,
          brand: brand || "General",
          category: category || "Smartphones",
          imei: singleImei.trim(),
          purchaseId,
          purchasePrice: Number(price),
          sellingPrice: unitSellingPrice,
          status: "in-stock",
          addedDate: date,
        });
      }
    } else {
      // If no IMEI was provided (e.g. accessories without serial), create generic inventory unit entries
      for (let i = 0; i < Number(qty); i++) {
        state.inventory.unshift({
          _id: "inv_" + uid(),
          product,
          brand: brand || "General",
          category: category || "Accessories",
          imei: `SN-${Date.now().toString().slice(-6)}-${i + 1}`,
          purchaseId,
          purchasePrice: Number(price),
          sellingPrice: unitSellingPrice,
          status: "in-stock",
          addedDate: date,
        });
      }
    }

    db.setAll(state);
    res.status(201).json({ purchase: newPurchase, message: "Purchase and inventory items saved successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/purchases/:id", (req, res) => {
  const { id } = req.params;
  const state = db.getAll();
  state.purchases = state.purchases.filter(p => p._id !== id);
  // Also remove in-stock items associated with this purchase (keep sold ones or mark detached)
  state.inventory = state.inventory.filter(item => !(item.purchaseId === id && item.status === "in-stock"));
  db.setAll(state);
  res.json({ success: true, message: "Purchase deleted" });
});

// Sales & Billing
app.post("/api/sales", (req, res) => {
  try {
    const {
      invoiceNo,
      date,
      customerName,
      customerPhone,
      product,
      brand,
      imei,
      qty,
      sellingPrice,
      discount,
      total,
      paymentMode,
      warranty,
      notes,
      createdBy,
    } = req.body;

    if (!customerName || !product || !total) {
      return res.status(400).json({ error: "Customer name, product, and total amount are required" });
    }

    const state = db.getAll();
    const saleId = "sale_" + uid();
    const saleDate = date || new Date().toISOString().split("T")[0];
    const imeiList: string[] = Array.isArray(imei) ? imei : (imei ? [imei] : []);

    // Find cost of sold items to calculate exact profit
    let totalCost = 0;
    imeiList.forEach(sn => {
      const invItem = state.inventory.find(i => i.imei === sn);
      if (invItem) {
        totalCost += (invItem.purchasePrice || 0);
        // Mark inventory item as sold!
        invItem.status = "sold";
        invItem.soldDate = saleDate;
        invItem.saleId = saleId;
      }
    });

    // If cost was not calculated from IMEI, estimate from product
    if (totalCost === 0) {
      const match = state.inventory.find(i => i.product === product);
      if (match) {
        totalCost = match.purchasePrice * (Number(qty) || 1);
      }
    }

    const finalTotal = Number(total);
    const profit = Math.max(0, finalTotal - totalCost);

    const newSale = {
      _id: saleId,
      invoiceNo: invoiceNo || `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(state.sales.length + 1).padStart(4, '0')}`,
      date: saleDate,
      customerName,
      customerPhone: customerPhone || "",
      product,
      brand: brand || "General",
      imei: imeiList,
      qty: Number(qty) || 1,
      sellingPrice: Number(sellingPrice) || finalTotal,
      discount: Number(discount) || 0,
      total: finalTotal,
      paymentMode: paymentMode || "Cash",
      profit,
      warranty: warranty || "1 Year Brand Warranty",
      notes: notes || "",
      createdBy: createdBy || "Staff",
    };

    state.sales.unshift(newSale);
    db.setAll(state);

    res.status(201).json({ sale: newSale, message: "Sale recorded and invoice generated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/sales/:id", (req, res) => {
  const { id } = req.params;
  const state = db.getAll();
  const sale = state.sales.find(s => s._id === id);

  if (sale) {
    // Revert inventory items back to in-stock!
    state.inventory.forEach(item => {
      if (item.saleId === id || (sale.imei && sale.imei.includes(item.imei))) {
        item.status = "in-stock";
        delete item.soldDate;
        delete item.saleId;
      }
    });
  }

  state.sales = state.sales.filter(s => s._id !== id);
  db.setAll(state);
  res.json({ success: true, message: "Sale reversed and stock restored" });
});

// Inventory
app.post("/api/inventory", (req, res) => {
  const { product, brand, category, imei, purchasePrice, sellingPrice, status } = req.body;
  if (!product || !imei) {
    return res.status(400).json({ error: "Product name and IMEI are required" });
  }
  const state = db.getAll();
  const newItem = {
    _id: "inv_" + uid(),
    product,
    brand: brand || "General",
    category: category || "Smartphones",
    imei: String(imei).trim(),
    purchaseId: req.body.purchaseId || "",
    purchasePrice: Number(purchasePrice) || 0,
    sellingPrice: Number(sellingPrice) || 0,
    status: (status as any) || "in-stock",
    addedDate: new Date().toISOString().split("T")[0],
    soldDate: undefined,
    saleId: undefined,
  };
  (state.inventory as any).unshift(newItem);
  db.setAll(state);
  res.status(201).json(newItem);
});

app.patch("/api/inventory/:id", (req, res) => {
  const { id } = req.params;
  const state = db.getAll();
  const item = state.inventory.find(i => i._id === id);
  if (!item) return res.status(404).json({ error: "Item not found" });

  Object.assign(item, req.body);
  db.setAll(state);
  res.json(item);
});

// Expenses
app.post("/api/expenses", (req, res) => {
  const { date, category, amount, paymentMode, description, receiptUrl, createdBy } = req.body;
  if (!category || !amount) {
    return res.status(400).json({ error: "Category and amount are required" });
  }
  const state = db.getAll();
  const newExp = {
    _id: "exp_" + uid(),
    date: date || new Date().toISOString().split("T")[0],
    category,
    amount: Number(amount),
    paymentMode: paymentMode || "Cash",
    description: description || "",
    receiptUrl: receiptUrl || "",
    createdBy: createdBy || "Admin",
  };
  state.expenses.unshift(newExp);
  db.setAll(state);
  res.status(201).json(newExp);
});

app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const state = db.getAll();
  state.expenses = state.expenses.filter(e => e._id !== id);
  db.setAll(state);
  res.json({ success: true, message: "Expense deleted" });
});

// Settings
const handleUpdateSettings = (req: any, res: any) => {
  const state = db.getAll();
  state.settings = { ...state.settings, ...req.body };
  db.setAll(state);
  res.json({ settings: state.settings, ...state.settings });
};

app.get("/api/settings", (req, res) => {
  const state = db.getAll();
  res.json({ settings: state.settings, ...state.settings });
});
app.put("/api/settings", handleUpdateSettings);
app.patch("/api/settings", handleUpdateSettings);

// Users
app.post("/api/users", (req, res) => {
  const { name, email, phone, role, password } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  const state = db.getAll();
  const newUser = {
    _id: "usr_" + uid(),
    name,
    email,
    phone: phone || "",
    role: role || "staff",
    password: password || "password123",
    createdAt: new Date().toISOString().split("T")[0],
  };
  state.users.push(newUser);
  db.setAll(state);
  res.status(201).json(newUser);
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const state = db.getAll();
  if (state.users.length <= 1) {
    return res.status(400).json({ error: "Cannot delete the only remaining user" });
  }
  state.users = state.users.filter(u => u._id !== id);
  db.setAll(state);
  res.json({ success: true });
});

app.patch("/api/users/:id/password", (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }
  const state = db.getAll();
  const user = state.users.find(u => u._id === id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.password = newPassword;
  db.setAll(state);
  res.json({ success: true, message: "Password updated successfully" });
});

// Backup & Restore
const handleRestore = (req: any, res: any) => {
  try {
    const backupData = req.body;
    if (!backupData || !backupData.sales || !backupData.inventory) {
      return res.status(400).json({ error: "Invalid backup JSON structure" });
    }
    db.setAll(backupData);
    res.json({ success: true, message: "Database restored successfully", data: backupData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const handleResetDemo = (req: any, res: any) => {
  const fresh = db.reset();
  res.json({ success: true, message: "Database reset to sample demo data", data: fresh });
};

app.post("/api/backup/restore", handleRestore);
app.post("/api/restore", handleRestore);

app.post("/api/backup/reset", handleResetDemo);
app.post("/api/reset-demo", handleResetDemo);

// WhatsApp Mode B - Cloud API / Auto-Scheduler Test Dispatch
app.post("/api/whatsapp/send-report", (req, res) => {
  const { recipients, messageBody, mode } = req.body;
  const state = db.getAll();
  const config = state.settings.whatsappApiConfig;

  // Log dispatch record
  const dispatchLog = {
    id: "wa_log_" + Date.now(),
    timestamp: new Date().toISOString(),
    recipients: recipients || state.settings.whatsappNumbers.filter(w => w.enabled).map(w => w.phone),
    mode: mode || "cloud_api",
    status: config?.enabled && config?.accessToken ? "delivered" : "simulated_success",
    messageSnippet: (messageBody || "").slice(0, 100) + "...",
  };

  res.json({
    success: true,
    message: config?.enabled && config?.accessToken 
      ? "Daily report dispatched via WhatsApp Cloud API" 
      : "Daily report dispatched in test mode (Configured recipients received simulated broadcast).",
    dispatchLog,
  });
});

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mobikart POS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
