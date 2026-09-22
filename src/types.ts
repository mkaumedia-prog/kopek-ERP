export type Role = 'owner' | 'staff' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: Role;
  createdAt: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Credit';

export interface Purchase {
  _id: string;
  date: string;
  supplier: string;
  product: string;
  brand?: string;
  category?: string;
  imei: string[];
  qty: number;
  price: number; // cost per unit
  total: number;
  paymentMode: PaymentMode;
  invoiceNo: string;
  notes?: string;
  createdBy: string;
}

export interface Sale {
  _id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  product: string;
  brand?: string;
  imei: string[];
  qty: number;
  sellingPrice: number; // price per unit or base price
  discount: number;
  total: number;
  paymentMode: PaymentMode;
  profit: number;
  warranty: string;
  notes?: string;
  createdBy: string;
}

export interface Expense {
  _id: string;
  date: string;
  category: 'Shop Rent' | 'Electricity' | 'Staff Salary' | 'Tea & Snacks' | 'Maintenance' | 'Marketing' | 'Shipping' | 'Misc';
  amount: number;
  paymentMode: PaymentMode;
  description: string;
  receiptUrl?: string;
  createdBy: string;
}

export interface InventoryItem {
  _id: string;
  product: string;
  brand: string;
  category: string;
  imei: string;
  purchaseId?: string;
  status: 'in-stock' | 'sold';
  purchasePrice: number;
  sellingPrice: number;
  addedDate: string;
  soldDate?: string;
  saleId?: string;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  role: 'Partner' | 'Accountant' | 'Owner' | 'Manager' | 'Other';
  enabled: boolean;
}

export interface WhatsAppApiConfig {
  phoneNumberId: string;
  accessToken: string;
  templateName: string;
  enabled: boolean;
  autoScheduleTime: string; // e.g. "21:00" (9 PM)
  autoSendDailyReport: boolean;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  logoUrl?: string;
  whatsappNumbers: WhatsAppContact[];
  lowStockThreshold: number;
  whatsappApiConfig: WhatsAppApiConfig;
  currencySymbol: string;
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  todaySalesCount: number;
  monthlySales: number;
  monthlyProfit: number;
  monthlyPurchases: number;
  monthlyExpenses: number;
  inStockCount: number;
  soldCount: number;
  lowStockCount: number;
  cashCollectedToday: number;
  upiCollectedToday: number;
}
