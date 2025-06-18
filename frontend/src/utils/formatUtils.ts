/**
 * Formats a number as a currency string with 2 decimal places
 * Uses parentheses for negative numbers following accounting practices
 */
export const formatCurrency = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
  
  // Use parentheses for negative numbers (accounting style)
  return amount < 0 ? `(${formatted})` : formatted;
}; 