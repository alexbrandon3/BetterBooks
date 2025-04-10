import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Snackbar,
  FormHelperText,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Restore as RestoreIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  AccountBalance as BankIcon,
  Receipt as ExpenseIcon,
  TrendingUp as IncomeIcon,
  Business as AssetIcon,
  CreditCard as LiabilityIcon,
  Person as EquityIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '12px',
}));

const AccountTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Asset':
      return <AssetIcon />;
    case 'Liability':
      return <LiabilityIcon />;
    case 'Equity':
      return <EquityIcon />;
    case 'Income':
      return <IncomeIcon />;
    case 'Expense':
      return <ExpenseIcon />;
    default:
      return <BankIcon />;
  }
};

interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string;
  isActive: boolean;
  description: string;
  isCustom: boolean;
}

interface ValidationWarning {
  accountId: string;
  message: string;
}

const ChartOfAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      name: 'Cash',
      type: 'Asset',
      subtype: 'Bank',
      isActive: true,
      description: 'Main business checking account',
      isCustom: false,
    },
    {
      id: '2',
      name: 'Accounts Receivable',
      type: 'Asset',
      subtype: 'Current Asset',
      isActive: true,
      description: 'Money owed by customers',
      isCustom: false,
    },
    // Add more default accounts here
  ]);

  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    name: '',
    type: 'Asset',
    subtype: '',
    isActive: true,
    description: '',
    isCustom: true,
  });

  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [showWarning, setShowWarning] = useState(false);

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    type?: string;
  }>({});

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.type) {
      return;
    }

    setAccounts([
      ...accounts,
      {
        ...newAccount,
        id: Date.now().toString(),
      } as Account,
    ]);
    setIsAddingAccount(false);
    setNewAccount({
      name: '',
      type: 'Asset',
      subtype: '',
      isActive: true,
      description: '',
      isCustom: true,
    });
  };

  const handleDeleteAccount = (id: string) => {
    setAccountToDelete(id);
    setIsDeletingAccount(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      setAccounts(accounts.filter(account => account.id !== accountToDelete));
      setIsDeletingAccount(false);
      setAccountToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeletingAccount(false);
    setAccountToDelete(null);
  };

  const handleRestoreDefaults = () => {
    // Implement restore defaults logic
  };

  const validateAccount = (account: Account): ValidationWarning | null => {
    // Check for common misclassifications
    if (account.name.toLowerCase().includes('rent') && account.type !== 'Expense') {
      return {
        accountId: account.id,
        message: 'Rent is typically classified as an Expense',
      };
    }
    if (account.name.toLowerCase().includes('equipment') && account.type !== 'Asset') {
      return {
        accountId: account.id,
        message: 'Equipment is typically classified as an Asset',
      };
    }
    // Add more validation rules as needed
    return null;
  };

  const handleEditStart = (accountId: string, field: 'name' | 'type' | 'subtype', value: string) => {
    setEditingAccount(accountId);
  };

  const handleEditSave = () => {
    if (editingAccount) {
      const newAccounts = accounts.map(account => {
        if (account.id === editingAccount) {
          const updatedAccount = {
            ...account,
            name: newAccount.name,
            type: newAccount.type,
            subtype: newAccount.subtype,
          };
          return updatedAccount;
        }
        return account;
      });
      setAccounts(newAccounts);
      setEditingAccount(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setEditingAccount(null);
    }
  };

  const handleEditCancel = () => {
    setEditingAccount(null);
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
          <Typography variant="h4" gutterBottom>
            Chart of Accounts
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            These accounts were generated based on your business. You can edit or add more as needed.
          </Typography>

          <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setIsAddingAccount(true)}
            >
              Add New Account
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={handleRestoreDefaults}
            >
              Restore Defaults
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account Name</TableCell>
                  <TableCell>Account Type</TableCell>
                  <TableCell>Subtype</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      {editingAccount === account.id ? (
                        <TextField
                          value={account.name}
                          onChange={(e) => {
                            const updatedAccounts = accounts.map((a) =>
                              a.id === account.id ? { ...a, name: e.target.value || a.name } : a
                            );
                            setAccounts(updatedAccounts);
                          }}
                          onKeyDown={handleKeyDown}
                          size="small"
                          autoFocus
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountTypeIcon type={account.type} />
                          {account.name}
                          <IconButton
                            aria-label="Edit account"
                            onClick={() => handleEditStart(account.id, 'name', account.name)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingAccount === account.id ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Select
                            value={account.type}
                            onChange={(e) => {
                              const updatedAccounts = accounts.map((a) =>
                                a.id === account.id ? { ...a, type: e.target.value } : a
                              );
                              setAccounts(updatedAccounts);
                            }}
                            size="small"
                          >
                            <MenuItem value="Asset">Asset</MenuItem>
                            <MenuItem value="Liability">Liability</MenuItem>
                            <MenuItem value="Equity">Equity</MenuItem>
                            <MenuItem value="Income">Income</MenuItem>
                            <MenuItem value="Expense">Expense</MenuItem>
                          </Select>
                          <IconButton size="small" onClick={handleEditSave}>
                            <CheckIcon />
                          </IconButton>
                          <IconButton size="small" onClick={handleEditCancel}>
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {account.type}
                          <IconButton
                            aria-label="Edit account"
                            onClick={() => handleEditStart(account.id, 'type', account.type)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{account.subtype}</TableCell>
                    <TableCell>
                      <Switch
                        checked={account.isActive}
                        onChange={(e) => {
                          const newAccounts = accounts.map(a =>
                            a.id === account.id ? { ...a, isActive: e.target.checked } : a
                          );
                          setAccounts(newAccounts);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={account.description}>
                        <IconButton size="small">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="Edit account"
                        onClick={() => handleEditStart(account.id, 'name', account.name)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="Delete account"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              size="large"
            >
              Save & Continue
            </Button>
          </Box>
        </StyledPaper>
      </Container>

      {/* Warning Snackbar */}
      <Snackbar
        open={showWarning}
        autoHideDuration={6000}
        onClose={() => setShowWarning(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowWarning(false)}
          severity="warning"
          sx={{ width: '100%' }}
        >
          {warnings[warnings.length - 1]?.message}
        </Alert>
      </Snackbar>

      {/* Add New Account Dialog */}
      <Dialog open={isAddingAccount} onClose={() => setIsAddingAccount(false)}>
        <DialogTitle>Add New Account</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Account Name"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              fullWidth
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <FormControl fullWidth error={!!formErrors.type}>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={newAccount.type}
                onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                label="Account Type"
              >
                <MenuItem value="Asset">Asset</MenuItem>
                <MenuItem value="Liability">Liability</MenuItem>
                <MenuItem value="Equity">Equity</MenuItem>
                <MenuItem value="Income">Income</MenuItem>
                <MenuItem value="Expense">Expense</MenuItem>
              </Select>
              {formErrors.type && (
                <FormHelperText>{formErrors.type}</FormHelperText>
              )}
            </FormControl>
            <TextField
              label="Description"
              value={newAccount.description}
              onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddingAccount(false)}>Cancel</Button>
          <Button onClick={handleAddAccount} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isDeletingAccount} onClose={cancelDelete}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this account? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChartOfAccountsPage; 