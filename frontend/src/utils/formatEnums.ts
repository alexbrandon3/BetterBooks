/**
 * Formats an enum value into a human-readable string.
 * Example: "CASH_AND_CASH_EQUIVALENTS" becomes "Cash And Cash Equivalents"
 * @param value The enum value to format
 * @returns Formatted string or "—" if value is falsy
 */
export const formatEnum = (value: string | undefined | null): string => {
  if (!value) return "—";
  
  return value
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}; 