/**
 * Formats currency values in Nigerian Naira (₦)
 */
export function formatMoney(amount) {
  const num = Number(amount || 0);
  return '₦' + num.toLocaleString('en-NG');
}

/**
 * Formats ISO date strings to readable local formats
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
