import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Undo as UndoIcon,
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '1rem',
  minWidth: 100,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

interface Transaction {
  id: string;
  date: Date;
  type: 'expense' | 'income' | 'transfer' | 'other';
  businessAccount: string;
  amount: number;
  description: string;
  receiptUrl?: string;
  tags: string[];
  isRecurring: boolean;
  debitAccount: string;
  creditAccount: string;
  vendor?: string;
  customer?: string;
  status: 'draft' | 'saved' | 'modified';
}

const TransactionEntryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [transaction, setTransaction] = useState<Partial<Transaction>>({
    type: 'expense',
    date: new Date(),
    isRecurring: false,
  });
  const [showManualMode, setShowManualMode] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    account: string;
    type: string;
    vendor?: string;
  } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    const types = ['expense', 'income', 'transfer', 'other'];
    setTransaction(prev => ({ ...prev, type: types[newValue] as Transaction['type'] }));
  };

  const handleInputChange = (field: keyof Transaction, value: any) => {
    setTransaction(prev => ({ ...prev, [field]: value }));
    
    // Trigger AI prediction when description or amount changes
    if ((field === 'description' || field === 'amount') && value) {
      // Simulate AI prediction
      setTimeout(() => {
        if (field === 'description' && value.toLowerCase().includes('office')) {
          setSuggestions({
            account: 'Office Supplies',
            type: 'Expense',
            vendor: 'Office Depot',
          });
        }
      }, 500);
    }
  };

  const handleSaveTransaction = () => {
    if (!transaction.date || !transaction.amount || !transaction.description) {
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: transaction.date,
      type: transaction.type || 'expense',
      businessAccount: transaction.businessAccount || '',
      amount: transaction.amount,
      description: transaction.description,
      tags: transaction.tags || [],
      isRecurring: transaction.isRecurring || false,
      debitAccount: transaction.debitAccount || '',
      creditAccount: transaction.creditAccount || '',
      vendor: transaction.vendor,
      customer: transaction.customer,
      status: 'saved',
    };

    setTransactions(prev => [...prev, newTransaction]);
    setTransaction({
      type: transaction.type,
      date: new Date(),
      isRecurring: false,
    });
    setSuggestions(null);
  };

  const handleUploadReceipt = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log('File uploaded:', file);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A2A6C 0%, #0A1A5C 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <StyledPaper elevation={3}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1A2A6C' }}>
            Record a New Transaction
          </Typography>

          <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <StyledTab label="Expense" />
            <StyledTab label="Income" />
            <StyledTab label="Transfer" />
            <StyledTab label="Other" />
          </StyledTabs>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={transaction.date}
                  onChange={(newValue) => handleInputChange('date', newValue)}
                  sx={{ width: '100%', mb: 2 }}
                />
              </LocalizationProvider>

              <TextField
                select
                label="Business Account"
                value={transaction.businessAccount || ''}
                onChange={(e) => handleInputChange('businessAccount', e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              >
                <MenuItem value="checking">Main Checking</MenuItem>
                <MenuItem value="savings">Business Savings</MenuItem>
                <MenuItem value="credit">Business Credit Card</MenuItem>
              </TextField>

              <TextField
                label="Amount"
                type="number"
                value={transaction.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />

              <TextField
                label="Description"
                value={transaction.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />

              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  id="receipt-upload"
                  type="file"
                  onChange={handleUploadReceipt}
                />
                <label htmlFor="receipt-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    sx={{ mr: 2 }}
                  >
                    Upload Receipt
                  </Button>
                </label>
                {transaction.receiptUrl && (
                  <Chip
                    icon={<ReceiptIcon />}
                    label="Receipt Attached"
                    onDelete={() => handleInputChange('receiptUrl', undefined)}
                  />
                )}
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={transaction.isRecurring || false}
                    onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                  />
                }
                label="Recurring Transaction"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={showManualMode}
                    onChange={(e) => setShowManualMode(e.target.checked)}
                  />
                }
                label="Manual Mode"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              {suggestions && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#F8F9FA' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    AI Suggestions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography>
                      Account: <strong>{suggestions.account}</strong>
                    </Typography>
                    <Typography>
                      Type: <strong>{suggestions.type}</strong>
                    </Typography>
                    {suggestions.vendor && (
                      <Typography>
                        Vendor: <strong>{suggestions.vendor}</strong>
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CheckIcon />}
                        onClick={() => {
                          handleInputChange('debitAccount', suggestions.account);
                          setSuggestions(null);
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CloseIcon />}
                        onClick={() => setSuggestions(null)}
                      >
                        Dismiss
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              )}

              {showManualMode && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    select
                    label="Debit Account"
                    value={transaction.debitAccount || ''}
                    onChange={(e) => handleInputChange('debitAccount', e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="office_supplies">Office Supplies</MenuItem>
                    <MenuItem value="rent">Rent Expense</MenuItem>
                    <MenuItem value="utilities">Utilities</MenuItem>
                  </TextField>

                  <TextField
                    select
                    label="Credit Account"
                    value={transaction.creditAccount || ''}
                    onChange={(e) => handleInputChange('creditAccount', e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="checking">Main Checking</MenuItem>
                    <MenuItem value="credit_card">Business Credit Card</MenuItem>
                  </TextField>
                </Box>
              )}

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSaveTransaction}
                disabled={!transaction.date || !transaction.amount || !transaction.description}
              >
                Save Transaction
              </Button>
            </Grid>
          </Grid>

          {transactions.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.date.toLocaleDateString()}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>${t.amount.toFixed(2)}</TableCell>
                        <TableCell>{t.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={t.status}
                            color={t.status === 'saved' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Audit Trail">
                            <IconButton onClick={() => setShowAuditTrail(true)}>
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </StyledPaper>
      </Container>

      <Dialog
        open={showAuditTrail}
        onClose={() => setShowAuditTrail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Trail</DialogTitle>
        <DialogContent>
          {/* Add audit trail content here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuditTrail(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionEntryPage; 