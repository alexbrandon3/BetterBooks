import React from "react";

interface AmountProps {
  value?: number;
  fallback?: string;
  color?: "default" | "positive" | "negative";
  bold?: boolean;
}

const Amount: React.FC<AmountProps> = ({
  value,
  fallback = "$0.00",
  color = "default",
  bold = false,
}) => {
  const formatted =
    typeof value === "number" ? `$${value.toFixed(2)}` : fallback;

  let textColor = "#1a2b4c";
  if (color === "positive") textColor = "green";
  if (color === "negative") textColor = "crimson";

  return (
    <span
      style={{
        fontWeight: bold ? 600 : 400,
        color: textColor,
      }}
    >
      {formatted}
    </span>
  );
};

export default Amount;
