import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAccounts } from '../contexts/AccountsContext';
import { useLedger } from '../contexts/LedgerContext';
import { JournalEntryInput } from '../types/JournalEntry';
import { validateJournalEntry, formatJournalEntry, formatJournalEntryForDisplay } from '../utils/journalEntryUtils';

interface JournalLine {
  account: string;
  amount: number;
}

export const ManualJournalEntry: React.FC = () => {
  const { accounts } = useAccounts();
  const { postJournalEntry } = useLedger();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [debits, setDebits] = useState<JournalLine[]>([{ account: '', amount: 0 }]);
  const [credits, setCredits] = useState<JournalLine[]>([{ account: '', amount: 0 }]);
  const [attachment, setAttachment] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddLine = (type: 'debit' | 'credit') => {
    if (type === 'debit') {
      setDebits([...debits, { account: '', amount: 0 }]);
    } else {
      setCredits([...credits, { account: '', amount: 0 }]);
    }
  };

  const handleRemoveLine = (type: 'debit' | 'credit', index: number) => {
    if (type === 'debit') {
      setDebits(debits.filter((_, i) => i !== index));
    } else {
      setCredits(credits.filter((_, i) => i !== index));
    }
  };

  const handleLineChange = (
    type: 'debit' | 'credit',
    index: number,
    field: 'account' | 'amount',
    value: string | number
  ) => {
    if (type === 'debit') {
      const newDebits = [...debits];
      newDebits[index] = { ...newDebits[index], [field]: value };
      setDebits(newDebits);
    } else {
      const newCredits = [...credits];
      newCredits[index] = { ...newCredits[index], [field]: value };
      setCredits(newCredits);
    }
  };

  const handleAmountChange = (type: 'debit' | 'credit', index: number, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    handleLineChange(type, index, 'amount', numValue);
  };

  const handleAmountFocus = (type: 'debit' | 'credit', index: number) => {
    const lines = type === 'debit' ? debits : credits;
    if (lines[index].amount === 0) {
      handleLineChange(type, index, 'amount', NaN);
    }
  };

  const handleAmountBlur = (type: 'debit' | 'credit', index: number) => {
    const lines = type === 'debit' ? debits : credits;
    if (isNaN(lines[index].amount)) {
      handleLineChange(type, index, 'amount', 0);
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    const input: JournalEntryInput = {
      date,
      description,
      debits,
      credits,
      attachment,
      tags
    };

    const validationResult = validateJournalEntry(input, accounts);
    
    if (validationResult.status === 'error') {
      setError(validationResult.message || 'Invalid journal entry');
      return;
    }

    const journalEntry = formatJournalEntry(input, accounts, validationResult);
    try {
      const ledgerResult = await postJournalEntry(journalEntry);

      if (!ledgerResult.isValid) {
        setError(ledgerResult.errors?.join('\n') || 'Failed to post journal entry');
        return;
      }

      if (ledgerResult.warnings?.length) {
        setSuccess(`Journal entry created successfully! ${ledgerResult.warnings.join('\n')}`);
      } else {
        setSuccess('Journal entry created successfully!');
      }

      // Reset form
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setDebits([{ account: '', amount: 0 }]);
      setCredits([{ account: '', amount: 0 }]);
      setAttachment('');
      setTags([]);
    } catch (error) {
      setError('An error occurred while posting the journal entry');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Manual Journal Entry
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>Debits</Typography>
          {debits.map((line, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                select
                label="Account"
                value={line.account}
                onChange={(e) => handleLineChange('debit', index, 'account', e.target.value)}
                SelectProps={{ native: true }}
                sx={{ 
                  flex: 2, 
                  minWidth: '200px',
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'white',
                    padding: '0 4px',
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.87)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.name}>
                    {account.name}
                  </option>
                ))}
              </TextField>
              <TextField
                type="number"
                label="Amount"
                value={isNaN(line.amount) ? '' : line.amount}
                onChange={(e) => handleAmountChange('debit', index, e.target.value)}
                onFocus={() => handleAmountFocus('debit', index)}
                onBlur={() => handleAmountBlur('debit', index)}
                sx={{ flex: 1, minWidth: '120px' }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
              <IconButton onClick={() => handleRemoveLine('debit', index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={() => handleAddLine('debit')}
            sx={{ mb: 2 }}
          >
            Add Debit Line
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>Credits</Typography>
          {credits.map((line, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                select
                label="Account"
                value={line.account}
                onChange={(e) => handleLineChange('credit', index, 'account', e.target.value)}
                SelectProps={{ native: true }}
                sx={{ 
                  flex: 2, 
                  minWidth: '200px',
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'white',
                    padding: '0 4px',
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.87)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.name}>
                    {account.name}
                  </option>
                ))}
              </TextField>
              <TextField
                type="number"
                label="Amount"
                value={isNaN(line.amount) ? '' : line.amount}
                onChange={(e) => handleAmountChange('credit', index, e.target.value)}
                onFocus={() => handleAmountFocus('credit', index)}
                onBlur={() => handleAmountBlur('credit', index)}
                sx={{ flex: 1, minWidth: '120px' }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
              <IconButton onClick={() => handleRemoveLine('credit', index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={() => handleAddLine('credit')}
            sx={{ mb: 2 }}
          >
            Add Credit Line
          </Button>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Attachment (Optional)"
            value={attachment}
            onChange={(e) => setAttachment(e.target.value)}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              label="Add Tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              size="small"
            />
            <Button onClick={handleAddTag}>Add</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
              />
            ))}
          </Box>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {success && (
          <Grid item xs={12}>
            <Alert severity="success">{success}</Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            fullWidth
          >
            Create Journal Entry
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}; 