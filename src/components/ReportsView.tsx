import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Wallet,
  PieChart,
  MessageSquare,
} from 'lucide-react';
import { Sale, Expense, InventoryItem, ShopSettings } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { exportSalesCSV } from '../utils/export';
import { translations, Language } from '../utils/i18n';

interface ReportsViewProps {
  sales: Sale[];
  expenses: Expense[];
  inventory: InventoryItem[];
  shopSettings: ShopSettings;
  lang: Language;
  onOpenWhatsAppShare: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  expenses,
  inventory,
  shopSettings,
  lang,
  onOpenWhatsAppShare,
}) => {
  const t = translations[lang];

  // Time Range Filter
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Date bounds
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthStartStr = todayStr.substring(0, 7); // YYYY-MM

  // Filter items according to time range
  const isDateInRange = (d: string) => {
    if (!d) return false;
    if (timeRange === 'today') return d === todayStr;
    if (timeRange === 'yesterday') return d === yesterdayStr;
    if (timeRange === 'week') return d >= sevenDaysAgoStr && d <= todayStr;
    if (timeRange === 'month') return d.startsWith(monthStartStr);
    if (timeRange === 'custom') {
      if (customStart && d < customStart) return false;
      if (customEnd && d > customEnd) return false;
      return true;
    }
    return true; // 'all'
  };

  const periodSales = useMemo(() => sales.filter(s => isDateInRange(s.date)), [sales, timeRange, customStart, customEnd]);
  const periodExpenses = useMemo(() => expenses.filter(e => isDateInRange(e.date)), [expenses, timeRange, customStart, customEnd]);

  // Financial Metrics
  const grossRevenue = useMemo(() => periodSales.reduce((acc, s) => acc + s.total, 0), [periodSales]);
  const grossProfit = useMemo(() => periodSales.reduce((acc, s) => acc + s.profit, 0), [periodSales]);
  const cogs = useMemo(() => Math.max(0, grossRevenue - grossProfit), [grossRevenue, grossProfit]);
  const totalExpenses = useMemo(() => periodExpenses.reduce((acc, e) => acc + e.amount, 0), [periodExpenses]);
  const netProfit = grossProfit - totalExpenses;
  const isNetProfitPositive = netProfit >= 0;

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { UPI: 0, Cash: 0, Card: 0, 'Bank Transfer': 0, Credit: 0 };
    periodSales.forEach(s => {
      map[s.paymentMode] = (map[s.paymentMode] || 0) + s.total;
    });
    return map;
  }, [periodSales]);

  // Brand Performance
  const brandSales = useMemo(() => {
    const map: Record<string, { count: number; total: number; profit: number }> = {};
    periodSales.forEach(s => {
      const b = s.brand || 'General';
      if (!map[b]) map[b] = { count: 0, total: 0, profit: 0 };
      map[b].count += s.qty;
      map[b].total += s.total;
      map[b].profit += s.profit;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [periodSales]);

  // Top products by units
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number; profit: number }> = {};
    periodSales.forEach(s => {
      if (!map[s.product]) map[s.product] = { name: s.product, count: 0, revenue: 0, profit: 0 };
      map[s.product].count += s.qty;
      map[s.product].revenue += s.total;
      map[s.product].profit += s.profit;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [periodSales]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.reports} &amp; P&amp;L Analysis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit profit margins, COGS, payment collections, and handset turnover
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenWhatsAppShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t.shareReport}</span>
          </button>

          <button
            onClick={() => exportSalesCSV(periodSales)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{t.exportPdf}</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Pill Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              timeRange === 'today'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('yesterday')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              timeRange === 'yesterday'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              timeRange === 'week'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              timeRange === 'month'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              timeRange === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeRange('custom')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              timeRange === 'custom'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Custom Range
          </button>
        </div>

        {timeRange === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Primary Profit & Loss Statement Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <span>{t.profitAndLoss}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 mb-6">
          {/* Revenue */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">{t.revenue}</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {formatINR(grossRevenue)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{periodSales.length} Total Bills</p>
          </div>

          {/* COGS */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">{t.cogs}</span>
            <p className="text-2xl font-black text-slate-600 dark:text-slate-300 font-mono mt-1">
              {formatINR(cogs)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Purchase cost of phones sold</p>
          </div>

          {/* Operating Expenses */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">{t.expenses}</span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              -{formatINR(totalExpenses)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Rent, tea, utilities, salary</p>
          </div>

          {/* Net Profit */}
          <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 md:pl-4 pt-4 md:pt-0">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
              {t.netProfit} (After Overheads)
            </span>
            <p
              className={`text-2xl font-black font-mono mt-1 ${
                isNetProfitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
              }`}
            >
              {formatINR(netProfit)}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              Margin:{' '}
              <b className="text-slate-700 dark:text-slate-200">
                {grossRevenue > 0 ? `${Math.round((netProfit / grossRevenue) * 100)}%` : '0%'}
              </b>
            </p>
          </div>
        </div>

        {/* Visual Profit Formula Strip */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-center gap-2 text-center">
          <span className="font-bold text-slate-900 dark:text-white">Revenue ({formatINR(grossRevenue)})</span>
          <span>-</span>
          <span>Cost of Goods ({formatINR(cogs)})</span>
          <span>-</span>
          <span className="text-rose-600">Expenses ({formatINR(totalExpenses)})</span>
          <span>=</span>
          <span className={`font-bold ${isNetProfitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            Net Profit ({formatINR(netProfit)})
          </span>
        </div>
      </div>

      {/* Two Column Section: Top Handsets & Payment Modes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Top Performing Phone Models (Units &amp; Profit)
          </h3>

          {topProducts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No sales in this period.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                      {p.count} units &bull; Revenue {formatINR(p.revenue)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatINR(p.profit)}
                    </span>
                    <p className="text-[10px] text-slate-400">Profit</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Collections Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Payment Mode Collections
          </h3>

          <div className="space-y-3">
            {Object.entries(paymentBreakdown).map(([mode, amount]) => {
              const pct = grossRevenue > 0 ? Math.round((amount / grossRevenue) * 100) : 0;

              return (
                <div key={mode} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{mode}</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {formatINR(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        mode === 'UPI'
                          ? 'bg-emerald-500'
                          : mode === 'Cash'
                          ? 'bg-blue-500'
                          : mode === 'Card'
                          ? 'bg-purple-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brand-Wise Sales Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Brand-wise Sales Volume &amp; Profit
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-[10px] uppercase">
                <th className="py-2 px-3">Brand</th>
                <th className="py-2 px-3 text-center">Units Sold</th>
                <th className="py-2 px-3 text-right">Total Revenue</th>
                <th className="py-2 px-3 text-right">Total Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {brandSales.map(([brand, data]) => (
                <tr key={brand}>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{brand}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{data.count}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatINR(data.total)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatINR(data.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
