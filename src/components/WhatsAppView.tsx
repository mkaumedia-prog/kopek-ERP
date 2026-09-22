import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  Send,
  Users,
  Settings,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  PhoneCall,
} from 'lucide-react';
import { Sale, Expense, InventoryItem, ShopSettings, WhatsAppContact } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { buildDailyReportMessage, openWhatsAppDirect } from '../utils/whatsapp';
import { translations, Language } from '../utils/i18n';

interface WhatsAppViewProps {
  sales: Sale[];
  expenses: Expense[];
  inventory: InventoryItem[];
  shopSettings: ShopSettings;
  lang: Language;
  onUpdateSettings: (newSettings: Partial<ShopSettings>) => Promise<void>;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const WhatsAppView: React.FC<WhatsAppViewProps> = ({
  sales,
  expenses,
  inventory,
  shopSettings,
  lang,
  onUpdateSettings,
  showToast,
}) => {
  const t = translations[lang];

  // Active sub-tab: 'modeA' (Direct WhatsApp) vs 'modeB' (Meta Cloud API & Scheduler)
  const [activeMode, setActiveMode] = useState<'modeA' | 'modeB'>('modeA');

  // Custom recipient phone
  const [customPhone, setCustomPhone] = useState('');

  // Mode B Form State
  const [phoneNumberId, setPhoneNumberId] = useState(
    shopSettings.whatsappApiConfig?.phoneNumberId || ''
  );
  const [accessToken, setAccessToken] = useState(
    shopSettings.whatsappApiConfig?.accessToken || ''
  );
  const [templateName, setTemplateName] = useState(
    shopSettings.whatsappApiConfig?.templateName || 'daily_shop_summary_v1'
  );
  const [autoScheduleTime, setAutoScheduleTime] = useState(
    shopSettings.whatsappApiConfig?.autoScheduleTime || '21:00'
  );
  const [autoSendDailyReport, setAutoSendDailyReport] = useState(
    shopSettings.whatsappApiConfig?.autoSendDailyReport ?? true
  );
  const [isCloudApiEnabled, setIsCloudApiEnabled] = useState(
    shopSettings.whatsappApiConfig?.enabled ?? false
  );
  const [isTestingBroadcast, setIsTestingBroadcast] = useState(false);
  const [dispatchLog, setDispatchLog] = useState<any>(null);

  // Today calculations for the pre-filled message
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySalesList = sales.filter(s => s.date === todayStr);
  const totalSales = todaySalesList.reduce((acc, s) => acc + s.total, 0);
  const totalProfit = todaySalesList.reduce((acc, s) => acc + s.profit, 0);
  const cashTotal = todaySalesList.filter(s => s.paymentMode === 'Cash').reduce((acc, s) => acc + s.total, 0);
  const upiTotal = todaySalesList.filter(s => s.paymentMode === 'UPI').reduce((acc, s) => acc + s.total, 0);
  const cardTotal = todaySalesList.filter(s => s.paymentMode === 'Card' || s.paymentMode === 'Bank Transfer').reduce((acc, s) => acc + s.total, 0);
  const todayExpensesList = expenses.filter(e => e.date === todayStr);
  const totalExpenses = todayExpensesList.reduce((acc, e) => acc + e.amount, 0);

  // Top products sold today
  const topProductsMap: Record<string, number> = {};
  todaySalesList.forEach(s => {
    topProductsMap[s.product] = (topProductsMap[s.product] || 0) + s.qty;
  });
  const topProducts = Object.entries(topProductsMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Low stock
  const inStockItems = inventory.filter(i => i.status === 'in-stock');
  const countMap: Record<string, number> = {};
  inStockItems.forEach(i => {
    countMap[i.product] = (countMap[i.product] || 0) + 1;
  });
  const lowStockThreshold = shopSettings.lowStockThreshold || 3;
  const lowStockCount = Object.values(countMap).filter(c => c <= lowStockThreshold).length;

  // Live generated WhatsApp Message
  const dailyMessage = useMemo(() => {
    return buildDailyReportMessage({
      shopSettings,
      dateStr: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      totalSales,
      salesCount: todaySalesList.length,
      totalProfit,
      cashTotal,
      upiTotal,
      cardTotal,
      topProducts,
      lowStockCount,
      totalExpenses,
    });
  }, [
    shopSettings,
    totalSales,
    todaySalesList.length,
    totalProfit,
    cashTotal,
    upiTotal,
    cardTotal,
    topProducts,
    lowStockCount,
    totalExpenses,
  ]);

  // Direct send to saved contact
  const handleSendToContact = (contact: WhatsAppContact) => {
    openWhatsAppDirect(contact.phone, dailyMessage);
    showToast('Opening WhatsApp', `Preparing daily report for ${contact.name}`, 'info');
  };

  // Direct send to custom number
  const handleSendToCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhone.trim()) {
      showToast('Error', 'Please enter a 10-digit mobile number', 'error');
      return;
    }
    openWhatsAppDirect(customPhone.trim(), dailyMessage);
    showToast('Opening WhatsApp', `Sending report to ${customPhone}`, 'info');
  };

  // Copy report text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(dailyMessage);
    showToast('Copied to Clipboard', 'Report message copied. You can paste anywhere in WhatsApp.', 'success');
  };

  // Save Mode B Cloud API Settings
  const handleSaveCloudConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateSettings({
        whatsappApiConfig: {
          phoneNumberId: phoneNumberId.trim(),
          accessToken: accessToken.trim(),
          templateName: templateName.trim(),
          enabled: isCloudApiEnabled,
          autoScheduleTime,
          autoSendDailyReport,
        },
      });
      showToast('Settings Saved', 'Meta WhatsApp Cloud API settings updated successfully', 'success');
    } catch (err: any) {
      showToast('Save Failed', err.message, 'error');
    }
  };

  // Test broadcast dispatch via Server API
  const handleTestBroadcast = async () => {
    setIsTestingBroadcast(true);
    try {
      const activePhones = shopSettings.whatsappNumbers
        .filter(w => w.enabled)
        .map(w => w.phone);

      const res = await fetch('/api/whatsapp/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: activePhones,
          messageBody: dailyMessage,
          mode: isCloudApiEnabled ? 'cloud_api' : 'simulation',
        }),
      });

      const data = await res.json();
      setDispatchLog(data.dispatchLog);
      showToast('Broadcast Dispatched', data.message, 'success');
    } catch (err: any) {
      showToast('Broadcast Error', err.message, 'error');
    } finally {
      setIsTestingBroadcast(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
            <span>{t.whatsapp} Module</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deliver daily business summaries, cash collections, and profits to owners, partners &amp; accountant
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveMode('modeA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'modeA'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Mode A: Click-to-Chat (wa.me)
          </button>
          <button
            onClick={() => setActiveMode('modeB')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'modeB'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Mode B: Meta Cloud API (Auto-Schedule)
          </button>
        </div>
      </div>

      {activeMode === 'modeA' ? (
        /* MODE A: DIRECT WHATSAPP */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Message Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pre-filled Daily Summary Message
                  </h3>
                </div>
                <button
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>
              </div>

              {/* WhatsApp Styled Chat Box */}
              <div className="rounded-xl p-4 bg-[#e5ddd5] dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 font-sans text-xs shadow-inner">
                <div className="bg-white dark:bg-slate-800/95 p-3.5 rounded-xl shadow-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed max-w-md border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                  {dailyMessage}
                </div>
                <p className="text-[10px] text-slate-500 text-right mt-1 font-mono">
                  {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>Calculated automatically from today&apos;s bills &amp; expenses</span>
                <button
                  onClick={() => openWhatsAppDirect('', dailyMessage)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open WhatsApp App</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Send to Saved Contacts (Owner, Partner, Accountant) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Send to Saved Shop Contacts (1-Click)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Click any partner or accountant below to instantly launch WhatsApp with today&apos;s formatted business report:
              </p>

              <div className="space-y-2.5">
                {shopSettings.whatsappNumbers.map(contact => (
                  <div
                    key={contact.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {contact.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                          {contact.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        +91 {contact.phone}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSendToContact(contact)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom Number Input */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Send to any other mobile number:
                </h4>
                <form onSubmit={handleSendToCustom} className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Enter 10-digit phone (e.g. 9811223344)"
                    value={customPhone}
                    onChange={e => setCustomPhone(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE B: ADVANCED META WHATSAPP CLOUD API */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <Settings className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Meta WhatsApp Cloud API Configuration
                </h2>
                <p className="text-xs text-slate-500">
                  Connect official Meta Graph API to automatically broadcast reports at 9:00 PM
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCloudConfig} className="space-y-4 text-xs">
              {/* Enable Cloud API Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Enable WhatsApp Cloud API Integration
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Uses Meta Business Manager Graph API endpoints
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isCloudApiEnabled}
                  onChange={e => setIsCloudApiEnabled(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meta Phone Number ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 109823475928371"
                  value={phoneNumberId}
                  onChange={e => setPhoneNumberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meta System User Permanent Access Token
                </label>
                <input
                  type="password"
                  placeholder="EAAG... (Stored securely server-side)"
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Message Template
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Daily Schedule Time
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <input
                      type="time"
                      value={autoScheduleTime}
                      onChange={e => setAutoScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Auto schedule toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="auto-send-toggle"
                  checked={autoSendDailyReport}
                  onChange={e => setAutoSendDailyReport(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="auto-send-toggle" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Auto-schedule daily business report every night at 9:00 PM to all saved contacts
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm"
                >
                  Save API Configuration
                </button>
              </div>
            </form>
          </div>

          {/* Mode B Test Dispatch & Recipient Monitor */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                Simulate / Test Cloud Broadcast
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Trigger an automated dispatch to all enabled shop contacts right now:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-4 text-xs space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Target Recipients ({shopSettings.whatsappNumbers.filter(w => w.enabled).length}):
                </p>
                <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-0.5">
                  {shopSettings.whatsappNumbers.filter(w => w.enabled).map(w => (
                    <li key={w.id}>
                      {w.name} ({w.role}): <span className="font-mono">{w.phone}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleTestBroadcast}
                disabled={isTestingBroadcast}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isTestingBroadcast ? 'Dispatching Broadcast...' : 'Test Send 9 PM Report Now'}</span>
              </button>

              {/* Status Output */}
              {dispatchLog && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Broadcast Sent Successfully</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    Status: {dispatchLog.status} &bull; Timestamp: {new Date(dispatchLog.timestamp).toLocaleTimeString('en-IN')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
