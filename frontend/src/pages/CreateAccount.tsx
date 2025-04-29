// src/pages/CreateAccount.tsx

import { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert, CircularProgress, MenuItem, Snackbar } from '@mui/material';
import axios from '@/utils/axios';
import { useNavigate } from 'react-router-dom';

const CreateAccount = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    number: '',
    name: '',
    description: '',
    type: 'Asset',
    subtype: '',
    balance: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
  
    setFormData(prev => {
      let updated = { ...prev, [name]: value };
  
      if (name === 'type') {
        updated.subtype = getDefaultSubtype(value); // Smartly set subtype!
      }
  
      return updated;
    });
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      await axios.post('/accounts', {
        ...formData,
        balance: parseFloat(formData.balance),
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500); // Redirect after short delay
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSubtype = (type: string) => {
    switch (type) {
      case 'Asset':
        return 'Cash';
      case 'Liability':
        return 'Credit Card';
      case 'Expense':
        return 'General Expense';
      case 'Income':
        return 'Sales Revenue';
      case 'Equity':
        return 'Owner’s Equity';
      default:
        return '';
    }
  };
  

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Create Account
        </Typography>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Account Number"
            name="number"
            value={formData.number}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Account Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            select
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            margin="normal"
            required
          >
            <MenuItem value="Asset">Asset</MenuItem>
            <MenuItem value="Liability">Liability</MenuItem>
            <MenuItem value="Equity">Equity</MenuItem>
            <MenuItem value="Income">Income</MenuItem>
            <MenuItem value="Expense">Expense</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Subtype"
            name="subtype"
            value={formData.subtype}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Starting Balance"
            name="balance"
            value={formData.balance}
            onChange={handleChange}
            type="number"
            margin="normal"
            required
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Account'}
          </Button>
        </form>
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={1500}
        message="🎉 Account created!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default CreateAccount;
