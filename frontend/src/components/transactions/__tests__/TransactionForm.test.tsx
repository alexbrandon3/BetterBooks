import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionForm } from '../TransactionForm';
import { toast } from 'react-hot-toast';
import { Account, AccountType, FinancialCategory } from '../../../types/account';
import { useSmartSuggestion } from '../../../hooks/useSmartSuggestion';

// Mock the services
jest.mock('../../../services/TransactionService', () => ({
  createTransaction: jest.fn()
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the smart suggestion hook
jest.mock('../../../hooks/useSmartSuggestion');
const mockUseSmartSuggestion = useSmartSuggestion as jest.MockedFunction<typeof useSmartSuggestion>;

const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Cash',
    type: AccountType.ASSET,
    category: 'Cash',
    subcategory: 'Cash',
    financialCategory: FinancialCategory.CURRENT_ASSET,
    financialSubcategory: 'Cash',
    balance: 1000
  },
  {
    id: '2',
    name: 'Bank',
    type: AccountType.ASSET,
    category: 'Bank',
    subcategory: 'Checking',
    financialCategory: FinancialCategory.CURRENT_ASSET,
    financialSubcategory: 'Checking',
    balance: 5000
  },
  {
    id: '3',
    name: 'Expenses',
    type: AccountType.EXPENSE,
    category: 'Expenses',
    subcategory: 'General',
    financialCategory: FinancialCategory.OPERATING_EXPENSE,
    financialSubcategory: 'General',
    balance: 0
  }
];

const mockInitialValues = {
  id: 1,
  description: 'Test Transaction',
  type: 'EXPENSE' as const,
  date: '2024-03-20',
  entries: [
    { accountId: '1', amount: '100', type: 'DEBIT' as const },
    { accountId: '3', amount: '100', type: 'CREDIT' as const }
  ],
  isRecurring: true,
  startDate: '2024-03-20',
  recurrencePattern: 'MONTHLY' as const,
  terminationDate: '2024-12-31'
};

describe('TransactionForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseSmartSuggestion.mockReturnValue({
      suggestion: null,
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    });
  });

  it('renders form with all fields', () => {
    render(
      <TransactionForm
        accounts={mockAccounts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
    expect(screen.getByTestId('description-input')).toBeInTheDocument();
    expect(screen.getByTestId('date-input')).toBeInTheDocument();
    expect(screen.getByTestId('type-select')).toBeInTheDocument();
    expect(screen.getByTestId('journal-entries')).toBeInTheDocument();
    expect(screen.getByTestId('recurring-toggle')).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(
      <TransactionForm
        accounts={mockAccounts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByTestId('submit-transaction'));

    // Debug output for validation errors
    screen.debug();

    await waitFor(() => {
      expect(screen.getByTestId('error-description')).toBeInTheDocument();
      expect(screen.getByTestId('error-date')).toBeInTheDocument();
      expect(screen.getByTestId('error-entries.0.accountId')).toBeInTheDocument();
      expect(screen.getByTestId('error-entries.0.amount')).toBeInTheDocument();
    });
  });

  it('submits valid one-time transaction successfully', async () => {
    const mockTransaction = {
      description: 'Test Transaction',
      date: '2024-03-20',
      type: 'EXPENSE',
      entries: [
        {
          accountId: '1',
          amount: '100',
          type: 'DEBIT',
          description: ''
        },
        {
          accountId: '3',
          amount: '100',
          type: 'CREDIT',
          description: ''
        }
      ],
      isRecurring: false
    };
    mockOnSubmit.mockResolvedValueOnce(undefined);
    render(
      <TransactionForm
        accounts={mockAccounts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    await userEvent.type(screen.getByTestId('description-input'), mockTransaction.description);
    await userEvent.clear(screen.getByTestId('date-input'));
    await userEvent.type(screen.getByTestId('date-input'), mockTransaction.date);
    await userEvent.selectOptions(screen.getByTestId('type-select'), mockTransaction.type);
    await userEvent.selectOptions(screen.getByTestId('account-select-0'), mockTransaction.entries[0].accountId);
    await userEvent.type(screen.getByTestId('amount-input-0'), mockTransaction.entries[0].amount);
    await userEvent.selectOptions(screen.getByTestId('type-select-0'), mockTransaction.entries[0].type);
    // Add second entry
    fireEvent.click(screen.getByTestId('add-entry'));
    await userEvent.selectOptions(screen.getByTestId('account-select-1'), mockTransaction.entries[1].accountId);
    await userEvent.type(screen.getByTestId('amount-input-1'), mockTransaction.entries[1].amount);
    await userEvent.selectOptions(screen.getByTestId('type-select-1'), mockTransaction.entries[1].type);
    // Debug output before submit
    screen.debug();
    fireEvent.click(screen.getByTestId('submit-transaction'));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(mockTransaction);
      expect(toast.success).toHaveBeenCalledWith('Transaction created successfully');
    });
  });

  it('submits valid recurring transaction', async () => {
    const mockRecurringTransaction = {
      description: 'Recurring Test',
      date: '2024-03-20',
      type: 'EXPENSE',
      entries: [
        {
          accountId: '1',
          amount: '100',
          type: 'DEBIT',
          description: ''
        },
        {
          accountId: '3',
          amount: '100',
          type: 'CREDIT',
          description: ''
        }
      ],
      isRecurring: true,
      startDate: '2024-03-20',
      recurrencePattern: 'MONTHLY',
      terminationDate: '2024-12-31'
    };
    mockOnSubmit.mockResolvedValueOnce(undefined);
    render(
      <TransactionForm
        accounts={mockAccounts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    await userEvent.type(screen.getByTestId('description-input'), mockRecurringTransaction.description);
    await userEvent.clear(screen.getByTestId('date-input'));
    await userEvent.type(screen.getByTestId('date-input'), mockRecurringTransaction.date);
    await userEvent.selectOptions(screen.getByTestId('type-select'), mockRecurringTransaction.type);
    await userEvent.selectOptions(screen.getByTestId('account-select-0'), mockRecurringTransaction.entries[0].accountId);
    await userEvent.type(screen.getByTestId('amount-input-0'), mockRecurringTransaction.entries[0].amount);
    await userEvent.selectOptions(screen.getByTestId('type-select-0'), mockRecurringTransaction.entries[0].type);
    // Add second entry
    fireEvent.click(screen.getByTestId('add-entry'));
    await userEvent.selectOptions(screen.getByTestId('account-select-1'), mockRecurringTransaction.entries[1].accountId);
    await userEvent.type(screen.getByTestId('amount-input-1'), mockRecurringTransaction.entries[1].amount);
    await userEvent.selectOptions(screen.getByTestId('type-select-1'), mockRecurringTransaction.entries[1].type);
    // Enable recurring
    fireEvent.click(screen.getByTestId('recurring-checkbox'));
    // Fill recurring fields
    await userEvent.clear(screen.getByTestId('start-date-input'));
    await userEvent.type(screen.getByTestId('start-date-input'), mockRecurringTransaction.startDate);
    await userEvent.selectOptions(screen.getByTestId('recurrence-pattern-select'), mockRecurringTransaction.recurrencePattern);
    await userEvent.clear(screen.getByTestId('termination-date-input'));
    await userEvent.type(screen.getByTestId('termination-date-input'), mockRecurringTransaction.terminationDate);
    // Debug output before submit
    screen.debug();
    fireEvent.click(screen.getByTestId('submit-transaction'));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(mockRecurringTransaction);
      expect(toast.success).toHaveBeenCalledWith('Transaction created successfully');
    });
  });

  it('submits valid multi-line split transaction', async () => {
    const mockSplitTransaction = {
      description: 'Split Test',
      date: '2024-03-20',
      type: 'EXPENSE',
      entries: [
        {
          accountId: '1',
          amount: '100',
          type: 'DEBIT',
          description: ''
        },
        {
          accountId: '2',
          amount: '50',
          type: 'CREDIT',
          description: ''
        },
        {
          accountId: '3',
          amount: '50',
          type: 'CREDIT',
          description: ''
        }
      ],
      isRecurring: false
    };

    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <TransactionForm
        accounts={mockAccounts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await userEvent.type(screen.getByTestId('description-input'), mockSplitTransaction.description);
    await userEvent.clear(screen.getByTestId('date-input'));
    await userEvent.type(screen.getByTestId('date-input'), mockSplitTransaction.date);
    await userEvent.selectOptions(screen.getByTestId('type-select'), mockSplitTransaction.type);
    
    // First entry
    await userEvent.selectOptions(screen.getByTestId('account-select-0'), mockSplitTransaction.entries[0].accountId);
    await userEvent.type(screen.getByTestId('amount-input-0'), mockSplitTransaction.entries[0].amount);
    await userEvent.selectOptions(screen.getByTestId('type-select-0'), mockSplitTransaction.entries[0].type);

    // Add second entry
    fireEvent.click(screen.getByTestId('add-entry'));
    await userEvent.selectOptions(screen.getByTestId('account-select-1'), mockSplitTransaction.entries[1].accountId);
    await userEvent.type(screen.getByTestId('amount-input-1'), mockSplitTransaction.entries[1].amount);
    await userEvent.selectOptions(screen.getByTestId('type-select-1'), mockSplitTransaction.entries[1].type);

    // Add third entry
    fireEvent.click(screen.getByTestId('add-entry'));
    await userEvent.selectOptions(screen.getByTestId('account-select-2'), mockSplitTransaction.entries[2].accountId);
    await userEvent.type(screen.getByTestId('amount-input-2'), mockSplitTransaction.entries[2].amount);
    await userEvent.selectOptions(screen.getByTestId('type-select-2'), mockSplitTransaction.entries[2].type);

    // Debug output before submit
    screen.debug();

    fireEvent.click(screen.getByTestId('submit-transaction'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(mockSplitTransaction);
      expect(toast.success).toHaveBeenCalledWith('Transaction created successfully');
    });
  });

  it('shows error toast on submission failure', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Failed to create transaction'));

    render(
      <TransactionForm
        accounts={mockAccounts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await userEvent.type(screen.getByTestId('description-input'), 'Test Transaction');
    await userEvent.clear(screen.getByTestId('date-input'));
    await userEvent.type(screen.getByTestId('date-input'), '2024-03-20');
    await userEvent.selectOptions(screen.getByTestId('type-select'), 'EXPENSE');
    await userEvent.selectOptions(screen.getByTestId('account-select-0'), '1');
    await userEvent.type(screen.getByTestId('amount-input-0'), '100');
    await userEvent.selectOptions(screen.getByTestId('type-select-0'), 'DEBIT');

    // Debug output before submit
    screen.debug();

    fireEvent.click(screen.getByTestId('submit-transaction'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save transaction');
    });
  });
});

describe('TransactionForm - Smart Suggestions', () => {
  const defaultProps = {
    accounts: mockAccounts,
    onSubmit: jest.fn(),
    onCancel: jest.fn()
  };

  it('should show suggestion chip when suggestion is available and no account is selected', () => {
    mockUseSmartSuggestion.mockReturnValue({
      suggestion: {
        suggestedAccountId: 2,
        suggestedAccountName: 'Meals & Entertainment',
        reason: "Matched keyword: 'restaurant' → Category: Food"
      },
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    });

    render(<TransactionForm {...defaultProps} />);

    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.change(descriptionInput, { target: { value: 'Dinner at restaurant' } });

    expect(screen.getByTestId('suggestion-chip')).toBeInTheDocument();
    expect(screen.getByText('Suggested: Meals & Entertainment')).toBeInTheDocument();
  });

  it('should show individual suggestion chips for split transactions', () => {
    // Mock multiple suggestion hooks for split transactions
    const mockSuggestionHook = {
      suggestion: {
        suggestedAccountId: 2,
        suggestedAccountName: 'Meals & Entertainment',
        reason: "Matched keyword: 'restaurant' → Category: Food"
      },
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    };

    const mockMainHook = {
      suggestion: null,
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    };

    // Mock for all hook calls using mockReturnValue
    mockUseSmartSuggestion
      .mockReturnValueOnce(mockMainHook) // Main suggestion hook
      .mockReturnValue(mockSuggestionHook); // All other hooks

    render(<TransactionForm {...defaultProps} />);

    // Add a second entry to create a split transaction
    const addEntryButton = screen.getByTestId('add-entry');
    fireEvent.click(addEntryButton);

    // Type in descriptions for both entries
    const descriptionInput0 = screen.getByTestId('description-input-0');
    const descriptionInput1 = screen.getByTestId('description-input-1');
    
    fireEvent.change(descriptionInput0, { target: { value: 'Dinner at restaurant' } });
    fireEvent.change(descriptionInput1, { target: { value: 'Lunch at cafe' } });

    // Should show suggestion chips for both entries
    expect(screen.getByTestId('entry-suggestion-chip-0')).toBeInTheDocument();
    expect(screen.getByTestId('entry-suggestion-chip-1')).toBeInTheDocument();
  });

  it('should apply suggestion to correct entry when clicked', () => {
    const mockSuggestionHook = {
      suggestion: {
        suggestedAccountId: 2,
        suggestedAccountName: 'Meals & Entertainment',
        reason: "Matched keyword: 'restaurant' → Category: Food"
      },
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    };

    const mockMainHook = {
      suggestion: null,
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    };

    // Mock for all hook calls using mockReturnValue
    mockUseSmartSuggestion
      .mockReturnValueOnce(mockMainHook) // Main suggestion hook
      .mockReturnValue(mockSuggestionHook); // All other hooks

    render(<TransactionForm {...defaultProps} />);

    // Add a second entry
    fireEvent.click(screen.getByTestId('add-entry'));

    // Type in description for first entry
    const descriptionInput0 = screen.getByTestId('description-input-0');
    fireEvent.change(descriptionInput0, { target: { value: 'Dinner at restaurant' } });

    // Click the suggestion chip for the first entry
    const suggestionChip0 = screen.getByTestId('entry-suggestion-chip-0');
    fireEvent.click(suggestionChip0);

    // Should apply suggestion to the first entry's account
    const accountSelect0 = screen.getByTestId('account-select-0') as HTMLSelectElement;
    expect(accountSelect0.value).toBe('2');
  });

  it('should show loading state when suggestion is being fetched', async () => {
    // Mock loading state with a suggestion (so shouldShowMainSuggestion is true)
    const mockLoadingHook = {
      suggestion: {
        suggestedAccountId: 2,
        suggestedAccountName: 'Meals & Entertainment',
        reason: "Matched keyword: 'restaurant' → Category: Food"
      },
      isLoading: true,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    };

    // Mock for all hooks
    mockUseSmartSuggestion.mockReturnValue(mockLoadingHook);

    render(<TransactionForm {...defaultProps} />);

    // Set description to trigger suggestion fetch (do not select account, do not add entry)
    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.change(descriptionInput, { target: { value: 'Dinner at restaurant' } });

    // Wait for loading spinner to appear
    await waitFor(() => {
      expect(screen.getByTestId('main-suggestion-loading')).toBeInTheDocument();
    });
  });

  it('should show tooltip with suggestion reason on hover', () => {
    mockUseSmartSuggestion.mockReturnValue({
      suggestion: {
        suggestedAccountId: 2,
        suggestedAccountName: 'Meals & Entertainment',
        reason: "Matched keyword: 'restaurant' → Category: Food"
      },
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    });

    render(<TransactionForm {...defaultProps} />);

    // Type in description to trigger suggestion
    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.change(descriptionInput, { target: { value: 'Dinner at restaurant' } });

    // Should show suggestion chip with tooltip
    const suggestionChip = screen.getByTestId('suggestion-chip');
    expect(suggestionChip).toBeInTheDocument();
    expect(suggestionChip).toHaveAttribute('title', "Matched keyword: 'restaurant' → Category: Food");
  });

  it('should show fallback message when no suggestion is found', () => {
    mockUseSmartSuggestion.mockReturnValue({
      suggestion: null,
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    });

    render(<TransactionForm {...defaultProps} />);

    // Type in description that won't match any keywords
    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.change(descriptionInput, { target: { value: 'Random transaction' } });

    // Should show fallback message
    expect(screen.getByText('No account suggestion found for "Random transaction"')).toBeInTheDocument();
  });

  it('should not show fallback message when account is already selected', () => {
    mockUseSmartSuggestion.mockReturnValue({
      suggestion: null,
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    });

    render(<TransactionForm {...defaultProps} />);

    // Select an account first
    const accountSelect = screen.getByTestId('account-select-0');
    fireEvent.change(accountSelect, { target: { value: '1' } });

    // Type in description that won't match any keywords
    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.change(descriptionInput, { target: { value: 'Random transaction' } });

    // Should not show fallback message when account is selected
    expect(screen.queryByText('No account suggestion found for "Random transaction"')).not.toBeInTheDocument();
  });

  it('should not show fallback message when suggestion is loading', () => {
    mockUseSmartSuggestion.mockReturnValue({
      suggestion: null,
      isLoading: true,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    });

    render(<TransactionForm {...defaultProps} />);

    // Type in description
    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.change(descriptionInput, { target: { value: 'Random transaction' } });

    // Should not show fallback message when loading
    expect(screen.queryByText('No account suggestion found for "Random transaction"')).not.toBeInTheDocument();
  });

  it('should hide fallback message when suggestion becomes available', () => {
    // Mock for main suggestion hook
    mockUseSmartSuggestion.mockReturnValue({
      suggestion: null,
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    });

    const { rerender } = render(<TransactionForm {...defaultProps} />);

    // Type in description
    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.change(descriptionInput, { target: { value: 'Random transaction' } });

    // Should show fallback message initially
    expect(screen.getByText('No account suggestion found for "Random transaction"')).toBeInTheDocument();

    // Update mock to return a suggestion
    mockUseSmartSuggestion.mockReturnValue({
      suggestion: {
        suggestedAccountId: 2,
        suggestedAccountName: 'Meals & Entertainment',
        reason: "Matched keyword: 'transaction' → Category: General"
      },
      isLoading: false,
      error: null,
      isMobile: false,
      fetchSuggestion: jest.fn(),
      clearSuggestion: jest.fn()
    });

    // Re-render with new suggestion
    rerender(<TransactionForm {...defaultProps} />);

    // Should hide fallback message when suggestion becomes available
    expect(screen.queryByText('No account suggestion found for "Random transaction"')).not.toBeInTheDocument();
  });
}); 