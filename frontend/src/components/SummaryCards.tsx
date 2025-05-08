import { useEffect, useState } from "react";
import axios from "@/utils/axios";
import { formatCurrency } from "@/utils/format";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";

interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

const SummaryCards = () => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/reports/income-statement");
        setData(res.data);
      } catch (err: any) {
        console.error("❌ Fetch error:", err.response ?? err.message);
        setError(
          err.response?.data?.message || "Failed to fetch income statement data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" mt={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" mt={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  const items = [
    { label: "Income", value: data.totalIncome, icon: "💰" },
    { label: "Expenses", value: data.totalExpenses, icon: "💸" },
    { label: "Net Income", value: data.netIncome, icon: "📊" },
  ];

  return (
    <Box mt={3} display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={3}>
      {items.map(({ label, value, icon }) => (
        <Card key={label} sx={{ textAlign: "center", p: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {icon} {label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 1, color: "#1a2b4c" }}>
              {formatCurrency(value)}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default SummaryCards;
