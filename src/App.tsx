import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sale,
  Purchase,
  InventoryItem,
  Expense,
  ShopSettings,
  User,
  Role,
} from './types';
import { Language } from './utils/i18n';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BillingView } from './components/BillingView';
import { PurchasesView } from './components/PurchasesView';
import { InventoryView } from './components/InventoryView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { WhatsAppView } from './components/WhatsAppView';
import { SettingsView } from './components/SettingsView';
import { InvoiceModal } from './components/InvoiceModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Loader2, RefreshCw } from 'lucide-react';

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'KOPEK MOBILES',
  tagline: 'Authorized Mobile Sales & Service Center',
  address: 'Shop #14, Ground Floor, Galaxy Mobile Plaza, MG Road, Pune, Maharashtra - 411001',
  phone: '9822019283',
  email: 'support@mobikartpune.in',
  gst: '27AABCM8291M1Z4',
  lowStockThreshold: 3,
  currencySymbol: '₹',
  whatsappNumbers: [
    { id: 'wa_1', name: 'Rahul Sharma', phone: '9822019283', role: 'Owner', enabled: true },
    { id: 'wa_2', name: 'Amit Kulkarni', phone: '9890123456', role: 'Partner', enabled: true },
    { id: 'wa_3', name: 'Sanjay Deshmukh (CA)', phone: '9422334455', role: 'Accountant', enabled: true },
  ],
  whatsappApiConfig: {
    phoneNumberId: '',
    accessToken: '',
    templateName: 'daily_shop_summary_v1',
    enabled: false,
    autoScheduleTime: '21:00',
    autoSendDailyReport: true,
  },
};

const DEFAULT_USER: User = {
  _id: 'usr_1',
  name: 'Rahul Sharma',
  email: 'rahul@mobikart.in',
  phone: '9822019283',
  role: 'owner',
  createdAt: new Date().toISOString(),
};

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // App Data State
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<User[]>([DEFAULT_USER]);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);

  // Status & Modal State
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<Sale | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Toast trigger
  const showToast = useCallback(
    (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      setToasts(prev => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch all initial data from server
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/all');
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      setSales(data.sales || []);
      setPurchases(data.purchases || []);
      setInventory(data.inventory || []);
      setExpenses(data.expenses || []);
      setShopSettings(data.settings || DEFAULT_SETTINGS);
      if (data.users && data.users.length > 0) {
        setUsers(data.users);
        setCurrentUser(prev => data.users.find((u: User) => u._id === prev._id) || data.users[0]);
      }
    } catch (err: any) {
      console.error('Failed to load store data:', err);
      setLoadError(err.message || 'Could not connect to backend server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculate Low Stock Count
  const lowStockCount = useMemo(() => {
    const threshold = shopSettings.lowStockThreshold || 3;
    const inStock = inventory.filter(i => i.status === 'in-stock');
    const counts: Record<string, number> = {};
    inStock.forEach(item => {
      counts[item.product] = (counts[item.product] || 0) + 1;
    });
    return Object.values(counts).filter(c => c <= threshold).length;
  }, [inventory, shopSettings.lowStockThreshold]);

  // Handler: Add Sale (POS)
  const handleAddSale = async (saleData: any): Promise<Sale> => {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Sale creation failed' }));
      throw new Error(err.error || 'Sale failed');
    }
    const data = await res.json();
    setSales(prev => [data.sale, ...prev]);
    // Refresh live inventory
    await fetchAllData();
    return data.sale;
  };

  // Handler: Delete Sale
  const handleDeleteSale = async (saleId: string) => {
    const res = await fetch(`/api/sales/${saleId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Could not delete sale');
    setSales(prev => prev.filter(s => s._id !== saleId));
    await fetchAllData();
    showToast('Sale Voided', 'The sale has been cancelled and items returned to stock', 'info');
  };

  // Handler: Add Purchase
  const handleAddPurchase = async (purchaseData: any) => {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData),
    });
    if (!res.ok) throw new Error('Failed to record purchase');
    await fetchAllData();
  };

  // Handler: Delete Purchase
  const handleDeletePurchase = async (id: string) => {
    const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete purchase');
    await fetchAllData();
    showToast('Purchase Deleted', 'Purchase and associated unsold inventory removed', 'info');
  };

  // Handler: Add Manual Inventory Item
  const handleAddInventoryItem = async (itemData: any) => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Inventory add failed' }));
      throw new Error(err.error || 'Failed to add item');
    }
    await fetchAllData();
  };

  // Handler: Add Expense
  const handleAddExpense = async (expenseData: any) => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });
    if (!res.ok) throw new Error('Failed to record expense');
    const data = await res.json();
    setExpenses(prev => [data.expense, ...prev]);
  };

  // Handler: Delete Expense
  const handleDeleteExpense = async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expense');
    setExpenses(prev => prev.filter(e => e._id !== id));
    showToast('Expense Deleted', 'Expense entry removed', 'info');
  };

  // Handler: Update Settings
  const handleUpdateSettings = async (newSettings: Partial<ShopSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (!res.ok) throw new Error('Failed to update shop settings');
    const data = await res.json();
    setShopSettings(data.settings);
  };

  // Handler: Add User
  const handleAddUser = async (userData: Partial<User>) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error('Failed to add staff member');
    const data = await res.json();
    setUsers(prev => [...prev, data.user]);
  };

  // Handler: Delete User
  const handleDeleteUser = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove staff member');
    setUsers(prev => prev.filter(u => u._id !== userId));
    showToast('Staff Removed', 'User has been removed', 'info');
  };

  // Handler: Change Password
  const handleChangePassword = async (userId: string, newPass: string) => {
    const res = await fetch(`/api/users/${userId}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: newPass }),
    });
    if (!res.ok) throw new Error('Failed to change password');
  };

  // Handler: Restore Backup
  const handleRestoreBackup = async (backupData: any) => {
    const res = await fetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData),
    });
    if (!res.ok) throw new Error('Backup restore failed');
    await fetchAllData();
  };

  // Handler: Reset Demo Data
  const handleResetDemoData = async () => {
    const res = await fetch('/api/reset-demo', { method: 'POST' });
    if (!res.ok) throw new Error('Reset failed');
    await fetchAllData();
    showToast('Reset Complete', 'Loaded sample iPhones, Galaxies & purchases', 'success');
  };

  // Quick Action Shortcuts from Dashboard
  const handleOpenNewSale = () => setActiveTab('sales');
  const handleOpenNewPurchase = () => setActiveTab('purchases');
  const handleOpenNewExpense = () => setActiveTab('expenses');
  const handleOpenWhatsAppShare = () => setActiveTab('whatsapp');

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-150`}>
      {/* Top Navigation Bar */}
      <Header
        shopSettings={shopSettings}
        currentUser={currentUser}
        users={users}
        onSwitchUser={user => {
          setCurrentUser(user);
          showToast('Switched User', `Active profile: ${user.name} (${user.role})`, 'info');
        }}
        lang={lang}
        onToggleLang={() => setLang(l => (l === 'en' ? 'hi' : 'en'))}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(d => !d)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        lowStockCount={lowStockCount}
        onNavigateTab={tab => setActiveTab(tab)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={tab => setActiveTab(tab)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          lang={lang}
          userRole={currentUser.role}
        />

        {/* Center Content Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">Connecting to Mobikart store database...</p>
            </div>
          ) : loadError ? (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 max-w-lg mx-auto text-center space-y-3 mt-12">
              <p className="font-bold text-base">Unable to connect to database</p>
              <p className="text-xs text-rose-600 dark:text-rose-300">{loadError}</p>
              <button
                onClick={fetchAllData}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  sales={sales}
                  purchases={purchases}
                  inventory={inventory}
                  expenses={expenses}
                  shopSettings={shopSettings}
                  lang={lang}
                  onNavigateTab={tab => setActiveTab(tab)}
                  onOpenNewSale={handleOpenNewSale}
                  onOpenNewPurchase={handleOpenNewPurchase}
                  onOpenNewExpense={handleOpenNewExpense}
                  onOpenWhatsAppShare={handleOpenWhatsAppShare}
                  onSelectSaleForInvoice={sale => setSelectedSaleForInvoice(sale)}
                />
              )}

              {activeTab === 'sales' && (
                <BillingView
                  sales={sales}
                  inventory={inventory}
                  shopSettings={shopSettings}
                  currentUserName={currentUser.name}
                  userRole={currentUser.role}
                  lang={lang}
                  onAddSale={handleAddSale}
                  onDeleteSale={handleDeleteSale}
                  onSelectSaleForInvoice={sale => setSelectedSaleForInvoice(sale)}
                  showToast={showToast}
                />
              )}

              {activeTab === 'purchases' && (
                <PurchasesView
                  purchases={purchases}
                  currentUserName={currentUser.name}
                  userRole={currentUser.role}
                  lang={lang}
                  onAddPurchase={handleAddPurchase}
                  onDeletePurchase={handleDeletePurchase}
                  showToast={showToast}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView
                  inventory={inventory}
                  sales={sales}
                  purchases={purchases}
                  shopSettings={shopSettings}
                  lang={lang}
                  onAddInventoryItem={handleAddInventoryItem}
                  showToast={showToast}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesView
                  expenses={expenses}
                  currentUserName={currentUser.name}
                  userRole={currentUser.role}
                  lang={lang}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                  showToast={showToast}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  sales={sales}
                  expenses={expenses}
                  inventory={inventory}
                  shopSettings={shopSettings}
                  lang={lang}
                  onOpenWhatsAppShare={handleOpenWhatsAppShare}
                />
              )}

              {activeTab === 'whatsapp' && (
                <WhatsAppView
                  sales={sales}
                  expenses={expenses}
                  inventory={inventory}
                  shopSettings={shopSettings}
                  lang={lang}
                  onUpdateSettings={handleUpdateSettings}
                  showToast={showToast}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  shopSettings={shopSettings}
                  users={users}
                  currentUser={currentUser}
                  lang={lang}
                  onUpdateSettings={handleUpdateSettings}
                  onAddUser={handleAddUser}
                  onDeleteUser={handleDeleteUser}
                  onChangePassword={handleChangePassword}
                  onRestoreBackup={handleRestoreBackup}
                  onResetDemoData={handleResetDemoData}
                  showToast={showToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Invoice Modal for Viewing & Printing Tax Bills */}
      <InvoiceModal
        sale={selectedSaleForInvoice}
        shopSettings={shopSettings}
        onClose={() => setSelectedSaleForInvoice(null)}
        lang={lang}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
