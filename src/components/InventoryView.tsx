import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Tag,
  Plus,
  Layers,
  History,
  Info,
} from 'lucide-react';
import { InventoryItem, ShopSettings, Sale, Purchase } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { exportInventoryCSV } from '../utils/export';
import { translations, Language } from '../utils/i18n';

interface InventoryViewProps {
  inventory: InventoryItem[];
  sales: Sale[];
  purchases: Purchase[];
  shopSettings: ShopSettings;
  lang: Language;
  onAddInventoryItem: (item: any) => Promise<void>;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  sales,
  purchases,
  shopSettings,
  lang,
  onAddInventoryItem,
  showToast,
}) => {
  const t = translations[lang];

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-stock' | 'sold'>('in-stock');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Selected item for Lifecycle Modal
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Manual Add Stock Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const [newBrand, setNewBrand] = useState('Apple');
  const [newCategory, setNewCategory] = useState('Smartphones');
  const [newImei, setNewImei] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState<number | ''>('');
  const [newSellingPrice, setNewSellingPrice] = useState<number | ''>('');

  // Brand options
  const brands = useMemo(() => {
    const set = new Set(inventory.map(i => i.brand || 'General'));
    return ['All', ...Array.from(set)];
  }, [inventory]);

  // Calculations
  const inStockItems = useMemo(() => inventory.filter(i => i.status === 'in-stock'), [inventory]);
  const soldItems = useMemo(() => inventory.filter(i => i.status === 'sold'), [inventory]);
  const inStockWorth = useMemo(() => inStockItems.reduce((sum, i) => sum + i.purchasePrice, 0), [inStockItems]);
  const expectedRevenue = useMemo(() => inStockItems.reduce((sum, i) => sum + i.sellingPrice, 0), [inStockItems]);

  // Filtered List
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch =
        item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBrand = brandFilter === 'All' || item.brand === brandFilter;
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesBrand && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, brandFilter, categoryFilter, statusFilter]);

  // Handle Manual Item Add
  const handleAddManualItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.trim() || !newImei.trim()) {
      showToast('Validation Error', 'Product name and IMEI are required', 'error');
      return;
    }

    try {
      await onAddInventoryItem({
        product: newProduct.trim(),
        brand: newBrand,
        category: newCategory,
        imei: newImei.trim(),
        purchasePrice: Number(newPurchasePrice) || 0,
        sellingPrice: Number(newSellingPrice) || 0,
        status: 'in-stock',
      });

      showToast('Device Registered', `${newProduct} with IMEI ${newImei} added to in-stock inventory`, 'success');
      setShowAddModal(false);
      setNewProduct('');
      setNewImei('');
      setNewPurchasePrice('');
      setNewSellingPrice('');
    } catch (err: any) {
      showToast('Error', err.message || 'Could not add item', 'error');
    }
  };

  // Find linked purchase or sale for Lifecycle modal
  const linkedPurchase = useMemo(() => {
    if (!selectedItem?.purchaseId) return null;
    return purchases.find(p => p._id === selectedItem.purchaseId);
  }, [selectedItem, purchases]);

  const linkedSale = useMemo(() => {
    if (!selectedItem?.saleId) {
      if (selectedItem?.status === 'sold') {
        return sales.find(s => s.imei && s.imei.includes(selectedItem.imei));
      }
      return null;
    }
    return sales.find(s => s._id === selectedItem.saleId);
  }, [selectedItem, sales]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.inventory}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time IMEI ledger, stock valuations, and handset lifecycle tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportInventoryCSV(inventory)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            id="add-device-inventory-btn"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Device / IMEI</span>
          </button>
        </div>
      </div>

      {/* Stock Summary Mini-KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Available In-Stock</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {inStockItems.length} <span className="text-xs font-normal text-slate-400">units</span>
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Sold Units</span>
          <p className="text-xl font-black text-slate-700 dark:text-slate-300 mt-1 font-mono">
            {soldItems.length} <span className="text-xs font-normal text-slate-400">units</span>
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Stock Valuation</span>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {formatINR(inStockWorth)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Expected Sales Value</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatINR(expectedRevenue)}
          </p>
        </div>
      </div>

      {/* Filters & Inventory List Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by 15-digit IMEI, handset model, brand..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter('in-stock')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'in-stock'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                In Stock ({inStockItems.length})
              </button>
              <button
                onClick={() => setStatusFilter('sold')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'sold'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Sold ({soldItems.length})
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({inventory.length})
              </button>
            </div>

            {/* Brand Dropdown */}
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 outline-none"
            >
              {brands.map(b => (
                <option key={b} value={b}>
                  {b === 'All' ? 'All Brands' : b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Device &amp; Brand</th>
                <th className="py-3 px-3">IMEI / Serial Number</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Cost (₹)</th>
                <th className="py-3 px-3 text-right">Selling (₹)</th>
                <th className="py-3 px-3">Added Date</th>
                <th className="py-3 px-3 text-right">Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No devices match your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => {
                  const isInStock = item.status === 'in-stock';

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {item.product}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.brand}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.category}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white select-all">
                        <span className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {item.imei}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isInStock
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {isInStock ? 'In Stock' : 'Sold'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatINR(item.purchasePrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatINR(item.sellingPrice)}
                      </td>

                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatDate(item.addedDate)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-semibold transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device History / Lifecycle Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  IMEI Device Lifecycle Tracker
                </h2>
                <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                  IMEI: {selectedItem.imei}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Phone Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedItem.product}
                </p>
                <div className="flex gap-4 mt-2 text-slate-600 dark:text-slate-300">
                  <span>Brand: <b>{selectedItem.brand}</b></span>
                  <span>Category: <b>{selectedItem.category}</b></span>
                  <span>Current Status: <b className="uppercase text-emerald-600">{selectedItem.status}</b></span>
                </div>
              </div>

              {/* Timeline Stage 1: Stock In / Purchase */}
              <div className="border-l-2 border-blue-500 pl-4 space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                  Stage 1 &bull; Inward Stock Purchase
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Purchased on {formatDate(selectedItem.addedDate)}
                </p>
                <p className="text-slate-500 font-mono">
                  Purchase Rate: {formatINR(selectedItem.purchasePrice)}
                </p>
                {linkedPurchase && (
                  <p className="text-slate-500">
                    Supplier: <b>{linkedPurchase.supplier}</b> (Inv: {linkedPurchase.invoiceNo})
                  </p>
                )}
              </div>

              {/* Timeline Stage 2: Retail Out / Sale */}
              <div className={`border-l-2 pl-4 space-y-1 ${
                selectedItem.status === 'sold' ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-700'
              }`}>
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  selectedItem.status === 'sold' ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  Stage 2 &bull; Customer Billing &amp; Warranty
                </span>
                {selectedItem.status === 'sold' ? (
                  <>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Sold on {formatDate(selectedItem.soldDate || '')}
                    </p>
                    <p className="text-slate-500 font-mono">
                      Selling Price: {formatINR(selectedItem.sellingPrice)}
                    </p>
                    {linkedSale && (
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 mt-1">
                        <p className="text-emerald-900 dark:text-emerald-200 font-semibold">
                          Customer: {linkedSale.customerName} ({linkedSale.customerPhone})
                        </p>
                        <p className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                          Invoice: {linkedSale.invoiceNo} &bull; Paid via {linkedSale.paymentMode}
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 text-[10px] mt-0.5">
                          Warranty: {linkedSale.warranty}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 italic">
                    Device is currently in shop showcase, available for sale.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Register Device to Inventory
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddManualItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samsung Galaxy A55 5G (8GB+128GB)"
                  value={newProduct}
                  onChange={e => setNewProduct(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand
                  </label>
                  <select
                    value={newBrand}
                    onChange={e => setNewBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Realme">Realme</option>
                    <option value="Boat">Boat</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Smartphones">Smartphones</option>
                    <option value="Audio">Audio</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  15-Digit IMEI or Serial <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 864902184920194"
                  value={newImei}
                  onChange={e => setNewImei(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newPurchasePrice}
                    onChange={e => setNewPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newSellingPrice}
                    onChange={e => setNewSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
