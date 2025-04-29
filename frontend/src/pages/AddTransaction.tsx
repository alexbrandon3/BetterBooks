import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  SelectChangeEvent,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/utils/axios';

const AddTransaction = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'INCOME',
    accountId: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data } = await axios.get('/accounts');
        setAccounts(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, accountId: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      }
    };

    fetchAccounts();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/transactions', formData);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  if (accounts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <Paper sx={{ p: 4, maxWidth: 400 }}>
          <Typography variant="h6" align="center" gutterBottom>
            🚧 No accounts found
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 2 }}>
            You need at least one account before adding a transaction.
          </Typography>
          <Button variant="contained" fullWidth onClick={() => navigate('/create-account')}>
            Create First Account
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Paper sx={{ p: 4, width: '100%', maxWidth: 450 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Add Transaction
        </Typography>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            type="number"
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select name="type" value={formData.type} onChange={handleSelectChange} required>
              <MenuItem value="INCOME">Income</MenuItem>
              <MenuItem value="EXPENSE">Expense</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Account</InputLabel>
            <Select name="accountId" value={formData.accountId} onChange={handleSelectChange} required>
              {accounts.map(acc => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            name="date"
            label="Transaction Date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Transaction'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AddTransaction;
