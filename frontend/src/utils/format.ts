// src/utils/format.ts
export const formatCurrency = (value: number | null | undefined) => {
  if (value == null) return "$0.00";
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};
