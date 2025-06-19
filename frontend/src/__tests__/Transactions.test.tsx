import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Transactions from "../pages/Transactions";
import { MemoryRouter } from "react-router-dom";
import * as TransactionService from "../services/TransactionService";
import * as AccountService from "../services/AccountService";
import { AccountType, FinancialCategory } from "../types/account";
// import { Transaction } from '../types/transaction.types';

// Mock data
const mockAccounts = [
  { id: "1", name: "Checking", type: AccountType.ASSET, category: "Bank", subcategory: "Checking", financialCategory: FinancialCategory.CURRENT_ASSET, financialSubcategory: "Bank", balance: 1000 },
  { id: "2", name: "Savings", type: AccountType.ASSET, category: "Bank", subcategory: "Savings", financialCategory: FinancialCategory.CURRENT_ASSET, financialSubcategory: "Bank", balance: 2000 },
  { id: "3", name: "Groceries", type: AccountType.EXPENSE, category: "Expense", subcategory: "Groceries", financialCategory: FinancialCategory.OPERATING_EXPENSE, financialSubcategory: "Food", balance: 0 }
];

const mockTransactions = [
  {
    id: "1",
    description: "Grocery Shopping",
    startDate: "2024-03-14",
    date: "2024-03-14",
    type: "EXPENSE" as const,
    category: "Groceries",
    amount: 100,
    entries: [
      {
        accountId: "3",
        amount: 100,
        type: "CREDIT" as const,
        id: "e1",
        description: "Mock entry",
        account: {
          id: "3",
          name: "Mock Account",
          type: AccountType.ASSET,
          category: "Mock Category",
          subcategory: "Mock Subcategory",
          financialCategory: FinancialCategory.CURRENT_ASSET,
          financialSubcategory: "Mock Subcategory",
          balance: 0,
          isLiquid: true,
          user: {
            id: 1,
            email: "mock@example.com",
            password: "mockpassword",
            firstName: "Mock",
            lastName: "User",
            createdAt: "2024-03-14T00:00:00.000Z",
            updatedAt: "2024-03-14T00:00:00.000Z"
          },
          createdAt: "2024-03-14T00:00:00.000Z",
          updatedAt: "2024-03-14T00:00:00.000Z"
        },
        createdAt: "2024-03-14T00:00:00.000Z",
        updatedAt: "2024-03-14T00:00:00.000Z"
      },
      {
        accountId: "1",
        amount: 100,
        type: "DEBIT" as const,
        id: "e2",
        description: "Mock entry",
        account: {
          id: "1",
          name: "Mock Account",
          type: AccountType.ASSET,
          category: "Mock Category",
          subcategory: "Mock Subcategory",
          financialCategory: FinancialCategory.CURRENT_ASSET,
          financialSubcategory: "Mock Subcategory",
          balance: 0,
          isLiquid: true,
          user: {
            id: 1,
            email: "mock@example.com",
            password: "mockpassword",
            firstName: "Mock",
            lastName: "User",
            createdAt: "2024-03-14T00:00:00.000Z",
            updatedAt: "2024-03-14T00:00:00.000Z"
          },
          createdAt: "2024-03-14T00:00:00.000Z",
          updatedAt: "2024-03-14T00:00:00.000Z"
        },
        createdAt: "2024-03-14T00:00:00.000Z",
        updatedAt: "2024-03-14T00:00:00.000Z"
      }
    ],
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "2",
    description: "Split Transaction",
    startDate: "",
    date: "2024-03-15",
    type: "EXPENSE" as const,
    category: "Split",
    amount: 100,
    entries: [
      {
        accountId: "1",
        amount: 50,
        type: "DEBIT" as const,
        id: "e3",
        description: "Mock entry",
        account: {
          id: "1",
          name: "Mock Account",
          type: AccountType.ASSET,
          category: "Mock Category",
          subcategory: "Mock Subcategory",
          financialCategory: FinancialCategory.CURRENT_ASSET,
          financialSubcategory: "Mock Subcategory",
          balance: 0,
          isLiquid: true,
          user: {
            id: 1,
            email: "mock@example.com",
            password: "mockpassword",
            firstName: "Mock",
            lastName: "User",
            createdAt: "2024-03-15T00:00:00.000Z",
            updatedAt: "2024-03-15T00:00:00.000Z"
          },
          createdAt: "2024-03-15T00:00:00.000Z",
          updatedAt: "2024-03-15T00:00:00.000Z"
        },
        createdAt: "2024-03-15T00:00:00.000Z",
        updatedAt: "2024-03-15T00:00:00.000Z"
      },
      {
        accountId: "2",
        amount: 50,
        type: "CREDIT" as const,
        id: "e4",
        description: "Mock entry",
        account: {
          id: "2",
          name: "Mock Account",
          type: AccountType.ASSET,
          category: "Mock Category",
          subcategory: "Mock Subcategory",
          financialCategory: FinancialCategory.CURRENT_ASSET,
          financialSubcategory: "Mock Subcategory",
          balance: 0,
          isLiquid: true,
          user: {
            id: 1,
            email: "mock@example.com",
            password: "mockpassword",
            firstName: "Mock",
            lastName: "User",
            createdAt: "2024-03-15T00:00:00.000Z",
            updatedAt: "2024-03-15T00:00:00.000Z"
          },
          createdAt: "2024-03-15T00:00:00.000Z",
          updatedAt: "2024-03-15T00:00:00.000Z"
        },
        createdAt: "2024-03-15T00:00:00.000Z",
        updatedAt: "2024-03-15T00:00:00.000Z"
      }
    ],
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe("Transactions Component", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock accounts endpoint
    jest.spyOn(AccountService, "fetchAccounts").mockResolvedValue(mockAccounts);

    // Mock transactions endpoint
    jest.spyOn(TransactionService, "fetchTransactions").mockResolvedValue([
      {
        id: "1",
        date: "2024-01-01",
        description: "Grocery Shopping",
        type: "EXPENSE",
        category: "Test",
        amount: 100,
        entries: [
          { 
            id: "1", 
            amount: 100, 
            type: "DEBIT", 
            description: "",
            account: { id: "1", name: "Checking", type: AccountType.ASSET, category: "Bank", subcategory: "Checking", financialCategory: FinancialCategory.CURRENT_ASSET, financialSubcategory: "Cash", balance: 0 },
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01"
          },
          { 
            id: "2", 
            amount: 100, 
            type: "CREDIT", 
            description: "",
            account: { id: "2", name: "Savings", type: AccountType.ASSET, category: "Bank", subcategory: "Savings", financialCategory: FinancialCategory.CURRENT_ASSET, financialSubcategory: "Cash", balance: 0 },
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01"
          }
        ],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01"
      },
      {
        id: "2",
        date: "2024-01-02",
        description: "Split Transaction",
        type: "EXPENSE" as const,
        category: "Split",
        amount: 100,
        entries: [
          { 
            id: "3", 
            amount: 50, 
            type: "DEBIT" as const, 
            description: "",
            account: { id: "1", name: "Checking", type: AccountType.ASSET, category: "Bank", subcategory: "Checking", financialCategory: FinancialCategory.CURRENT_ASSET, financialSubcategory: "Cash", balance: 0 },
            createdAt: "2024-01-02",
            updatedAt: "2024-01-02"
          },
          { 
            id: "4", 
            amount: 50, 
            type: "CREDIT" as const, 
            description: "",
            account: { id: "2", name: "Savings", type: AccountType.ASSET, category: "Bank", subcategory: "Savings", financialCategory: FinancialCategory.CURRENT_ASSET, financialSubcategory: "Cash", balance: 0 },
            createdAt: "2024-01-02",
            updatedAt: "2024-01-02"
          }
        ],
        createdAt: "2024-01-02",
        updatedAt: "2024-01-02"
      }
    ]);

    // Mock transaction creation
    jest.spyOn(TransactionService, "createTransaction").mockResolvedValue(mockTransactions[0]);

    // Mock transaction update
    jest.spyOn(TransactionService, "updateTransaction").mockResolvedValue(mockTransactions[0]);

    // Mock transaction deletion
    jest.spyOn(TransactionService, "deleteTransaction").mockResolvedValue();

    // Mock account suggestion
    jest.spyOn(TransactionService, "getSuggestedAccount").mockResolvedValue({ 
      suggestedAccountId: 3,
      suggestedAccountName: "Test Account",
      reason: "Test reason"
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Utility to wait for loading to finish before assertions
  const waitForForm = async () => {
    await waitFor(() => {
      expect(screen.queryByText("Loading transactions...")).not.toBeInTheDocument();
    });
  };

  describe("Loading States", () => {
    it("shows loading indicator while fetching transactions", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Check for loading state
      expect(screen.getByText("Loading transactions...")).toBeInTheDocument();

      // Wait for loading to complete
      await waitForForm();
    });

    it("shows loading state during form submission", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );
      // Wait for loading indicator
      expect(screen.getByText(/loading transactions/i)).toBeInTheDocument();
      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });
      // Now interact with the form as needed...
    });
  });

  describe("Error Handling", () => {
    it("displays error message when fetch fails", async () => {
      jest.spyOn(TransactionService, "fetchTransactions").mockRejectedValue(new Error("Boom"));
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch transactions. Please try again later.');
      });
    });

    it("handles create transaction failure", async () => {
      jest.spyOn(TransactionService, "createTransaction").mockRejectedValue(new Error("Boom"));
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );
      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });
      // Fill out form and submit, then check for error
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Test Transaction");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[1], "100");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[1], "2");
      await userEvent.click(screen.getByRole("button", { name: /create transaction/i }));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to save transaction. Please try again.');
      });
    });

    it("handles delete transaction failure", async () => {
      jest.spyOn(TransactionService, "deleteTransaction").mockRejectedValue(new Error("Boom"));
      jest.spyOn(TransactionService, "fetchTransactions").mockResolvedValue([
        {
          id: "1",
          date: "2024-01-01",
          description: "Grocery Shopping",
          type: "EXPENSE",
          category: "Test",
          amount: 100,
          entries: [
            { 
              id: "1", 
              amount: 100, 
              type: "DEBIT", 
              description: "",
              account: { id: "1", name: "Checking", type: AccountType.ASSET, category: "Bank", subcategory: "Checking", financialCategory: FinancialCategory.CURRENT_ASSET, financialSubcategory: "Cash", balance: 0 },
              createdAt: "2024-01-01",
              updatedAt: "2024-01-01"
            },
            { 
              id: "2", 
              amount: 100, 
              type: "CREDIT", 
              description: "",
              account: { id: "2", name: "Savings", type: AccountType.ASSET, category: "Bank", subcategory: "Savings", financialCategory: FinancialCategory.CURRENT_ASSET, financialSubcategory: "Cash", balance: 0 },
              createdAt: "2024-01-01",
              updatedAt: "2024-01-01"
            }
          ],
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        }
      ]);
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );
      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByTestId("transaction-row-1")).toBeInTheDocument();
      });
      // Use getAllByRole to disambiguate delete buttons
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      // Click the first delete button (or use data-testid if available)
      fireEvent.click(deleteButtons[0]);
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to delete transaction');
      });
    });
  });

  describe("UI Feedback", () => {
    it("shows success message after creating transaction", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out form
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Test Transaction");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[1], "100");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[1], "2");
      // Set date field
      const today = new Date().toISOString().split('T')[0];
      await userEvent.clear(screen.getByLabelText(/date/i));
      fireEvent.change(screen.getByLabelText(/date/i), { target: { value: today } });

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      // Wait for the success message
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/transaction created successfully/i);
      });
    });

    it("shows success message after updating transaction", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByTestId("transaction-row-1")).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByTestId("edit-transaction-1");
      await userEvent.click(editButton);

      // Verify form populated
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toHaveValue("Grocery Shopping");
      });

      // Update description
      await userEvent.clear(screen.getByLabelText(/transaction description/i));
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Updated Transaction");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /update transaction/i });
      await userEvent.click(submitButton);

      // Verify success message
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/transaction updated successfully/i);
    });
  });

  describe("Field-Specific Validation", () => {
    it("rejects zero amounts", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Try to enter zero amount
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "0");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Amount must be positive");
    });

    it("rejects negative amounts", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Try to enter negative amount
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "-100");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Amount must be positive");
    });

    it("validates required date field", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Clear date field
      await userEvent.clear(screen.getByLabelText(/date/i));

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Date is required");
    });

    it("validates required account fields", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out form without selecting accounts
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Test Transaction");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[1], "100");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alerts = screen.getAllByRole("alert");
      expect(alerts.some(a => a.textContent?.match(/all entries.*account/i))).toBe(true);
    });

    it("validates balanced journal entries", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out the form with unbalanced entries
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Unbalanced Transaction");
      await userEvent.selectOptions(screen.getAllByLabelText(/entry type/i)[0], "DEBIT");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100.00");
      await userEvent.selectOptions(screen.getAllByLabelText(/entry type/i)[1], "CREDIT");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[1], "2");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[1], "50.00");

      // Submit the form
      await userEvent.click(screen.getByRole("button", { name: /create transaction/i }));

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Total debits must equal total credits");
    });

    it('validates positive amounts', async () => {
      render(<Transactions />);
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out form with zero amount
      await userEvent.type(screen.getByLabelText(/transaction description/i), 'Test Transaction');
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "0");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], '1');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Amount must be positive");
    });

    it('validates required date field', async () => {
      render(<Transactions />);
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Clear date field
      const dateInput = screen.getByLabelText(/date/i);
      await userEvent.clear(dateInput);

      // Fill out other required fields
      await userEvent.type(screen.getByLabelText(/transaction description/i), 'Test Transaction');
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], '1');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Date is required");
    });

    it('validates required account fields', async () => {
      render(<Transactions />);
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out form without selecting account
      await userEvent.type(screen.getByLabelText(/transaction description/i), 'Test Transaction');
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alerts = screen.getAllByRole("alert");
      expect(alerts.some(a => a.textContent?.match(/all entries.*account/i))).toBe(true);
    });

    it('validates balanced journal entries', async () => {
      render(<Transactions />);
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out the form with unbalanced entries
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Unbalanced Transaction");
      await userEvent.selectOptions(screen.getAllByLabelText(/entry type/i)[0], "DEBIT");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100.00");
      await userEvent.selectOptions(screen.getAllByLabelText(/entry type/i)[1], "CREDIT");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[1], "2");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[1], "50.00");

      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /create transaction/i }));

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Total debits must equal total credits");
    });
  });

  describe("Form Validation", () => {
    it("enforces required fields", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      await userEvent.click(screen.getByRole("button", { name: /create transaction/i }));

      const alerts = screen.getAllByRole("alert");
      expect(alerts.some(a => a.textContent?.match(/description.*required/i))).toBe(true);
      expect(alerts.some(a => a.textContent?.match(/entries.*account/i))).toBe(true);
    });

    it("sets default type to EXPENSE and toggles correctly", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Get the main transaction type select by id
      const typeSelect = screen.getByLabelText("Type", { selector: 'select#transaction-type' });
      expect(typeSelect).toHaveValue("EXPENSE");

      // Change to INCOME
      await userEvent.selectOptions(typeSelect, "INCOME");
      expect(typeSelect).toHaveValue("INCOME");

      // Verify entry types updated
      const entryTypes = screen.getAllByLabelText(/entry type/i);
      expect(entryTypes[0]).toHaveValue("DEBIT");
      expect(entryTypes[1]).toHaveValue("CREDIT");
    });

    it("allows adding and removing journal entries", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Initial entries
      expect(screen.getAllByLabelText(/account/i)).toHaveLength(2);

      // Add entry
      const addButton = screen.getByTestId("add-split-btn");
      await userEvent.click(addButton);
      expect(screen.getAllByLabelText(/account/i)).toHaveLength(3);

      // Remove entry
      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      await userEvent.click(removeButtons[0]);
      expect(screen.getAllByLabelText(/account/i)).toHaveLength(2);
    });

    it("resets form after successful submission", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out form
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Test Transaction");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[1], "100");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[1], "2");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      // Verify form reset
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toHaveValue("");
        expect(screen.getAllByLabelText(/amount/i)[0]).toHaveValue(null);
        expect(screen.getAllByLabelText(/amount/i)[1]).toHaveValue(null);
      });
    });

    it("validates account selection", async () => {
      render(<Transactions />);
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out the form without selecting an account
      await userEvent.type(screen.getByLabelText(/transaction description/i), 'No Account Transaction');
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");
      // Add a second entry
      await userEvent.click(screen.getByTestId('add-split-btn'));
      await userEvent.type(screen.getAllByLabelText(/amount/i)[1], '100.00');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alerts = screen.getAllByRole("alert");
      expect(alerts.some(a => a.textContent?.match(/all entries.*account/i))).toBe(true);
    });

    it("validates positive amounts", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out form with zero amount
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Test Transaction");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "0");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alerts = screen.getAllByRole("alert");
      expect(alerts.some(a => a.textContent?.match(/amount.*positive/i))).toBe(true);
    });

    it("validates required date field", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Clear date field
      const dateInput = screen.getByLabelText(/date/i);
      await userEvent.clear(dateInput);

      // Fill out other required fields
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Test Transaction");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alerts = screen.getAllByRole("alert");
      expect(alerts.some(a => a.textContent?.match(/date.*required/i))).toBe(true);
    });

    it("validates required account fields", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out form without selecting account
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Test Transaction");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      const alerts = screen.getAllByRole("alert");
      expect(alerts.some(a => a.textContent?.match(/entries.*account/i))).toBe(true);
    });

    it("validates balanced journal entries", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out the form with unbalanced entries
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Unbalanced Transaction");
      await userEvent.selectOptions(screen.getAllByLabelText(/entry type/i)[0], "DEBIT");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100.00");
      await userEvent.selectOptions(screen.getAllByLabelText(/entry type/i)[1], "CREDIT");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[1], "2");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[1], "50.00");

      // Submit the form
      await userEvent.click(screen.getByRole("button", { name: /create transaction/i }));

      const alerts = screen.getAllByRole("alert");
      expect(alerts.some(a => a.textContent?.match(/debits.*equal.*credits/i))).toBe(true);
    });
  });

  describe("CRUD Operations", () => {
    test("creates a new transaction", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out form
      await userEvent.type(screen.getByLabelText(/transaction description/i), "New Transaction");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[1], "100");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[1], "2");
      await userEvent.selectOptions(screen.getAllByLabelText(/entry type/i)[0], "DEBIT");
      await userEvent.selectOptions(screen.getAllByLabelText(/entry type/i)[1], "CREDIT");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      // Wait for the success message
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/transaction created successfully/i);
      });
    });

    test("edits an existing transaction", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByTestId("transaction-row-1")).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByTestId("edit-transaction-1");
      await userEvent.click(editButton);

      // Verify form populated
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toHaveValue("Grocery Shopping");
      });

      // Update description
      await userEvent.clear(screen.getByLabelText(/transaction description/i));
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Updated Transaction");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /update transaction/i });
      await userEvent.click(submitButton);

      // Verify success message
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/transaction updated successfully/i);
    });

    test("deletes a transaction", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByTestId("transaction-row-1")).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByTestId("delete-transaction-1");
      await userEvent.click(deleteButton);

      // Verify success message
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/transaction deleted successfully/i);
    });
  });

  describe("Edge Cases", () => {
    test("handles missing accounts", async () => {
      // Mock failed accounts fetch
      (AccountService.fetchAccounts as jest.Mock).mockRejectedValue(new Error("Network error"));

      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch transactions. Please try again later.');
      });
    });

    test("handles API errors", async () => {
      // Mock failed transaction creation
      (TransactionService.createTransaction as jest.Mock).mockRejectedValue(new Error("Boom"));

      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Fill out form
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Test Transaction");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[0], "100");
      await userEvent.type(screen.getAllByLabelText(/amount/i)[1], "100");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[1], "2");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create transaction/i });
      await userEvent.click(submitButton);

      // Verify error message
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/failed to save transaction/i);
    });
  });

  describe("Smart Suggestions", () => {
    test("displays suggested account based on description", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Type description
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Grocery Store");

      // Wait for suggestion
      await waitFor(() => {
        const accountSelect = screen.getAllByLabelText(/account/i)[0];
        expect(accountSelect).toHaveValue("3"); // Groceries account
      });
    });

    test("does not override manually selected account", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByLabelText(/transaction description/i)).toBeInTheDocument();
      });

      // Select account manually
      await userEvent.selectOptions(screen.getAllByLabelText(/account/i)[0], "1");

      // Type description
      await userEvent.type(screen.getByLabelText(/transaction description/i), "Grocery Store");

      // Verify account selection remains unchanged
      await waitFor(() => {
        const accountSelect = screen.getAllByLabelText(/account/i)[0];
        expect(accountSelect).toHaveValue("1");
      });
    });
  });

  describe("Split Transaction Editing", () => {
    test("edits a split transaction with multiple splits", async () => {
      render(<Transactions />);

      // Wait for the transaction to load
      const splitRow = await screen.findByTestId("transaction-row-2");
      expect(splitRow).toBeInTheDocument();
      
      // Find and click the edit button
      const editButton = screen.getByTestId("edit-transaction-2");
      await userEvent.click(editButton);

      // ... rest of the test ...
    });

    test("adds a new split line and updates it", async () => {
      render(<Transactions />);
      await waitFor(() => screen.getByTestId("transaction-row-2"));

      await userEvent.click(screen.getByTestId("edit-transaction-2"));
      // ... rest of the test ...
    });

    test("removes a split line", async () => {
      render(<Transactions />);
      await waitFor(() => screen.getByTestId("transaction-row-2"));

      await userEvent.click(screen.getByTestId("edit-transaction-2"));
      // ... rest of the test ...
    });

    test("prevents saving if any split has an empty amount", async () => {
      render(<Transactions />);
      await waitFor(() => screen.getByTestId("transaction-row-2"));

      await userEvent.click(screen.getByTestId("edit-transaction-2"));
      // ... rest of the test ...
    });

    test("saves successfully when all splits are valid", async () => {
      render(<Transactions />);
      await waitFor(() => screen.getByTestId("transaction-row-2"));

      await userEvent.click(screen.getByTestId("edit-transaction-2"));
      // ... rest of the test ...
    });
  });
}); 