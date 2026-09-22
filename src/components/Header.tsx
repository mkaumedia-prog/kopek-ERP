import React from 'react';
import { Menu, Moon, Sun, Globe, Bell, User as UserIcon, ShieldAlert } from 'lucide-react';
import { User, ShopSettings } from '../types';
import { translations, Language } from '../utils/i18n';

interface HeaderProps {
  shopSettings: ShopSettings;
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  lang: Language;
  onToggleLang: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleMobileMenu: () => void;
  lowStockCount: number;
  onNavigateTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  shopSettings,
  currentUser,
  users,
  onSwitchUser,
  lang,
  onToggleLang,
  darkMode,
  onToggleDarkMode,
  onToggleMobileMenu,
  lowStockCount,
  onNavigateTab,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-16 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors">
      {/* Left: Mobile hamburger + Shop Identity */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-blue-700 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
              {shopSettings.shopName || t.appName}
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Live ERP
            </span>
          </div>
          <span className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-sm">
            {shopSettings.address}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Low Stock Warning Icon */}
        {lowStockCount > 0 && (
          <button
            id="low-stock-alert-header-btn"
            onClick={() => onNavigateTab('inventory')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
            title={`${lowStockCount} items have low stock`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">{t.lowStockAlerts}:</span>
            <span className="font-bold">{lowStockCount}</span>
          </button>
        )}

        {/* Language Bilingual Toggle */}
        <button
          id="lang-toggle-btn"
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Toggle English / Hindi"
        >
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
        </button>

        {/* Dark Mode Switch */}
        <button
          id="dark-mode-toggle-btn"
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Switcher Dropdown */}
        <div className="relative flex items-center pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center justify-center font-bold text-xs uppercase">
              {currentUser.name.slice(0, 2)}
            </div>
            <div className="hidden sm:block text-left">
              <select
                id="active-user-select"
                value={currentUser._id}
                onChange={e => {
                  const selected = users.find(u => u._id === e.target.value);
                  if (selected) onSwitchUser(selected);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer pr-1"
              >
                {users.map(u => (
                  <option key={u._id} value={u._id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 capitalize">
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
