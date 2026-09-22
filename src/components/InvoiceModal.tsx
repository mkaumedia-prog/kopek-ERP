import React from 'react';
import { X, Printer, MessageSquare, Check, ShieldCheck } from 'lucide-react';
import { Sale, ShopSettings } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { buildCustomerInvoiceMessage, openWhatsAppDirect } from '../utils/whatsapp';

interface InvoiceModalProps {
  sale: Sale | null;
  shopSettings: ShopSettings;
  onClose: () => void;
  lang?: 'en' | 'hi';
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  sale,
  shopSettings,
  onClose,
  lang = 'en',
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const message = buildCustomerInvoiceMessage(sale, shopSettings);
    openWhatsAppDirect(sale.customerPhone, message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        id="invoice-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 transition-all"
      >
        {/* Modal Top Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {lang === 'hi' ? 'बिल तैयार है' : 'Invoice Generated'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {sale.invoiceNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              title="Share bill on WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
              title="Print Tax Invoice"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body (Visible in Print and View) */}
        <div id="printable-invoice" className="p-8 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 print:p-0 print:m-0 print:text-black">
          {/* Shop Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-blue-900 dark:text-blue-400 tracking-tight">
                  {shopSettings.shopName}
                </h1>
                {shopSettings.tagline && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {shopSettings.tagline}
                  </p>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-sm leading-relaxed">
                  {shopSettings.address}
                </p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
                  <span>Tel: {shopSettings.phone}</span>
                  {shopSettings.gst && <span>GSTIN: <b>{shopSettings.gst}</b></span>}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-black uppercase tracking-wider">
                  Tax Invoice / Cash Memo
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-2 font-mono">
                  {sale.invoiceNo}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Date: {formatDate(sale.date, true)}
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Bill Info */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs mb-6">
            <div>
              <span className="text-slate-400 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                Billed To (Customer):
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                {sale.customerName}
              </p>
              <p className="text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                Phone: {sale.customerPhone || 'Not Provided'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                Payment & Billing Details:
              </span>
              <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                Mode: <span className="font-bold text-emerald-600 dark:text-emerald-400">{sale.paymentMode}</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Billed By: {sale.createdBy}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {sale.product}
                    </div>
                    {sale.imei && sale.imei.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {sale.imei.map((im, idx) => (
                          <span
                            key={idx}
                            className="inline-block font-mono text-[11px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                          >
                            IMEI: {im}
                          </span>
                        ))}
                      </div>
                    )}
                    {sale.warranty && (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Warranty: {sale.warranty}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-medium">{sale.qty}</td>
                  <td className="py-3 px-3 text-right font-mono">{formatINR(sale.sellingPrice)}</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                    {sale.discount > 0 ? `-${formatINR(sale.discount)}` : '₹0'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatINR(sale.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Summary */}
          <div className="flex justify-between items-start gap-6 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Terms & Conditions:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Goods once sold will not be taken back without original invoice.</li>
                <li>Warranty claims handled by authorized brand service centers.</li>
                <li>Subject to local jurisdiction.</li>
              </ul>
            </div>

            <div className="w-56 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono">{formatINR(sale.sellingPrice * sale.qty)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatINR(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                <span>Grand Total:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base">
                  {formatINR(sale.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="mt-12 pt-6 border-t border-dashed border-slate-300 dark:border-slate-700 flex justify-between items-end text-xs text-slate-400">
            <div>
              <p className="text-[11px]">Thank you for your business!</p>
              <p className="text-[10px] text-slate-400">Customer Support: {shopSettings.phone}</p>
            </div>
            <div className="text-center">
              <div className="h-10 border-b border-slate-400 w-36 mb-1"></div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
