import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip,
} from '@mui/material';
import { AttachFile as AttachFileIcon, TrendingUp as IncomeIcon, TrendingDown as ExpenseIcon, Receipt as ReceiptIcon, SwapHoriz as TransferIcon, Business as AssetIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Layout from '../components/Layout';
import { useAccounts } from '../contexts/AccountsContext';
import { useToast } from '../contexts/ToastContext';

// Constants
const DEFAULT_SALES_TAX_RATE = 0.07; // 7% default sales tax rate

interface AccountCategory {
  [key: string]: string;
}

interface ChartOfAccounts {
  [key: string]: AccountCategory;
}

interface IndustryContext {
  type: string;
  keywords: string[];
  accountMappings: Record<string, string[]>;
}

interface AccountMapping {
  account: string;
  keywords: string[];
  patterns: RegExp[];
  vendors?: string[];
  defaultFor?: string[];
  confidenceBoost?: number;
  tags?: string[];
  industrySpecific?: boolean;
}

interface AccountPrediction {
  account: string;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{
    account: string;
    confidence: number;
    reasoning: string;
  }>;
}

const CHART_OF_ACCOUNTS: ChartOfAccounts = {
  assets: {
    cash: 'Cash & Checking',
    savings: 'Savings',
    accounts_receivable: 'Accounts Receivable',
    inventory: 'Inventory',
    prepaid_expenses: 'Prepaid Expenses',
    vehicles: 'Vehicles',
    equipment: 'Equipment',
    furniture: 'Furniture',
    leasehold_improvements: 'Leasehold Improvements',
    deposits: 'Deposits',
    intangible_assets: 'Intangible Assets',
  },
  liabilities: {
    accounts_payable: 'Accounts Payable',
    credit_card: 'Credit Card Payable',
    sales_tax: 'Sales Tax Payable',
    payroll: 'Payroll Liabilities',
    vehicle_loans: 'Vehicle Loans',
    sba_loan: 'SBA Loan',
    mortgage: 'Mortgage Payable',
  },
  equity: {
    owners_equity: "Owner's Equity",
    owners_contributions: "Owner's Contributions",
    owners_draws: "Owner's Draws",
    retained_earnings: 'Retained Earnings',
  },
  income: {
    service_revenue: 'Service Revenue',
    product_sales: 'Product Sales',
    interest_income: 'Interest Income',
    rental_income: 'Rental Income',
    consulting_revenue: 'Consulting Revenue',
    commission_income: 'Commission Income',
    other_income: 'Other Income',
  },
  cogs: {
    materials: 'Materials & Supplies',
    inventory_cost: 'Cost of Inventory Sold',
    subcontractor: 'Subcontractor Fees',
    shipping: 'Shipping & Delivery',
  },
  expenses: {
    advertising: 'Advertising & Marketing',
    office_supplies: 'Office Supplies',
    utilities: 'Utilities',
    insurance: 'Insurance',
    fuel: 'Fuel',
    meals: 'Meals & Entertainment',
    professional_services: 'Professional Services',
    repairs: 'Repairs & Maintenance',
    rent: 'Rent',
    software: 'Software Subscriptions',
    wages: 'Wages & Payroll',
    taxes: 'Taxes & Licenses',
    travel: 'Travel',
    bank_fees: 'Bank Fees',
    telephone: 'Telephone',
    internet: 'Internet',
    training: 'Training & Development',
    cleaning: 'Cleaning Services',
    security: 'Security Services',
    landscaping: 'Landscaping Services',
    parking: 'Parking',
    postage: 'Postage & Delivery',
    printing: 'Printing & Reproduction',
    storage: 'Storage',
    uniforms: 'Uniforms & Work Clothes',
    waste: 'Waste Disposal',
    water: 'Water',
    workers_comp: 'Workers Compensation',
    other: 'Other Expenses',
  },
};

const COMMON_TRANSACTIONS: Record<'expense' | 'income' | 'transfer', AccountCategory> = {
  expense: CHART_OF_ACCOUNTS.expenses,
  income: CHART_OF_ACCOUNTS.income,
  transfer: CHART_OF_ACCOUNTS.assets, // For transfers, we'll use asset accounts
};

interface JournalEntry {
  date: string;
  debit: {
    account: string;
    amount: number;
  };
  credit: {
    account: string;
    amount: number;
  };
}

interface Transaction {
  date: Date;
  amount: number;
  description: string;
  businessAccount: string;
  receipt?: File;
  journalEntry?: JournalEntry;
  type?: 'expense' | 'income' | 'transfer' | 'asset_purchase';
}

interface SalesTaxInfo {
  included: boolean;
  rate: number;
  amount: number;
  revenue: number;
}

interface TransactionAnalysis {
  journal_entry: JournalEntry;
  type: 'expense' | 'income' | 'transfer' | 'asset_purchase';
  confidence: number;
  explanation: string;
  sales_tax?: SalesTaxInfo;
  alternative_suggestions?: {
    account: string;
    confidence: number;
    explanation: string;
  }[];
}

interface AssetMetadata {
  description: string;
  useful_life_years?: number;
  depreciation_method?: 'Straight Line' | 'Double Declining' | 'Units of Production';
}

interface AssetPurchaseAnalysis extends TransactionAnalysis {
  type: 'asset_purchase';
  asset_metadata: AssetMetadata;
}

const ASSET_TYPES = {
  equipment: 'Equipment',
  vehicles: 'Vehicles',
  furniture: 'Furniture',
  leasehold_improvements: 'Leasehold Improvements',
  intangible_assets: 'Intangible Assets',
} as const;

// Industry-specific contexts
const INDUSTRY_CONTEXTS: Record<string, IndustryContext> = {
  landscaping: {
    type: 'landscaping',
    keywords: ['landscape', 'garden', 'lawn', 'drainage', 'irrigation'],
    accountMappings: {
      'Subcontractor Expense': ['contractor', 'labor', 'crew', 'help', 'worker'],
      'Materials': ['soil', 'plants', 'mulch', 'fertilizer', 'pavers'],
      'Equipment Rental': ['rental', 'machine', 'truck', 'trailer'],
    },
  },
  construction: {
    type: 'construction',
    keywords: ['build', 'construction', 'contractor', 'subcontractor', 'job site'],
    accountMappings: {
      'Subcontractor Expense': ['contractor', 'subcontractor', 'labor', 'crew'],
      'Materials': ['lumber', 'concrete', 'drywall', 'paint', 'supplies'],
      'Equipment Rental': ['rental', 'machine', 'truck', 'trailer'],
    },
  },
  retail: {
    type: 'retail',
    keywords: ['store', 'retail', 'merchandise', 'inventory', 'sales'],
    accountMappings: {
      'Cost of Goods Sold': ['inventory', 'merchandise', 'product', 'stock'],
      'Advertising': ['ad', 'marketing', 'promotion', 'social media'],
      'Store Supplies': ['supplies', 'bags', 'boxes', 'packaging'],
    },
  },
};

// Enhanced account mappings with industry context
const ACCOUNT_MAPPINGS: Record<string, AccountMapping[]> = {
  expense: [
    {
      account: CHART_OF_ACCOUNTS.expenses.subcontractor,
      keywords: ['contractor', 'subcontractor', 'labor', 'crew', 'help', 'worker'],
      patterns: [/paid\s*to\s*contractor/i, /hired\s*labor/i, /subcontractor\s*work/i],
      tags: ['labor', 'external', 'job-related'],
      industrySpecific: true,
      confidenceBoost: 0.2,
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.fuel,
      keywords: ['gas', 'fuel', 'petrol', 'diesel', 'filling', 'station'],
      patterns: [/gas\s*station/i, /fuel\s*purchase/i, /filling\s*station/i],
      vendors: ['shell', 'chevron', 'exxon', 'bp', 'mobil', 'valero', 'costco gas', 'sams club gas'],
      confidenceBoost: 0.2,
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.advertising,
      keywords: ['ad', 'marketing', 'promotion', 'social media', 'advertising'],
      patterns: [/marketing\s*campaign/i, /ad\s*campaign/i],
      vendors: ['google ads', 'facebook ads', 'linkedin ads', 'instagram ads'],
      tags: ['marketing', 'promotion'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.software,
      keywords: ['software', 'subscription', 'saas', 'app', 'license'],
      patterns: [/software\s*subscription/i, /saas\s*service/i],
      vendors: ['adobe', 'microsoft', 'quickbooks', 'salesforce', 'slack', 'zoom'],
      tags: ['technology', 'subscription'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.materials,
      keywords: ['materials', 'supplies', 'inventory', 'stock', 'product'],
      patterns: [/materials\s*purchase/i, /supplies\s*purchase/i],
      vendors: ['home depot', 'lowes', 'grainger', 'mcmaster-carr'],
      tags: ['inventory', 'supplies'],
      industrySpecific: true,
    },
  ],
  income: [
    {
      account: CHART_OF_ACCOUNTS.income.service_revenue,
      keywords: ['service', 'consulting', 'professional', 'work', 'project'],
      patterns: [/service\s*provided/i, /consulting\s*work/i],
    },
    {
      account: CHART_OF_ACCOUNTS.income.product_sales,
      keywords: ['sale', 'product', 'merchandise', 'inventory', 'item'],
      patterns: [/product\s*sale/i, /merchandise\s*sale/i],
    },
  ],
};

const ASSET_MAPPINGS: Record<string, AccountMapping[]> = {
  asset_purchase: [
    {
      account: CHART_OF_ACCOUNTS.assets.equipment,
      keywords: ['computer', 'laptop', 'printer', 'server', 'equipment', 'machine'],
      patterns: [/computer\s*purchase/i, /equipment\s*purchase/i],
      vendors: ['dell', 'hp', 'lenovo', 'apple', 'microsoft'],
    },
    {
      account: CHART_OF_ACCOUNTS.assets.vehicles,
      keywords: ['car', 'truck', 'vehicle', 'van', 'automobile'],
      patterns: [/vehicle\s*purchase/i, /car\s*purchase/i],
      vendors: ['toyota', 'ford', 'honda', 'chevrolet', 'nissan'],
    },
    {
      account: CHART_OF_ACCOUNTS.assets.furniture,
      keywords: ['desk', 'chair', 'table', 'furniture', 'couch', 'shelf'],
      patterns: [/furniture\s*purchase/i, /office\s*furniture/i],
      vendors: ['ikea', 'herman miller', 'steelcase', 'haworth'],
    },
  ],
};

const TransactionEntryPage: React.FC = () => {
  const { accounts } = useAccounts();
  const { showToast } = useToast();
  const [transaction, setTransaction] = useState<Transaction>({
    date: new Date(),
    amount: 0,
    description: '',
    businessAccount: '',
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'transfer' | 'asset_purchase'>('expense');
  const [analysis, setAnalysis] = useState<TransactionAnalysis | AssetPurchaseAnalysis | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [salesTaxIncluded, setSalesTaxIncluded] = useState(false);
  const [salesTaxRate, setSalesTaxRate] = useState(DEFAULT_SALES_TAX_RATE);
  const [otherSideAccount, setOtherSideAccount] = useState<string>('');
  const [assetType, setAssetType] = useState<string>('');
  const [usefulLife, setUsefulLife] = useState<number>(5); // Default 5 years
  const [depreciationMethod, setDepreciationMethod] = useState<'Straight Line' | 'Double Declining' | 'Units of Production'>('Straight Line');
  const [industryContext, setIndustryContext] = useState<IndustryContext | null>(null);
  const [userCorrections, setUserCorrections] = useState<Array<{
    description: string;
    selectedAccount: string;
    timestamp: Date;
  }>>([]);

  const calculateSalesTax = (total: number, rate: number): SalesTaxInfo => {
    const revenue = total / (1 + rate);
    const taxAmount = total - revenue;
    return {
      included: true,
      rate,
      amount: taxAmount,
      revenue,
    };
  };

  const validateTransaction = (): string | null => {
    if (!transaction.description) {
      return 'Please enter a description';
    }
    if (!transaction.businessAccount) {
      return 'Please select a business account';
    }
    if (transaction.amount <= 0) {
      return 'Amount must be greater than 0';
    }
    if (transactionType === 'transfer' && !otherSideAccount) {
      return 'Please select a transfer destination account';
    }
    if (transactionType === 'transfer' && transaction.businessAccount === otherSideAccount) {
      return 'Cannot transfer to the same account';
    }
    if (salesTaxIncluded && salesTaxRate <= 0) {
      return 'Sales tax rate must be greater than 0';
    }
    return null;
  };

  // Function to detect industry context from description
  const detectIndustryContext = (description: string): IndustryContext | null => {
    const lowerDesc = description.toLowerCase();
    for (const [key, context] of Object.entries(INDUSTRY_CONTEXTS)) {
      if (context.keywords.some(keyword => lowerDesc.includes(keyword))) {
        return context;
      }
    }
    return null;
  };

  // Enhanced account prediction with industry context
  const getSuggestedAccount = (description: string): AccountPrediction | null => {
    const lowerDesc = description.toLowerCase();
    const mappings = ACCOUNT_MAPPINGS[transactionType] || [];
    const detectedIndustry = detectIndustryContext(description);
    
    let bestMatch: AccountPrediction | null = null;
    const alternatives: AccountPrediction[] = [];

    // Check user corrections first
    const userCorrection = userCorrections.find(correction => 
      correction.description.toLowerCase() === lowerDesc
    );
    if (userCorrection) {
      return {
        account: userCorrection.selectedAccount,
        confidence: 0.95,
        reasoning: 'Based on your previous correction for similar transactions',
      };
    }

    for (const mapping of mappings) {
      let confidence = 0;
      let reasoning = '';

      // Apply industry-specific boost
      if (mapping.industrySpecific && detectedIndustry) {
        const industryMapping = detectedIndustry.accountMappings[mapping.account];
        if (industryMapping?.some(keyword => lowerDesc.includes(keyword))) {
          confidence = 0.9;
          reasoning = `Based on ${detectedIndustry.type} industry context and description keywords`;
        }
      }

      // Check vendor names
      if (mapping.vendors?.some(vendor => lowerDesc.includes(vendor.toLowerCase()))) {
        confidence = Math.max(confidence, 0.9 + (mapping.confidenceBoost || 0));
        reasoning = `Transaction description includes vendor name associated with ${mapping.account}`;
      }
      
      // Check patterns
      else if (mapping.patterns.some(pattern => pattern.test(description))) {
        confidence = Math.max(confidence, 0.8);
        reasoning = `Transaction description matches pattern for ${mapping.account}`;
      }
      
      // Check keywords
      else if (mapping.keywords.some(keyword => lowerDesc.includes(keyword))) {
        confidence = Math.max(confidence, 0.7);
        reasoning = `Transaction description includes keywords associated with ${mapping.account}`;
      }

      // Check partial matches
      else {
        for (const keyword of mapping.keywords) {
          if (keyword.includes(lowerDesc) || lowerDesc.includes(keyword)) {
            confidence = Math.max(confidence, 0.5);
            reasoning = `Transaction description partially matches keywords for ${mapping.account}`;
            break;
          }
        }
      }

      if (confidence > 0) {
        const prediction: AccountPrediction = {
          account: mapping.account,
          confidence,
          reasoning,
        };

        if (!bestMatch || confidence > bestMatch.confidence) {
          if (bestMatch) {
            alternatives.push(bestMatch);
          }
          bestMatch = prediction;
        } else {
          alternatives.push(prediction);
        }
      }
    }

    // Sort alternatives by confidence
    alternatives.sort((a, b) => b.confidence - a.confidence);

    if (bestMatch) {
      bestMatch.alternatives = alternatives.slice(0, 2);
    }

    return bestMatch;
  };

  const analyzeTransaction = async () => {
    const validationError = validateTransaction();
    if (validationError) {
      showToast(validationError, 'warning');
      return;
    }

    setIsAnalyzing(true);
    try {
      const salesTax = salesTaxIncluded ? calculateSalesTax(transaction.amount, salesTaxRate) : undefined;
      const suggestedAccount = getSuggestedAccount(transaction.description);

      let debitAccount = '';
      let creditAccount = '';

      switch (transactionType) {
        case 'expense':
          debitAccount = suggestedAccount?.account || CHART_OF_ACCOUNTS.expenses.other;
          creditAccount = suggestedAccount?.account || CHART_OF_ACCOUNTS.income.service_revenue;
          break;
        case 'income':
          debitAccount = suggestedAccount?.account || CHART_OF_ACCOUNTS.assets.cash;
          creditAccount = suggestedAccount?.account || CHART_OF_ACCOUNTS.income.service_revenue;
          break;
        case 'transfer':
          debitAccount = assetType || suggestedAccount?.account || CHART_OF_ACCOUNTS.assets.equipment;
          creditAccount = otherSideAccount || CHART_OF_ACCOUNTS.assets.cash;
          break;
        case 'asset_purchase':
          debitAccount = assetType || suggestedAccount?.account || CHART_OF_ACCOUNTS.assets.equipment;
          creditAccount = transaction.businessAccount;
          break;
      }

      const mockResponse: TransactionAnalysis | AssetPurchaseAnalysis = {
        journal_entry: {
          date: transaction.date.toISOString().split('T')[0],
          debit: {
            account: debitAccount,
            amount: transaction.amount,
          },
          credit: {
            account: creditAccount,
            amount: transaction.amount,
          },
        },
        type: transactionType === 'asset_purchase' ? 'asset_purchase' : transactionType,
        confidence: suggestedAccount?.confidence || 0.5,
        explanation: suggestedAccount?.reasoning || 
          `Based on the description "${transaction.description}" and amount $${transaction.amount}, this appears to be a ${transactionType}.`,
        sales_tax: salesTax,
        alternative_suggestions: ACCOUNT_MAPPINGS[transactionType]
          ?.filter(mapping => mapping.account !== suggestedAccount?.account)
          .map(mapping => ({
            account: mapping.account,
            confidence: 0.6,
            explanation: `Could also be categorized as ${mapping.account} based on the description.`,
          }))
          .slice(0, 2),
        ...(transactionType === 'asset_purchase' && {
          asset_metadata: {
            description: transaction.description,
            useful_life_years: usefulLife,
            depreciation_method: depreciationMethod,
          },
        }),
      };

      setAnalysis(mockResponse);
      setTransaction(prev => ({
        ...prev,
        journalEntry: mockResponse.journal_entry,
        type: mockResponse.type,
      }));
    } catch (error) {
      showToast('Error analyzing transaction', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to handle user corrections
  const handleAccountSelect = (account: string, side: 'debit' | 'credit') => {
    if (side === 'debit') {
      setSelectedAccount(account);
    } else {
      setOtherSideAccount(account);
    }

    // Store user correction for learning
    if (transaction.description) {
      setUserCorrections(prev => [
        ...prev,
        {
          description: transaction.description,
          selectedAccount: account,
          timestamp: new Date(),
        },
      ]);
    }

    if (analysis) {
      setTransaction(prev => ({
        ...prev,
        journalEntry: {
          ...analysis.journal_entry,
          [side]: {
            ...analysis.journal_entry[side],
            account,
          },
        },
      }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTransaction(prev => ({ ...prev, receipt: file }));
    }
  };

  const handleSubmit = async () => {
    if (!transaction.journalEntry) {
      showToast('Please analyze the transaction first', 'warning');
      return;
    }

    try {
      // Simulate API call to save transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Transaction recorded successfully', 'success');
      // Reset form
      setTransaction({
        date: new Date(),
        amount: 0,
        description: '',
        businessAccount: '',
      });
    } catch (error) {
      showToast('Error recording transaction', 'error');
    }
  };

  const getAvailableAccounts = (side: 'debit' | 'credit'): string[] => {
    switch (transactionType) {
      case 'expense':
        if (side === 'debit') {
          // For expenses, debit side can be any expense account
          return Object.values(CHART_OF_ACCOUNTS.expenses);
        } else {
          // Credit side must be an asset account (business account)
          return Object.values(CHART_OF_ACCOUNTS.assets);
        }
      case 'income':
        if (side === 'debit') {
          // For income, debit side must be an asset account (business account)
          return Object.values(CHART_OF_ACCOUNTS.assets);
        } else {
          // Credit side can be any income account
          return Object.values(CHART_OF_ACCOUNTS.income);
        }
      case 'transfer':
        // For transfers, both sides must be asset accounts
        return Object.values(CHART_OF_ACCOUNTS.assets);
      case 'asset_purchase':
        if (side === 'debit') {
          // For asset purchases, debit side can be any asset account
          return Object.values(CHART_OF_ACCOUNTS.assets);
        } else {
          // Credit side must be an asset account (business account)
          return Object.values(CHART_OF_ACCOUNTS.assets);
        }
      default:
        return [];
    }
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Record Transaction
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Transaction Type
                </Typography>
                <ToggleButtonGroup
                  value={transactionType}
                  exclusive
                  onChange={(_, newType) => newType && setTransactionType(newType)}
                  fullWidth
                >
                  <ToggleButton value="expense">
                    <ExpenseIcon sx={{ mr: 1 }} />
                    Expense
                  </ToggleButton>
                  <ToggleButton value="income">
                    <IncomeIcon sx={{ mr: 1 }} />
                    Income
                  </ToggleButton>
                  <ToggleButton value="transfer">
                    <TransferIcon sx={{ mr: 1 }} />
                    Transfer
                  </ToggleButton>
                  <ToggleButton value="asset_purchase">
                    <AssetIcon sx={{ mr: 1 }} />
                    Asset Purchase
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={transaction.date}
                  onChange={(newDate) => newDate && setTransaction({ ...transaction, date: newDate })}
                  sx={{ width: '100%', mb: 2 }}
                />
              </LocalizationProvider>

              <TextField
                label="Amount"
                type="number"
                value={transaction.amount}
                onChange={(e) => setTransaction({ ...transaction, amount: parseFloat(e.target.value) })}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Business Account</InputLabel>
                <Select
                  value={transaction.businessAccount}
                  onChange={(e) => setTransaction({ ...transaction, businessAccount: e.target.value })}
                  label="Business Account"
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.name}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Description"
                value={transaction.description}
                onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />

              {transactionType === 'income' && (
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={salesTaxIncluded}
                        onChange={(e) => setSalesTaxIncluded(e.target.checked)}
                      />
                    }
                    label="Sales tax included in amount"
                  />
                  {salesTaxIncluded && (
                    <TextField
                      label="Sales Tax Rate"
                      type="number"
                      value={salesTaxRate * 100}
                      onChange={(e) => setSalesTaxRate(parseFloat(e.target.value) / 100)}
                      fullWidth
                      sx={{ mt: 2 }}
                      InputProps={{
                        endAdornment: <Typography>%</Typography>,
                      }}
                      helperText={`Default rate: ${DEFAULT_SALES_TAX_RATE * 100}%`}
                    />
                  )}
                </Box>
              )}

              {transactionType === 'transfer' && (
                <Tooltip title="Select the account to transfer funds to">
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Transfer To Account</InputLabel>
                    <Select
                      value={otherSideAccount}
                      onChange={(e) => setOtherSideAccount(e.target.value)}
                      label="Transfer To Account"
                      error={transaction.businessAccount === otherSideAccount}
                    >
                      {accounts.map((account) => (
                        <MenuItem key={account.id} value={account.name}>
                          {account.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {transaction.businessAccount === otherSideAccount && (
                      <Typography color="error" variant="caption">
                        Cannot transfer to the same account
                      </Typography>
                    )}
                  </FormControl>
                </Tooltip>
              )}

              {transactionType === 'asset_purchase' && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Asset Type</InputLabel>
                    <Select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value)}
                      label="Asset Type"
                    >
                      {Object.entries(ASSET_TYPES).map(([key, value]) => (
                        <MenuItem key={key} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Useful Life (years)"
                    type="number"
                    value={usefulLife}
                    onChange={(e) => setUsefulLife(Number(e.target.value))}
                    fullWidth
                    sx={{ mb: 2 }}
                    helperText="Used for depreciation calculations"
                  />

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Depreciation Method</InputLabel>
                    <Select
                      value={depreciationMethod}
                      onChange={(e) => setDepreciationMethod(e.target.value as any)}
                      label="Depreciation Method"
                    >
                      <MenuItem value="Straight Line">Straight Line</MenuItem>
                      <MenuItem value="Double Declining">Double Declining</MenuItem>
                      <MenuItem value="Units of Production">Units of Production</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              <input
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                id="receipt-upload"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="receipt-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AttachFileIcon />}
                  sx={{ mb: 2 }}
                >
                  Attach Receipt
                </Button>
              </label>
              {transaction.receipt && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {transaction.receipt.name}
                </Typography>
              )}

              <Button
                variant="contained"
                onClick={analyzeTransaction}
                disabled={isAnalyzing || !transaction.description || !transaction.businessAccount}
                startIcon={isAnalyzing ? <CircularProgress size={20} /> : null}
                sx={{ mb: 2 }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Transaction'}
              </Button>
            </Grid>

            {analysis && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: '#F8F9FA' }}>
                  <Typography variant="h6" gutterBottom>
                    Journal Entry
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Tooltip title="The account receiving the funds">
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Debit
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {analysis.journal_entry.debit.account}
                          </Typography>
                          <Chip
                            label={`$${analysis.journal_entry.debit.amount.toFixed(2)}`}
                            size="small"
                            color="primary"
                          />
                        </Box>
                        <FormControl fullWidth sx={{ mt: 1 }}>
                          <InputLabel>Change Debit Account</InputLabel>
                          <Select
                            value={selectedAccount}
                            onChange={(e) => handleAccountSelect(e.target.value, 'debit')}
                            label="Change Debit Account"
                          >
                            {getAvailableAccounts('debit').map((account) => (
                              <MenuItem key={account} value={account}>
                                {account}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Tooltip>

                    <Tooltip title="The account providing the funds">
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Credit
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {analysis.journal_entry.credit.account}
                          </Typography>
                          <Chip
                            label={`$${analysis.journal_entry.credit.amount.toFixed(2)}`}
                            size="small"
                            color="primary"
                          />
                        </Box>
                        <FormControl fullWidth sx={{ mt: 1 }}>
                          <InputLabel>Change Credit Account</InputLabel>
                          <Select
                            value={otherSideAccount}
                            onChange={(e) => handleAccountSelect(e.target.value, 'credit')}
                            label="Change Credit Account"
                          >
                            {getAvailableAccounts('credit').map((account) => (
                              <MenuItem key={account} value={account}>
                                {account}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Tooltip>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Type
                      </Typography>
                      <Chip
                        label={analysis.type}
                        color={analysis.type === 'income' ? 'success' : analysis.type === 'expense' ? 'error' : 'warning'}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Confidence
                      </Typography>
                      <Chip
                        label={`${Math.round(analysis.confidence * 100)}%`}
                        color={analysis.confidence > 0.8 ? 'success' : 'warning'}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Explanation
                      </Typography>
                      <Typography variant="body2">
                        {analysis.explanation}
                      </Typography>
                    </Box>

                    {analysis.sales_tax && (
                      <>
                        <Divider />
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Sales Tax Breakdown
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              Total Amount: ${transaction.amount.toFixed(2)}
                            </Typography>
                            <Typography variant="body2">
                              Revenue: ${analysis.sales_tax.revenue.toFixed(2)}
                            </Typography>
                            <Typography variant="body2">
                              Sales Tax ({analysis.sales_tax.rate * 100}%): ${analysis.sales_tax.amount.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    )}

                    {analysis.alternative_suggestions && analysis.alternative_suggestions.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Alternative Suggestions
                        </Typography>
                        {analysis.alternative_suggestions.map((suggestion, index) => (
                          <Box
                            key={index}
                            sx={{
                              p: 1,
                              mb: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                            onClick={() => handleAccountSelect(suggestion.account, 'debit')}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {suggestion.account}
                              </Typography>
                              <Chip
                                label={`${Math.round(suggestion.confidence * 100)}%`}
                                size="small"
                                color={suggestion.confidence > 0.8 ? 'success' : 'warning'}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {suggestion.explanation}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {analysis.type === 'asset_purchase' && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Asset Details
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              Type: {(analysis as AssetPurchaseAnalysis).asset_metadata.description}
                            </Typography>
                            <Typography variant="body2">
                              Useful Life: {(analysis as AssetPurchaseAnalysis).asset_metadata.useful_life_years} years
                            </Typography>
                            <Typography variant="body2">
                              Depreciation Method: {(analysis as AssetPurchaseAnalysis).asset_metadata.depreciation_method}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                </Paper>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleSubmit}
                  sx={{ mt: 2 }}
                >
                  Record Transaction
                </Button>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    </Layout>
  );
};

export default TransactionEntryPage; 