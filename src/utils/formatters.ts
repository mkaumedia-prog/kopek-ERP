// Indian currency formatter (e.g. ₹1,50,000)
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format numbers without currency symbol using Indian grouping
export function formatIndianNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

// Format date to Indian standard readable string (e.g. 18 Sep 2026, 07:30 PM)
export function formatDate(dateString: string, includeTime = false): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
    });
  } catch {
    return dateString;
  }
}

// Generate invoice number (e.g. INV-202609-0012)
export function generateInvoiceNo(count: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${seq}`;
}
