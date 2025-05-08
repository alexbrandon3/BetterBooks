import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/utils/axios";
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from "@mui/material";
import { Replay, SyncAlt } from "@mui/icons-material";
import Amount from "@/components/Amount";
import SummaryCards from "@/components/SummaryCards";

interface IncomeStatement {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  startDate: string;
  endDate: string;
}

interface BalanceSheet {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  assetsMinusLiabilities: number;
}

interface RecurringPreview {
  description: string;
  amount: number;
  nextRun: string;
}

interface TransactionEntry {
  amount: number;
  account: { name: string };
}

interface Transaction {
  id: string;
  description: string;
  amount: number | null;
  type: string;
  createdAt: string;
  entries?: TransactionEntry[];
  account?: { name: string };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [recurring, setRecurring] = useState<RecurringPreview[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incomeRes, balanceRes, recurringRes, userRes, txRes] =
          await Promise.all([
            axios.get("/reports/income-statement"),
            axios.get("/reports/balance-sheet"),
            axios.get("/recurring/preview"),
            axios.get("/auth/me"),
            axios.get("/transactions"),
          ]);

        if (Array.isArray(txRes.data)) {
          setTransactions(txRes.data);
        } else {
          console.warn("⚠️ Transactions response was not an array", txRes.data);
          setTransactions([]);
        }

        setData(incomeRes.data);
        setBalanceSheet(balanceRes.data);
        setRecurring(recurringRes.data);
        setUserEmail(userRes.data.email);
      } catch (err: any) {
        console.error("Fetch error:", err.response ?? err.message);
        setError(
          err.response?.data?.message || "Failed to fetch dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box mt={10} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={8}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const balanceStats = balanceSheet
    ? [
        {
          title: "Total Assets",
          value: <Amount value={balanceSheet.totalAssets} />,
        },
        {
          title: "Total Liabilities",
          value: <Amount value={balanceSheet.totalLiabilities} />,
        },
        {
          title: "Total Equity",
          value: <Amount value={balanceSheet.totalEquity} />,
        },
        {
          title: "Assets – Liabilities",
          value: <Amount value={balanceSheet.assetsMinusLiabilities} />,
        },
      ]
    : [];

  return (
    <Box p={4} sx={{ backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      {userEmail && (
        <Box mb={2} textAlign="right">
          <Chip
            label={`Logged in as ${userEmail}`}
            sx={{
              backgroundColor: "#e0e7ff",
              color: "#1a2b4c",
              fontWeight: 500,
            }}
          />
        </Box>
      )}

      <Typography
        variant="h4"
        gutterBottom
        sx={{ color: "#1a2b4c", fontWeight: 600 }}
      >
        Dashboard
      </Typography>

      <Box mt={2}>
        <SummaryCards />
      </Box>

      <Grid container spacing={4} mt={1}>
        {balanceStats.map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: "white",
                textAlign: "center",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {item.title}
              </Typography>
              <Typography variant="h6" sx={{ color: "#1a2b4c", mt: 1 }}>
                {item.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid item xs={12} md={6} mt={4}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <SyncAlt sx={{ mr: 1, color: "#1a2b4c" }} />
            <Typography variant="h6" sx={{ color: "#1a2b4c" }}>
              Recent Transactions
            </Typography>
          </Box>
          {transactions.length === 0 ? (
            <Typography color="text.secondary">No transactions yet.</Typography>
          ) : (
            <List>
              {transactions.slice(0, 5).map((tx) => (
                <ListItem key={tx.id} sx={{ py: 1 }}>
                  <ListItemText
                    primary={tx.description}
                    secondary={`Amount: ${
                      tx.amount ? `$${tx.amount.toFixed(2)}` : "N/A"
                    } - Date: ${new Date(tx.createdAt).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Grid>
    </Box>
  );
};

export default Dashboard;
