import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { AccountBalance as AccountBalanceIcon, TrendingUp as TrendingUpIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface IncomeStatement {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  startDate: string;
  endDate: string;
}

const Dashboard = () => {
  const [data, setData] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIncomeStatement = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await axios.get('/api/reports/income-statement', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load income statement');
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeStatement();
  }, []);

  if (loading) {
    return (
      <Box p={4}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const stats = [
    { title: 'Net Income', value: `$${data?.netIncome.toFixed(2)}`, icon: <AccountBalanceIcon /> },
    { title: 'Total Income', value: `$${data?.totalIncome.toFixed(2)}`, icon: <TrendingUpIcon /> },
    { title: 'Total Expenses', value: `$${data?.totalExpenses.toFixed(2)}`, icon: <ReceiptIcon /> },
  ];

  return (
    <Box p={4}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  mb: 2,
                }}
              >
                {stat.icon}
              </Box>
              <Typography variant="h6" component="h2" gutterBottom>
                {stat.title}
              </Typography>
              <Typography variant="h5" component="p" color="primary">
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Extra button for expansion later */}
      <Box textAlign="center">
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/income-statement')}
        >
          View Full Income Statement
        </Button>
      </Box>
    </Box>
  );
};

export default Dashboard;
