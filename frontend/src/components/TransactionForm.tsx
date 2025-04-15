import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAccounts } from '../hooks/useAccounts';
import { createTransaction } from '../services/transactionService';
import { Transaction, TransactionType } from '../types/transaction';
import { useToast } from '../contexts/ToastContext';

interface TransactionFormProps {
  onSuccess?: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess }) => {
  const { accounts, loadAccounts } = useAccounts();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    accountId: '',
    type: 'expense',
    categoryAccountId: '',
    isReconciled: false,
  });

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const getAssetAccounts = useCallback(() => {
    return accounts.filter(account => 
      account.type === 'asset' && 
      account.isActive &&
      (account.subType === 'current' ||
       account.subType === 'cash' ||
       account.subType === 'bank' ||
       account.subType === 'credit_card' ||
       account.subType === 'paypal' ||
       account.subType === 'stripe' ||
       account.subType === 'square' ||
       account.subType === 'undeposited_funds')
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts]);

  const handleInputChange = (field: keyof Transaction) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'amount' 
      ? parseFloat(event.target.value) || 0
      : event.target.value;

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectChange = (field: keyof Transaction) => (
    event: SelectChangeEvent
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0]
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createTransaction(formData);
      showToast('Transaction recorded successfully', 'success');
      if (onSuccess) {
        onSuccess();
      }
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        accountId: '',
        type: 'expense',
        categoryAccountId: '',
        isReconciled: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      showToast('Failed to record transaction', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.description.trim() !== '' &&
      formData.amount > 0 &&
      formData.accountId !== '' &&
      formData.categoryAccountId !== ''
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={new Date(formData.date)}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={handleInputChange('description')}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={handleInputChange('amount')}
            required
            InputProps={{
              startAdornment: '$'
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Transaction Type</InputLabel>
            <Select
              value={formData.type}
              onChange={handleSelectChange('type')}
              label="Transaction Type"
            >
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="revenue">Revenue</MenuItem>
              <MenuItem value="transfer">Transfer</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Account</InputLabel>
            <Select
              value={formData.accountId}
              onChange={handleSelectChange('accountId')}
              label="Account"
            >
              {getAssetAccounts().map(account => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Category Account</InputLabel>
            <Select
              value={formData.categoryAccountId}
              onChange={handleSelectChange('categoryAccountId')}
              label="Category Account"
            >
              {accounts.map(account => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isFormValid() || isSubmitting}
            fullWidth
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Record Transaction'
            )}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransactionForm; 