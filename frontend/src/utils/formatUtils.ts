/**
 * Formats a number as a currency string with 2 decimal places
 * Uses parentheses for negative numbers following accounting practices
 */
export const formatCurrency = (amount: number): string => {
  // Safety check for NaN or invalid values
  if (isNaN(amount) || !isFinite(amount)) {
    console.warn('⚠️ Invalid amount for currency formatting:', amount);
    return '$0.00';
  }
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
  
  // Use parentheses for negative numbers (accounting style)
  return amount < 0 ? `(${formatted})` : formatted;
};

/**
 * Formats a recurrence pattern from uppercase to title case
 * @param pattern - The recurrence pattern (e.g., "MONTHLY", "WEEKLY", "DAILY")
 * @returns Formatted pattern (e.g., "Monthly", "Weekly", "Daily")
 */
export const formatRecurrencePattern = (pattern: string): string => {
  if (!pattern) return '';
  
  // Convert to lowercase first, then capitalize first letter
  return pattern.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}; 