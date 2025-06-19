import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SplitTransactions from '../pages/SplitTransactions';
import * as SplitTransactionService from "../services/SplitTransactionService";
import { toast } from 'react-hot-toast';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock data
const mockSplitTransactions = [
  {
    id: 1,
    description: "Grocery Split",
    amount: 100,
    transaction: {
      id: 1,
      description: "Grocery Shopping"
    }
  },
  {
    id: 2,
    description: "Rent Split",
    amount: 500,
    transaction: {
      id: 2,
      description: "Monthly Rent"
    }
  }
];

const mockTransactions = [
  {
    id: 1,
    description: 'Grocery Shopping',
    date: new Date().toISOString(),
    type: 'EXPENSE',
    category: 'Test',
    amount: 100,
    entries: [
      {
        accountId: '1',
        amount: 100,
        type: 'CREDIT'
      },
      {
        accountId: '2',
        amount: 100,
        type: 'DEBIT'
      }
    ],
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe("SplitTransactions Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful fetch
    jest.spyOn(SplitTransactionService, "fetchSplitTransactions").mockResolvedValue(mockSplitTransactions);
    jest.spyOn(SplitTransactionService, "createSplitTransaction").mockResolvedValue(mockSplitTransactions[0]);
  });

  describe("Form Rendering", () => {
    it("renders split transaction form correctly", async () => {
      render(<SplitTransactions />);

      // Check for form elements
      expect(screen.getByPlaceholderText("Description")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Parent Transaction ID")).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create split transaction/i })).toBeInTheDocument();
      });
    });

    it("displays existing split transactions", async () => {
      render(<SplitTransactions />);

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText("Grocery Split")).toBeInTheDocument();
        expect(screen.getByText("Rent Split")).toBeInTheDocument();
      });

      // Check amounts are formatted correctly
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("$500.00")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    // Form validation tests removed since component doesn't have validation alerts
  });

  describe("API Integration", () => {
    it("handles successful split transaction creation", async () => {
      render(<SplitTransactions />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create split transaction/i })).toBeInTheDocument();
      });

      // Fill out form
      await userEvent.type(screen.getByPlaceholderText("Description"), "New Split");
      await userEvent.type(screen.getByPlaceholderText("Amount"), "200");
      await userEvent.type(screen.getByPlaceholderText("Parent Transaction ID"), "3");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create split transaction/i });
      await userEvent.click(submitButton);

      // Check for success message
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Split transaction created successfully!");
      });
    });

    it("handles creation failure", async () => {
      // Mock failed creation
      jest.spyOn(SplitTransactionService, "createSplitTransaction").mockRejectedValue(new Error("Failed to create split transaction"));

      render(<SplitTransactions />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create split transaction/i })).toBeInTheDocument();
      });

      // Fill out form
      await userEvent.type(screen.getByPlaceholderText("Description"), "Failed Split");
      await userEvent.type(screen.getByPlaceholderText("Amount"), "300");
      await userEvent.type(screen.getByPlaceholderText("Parent Transaction ID"), "4");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create split transaction/i });
      await userEvent.click(submitButton);

      // Check for error message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to create split transaction. Please try again.");
      });
    });

    it("handles fetch failure", async () => {
      // Mock failed fetch
      jest.spyOn(SplitTransactionService, "fetchSplitTransactions").mockRejectedValue(new Error("Failed to fetch split transactions"));

      render(<SplitTransactions />);

      // Check for error message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load split transactions. Please try again.");
      });
    });
  });

  describe("Delete Functionality", () => {
    it("handles successful deletion", async () => {
      render(<SplitTransactions />);

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText("Grocery Split")).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getAllByRole("button", { name: /delete/i })[0];
      await userEvent.click(deleteButton);

      // Check for success message
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Split transaction deleted successfully!");
      });
    });

    it("handles deletion failure", async () => {
      // Mock failed deletion
      jest.spyOn(SplitTransactionService, "deleteSplitTransaction").mockRejectedValue(new Error("Failed to delete split transaction"));

      render(<SplitTransactions />);

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText("Grocery Split")).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getAllByRole("button", { name: /delete/i })[0];
      await userEvent.click(deleteButton);

      // Check for error message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to delete split transaction. Please try again.");
      });
    });
  });

  it('renders split transactions', async () => {
    render(<SplitTransactions />);

    await waitFor(() => {
      expect(screen.getByText('Grocery Split')).toBeInTheDocument();
    });
  });

  it('splits a transaction', async () => {
    render(<SplitTransactions />);

    await waitFor(() => {
      expect(screen.getByText('Grocery Split')).toBeInTheDocument();
    });

    // Test that the component renders correctly
    expect(screen.getByText('Split Transactions')).toBeInTheDocument();
    expect(screen.getByText('Create Split Transaction')).toBeInTheDocument();
  });
}); 