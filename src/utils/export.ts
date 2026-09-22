// Export utilities for Excel (CSV) and Printable reports
import { Sale, Purchase, InventoryItem, Expense } from '../types';
import { formatDate } from './formatters';

export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row
      .map(val => {
        const str = String(val ?? '');
        // Escape double quotes by doubling them
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(',');
  };

  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSalesCSV(sales: Sale[]) {
  const headers = [
    'Invoice No',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Product',
    'Brand',
    'IMEI / Serial',
    'Quantity',
    'Selling Price (₹)',
    'Discount (₹)',
    'Total Amount (₹)',
    'Profit (₹)',
    'Payment Mode',
    'Warranty',
    'Billed By',
    'Notes',
  ];

  const rows = sales.map(s => [
    s.invoiceNo,
    formatDate(s.date),
    s.customerName,
    s.customerPhone,
    s.product,
    s.brand || '',
    (s.imei || []).join(' | '),
    s.qty,
    s.sellingPrice,
    s.discount,
    s.total,
    s.profit,
    s.paymentMode,
    s.warranty,
    s.createdBy,
    s.notes || '',
  ]);

  exportToCSV(`Sales_Report_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
}

export function exportInventoryCSV(inventory: InventoryItem[]) {
  const headers = [
    'Product Name',
    'Brand',
    'Category',
    'IMEI / Serial Number',
    'Status',
    'Purchase Cost (₹)',
    'Selling Price (₹)',
    'Added Date',
    'Sold Date',
  ];

  const rows = inventory.map(i => [
    i.product,
    i.brand,
    i.category,
    i.imei,
    i.status.toUpperCase(),
    i.purchasePrice,
    i.sellingPrice,
    formatDate(i.addedDate),
    i.soldDate ? formatDate(i.soldDate) : '-',
  ]);

  exportToCSV(`Inventory_Stock_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
}

export function exportPurchasesCSV(purchases: Purchase[]) {
  const headers = [
    'Purchase ID',
    'Date',
    'Supplier',
    'Product',
    'Brand',
    'Quantity',
    'Cost per Unit (₹)',
    'Total Amount (₹)',
    'Payment Mode',
    'Supplier Invoice',
    'IMEI List',
    'Recorded By',
  ];

  const rows = purchases.map(p => [
    p._id,
    formatDate(p.date),
    p.supplier,
    p.product,
    p.brand || '',
    p.qty,
    p.price,
    p.total,
    p.paymentMode,
    p.invoiceNo,
    (p.imei || []).join(' | '),
    p.createdBy,
  ]);

  exportToCSV(`Purchases_Report_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
}

export function exportExpensesCSV(expenses: Expense[]) {
  const headers = [
    'Date',
    'Category',
    'Amount (₹)',
    'Payment Mode',
    'Description',
    'Recorded By',
  ];

  const rows = expenses.map(e => [
    formatDate(e.date),
    e.category,
    e.amount,
    e.paymentMode,
    e.description,
    e.createdBy,
  ]);

  exportToCSV(`Expenses_Report_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
}
