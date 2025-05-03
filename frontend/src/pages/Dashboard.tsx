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
import {
  AccountBalance,
  TrendingUp,
  Receipt,
  Replay,
} from "@mui/icons-material";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [recurring, setRecurring] = useState<RecurringPreview[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [incomeRes, balanceRes, recurringRes, userRes] =
          await Promise.all([
            axios.get("/reports/income-statement", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("/reports/balance-sheet", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("/recurring/preview", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        setData(incomeRes.data);
        setBalanceSheet(balanceRes.data);
        setRecurring(recurringRes.data);
        setUserEmail(userRes.data.email);
      } catch (err: any) {
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

  const stats = [
    {
      title: "Net Income",
      value: `$${data?.netIncome.toFixed(2)}`,
      icon: <AccountBalance />,
    },
    {
      title: "Total Income",
      value: `$${data?.totalIncome.toFixed(2)}`,
      icon: <TrendingUp />,
    },
    {
      title: "Total Expenses",
      value: `$${data?.totalExpenses.toFixed(2)}`,
      icon: <Receipt />,
    },
  ];

  const balanceStats = balanceSheet
    ? [
        {
          title: "Total Assets",
          value: `$${balanceSheet.totalAssets.toFixed(2)}`,
        },
        {
          title: "Total Liabilities",
          value: `$${balanceSheet.totalLiabilities.toFixed(2)}`,
        },
        {
          title: "Total Equity",
          value: `$${balanceSheet.totalEquity.toFixed(2)}`,
        },
        {
          title: "Assets – Liabilities",
          value: `$${balanceSheet.assetsMinusLiabilities.toFixed(2)}`,
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

      <Grid container spacing={4}>
        {stats.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderRadius: 3,
                backgroundColor: "white",
              }}
            >
              <Box
                sx={{
                  mb: 2,
                  bgcolor: "#1a2b4c",
                  color: "white",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: 2,
                }}
              >
                {stat.icon}
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {stat.title}
              </Typography>
              <Typography variant="h5" sx={{ color: "#b08d57", mt: 1 }}>
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4} mt={1}>
        {balanceStats.map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: "white",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
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
            <Replay sx={{ mr: 1, color: "#1a2b4c" }} />
            <Typography variant="h6" sx={{ color: "#1a2b4c" }}>
              Upcoming Recurring
            </Typography>
          </Box>
          {recurring.length === 0 ? (
            <Typography color="text.secondary">
              No upcoming recurring transactions.
            </Typography>
          ) : (
            <List>
              {recurring.map((item, idx) => (
                <div key={idx}>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText
                      primary={item.description}
                      secondary={`$${item.amount.toFixed(2)} – ${new Date(
                        item.nextRun
                      ).toLocaleDateString()}`}
                    />
                  </ListItem>
                  {idx < recurring.length - 1 && <Divider />}
                </div>
              ))}
            </List>
          )}
          <Box textAlign="right" mt={2}>
            <Button
              onClick={() => navigate("/recurring-transactions")}
              size="small"
              sx={{ color: "#1a2b4c", fontWeight: 500 }}
            >
              View All
            </Button>
          </Box>
        </Paper>
      </Grid>

      <Box mt={5} textAlign="center">
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#1a2b4c",
            "&:hover": { backgroundColor: "#16233a" },
            borderRadius: 2,
            px: 4,
            py: 1,
            fontWeight: 600,
          }}
          onClick={() => navigate("/add-transaction")}
        >
          Add New Transaction
        </Button>
      </Box>
    </Box>
  );
};

export default Dashboard;
