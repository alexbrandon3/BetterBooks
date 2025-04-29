import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { useEffect, useState } from 'react';
import axios from '@/utils/axios';

interface IncomeStatementData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  startDate: string;
  endDate: string;
}

const IncomeStatement = () => {
  const [data, setData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIncomeStatement = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/reports/income-statement', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load income statement');
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

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Income Statement
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Period: {new Date(data!.startDate).toLocaleDateString()} – {new Date(data!.endDate).toLocaleDateString()}
      </Typography>

      <Paper sx={{ p: 4, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="h6">Total Income</Typography>
          <Typography variant="h6" color="success.main">${data!.totalIncome.toFixed(2)}</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="h6">Total Expenses</Typography>
          <Typography variant="h6" color="error.main">${data!.totalExpenses.toFixed(2)}</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between">
          <Typography variant="h5">Net Income</Typography>
          <Typography
            variant="h5"
            color={data!.netIncome >= 0 ? 'success.main' : 'error.main'}
          >
            ${data!.netIncome.toFixed(2)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default IncomeStatement;
