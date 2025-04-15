import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Chip,
  SelectChangeEvent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
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
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from '../components/Layout';
import { useAccounts } from '../hooks/useAccounts';
import { Account, AccountType } from '../types/account';
import { ACCOUNT_TYPES } from '../utils/accountUtils';
import AccountTable from '../components/AccountTable';
import AccountFormDialog from '../components/AccountFormDialog';
import AccountFormModal from '../components/AccountFormModal';

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

const ChartOfAccountsPage: React.FC = () => {
  const {
    accounts,
    searchTerm,
    typeFilter,
    showArchived,
    sortBy,
    sortOrder,
    handleSearch,
    handleTypeFilter,
    handleSort,
    handleArchiveToggle,
    handleAddAccount,
    handleUpdateAccount,
    loadAccounts,
    isLoading,
    error,
    setShowArchived,
    fetchAccounts,
  } = useAccounts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleOpenDialog = (account?: Account) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedAccount(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (accountData: Partial<Account>) => {
    try {
      if (selectedAccount) {
        await handleUpdateAccount(selectedAccount.id, accountData);
        setSuccessMessage('Account updated successfully');
      } else {
        const newAccount: Omit<Account, 'id'> = {
          ...accountData,
          createdAt: new Date(),
          updatedAt: new Date(),
          balance: accountData.balance || 0,
          isActive: true,
          isCustom: true
        } as Omit<Account, 'id'>;
        await handleAddAccount(newAccount);
        setSuccessMessage('Account created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save account');
      throw error;
    }
  };

  const handleAccountArchiveToggle = async (accountId: string, isActive: boolean) => {
    try {
      await handleUpdateAccount(accountId, { isActive });
      setSuccessMessage(`Account ${isActive ? 'activated' : 'archived'} successfully`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update account status');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleAccountCreated = () => {
    fetchAccounts();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Layout initialSidebarOpen={false}>
      <Container maxWidth="lg">
        <StyledPaper elevation={3}>
          <Typography variant="h4" gutterBottom>
            Chart of Accounts
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            These accounts were generated based on your business. You can edit or add more as needed.
          </Typography>

          <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setModalOpen(true)}
              >
                New Account
              </Button>
              <Button
                variant="outlined"
                startIcon={<RestoreIcon />}
                onClick={() => {
                  // Implement restore defaults functionality
                }}
              >
                Restore Defaults
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => handleTypeFilter(e.target.value as AccountType | 'all')}
                  label="Filter by Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {Object.entries(ACCOUNT_TYPES).map(([type, { label }]) => (
                    <MenuItem key={type} value={type}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={showArchived ? 'inactive' : 'active'}
                  onChange={(e) => setShowArchived(e.target.value === 'inactive')}
                  label="Filter by Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <AccountTable
            accounts={accounts}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onEdit={handleOpenDialog}
            onArchiveToggle={(accountId, isActive) => handleAccountArchiveToggle(accountId, isActive)}
          />

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

      <AccountFormDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        account={selectedAccount}
        formError={errorMessage || undefined}
      />

      <AccountFormModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleAccountCreated}
      />

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default ChartOfAccountsPage;