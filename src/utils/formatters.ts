/**
 * SpendIntel Formatting Utilities
 * Standardizes Indian Rupee (₹) presentation, Lakhs, Crores, and percentages.
 */

export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

export function formatCompactINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  const abs = Math.abs(val);
  if (abs >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `₹${(val / 1000).toFixed(1)} K`;
  }
  return `₹${Math.round(val)}`;
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.00%';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
}
