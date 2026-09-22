import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Download,
  Trash2,
  PackagePlus,
  Building,
  Smartphone,
  Check,
} from 'lucide-react';
import { Purchase, PaymentMode, Role } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { exportPurchasesCSV } from '../utils/export';
import { translations, Language } from '../utils/i18n';

interface PurchasesViewProps {
  purchases: Purchase[];
  currentUserName: string;
  userRole: Role;
  lang: Language;
  onAddPurchase: (purchaseData: any) => Promise<void>;
  onDeletePurchase: (id: string) => Promise<void>;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  currentUserName,
  userRole,
  lang,
  onAddPurchase,
  onDeletePurchase,
  showToast,
}) => {
  const t = translations[lang];

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [product, setProduct] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [category, setCategory] = useState('Smartphones');
  const [imeiInput, setImeiInput] = useState('');
  const [qty, setQty] = useState<number | ''>(1);
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [suggestedSellingPrice, setSuggestedSellingPrice] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Handle IMEI input change to auto-update Qty if multiple IMEIs entered
  const handleImeiChange = (value: string) => {
    setImeiInput(value);
    const cleaned = value
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (cleaned.length > 0) {
      setQty(cleaned.length);
    }
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.trim() || !costPrice || Number(costPrice) <= 0) {
      showToast('Validation Error', 'Please enter a product name and valid purchase cost', 'error');
      return;
    }

    const imeiList = imeiInput
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const actualQty = imeiList.length > 0 ? imeiList.length : (Number(qty) || 1);
    const numCost = Number(costPrice);
    const totalAmount = actualQty * numCost;

    setIsSubmitting(true);
    try {
      await onAddPurchase({
        supplier: supplier.trim() || 'Wholesale Supplier',
        product: product.trim(),
        brand,
        category,
        imei: imeiList,
        qty: actualQty,
        price: numCost,
        suggestedSellingPrice: Number(suggestedSellingPrice) || Math.round(numCost * 1.15),
        total: totalAmount,
        paymentMode,
        invoiceNo: invoiceNo.trim() || `PINV-${Date.now().toString().slice(-6)}`,
        date,
        notes,
        createdBy: currentUserName,
      });

      showToast(
        'Stock Added to Inventory!',
        `Recorded purchase of ${actualQty} units of ${product}. Added to live stock.`,
        'success'
      );

      // Reset
      setShowAddModal(false);
      setSupplier('');
      setProduct('');
      setImeiInput('');
      setQty(1);
      setCostPrice('');
      setSuggestedSellingPrice('');
      setInvoiceNo('');
      setNotes('');
    } catch (err: any) {
      showToast('Error', err.message || 'Could not record purchase', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPurchases = purchases.filter(p => {
    return (
      p.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.imei && p.imei.some(i => i.includes(searchTerm)))
    );
  });

  const totalSpent = purchases.reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.purchases} &amp; Stock In
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log wholesale purchases with IMEI numbers &bull; Lifetime Spend: <b>{formatINR(totalSpent)}</b>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportPurchasesCSV(purchases)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            id="add-purchase-btn"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newPurchase}</span>
          </button>
        </div>
      </div>

      {/* Purchases Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product, supplier, invoice, IMEI..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            {filteredPurchases.length} Purchase bills
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Supplier &amp; Inv #</th>
                <th className="py-3 px-3">Product / Device</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Cost / Unit</th>
                <th className="py-3 px-3 text-right">Total (₹)</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No purchases recorded yet. Click &quot;+ New Purchase&quot; to add inventory.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(p.date)}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 dark:text-white">{p.supplier}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.invoiceNo}</p>
                    </td>
                    <td className="py-3 px-3 max-w-sm">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{p.product}</p>
                      {p.imei && p.imei.length > 0 && (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5 truncate">
                          {p.imei.length} IMEI(s): {p.imei.slice(0, 3).join(', ')}{p.imei.length > 3 ? '...' : ''}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {p.qty}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatINR(p.price)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(p.total)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {(userRole === 'owner' || userRole === 'admin') && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete purchase ${p.invoiceNo}? Unsold items from this purchase will be removed from inventory.`)) {
                              onDeletePurchase(p._id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                          title="Delete purchase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.addPurchaseTitle}
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.supplierName} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SuperTech Distributors"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.supplierInvoice}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ST-INV-9921"
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Model &amp; Specs <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. OnePlus Nord CE 4 5G (8GB+128GB Celadon Marble)"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand
                  </label>
                  <select
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Xiaomi">Xiaomi / Redmi</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Oppo">Oppo</option>
                    <option value="Realme">Realme</option>
                    <option value="Motorola">Motorola</option>
                    <option value="Boat">Boat</option>
                    <option value="General">General / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Smartphones">Smartphones</option>
                    <option value="Feature Phones">Feature Phones</option>
                    <option value="Audio">Audio / Earphones</option>
                    <option value="Accessories">Accessories &amp; Cables</option>
                    <option value="Smartwatch">Smartwatch</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* IMEIs Textarea */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.enterImeis}
                </label>
                <textarea
                  rows={3}
                  placeholder="Paste 15-digit IMEI numbers separated by comma or new line:&#10;865492051839201&#10;865492051839202"
                  value={imeiInput}
                  onChange={e => handleImeiChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tip: Entering IMEIs auto-creates unique tracked items in your inventory.
                </p>
              </div>

              {/* Price, Qty, Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.qty}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={e => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.unitCost} (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 19500"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Retail Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 22999"
                    value={suggestedSellingPrice}
                    onChange={e => setSuggestedSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode to Supplier
                </label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit">Credit / Due</option>
                </select>
              </div>

              {/* Total Calculation Note */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <span>Total Purchase Amount:</span>
                <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                  {formatINR((Number(costPrice) || 0) * (Number(qty) || 1))}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : t.savePurchase}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
