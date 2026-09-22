import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  ShoppingBag,
  Smartphone,
  Wallet,
  BarChart3,
  MessageCircle,
  Settings as SettingsIcon,
  X,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { translations, Language } from '../utils/i18n';
import { Role } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  lang: Language;
  userRole: Role;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  lang,
  userRole,
}) => {
  const t = translations[lang];

  const navItems = [
    {
      id: 'dashboard',
      label: t.dashboard,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'sales',
      label: t.sales,
      icon: ReceiptText,
      badge: 'POS',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'purchases',
      label: t.purchases,
      icon: ShoppingBag,
      badge: null,
    },
    {
      id: 'inventory',
      label: t.inventory,
      icon: Smartphone,
      badge: null,
    },
    {
      id: 'expenses',
      label: t.expenses,
      icon: Wallet,
      badge: null,
    },
    {
      id: 'reports',
      label: t.reports,
      icon: BarChart3,
      badge: 'P&L',
    },
    {
      id: 'whatsapp',
      label: t.whatsapp,
      icon: MessageCircle,
      badge: 'Meta',
      color: 'text-emerald-500',
    },
    {
      id: 'settings',
      label: t.settings,
      icon: SettingsIcon,
      badge: null,
    },
  ];

  const handleItemClick = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } border-r border-slate-800 shadow-2xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-wide">
                MOBIKART
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                {lang === 'hi' ? 'दुकान ईआरपी' : 'Shop ERP v2.6'}
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-900/30 font-bold translate-x-1'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-white' : item.color || 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-emerald-400 border border-emerald-900/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Role Information */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Role: <strong className="text-white capitalize">{userRole}</strong>
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Indian GST &amp; Multi-IMEI Compliant
          </p>
        </div>
      </aside>
    </>
  );
};
