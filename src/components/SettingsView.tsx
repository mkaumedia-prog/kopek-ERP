import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Users,
  Database,
  Lock,
  Phone,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ShopSettings, WhatsAppContact, User, Role } from '../types';
import { translations, Language } from '../utils/i18n';

interface SettingsViewProps {
  shopSettings: ShopSettings;
  users: User[];
  currentUser: User;
  lang: Language;
  onUpdateSettings: (newSettings: Partial<ShopSettings>) => Promise<void>;
  onAddUser: (user: Partial<User>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onChangePassword: (userId: string, newPass: string) => Promise<void>;
  onRestoreBackup: (backupData: any) => Promise<void>;
  onResetDemoData: () => Promise<void>;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  shopSettings,
  users,
  currentUser,
  lang,
  onUpdateSettings,
  onAddUser,
  onDeleteUser,
  onChangePassword,
  onRestoreBackup,
  onResetDemoData,
  showToast,
}) => {
  const t = translations[lang];

  // Active section inside Settings
  const [activeSection, setActiveSection] = useState<'profile' | 'whatsapp' | 'users' | 'backup' | 'password'>('profile');

  // Profile Form
  const [shopName, setShopName] = useState(shopSettings.shopName || '');
  const [tagline, setTagline] = useState(shopSettings.tagline || '');
  const [address, setAddress] = useState(shopSettings.address || '');
  const [phone, setPhone] = useState(shopSettings.phone || '');
  const [email, setEmail] = useState(shopSettings.email || '');
  const [gst, setGst] = useState(shopSettings.gst || '');
  const [lowStockThreshold, setLowStockThreshold] = useState(shopSettings.lowStockThreshold || 3);

  // New WhatsApp Contact form
  const [newWaName, setNewWaName] = useState('');
  const [newWaPhone, setNewWaPhone] = useState('');
  const [newWaRole, setNewWaRole] = useState<WhatsAppContact['role']>('Partner');

  // New User form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('staff');
  const [newUserPass, setNewUserPass] = useState('password123');

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // File upload input ref for JSON restore
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateSettings({
        shopName: shopName.trim(),
        tagline: tagline.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gst: gst.trim(),
        lowStockThreshold: Number(lowStockThreshold) || 3,
      });
      showToast('Settings Saved', 'Shop profile details updated successfully', 'success');
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  // Add WhatsApp Contact
  const handleAddWaContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaName.trim() || !newWaPhone.trim()) {
      showToast('Error', 'Name and Phone number are required', 'error');
      return;
    }

    const updatedNumbers: WhatsAppContact[] = [
      ...shopSettings.whatsappNumbers,
      {
        id: 'wa_' + Date.now(),
        name: newWaName.trim(),
        phone: newWaPhone.trim().replace(/[^0-9]/g, ''),
        role: newWaRole,
        enabled: true,
      },
    ];

    try {
      await onUpdateSettings({ whatsappNumbers: updatedNumbers });
      showToast('Contact Added', `${newWaName} added to WhatsApp delivery list`, 'success');
      setNewWaName('');
      setNewWaPhone('');
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  // Toggle contact enabled/disabled
  const handleToggleContact = async (id: string) => {
    const updated = shopSettings.whatsappNumbers.map(c =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    );
    await onUpdateSettings({ whatsappNumbers: updated });
  };

  // Remove WhatsApp contact
  const handleRemoveContact = async (id: string) => {
    const updated = shopSettings.whatsappNumbers.filter(c => c.id !== id);
    await onUpdateSettings({ whatsappNumbers: updated });
    showToast('Contact Removed', 'Recipient removed from list', 'info');
  };

  // Add Staff User
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Error', 'Name and email are required', 'error');
      return;
    }

    try {
      await onAddUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        phone: newUserPhone.trim(),
        role: newUserRole,
        password: newUserPass || 'password123',
      });
      showToast('User Created', `${newUserName} added with ${newUserRole} role`, 'success');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  // Change Password
  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      showToast('Error', 'Password must be at least 4 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Error', 'Passwords do not match', 'error');
      return;
    }

    try {
      await onChangePassword(currentUser._id, newPassword);
      showToast('Password Changed', 'Your password was updated successfully', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  // Download full JSON backup
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/all');
      const data = await res.json();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mobikart_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup Downloaded', 'All database collections saved as JSON file', 'success');
    } catch (err: any) {
      showToast('Backup Failed', err.message, 'error');
    }
  };

  // Upload JSON restore
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        await onRestoreBackup(parsed);
        showToast('Database Restored', 'All shop collections restored from backup JSON', 'success');
      } catch (err: any) {
        showToast('Restore Failed', 'Invalid JSON backup file format', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t.settings} &amp; Shop Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure shop invoice details, WhatsApp automated delivery, staff roles, and data backup
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSection('profile')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>{t.shopProfile}</span>
        </button>

        <button
          onClick={() => setActiveSection('whatsapp')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'whatsapp'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Phone className="w-4 h-4 text-emerald-500" />
          <span>WhatsApp Report Delivery</span>
        </button>

        <button
          onClick={() => setActiveSection('users')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.userManagement}</span>
        </button>

        <button
          onClick={() => setActiveSection('backup')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'backup'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup &amp; Restore</span>
        </button>

        <button
          onClick={() => setActiveSection('password')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'password'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </div>

      {/* SECTION 1: SHOP PROFILE */}
      {activeSection === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-2xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Invoice Header &amp; Business Information
          </h2>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Shop Name (appears on print invoice &amp; WhatsApp bills) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Shop Tagline / Slogan
            </label>
            <input
              type="text"
              placeholder="e.g. Authorized Mobile Sales & Service Center"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Shop Physical Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN Number (for Tax Invoices)
              </label>
              <input
                type="text"
                placeholder="e.g. 27AAACG0123M1Z5"
                value={gst}
                onChange={e => setGst(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold uppercase outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Low Stock Alert Threshold (units remaining)
            </label>
            <input
              type="number"
              min="1"
              value={lowStockThreshold}
              onChange={e => setLowStockThreshold(Number(e.target.value))}
              className="w-32 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              When remaining units of any model drop to or below this number, warning alerts will appear on your dashboard.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: WHATSAPP RECIPIENTS */}
      {activeSection === 'whatsapp' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-2xl space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              WhatsApp Report Delivery Numbers
            </h2>
            <p className="text-slate-500 text-[11px]">
              Daily business summaries, profits, and cash receipts will be shared with these recipients.
            </p>
          </div>

          {/* List */}
          <div className="space-y-2.5">
            {shopSettings.whatsappNumbers.map(contact => (
              <div
                key={contact.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={contact.enabled}
                    onChange={() => handleToggleContact(contact.id)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    title="Enable/disable this recipient"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{contact.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                        {contact.role}
                      </span>
                    </div>
                    <p className="text-slate-500 font-mono text-[11px]">+91 {contact.phone}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveContact(contact.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Contact Form */}
          <form onSubmit={handleAddWaContact} className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white">+ Add Recipient (Partner, Accountant, Manager)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                placeholder="Contact Name"
                value={newWaName}
                onChange={e => setNewWaName(e.target.value)}
                required
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
              <input
                type="tel"
                placeholder="10-digit Phone"
                value={newWaPhone}
                onChange={e => setNewWaPhone(e.target.value)}
                required
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
              />
              <select
                value={newWaRole}
                onChange={e => setNewWaRole(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                <option value="Partner">Partner</option>
                <option value="Accountant">Accountant (CA)</option>
                <option value="Owner">Owner</option>
                <option value="Manager">Manager</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Add to Delivery List
            </button>
          </form>
        </div>
      )}

      {/* SECTION 3: USER & STAFF MANAGEMENT */}
      {activeSection === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-2xl space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Active Counter Staff &amp; Store Managers ({users.length})
            </h2>
            <p className="text-slate-500 text-[11px]">
              Control employee access roles: Staff (Billing only), Owner/Admin (Full Access)
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {users.map(u => (
              <div key={u._id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      {u.role}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{u.email} {u.phone && `• ${u.phone}`}</p>
                </div>

                {users.length > 1 && u._id !== currentUser._id && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove staff ${u.name}?`)) onDeleteUser(u._id);
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Staff Form */}
          <form onSubmit={handleAddStaff} className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white">+ Add New Staff Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Full Name"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                required
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                required
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newUserPhone}
                onChange={e => setNewUserPhone(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
              />
              <select
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value as Role)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                <option value="staff">Staff (Billing &amp; Stock)</option>
                <option value="admin">Admin / Accountant</option>
                <option value="owner">Store Owner</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Add Staff Member
            </button>
          </form>
        </div>
      )}

      {/* SECTION 4: BACKUP & RESTORE */}
      {activeSection === 'backup' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-2xl space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Data Security &amp; Backup
            </h2>
            <p className="text-slate-500 text-[11px]">
              Export complete store ledger, purchases, sales, IMEIs, and receipts to a local JSON file, or restore existing data.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Download Full Backup (JSON)</p>
              <p className="text-slate-500 text-[11px]">Saves users, sales, inventory, purchases, expenses &amp; settings</p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Restore from Backup File</p>
              <p className="text-slate-500 text-[11px]">Upload a previously downloaded Mobikart JSON backup</p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload JSON</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">Reset to Demo Sample Data</p>
              <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                Restores standard mock handsets (iPhone 15, S24, OnePlus 12R), purchases, and sample sales.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('Reset all data to sample demo phones and invoices?')) {
                  onResetDemoData();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5: CHANGE PASSWORD */}
      {activeSection === 'password' && (
        <form onSubmit={handleChangePass} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-md space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Change Password for {currentUser.name}
          </h2>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="At least 4 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            Update Password
          </button>
        </form>
      )}
    </div>
  );
};
