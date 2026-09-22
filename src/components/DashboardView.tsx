import React from 'react';
import {
  TrendingUp,
  Receipt,
  Smartphone,
  AlertTriangle,
  ArrowUpRight,
  Wallet,
  CreditCard,
  PlusCircle,
  MessageCircle,
  Clock,
  Printer,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { Sale, Purchase, InventoryItem, Expense, ShopSettings } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { translations, Language } from '../utils/i18n';

interface DashboardViewProps {
  sales: Sale[];
  purchases: Purchase[];
  inventory: InventoryItem[];
  expenses: Expense[];
  shopSettings: ShopSettings;
  lang: Language;
  onNavigateTab: (tab: string) => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewExpense: () => void;
  onSelectSaleForInvoice: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  purchases,
  inventory,
  expenses,
  shopSettings,
  lang,
  onNavigateTab,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenNewExpense,
  onSelectSaleForInvoice,
}) => {
  const t = translations[lang];
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  // Today calculations
  const todaySalesList = sales.filter(s => s.date === todayStr);
  const todaySales = todaySalesList.reduce((acc, s) => acc + s.total, 0);
  const todayProfit = todaySalesList.reduce((acc, s) => acc + s.profit, 0);
  const todayCash = todaySalesList.filter(s => s.paymentMode === 'Cash').reduce((acc, s) => acc + s.total, 0);
  const todayUPI = todaySalesList.filter(s => s.paymentMode === 'UPI').reduce((acc, s) => acc + s.total, 0);

  // Month calculations
  const monthSalesList = sales.filter(s => s.date.startsWith(currentMonthStr));
  const monthSalesTotal = monthSalesList.reduce((acc, s) => acc + s.total, 0);
  const monthExpensesList = expenses.filter(e => e.date.startsWith(currentMonthStr));
  const monthExpensesTotal = monthExpensesList.reduce((acc, e) => acc + e.amount, 0);

  // Inventory stats
  const inStockItems = inventory.filter(i => i.status === 'in-stock');
  const inStockCount = inStockItems.length;
  const stockValuation = inStockItems.reduce((acc, i) => acc + (i.purchasePrice || 0), 0);

  // Group inventory by product to calculate remaining count and detect low stock
  const productStockMap: Record<string, { product: string; brand: string; count: number; minPrice: number }> = {};
  inStockItems.forEach(item => {
    if (!productStockMap[item.product]) {
      productStockMap[item.product] = {
        product: item.product,
        brand: item.brand,
        count: 0,
        minPrice: item.sellingPrice,
      };
    }
    productStockMap[item.product].count += 1;
  });

  const lowStockThreshold = shopSettings.lowStockThreshold || 3;
  const lowStockProducts = Object.values(productStockMap).filter(p => p.count <= lowStockThreshold);

  // Recent 5 sales
  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl border border-blue-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {lang === 'hi' ? 'दुकान डैशबोर्ड' : 'Real-time Shop Dashboard'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              {shopSettings.shopName}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Today is {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Big Touch-Friendly Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="dash-quick-sale-btn"
              onClick={onOpenNewSale}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-5 h-5 text-slate-950" />
              <span>{t.newSale}</span>
            </button>

            <button
              id="dash-quick-purchase-btn"
              onClick={onOpenNewPurchase}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{t.newPurchase}</span>
            </button>

            <button
              id="dash-quick-expense-btn"
              onClick={onOpenNewExpense}
              className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
            >
              <Wallet className="w-4 h-4 text-rose-400" />
              <span>{t.addExpense}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.todaySales}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {formatINR(todaySales)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{todaySalesList.length} Bills Cut Today</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              Cash: {formatINR(todayCash)}
            </span>
          </div>
        </div>

        {/* Today's Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.todayProfit}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {formatINR(todayProfit)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Gross Margin:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {todaySales > 0 ? `${Math.round((todayProfit / todaySales) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* In-Stock Devices */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.inStockCount}</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {inStockCount} <span className="text-xs font-normal text-slate-400">units</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Stock Worth:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
              {formatINR(stockValuation)}
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
            lowStockProducts.length > 0
              ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-900/60'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.lowStockAlerts}</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              lowStockProducts.length > 0 ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 font-mono ${
            lowStockProducts.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'
          }`}>
            {lowStockProducts.length} <span className="text-xs font-normal text-slate-400">models</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
            <span>Threshold: &le; {lowStockThreshold} units</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              View &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Cash Collection Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-medium">Cash Collected (Today)</span>
          <p className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">
            {formatINR(todayCash)}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-medium">UPI Collected (Today)</span>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {formatINR(todayUPI)}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-medium">Month Sales</span>
          <p className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
            {formatINR(monthSalesTotal)}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-medium">Month Expenses</span>
          <p className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
            {formatINR(monthExpensesTotal)}
          </p>
        </div>
      </div>

      {/* Two Column Layout: Recent Sales & Low Stock List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Bills / Transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.recentTransactions}
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All Bills &rarr;
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">No sales recorded yet.</p>
              <button
                onClick={onOpenNewSale}
                className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
              >
                Create your first sale
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSales.map(sale => (
                <div
                  key={sale._id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {sale.invoiceNo}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {sale.paymentMode}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate mt-0.5">
                      {sale.product}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {sale.customerName} {sale.customerPhone && `• ${sale.customerPhone}`}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {formatINR(sale.total)}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      +{formatINR(sale.profit)} profit
                    </p>
                    <button
                      onClick={() => onSelectSaleForInvoice(sale)}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-0.5"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Invoice</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Low Stock Warnings & Handset Inventory Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.lowStockAlerts}
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                &le; {lowStockThreshold} left
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t.allGoodStock}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 5).map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {p.product}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        {p.brand}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        {p.count} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onOpenNewPurchase}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Purchase / Restock Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
