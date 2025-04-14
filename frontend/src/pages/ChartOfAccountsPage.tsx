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
  FormControlLabel,
  Chip,
  SelectChangeEvent,
  List,
  ListItem,
  ListItemText,
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
import Layout from '../components/Layout';

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
  number: string;
  name: string;
  type: string;
  subtype: string;
  isActive: boolean;
  description: string;
  isCustom: boolean;
  balance: number;
  parentId?: string;
  level: number;
}

interface AccountType {
  value: string;
  label: string;
  subtypes: string[];
  defaultNumberPrefix: string;
  keywords: string[];
  description: string;
  examples: string[];
  financialStatement: string;
}

const ACCOUNT_TYPES: AccountType[] = [
  {
    value: 'Asset',
    label: 'Asset',
    subtypes: ['Current Asset', 'Fixed Asset', 'Other Asset'],
    defaultNumberPrefix: '1',
    keywords: ['cash', 'bank', 'receivable', 'inventory', 'equipment', 'property', 'building', 'vehicle', 'furniture', 'land', 'investment', 'prepaid'],
    description: 'Resources owned by the business that have economic value',
    examples: ['Cash', 'Accounts Receivable', 'Inventory', 'Equipment', 'Buildings'],
    financialStatement: 'Balance Sheet',
  },
  {
    value: 'Liability',
    label: 'Liability',
    subtypes: ['Current Liability', 'Long-term Liability'],
    defaultNumberPrefix: '2',
    keywords: ['payable', 'loan', 'debt', 'credit', 'mortgage', 'tax', 'wages', 'salary', 'interest', 'accrued', 'unearned'],
    description: 'Obligations or debts owed by the business',
    examples: ['Accounts Payable', 'Loans Payable', 'Wages Payable', 'Taxes Payable'],
    financialStatement: 'Balance Sheet',
  },
  {
    value: 'Equity',
    label: 'Equity',
    subtypes: ['Owner\'s Equity', 'Retained Earnings'],
    defaultNumberPrefix: '3',
    keywords: ['capital', 'equity', 'stock', 'share', 'retained', 'earnings', 'dividend', 'drawing'],
    description: 'Owner\'s claim on the business assets after liabilities',
    examples: ['Common Stock', 'Retained Earnings', 'Owner\'s Capital', 'Dividends'],
    financialStatement: 'Balance Sheet',
  },
  {
    value: 'Income',
    label: 'Income',
    subtypes: ['Operating Income', 'Other Income'],
    defaultNumberPrefix: '4',
    keywords: ['revenue', 'sales', 'income', 'fee', 'service', 'interest', 'rental', 'commission', 'royalty'],
    description: 'Money earned from business operations',
    examples: ['Sales Revenue', 'Service Revenue', 'Interest Income', 'Rental Income'],
    financialStatement: 'Income Statement',
  },
  {
    value: 'Expense',
    label: 'Expense',
    subtypes: ['Operating Expense', 'Cost of Goods Sold', 'Other Expense'],
    defaultNumberPrefix: '5',
    keywords: ['expense', 'cost', 'rent', 'utilities', 'salary', 'wage', 'insurance', 'supplies', 'maintenance', 'repair', 'advertising', 'depreciation', 'interest'],
    description: 'Costs incurred in running the business',
    examples: ['Rent Expense', 'Salaries Expense', 'Utilities Expense', 'Insurance Expense'],
    financialStatement: 'Income Statement',
  },
];

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: '1',
    number: '1000',
    name: 'Cash',
    type: 'Asset',
    subtype: 'Current Asset',
    isActive: true,
    description: 'Main business checking account',
    isCustom: false,
    balance: 0,
    level: 1,
  },
  {
    id: '2',
    number: '1100',
    name: 'Accounts Receivable',
    type: 'Asset',
    subtype: 'Current Asset',
    isActive: true,
    description: 'Money owed by customers',
    isCustom: false,
    balance: 0,
    level: 1,
  },
  {
    id: '3',
    number: '2000',
    name: 'Accounts Payable',
    type: 'Liability',
    subtype: 'Current Liability',
    isActive: true,
    description: 'Money owed to vendors',
    isCustom: false,
    balance: 0,
    level: 1,
  },
  {
    id: '4',
    number: '3000',
    name: 'Owner\'s Capital',
    type: 'Equity',
    subtype: 'Owner\'s Equity',
    isActive: true,
    description: 'Owner\'s investment in the business',
    isCustom: false,
    balance: 0,
    level: 1,
  },
  {
    id: '5',
    number: '4000',
    name: 'Sales Revenue',
    type: 'Income',
    subtype: 'Operating Income',
    isActive: true,
    description: 'Revenue from sales',
    isCustom: false,
    balance: 0,
    level: 1,
  },
  {
    id: '6',
    number: '5000',
    name: 'Rent Expense',
    type: 'Expense',
    subtype: 'Operating Expense',
    isActive: true,
    description: 'Monthly rent payment',
    isCustom: false,
    balance: 0,
    level: 1,
  },
];

interface ValidationWarning {
  accountId: string;
  message: string;
}

interface BestMatch {
  type: string;
  score: number;
}

interface AccountNameSuggestion {
  name: string;
  description: string;
  score: number;
  subtype?: string;
}

const getAccountNameSuggestions = (type: string, currentName: string): AccountNameSuggestion[] => {
  const suggestions: AccountNameSuggestion[] = [];
  const lowerCurrentName = currentName.toLowerCase();

  // Asset suggestions
  if (type === 'Asset') {
    suggestions.push(
      { name: 'Cash', description: 'Main business checking account', score: 0.9, subtype: 'Current Asset' },
      { name: 'Petty Cash', description: 'Small cash fund for minor expenses', score: 0.8, subtype: 'Current Asset' },
      { name: 'Accounts Receivable', description: 'Money owed by customers', score: 0.9, subtype: 'Current Asset' },
      { name: 'Allowance for Doubtful Accounts', description: 'Estimated uncollectible accounts', score: 0.7, subtype: 'Current Asset' },
      { name: 'Inventory', description: 'Goods held for sale', score: 0.8, subtype: 'Current Asset' },
      { name: 'Raw Materials', description: 'Unprocessed materials for production', score: 0.7, subtype: 'Current Asset' },
      { name: 'Work in Progress', description: 'Partially completed products', score: 0.7, subtype: 'Current Asset' },
      { name: 'Finished Goods', description: 'Completed products ready for sale', score: 0.7, subtype: 'Current Asset' },
      { name: 'Equipment', description: 'Business equipment and machinery', score: 0.8, subtype: 'Fixed Asset' },
      { name: 'Accumulated Depreciation - Equipment', description: 'Total depreciation on equipment', score: 0.7, subtype: 'Fixed Asset' },
      { name: 'Vehicles', description: 'Company vehicles', score: 0.7, subtype: 'Fixed Asset' },
      { name: 'Accumulated Depreciation - Vehicles', description: 'Total depreciation on vehicles', score: 0.7, subtype: 'Fixed Asset' },
      { name: 'Buildings', description: 'Business premises', score: 0.7, subtype: 'Fixed Asset' },
      { name: 'Accumulated Depreciation - Buildings', description: 'Total depreciation on buildings', score: 0.7, subtype: 'Fixed Asset' },
      { name: 'Land', description: 'Business property land', score: 0.7, subtype: 'Fixed Asset' },
      { name: 'Prepaid Expenses', description: 'Expenses paid in advance', score: 0.8, subtype: 'Current Asset' },
      { name: 'Prepaid Insurance', description: 'Insurance premiums paid in advance', score: 0.7, subtype: 'Current Asset' },
      { name: 'Prepaid Rent', description: 'Rent paid in advance', score: 0.7, subtype: 'Current Asset' },
      { name: 'Investments', description: 'Long-term investments', score: 0.7, subtype: 'Long-term Investment' },
      { name: 'Intangible Assets', description: 'Non-physical assets like patents', score: 0.6, subtype: 'Intangible Asset' }
    );
  }

  // Liability suggestions
  if (type === 'Liability') {
    suggestions.push(
      { name: 'Accounts Payable', description: 'Money owed to vendors', score: 0.9, subtype: 'Current Liability' },
      { name: 'Accrued Expenses', description: 'Expenses incurred but not yet paid', score: 0.8, subtype: 'Current Liability' },
      { name: 'Accrued Wages', description: 'Wages earned but not yet paid', score: 0.8, subtype: 'Current Liability' },
      { name: 'Accrued Interest', description: 'Interest incurred but not yet paid', score: 0.7, subtype: 'Current Liability' },
      { name: 'Accrued Taxes', description: 'Taxes incurred but not yet paid', score: 0.8, subtype: 'Current Liability' },
      { name: 'Sales Tax Payable', description: 'Sales tax collected from customers', score: 0.8, subtype: 'Current Liability' },
      { name: 'Payroll Tax Payable', description: 'Taxes withheld from employee paychecks', score: 0.8, subtype: 'Current Liability' },
      { name: 'Income Tax Payable', description: 'Income taxes owed to government', score: 0.8, subtype: 'Current Liability' },
      { name: 'Loans Payable', description: 'Outstanding loans', score: 0.8, subtype: 'Long-term Liability' },
      { name: 'Short-term Loans', description: 'Loans due within one year', score: 0.7, subtype: 'Current Liability' },
      { name: 'Long-term Loans', description: 'Loans due after one year', score: 0.7, subtype: 'Long-term Liability' },
      { name: 'Notes Payable', description: 'Written promises to pay', score: 0.7, subtype: 'Current Liability' },
      { name: 'Mortgage Payable', description: 'Property mortgage debt', score: 0.7, subtype: 'Long-term Liability' },
      { name: 'Unearned Revenue', description: 'Payments received for future services', score: 0.8, subtype: 'Current Liability' },
      { name: 'Customer Deposits', description: 'Payments received in advance', score: 0.7, subtype: 'Current Liability' },
      { name: 'Warranty Liability', description: 'Estimated warranty claims', score: 0.6, subtype: 'Current Liability' }
    );
  }

  // Equity suggestions
  if (type === 'Equity') {
    suggestions.push(
      { name: 'Owner\'s Capital', description: 'Owner\'s investment in the business', score: 0.9, subtype: 'Owner\'s Equity' },
      { name: 'Owner\'s Drawings', description: 'Owner\'s withdrawals from the business', score: 0.8, subtype: 'Owner\'s Equity' },
      { name: 'Retained Earnings', description: 'Cumulative profits kept in the business', score: 0.9, subtype: 'Retained Earnings' },
      { name: 'Common Stock', description: 'Value of issued common stock', score: 0.8, subtype: 'Owner\'s Equity' },
      { name: 'Preferred Stock', description: 'Value of issued preferred stock', score: 0.7, subtype: 'Owner\'s Equity' },
      { name: 'Additional Paid-in Capital', description: 'Amount paid above par value', score: 0.7, subtype: 'Owner\'s Equity' },
      { name: 'Treasury Stock', description: 'Company\'s own repurchased stock', score: 0.6, subtype: 'Owner\'s Equity' },
      { name: 'Dividends Payable', description: 'Declared but unpaid dividends', score: 0.7, subtype: 'Retained Earnings' }
    );
  }

  // Income suggestions
  if (type === 'Income') {
    suggestions.push(
      { name: 'Sales Revenue', description: 'Revenue from product sales', score: 0.9, subtype: 'Operating Income' },
      { name: 'Service Revenue', description: 'Revenue from services provided', score: 0.9, subtype: 'Operating Income' },
      { name: 'Interest Income', description: 'Income from interest', score: 0.8, subtype: 'Operating Income' },
      { name: 'Rental Income', description: 'Income from property rental', score: 0.8, subtype: 'Operating Income' },
      { name: 'Commission Income', description: 'Income from sales commissions', score: 0.7, subtype: 'Operating Income' },
      { name: 'Royalty Income', description: 'Income from intellectual property', score: 0.7, subtype: 'Operating Income' },
      { name: 'Dividend Income', description: 'Income from investments', score: 0.7, subtype: 'Operating Income' },
      { name: 'Gain on Sale of Assets', description: 'Profit from selling assets', score: 0.7, subtype: 'Operating Income' },
      { name: 'Other Income', description: 'Miscellaneous income sources', score: 0.6, subtype: 'Operating Income' }
    );
  }

  // Expense suggestions
  if (type === 'Expense') {
    suggestions.push(
      { name: 'Cost of Goods Sold', description: 'Direct costs of producing goods', score: 0.9, subtype: 'Operating Expense' },
      { name: 'Rent Expense', description: 'Cost of business premises', score: 0.9, subtype: 'Operating Expense' },
      { name: 'Salaries Expense', description: 'Employee compensation', score: 0.9, subtype: 'Operating Expense' },
      { name: 'Wages Expense', description: 'Hourly employee compensation', score: 0.8, subtype: 'Operating Expense' },
      { name: 'Payroll Tax Expense', description: 'Employer portion of payroll taxes', score: 0.8, subtype: 'Operating Expense' },
      { name: 'Employee Benefits', description: 'Health insurance and other benefits', score: 0.7, subtype: 'Operating Expense' },
      { name: 'Utilities Expense', description: 'Electricity, water, etc.', score: 0.8, subtype: 'Operating Expense' },
      { name: 'Office Supplies', description: 'Consumable office items', score: 0.7, subtype: 'Operating Expense' },
      { name: 'Insurance Expense', description: 'Business insurance premiums', score: 0.7, subtype: 'Operating Expense' },
      { name: 'Depreciation Expense', description: 'Allocation of asset costs', score: 0.8, subtype: 'Operating Expense' },
      { name: 'Amortization Expense', description: 'Allocation of intangible assets', score: 0.7, subtype: 'Operating Expense' },
      { name: 'Advertising Expense', description: 'Marketing and promotional costs', score: 0.7, subtype: 'Operating Expense' },
      { name: 'Travel Expense', description: 'Business travel costs', score: 0.7, subtype: 'Operating Expense' },
      { name: 'Meals and Entertainment', description: 'Business dining and entertainment', score: 0.7, subtype: 'Operating Expense' },
      { name: 'Professional Fees', description: 'Legal, accounting, consulting', score: 0.7, subtype: 'Operating Expense' },
      { name: 'Repairs and Maintenance', description: 'Equipment and facility maintenance', score: 0.7, subtype: 'Operating Expense' },
      { name: 'Interest Expense', description: 'Cost of borrowing money', score: 0.8, subtype: 'Operating Expense' },
      { name: 'Bad Debt Expense', description: 'Uncollectible accounts', score: 0.7, subtype: 'Operating Expense' },
      { name: 'Income Tax Expense', description: 'Current period income taxes', score: 0.8, subtype: 'Operating Expense' },
      { name: 'Other Expenses', description: 'Miscellaneous business expenses', score: 0.6, subtype: 'Operating Expense' }
    );
  }

  // Filter and sort suggestions based on current input
  return suggestions
    .filter(suggestion => 
      suggestion.name.toLowerCase().includes(lowerCurrentName) ||
      suggestion.description.toLowerCase().includes(lowerCurrentName)
    )
    .sort((a, b) => b.score - a.score);
};

const ChartOfAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Account; direction: 'asc' | 'desc' }>({
    key: 'number',
    direction: 'asc',
  });
  const [filter, setFilter] = useState<{ type?: string; active?: boolean }>({});
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
    balance: 0,
    level: 1,
  });
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    type?: string;
    number?: string;
  }>({});
  const [suggestedType, setSuggestedType] = useState<string | null>(null);
  const [suggestedSubtypes, setSuggestedSubtypes] = useState<string[]>([]);
  const [accountName, setAccountName] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<AccountNameSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const generateAccountNumber = (type: string): string => {
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    if (!accountType) return '';

    const existingNumbers = accounts
      .filter(a => a.type === type)
      .map(a => parseInt(a.number))
      .filter(n => !isNaN(n));

    const maxNumber = Math.max(...existingNumbers, 0);
    const nextNumber = maxNumber + 1;
    return nextNumber.toString().padStart(4, '0');
  };

  const handleRestoreDefaults = () => {
    setAccounts(DEFAULT_ACCOUNTS);
  };

  const handleSort = (key: keyof Account) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilter = (type?: string, active?: boolean) => {
    setFilter({ type, active });
  };

  const sortedAndFilteredAccounts = React.useMemo(() => {
    let result = [...accounts];
    
    // Apply filters
    if (filter.type) {
      result = result.filter(account => account.type === filter.type);
    }
    if (filter.active !== undefined) {
      result = result.filter(account => account.isActive === filter.active);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return result;
  }, [accounts, sortConfig, filter]);

  const analyzeAccountName = (name: string): BestMatch | null => {
    const lowerName = name.toLowerCase();
    let bestMatch: BestMatch | null = null;
    
    ACCOUNT_TYPES.forEach(type => {
      const score = type.keywords.reduce((total, keyword) => {
        return total + (lowerName.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { type: type.value, score };
      }
    });
    
    return bestMatch;
  };

  const handleAccountNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setAccountName(name);
    setNewAccount({ ...newAccount, name });
    
    // Update suggestions based on current input and type
    if (newAccount.type) {
      const suggestions = getAccountNameSuggestions(newAccount.type, name);
      setNameSuggestions(suggestions);
      setShowSuggestions(true);
    }
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    const type = event.target.value;
    setNewAccount({ ...newAccount, type });
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    setSuggestedSubtypes(accountType?.subtypes || []);
  };

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.type) {
      setFormErrors({
        name: !newAccount.name ? 'Account name is required' : undefined,
        type: !newAccount.type ? 'Account type is required' : undefined,
      });
      return;
    }

    const accountNumber = generateAccountNumber(newAccount.type);
    const newAccountWithNumber: Account = {
      id: Date.now().toString(),
      number: accountNumber,
      name: newAccount.name || '',
      type: newAccount.type || 'Asset',
      subtype: newAccount.subtype || '',
      isActive: newAccount.isActive || true,
      description: newAccount.description || '',
      isCustom: true,
      balance: 0,
      level: 1,
    };

    const warning = validateAccount(newAccountWithNumber);
    if (warning) {
      setWarnings([warning]);
      setShowWarning(true);
      return;
    }

    setAccounts(prevAccounts => [...prevAccounts, newAccountWithNumber]);
    setIsAddingAccount(false);
    setNewAccount({
      name: '',
      type: 'Asset',
      subtype: '',
      isActive: true,
      description: '',
      isCustom: true,
      balance: 0,
      level: 1,
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

  const handleEditAccount = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    setNewAccount({
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      isActive: account.isActive,
      description: account.description,
      isCustom: account.isCustom,
      balance: account.balance,
      level: account.level,
    });
    setEditingAccount(accountId);
  };

  const handleSaveEdit = () => {
    if (!editingAccount || !newAccount.name || !newAccount.type) {
      setFormErrors({
        name: !newAccount.name ? 'Account name is required' : undefined,
        type: !newAccount.type ? 'Account type is required' : undefined,
      });
      return;
    }

    const updatedAccount: Account = {
      id: editingAccount,
      number: accounts.find(a => a.id === editingAccount)?.number || '',
      name: newAccount.name || '',
      type: newAccount.type || 'Asset',
      subtype: newAccount.subtype || '',
      isActive: newAccount.isActive || true,
      description: newAccount.description || '',
      isCustom: true,
      balance: newAccount.balance || 0,
      level: newAccount.level || 1,
    };

    const warning = validateAccount(updatedAccount);
    if (warning) {
      setWarnings([warning]);
      setShowWarning(true);
      return;
    }

    setAccounts(accounts.map(account => 
      account.id === editingAccount ? updatedAccount : account
    ));
    setEditingAccount(null);
    setNewAccount({
      name: '',
      type: 'Asset',
      subtype: '',
      isActive: true,
      description: '',
      isCustom: true,
      balance: 0,
      level: 1,
    });
  };

  const validateAccount = (account: Account): ValidationWarning | null => {
    const errors: string[] = [];
    
    if (!account.name.trim()) {
      errors.push('Account name is required');
    }
    
    if (!account.type) {
      errors.push('Account type is required');
    }
    
    // Check for misclassifications based on keywords
    const bestMatch = analyzeAccountName(account.name);
    if (bestMatch && bestMatch.type !== account.type) {
      return {
        accountId: account.id,
        message: `Warning: This account might be better classified as ${bestMatch.type} based on its name`
      };
    }
    
    if (errors.length > 0) {
      return {
        accountId: account.id,
        message: errors.join(', ')
      };
    }
    
    return null;
  };

  const handleSuggestionClick = (suggestion: AccountNameSuggestion) => {
    setNewAccount({ 
      ...newAccount, 
      name: suggestion.name,
      subtype: suggestion.subtype || ''
    });
    setAccountName(suggestion.name);
    setShowSuggestions(false);
    
    // Analyze the account name for type suggestions
    const bestMatch = analyzeAccountName(suggestion.name);
    if (bestMatch) {
      setSuggestedType(bestMatch.type);
      const type = ACCOUNT_TYPES.find(t => t.value === bestMatch.type);
      setSuggestedSubtypes(type?.subtypes || []);
    }
  };

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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={filter.type || ''}
                  onChange={(e) => handleFilter(e.target.value as string, filter.active)}
                  label="Filter by Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {ACCOUNT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filter.active === undefined ? '' : filter.active ? 'active' : 'inactive'}
                  onChange={(e) => handleFilter(filter.type, e.target.value === 'active')}
                  label="Filter by Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Button
                      onClick={() => handleSort('number')}
                      endIcon={
                        sortConfig.key === 'number' ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : null
                      }
                    >
                      Account #
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleSort('name')}
                      endIcon={
                        sortConfig.key === 'name' ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : null
                      }
                    >
                      Account Name
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleSort('type')}
                      endIcon={
                        sortConfig.key === 'type' ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : null
                      }
                    >
                      Type
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleSort('subtype')}
                      endIcon={
                        sortConfig.key === 'subtype' ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : null
                      }
                    >
                      Subtype
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleSort('balance')}
                      endIcon={
                        sortConfig.key === 'balance' ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : null
                      }
                    >
                      Balance
                    </Button>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedAndFilteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.number}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountTypeIcon type={account.type} />
                        {account.type}
                      </Box>
                    </TableCell>
                    <TableCell>{account.subtype}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(account.balance)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={account.isActive}
                        onChange={() => {
                          setAccounts(
                            accounts.map((a) =>
                              a.id === account.id
                                ? { ...a, isActive: !a.isActive }
                                : a
                            )
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>{account.description}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditAccount(account.id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAccount(account.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
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
      <Dialog
        open={isAddingAccount}
        onClose={() => setIsAddingAccount(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Account</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Account Name"
              value={newAccount.name}
              onChange={handleAccountNameChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && nameSuggestions.length > 0 && (
              <Paper 
                elevation={2} 
                sx={{ 
                  mt: 1, 
                  maxHeight: 300, 
                  overflow: 'auto',
                  position: 'relative',
                  zIndex: 1,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '4px',
                    '&:hover': {
                      background: '#555',
                    },
                  },
                }}
              >
                <List>
                  {nameSuggestions.map((suggestion, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {suggestion.name}
                            </Typography>
                            <Chip
                              label={`${Math.round(suggestion.score * 100)}% match`}
                              size="small"
                              color={suggestion.score > 0.8 ? 'success' : suggestion.score > 0.6 ? 'warning' : 'default'}
                              sx={{ ml: 1 }}
                            />
                            {suggestion.subtype && (
                              <Chip
                                label={suggestion.subtype}
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {suggestion.description}
                            </Typography>
                            {suggestion.name.toLowerCase().includes('tax') && (
                              <Alert 
                                severity="info" 
                                sx={{ mt: 1, fontSize: '0.75rem' }}
                              >
                                <Typography variant="caption">
                                  <strong>Tax Tip:</strong> This account tracks {suggestion.name.toLowerCase().includes('sales') ? 'sales tax collected from customers' : suggestion.name.toLowerCase().includes('payroll') ? 'taxes withheld from employee paychecks' : 'income taxes owed to the government'}. Make sure to remit these taxes to the appropriate government agency on time.
                                </Typography>
                              </Alert>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            {suggestedType && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Based on the account name, we suggest using the "{suggestedType}" account type.
                </Typography>
                <Typography variant="body2">
                  {ACCOUNT_TYPES.find(t => t.value === suggestedType)?.description}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  This account will appear on the {ACCOUNT_TYPES.find(t => t.value === suggestedType)?.financialStatement}.
                </Typography>
              </Alert>
            )}
            <FormControl fullWidth error={!!formErrors.type}>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={newAccount.type}
                onChange={handleTypeChange}
                label="Account Type"
              >
                {ACCOUNT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography>{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
            </FormControl>
            <Button
              variant="text"
              onClick={() => setShowExamples(!showExamples)}
              startIcon={<InfoIcon />}
            >
              {showExamples ? 'Hide Examples' : 'Show Common Examples'}
            </Button>
            {showExamples && (
              <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Common {newAccount.type} Accounts:
                </Typography>
                <Grid container spacing={1}>
                  {ACCOUNT_TYPES.find(t => t.value === newAccount.type)?.examples.map((example) => (
                    <Grid item xs={6} key={example}>
                      <Chip
                        label={example}
                        size="small"
                        onClick={() => {
                          setNewAccount({ ...newAccount, name: example });
                          analyzeAccountName(example);
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            <FormControl fullWidth>
              <InputLabel>Subtype</InputLabel>
              <Select
                value={newAccount.subtype}
                onChange={(e) => setNewAccount({ ...newAccount, subtype: e.target.value })}
                label="Subtype"
              >
                {suggestedSubtypes.map((subtype) => (
                  <MenuItem key={subtype} value={subtype}>
                    {subtype}
                  </MenuItem>
                ))}
              </Select>
              {suggestedSubtypes.length > 0 && (
                <FormHelperText>
                  Suggested subtypes based on the account type
                </FormHelperText>
              )}
            </FormControl>
            <TextField
              label="Description"
              value={newAccount.description}
              onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newAccount.isActive}
                  onChange={(e) => setNewAccount({ ...newAccount, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddingAccount(false)}>Cancel</Button>
          <Button onClick={handleAddAccount} variant="contained" color="primary">
            Add Account
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

      <Dialog
        open={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Account</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Account Name"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
            />
            <FormControl fullWidth error={!!formErrors.type}>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={newAccount.type}
                onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                label="Account Type"
              >
                {ACCOUNT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Subtype</InputLabel>
              <Select
                value={newAccount.subtype}
                onChange={(e) => setNewAccount({ ...newAccount, subtype: e.target.value })}
                label="Subtype"
              >
                {ACCOUNT_TYPES.find(t => t.value === newAccount.type)?.subtypes.map((subtype) => (
                  <MenuItem key={subtype} value={subtype}>
                    {subtype}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={newAccount.description}
              onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newAccount.isActive}
                  onChange={(e) => setNewAccount({ ...newAccount, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingAccount(null)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default ChartOfAccountsPage; 