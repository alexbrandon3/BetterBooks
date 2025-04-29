// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/utils/axios';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { AccountBalance, TrendingUp, Receipt } from '@mui/icons-material';

interface IncomeStatement {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  startDate: string;
  endDate: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIncomeStatement = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/reports/income-statement', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch income statement');
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeStatement();
  }, []);

  if (loading) {
    return (
      <Box mt={8} textAlign="center">
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

  const totalIncome = data?.totalIncome ?? 0;
  const totalExpenses = data?.totalExpenses ?? 0;
  const netIncome = data?.netIncome ?? 0;

  const stats = [
    { title: 'Net Income', value: `$${netIncome.toFixed(2)}`, icon: <AccountBalance /> },
    { title: 'Total Income', value: `$${totalIncome.toFixed(2)}`, icon: <TrendingUp /> },
    { title: 'Total Expenses', value: `$${totalExpenses.toFixed(2)}`, icon: <Receipt /> },
  ];

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>

      <Grid container spacing={3}>
        {stats.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
              <Box sx={{ mb: 2, bgcolor: 'primary.main', color: 'white', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </Box>
              <Typography variant="h6">{stat.title}</Typography>
              <Typography variant="h4" color="primary">{stat.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box mt={4} textAlign="center">
        <Button variant="contained" onClick={() => navigate('/add-transaction')}>
          Add New Transaction
        </Button>
      </Box>
    </Box>
  );
};

export default Dashboard;
