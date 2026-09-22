import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  Printer,
  MessageSquare,
  Sparkles,
  Download,
  Check,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Banknote,
  QrCode,
  Building,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Sale, InventoryItem, ShopSettings, PaymentMode, Role } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { exportSalesCSV } from '../utils/export';
import { buildCustomerInvoiceMessage, openWhatsAppDirect } from '../utils/whatsapp';
import { translations, Language } from '../utils/i18n';

interface BillingViewProps {
  sales: Sale[];
  inventory: InventoryItem[];
  shopSettings: ShopSettings;
  currentUserName: string;
  userRole: Role;
  lang: Language;
  onAddSale: (saleData: any) => Promise<Sale>;
  onDeleteSale: (saleId: string) => Promise<void>;
  onSelectSaleForInvoice: (sale: Sale) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  sales,
  inventory,
  shopSettings,
  currentUserName,
  userRole,
  lang,
  onAddSale,
  onDeleteSale,
  onSelectSaleForInvoice,
  showToast,
}) => {
  const t = translations[lang];

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedImeis, setSelectedImeis] = useState<string[]>([]);
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [warranty, setWarranty] = useState('1 Year Official Brand Warranty');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter for History
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Filter in-stock inventory items
  const inStockItems = useMemo(() => {
    return inventory.filter(i => i.status === 'in-stock');
  }, [inventory]);

  // Unique products currently in stock
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, { product: string; brand: string; count: number; defaultPrice: number; cost: number }>();
    inStockItems.forEach(item => {
      const existing = map.get(item.product);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(item.product, {
          product: item.product,
          brand: item.brand,
          count: 1,
          defaultPrice: item.sellingPrice,
          cost: item.purchasePrice,
        });
      }
    });
    return Array.from(map.values());
  }, [inStockItems]);

  // IMEIs available for the currently selected product
  const availableImeis = useMemo(() => {
    if (!selectedProduct) return [];
    return inStockItems.filter(i => i.product === selectedProduct);
  }, [inStockItems, selectedProduct]);

  // Handle product change
  const handleProductSelect = (prodName: string) => {
    setSelectedProduct(prodName);
    const found = uniqueProducts.find(p => p.product === prodName);
    if (found) {
      setSellingPrice(found.defaultPrice);
      // Auto-select first available IMEI if available
      const firstImei = inStockItems.find(i => i.product === prodName);
      if (firstImei) {
        setSelectedImeis([firstImei.imei]);
      } else {
        setSelectedImeis([]);
      }
    }
  };

  // Quantity is determined by selected IMEIs (or 1 if none)
  const qty = selectedImeis.length > 0 ? selectedImeis.length : 1;
  const numPrice = Number(sellingPrice) || 0;
  const numDiscount = Number(discount) || 0;
  const calculatedTotal = Math.max(0, numPrice * qty - numDiscount);

  // Calculate estimated profit
  const selectedCost = useMemo(() => {
    if (selectedImeis.length > 0) {
      return selectedImeis.reduce((sum, imei) => {
        const item = inStockItems.find(i => i.imei === imei);
        return sum + (item ? item.purchasePrice : 0);
      }, 0);
    }
    const prod = uniqueProducts.find(p => p.product === selectedProduct);
    return prod ? prod.cost * qty : 0;
  }, [selectedImeis, inStockItems, uniqueProducts, selectedProduct, qty]);

  const estimatedProfit = Math.max(0, calculatedTotal - selectedCost);

  // Toggle IMEI selection
  const handleToggleImei = (imei: string) => {
    if (selectedImeis.includes(imei)) {
      setSelectedImeis(selectedImeis.filter(i => i !== imei));
    } else {
      setSelectedImeis([...selectedImeis, imei]);
    }
  };

  // Submit sale
  const handleCompleteSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Validation Error', 'Customer name is required', 'error');
      return;
    }
    if (!selectedProduct) {
      showToast('Validation Error', 'Please choose a product from in-stock inventory', 'error');
      return;
    }
    if (calculatedTotal <= 0) {
      showToast('Validation Error', 'Total bill amount must be greater than ₹0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedItem = inStockItems.find(i => i.product === selectedProduct);
      const salePayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        product: selectedProduct,
        brand: selectedItem?.brand || 'General',
        imei: selectedImeis,
        qty,
        sellingPrice: numPrice,
        discount: numDiscount,
        total: calculatedTotal,
        paymentMode,
        warranty,
        notes,
        createdBy: currentUserName,
      };

      const createdSale = await onAddSale(salePayload);

      // Trigger Confetti!
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast('Sale Completed!', `Invoice ${createdSale.invoiceNo} generated for ₹${calculatedTotal.toLocaleString('en-IN')}`, 'success');

      // Reset Form
      setCustomerName('');
      setCustomerPhone('');
      setSelectedProduct('');
      setSelectedImeis([]);
      setSellingPrice('');
      setDiscount(0);
      setNotes('');

      // Prompt Invoice Modal
      onSelectSaleForInvoice(createdSale);
    } catch (err: any) {
      showToast('Sale Failed', err.message || 'Could not record sale', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered sales history
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch =
        s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerPhone.includes(searchTerm) ||
        s.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.imei && s.imei.some(i => i.includes(searchTerm)));

      const matchesPayment = paymentFilter === 'All' || s.paymentMode === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [sales, searchTerm, paymentFilter]);

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.billingTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create Tax Invoice with live IMEI tracking &amp; instant WhatsApp share
          </p>
        </div>

        <button
          onClick={() => exportSalesCSV(sales)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>{t.exportExcel}</span>
        </button>
      </div>

      {/* POS Billing Form Card */}
      <form onSubmit={handleCompleteSale} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Customer Details */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">1</span>
              <span>Customer Details</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.customerName} <span className="text-rose-500">*</span>
              </label>
              <input
                id="pos-customer-name-input"
                type="text"
                placeholder="e.g. Ramesh Kadam"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.customerPhone} (for WhatsApp Bill)
              </label>
              <input
                id="pos-customer-phone-input"
                type="tel"
                placeholder="e.g. 9876543210"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.warranty}
              </label>
              <select
                id="pos-warranty-select"
                value={warranty}
                onChange={e => setWarranty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="1 Year Official Brand Warranty">1 Year Official Brand Warranty</option>
                <option value="6 Months Shop Warranty">6 Months Shop Warranty</option>
                <option value="2 Years Extended Warranty">2 Years Extended Warranty</option>
                <option value="No Warranty (Accessories)">No Warranty (Accessories)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bill Notes / Freebies
              </label>
              <input
                type="text"
                placeholder="e.g. Free Tempered glass + 20W Cable"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Column 2: Product & In-Stock IMEI Selection */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">2</span>
              <span>Device &amp; IMEI Stock</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.selectDevice} <span className="text-rose-500">*</span>
              </label>
              <select
                id="pos-product-select"
                value={selectedProduct}
                onChange={e => handleProductSelect(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              >
                <option value="">-- Choose in-stock device ({inStockItems.length} available) --</option>
                {uniqueProducts.map(p => (
                  <option key={p.product} value={p.product}>
                    {p.product} ({p.count} in stock) - MRP {formatINR(p.defaultPrice)}
                  </option>
                ))}
              </select>
            </div>

            {/* Available IMEIs */}
            {selectedProduct && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Select Specific IMEI(s):</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Selected: <b>{selectedImeis.length}</b>
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                  {availableImeis.map(item => {
                    const isSelected = selectedImeis.includes(item.imei);
                    return (
                      <div
                        key={item._id}
                        onClick={() => handleToggleImei(item.imei)}
                        className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer text-xs font-mono transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <span className="truncate">{item.imei}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            Cost: {formatINR(item.purchasePrice)}
                          </span>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-white text-blue-600 border-white' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price & Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Selling Rate (₹)
                </label>
                <input
                  id="pos-selling-price-input"
                  type="number"
                  min="0"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  placeholder="Price"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Discount (₹)
                </label>
                <input
                  id="pos-discount-input"
                  type="number"
                  min="0"
                  value={discount}
                  onChange={e => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Column 3: Payment Mode & Bill Finalization */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">3</span>
                <span>Payment &amp; Final Total</span>
              </h2>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t.paymentMode}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Cash', 'Card', 'Bank Transfer', 'Credit'] as PaymentMode[]).map(mode => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center ${
                        paymentMode === mode
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bill Summary Calculations */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Base Price ({qty} unit{qty > 1 ? 's' : ''}):</span>
                  <span className="font-mono">{formatINR(numPrice * qty)}</span>
                </div>
                {numDiscount > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Discount applied:</span>
                    <span className="font-mono">-{formatINR(numDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-900 dark:text-white text-base font-black pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Grand Total:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xl">
                    {formatINR(calculatedTotal)}
                  </span>
                </div>

                {/* Profit estimate badge (visible to shopkeeper) */}
                <div className="flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-800 dark:text-emerald-300 mt-2">
                  <span>Your Profit on this sale:</span>
                  <span className="font-bold font-mono">+{formatINR(estimatedProfit)}</span>
                </div>
              </div>
            </div>

            {/* Big Complete Button */}
            <button
              id="pos-submit-sale-btn"
              type="submit"
              disabled={isSubmitting || !selectedProduct}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>{isSubmitting ? 'Processing Bill...' : t.generateBill}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Sales History & Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Sales Records &amp; Tax Invoices ({filteredSales.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Invoice, Customer, IMEI..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none w-56 sm:w-64"
              />
            </div>

            {/* Payment filter */}
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="All">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Device / IMEI</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-right">Profit</th>
                <th className="py-3 px-3 text-center">Mode</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No sales invoices match your search.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {sale.invoiceNo}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(sale.date)}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 dark:text-white">{sale.customerName}</p>
                      {sale.customerPhone && (
                        <p className="text-[11px] text-slate-500 font-mono">{sale.customerPhone}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{sale.product}</p>
                      {sale.imei && sale.imei.length > 0 && (
                        <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                          {sale.imei.join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(sale.total)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatINR(sale.profit)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sale.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            const msg = buildCustomerInvoiceMessage(sale, shopSettings);
                            openWhatsAppDirect(sale.customerPhone, msg);
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors"
                          title="Share bill on WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectSaleForInvoice(sale)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {(userRole === 'owner' || userRole === 'admin') && (
                          <button
                            onClick={() => {
                              if (confirm(`Cancel invoice ${sale.invoiceNo}? Stock will be restored to inventory.`)) {
                                onDeleteSale(sale._id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                            title="Cancel sale & restore stock"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
