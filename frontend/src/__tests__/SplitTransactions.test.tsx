import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SplitTransactions from '../pages/SplitTransactions';
import * as SplitTransactionService from "../services/SplitTransactionService";
import MockAdapter from "axios-mock-adapter";
import axios from 'axios';

const mock = new MockAdapter(axios);

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
    description: 'Test Transaction',
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
    mock.reset();
    jest.clearAllMocks();
    
    // Mock successful fetch
    mock.onGet("/split-transactions").reply(200, mockSplitTransactions);
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
    it("validates required fields", async () => {
      render(<SplitTransactions />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create split transaction/i })).toBeInTheDocument();
      });

      // Submit form without filling required fields
      const submitButton = screen.getByRole("button", { name: /create split transaction/i });
      await userEvent.click(submitButton);

      // Check for validation messages
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Description is required");
    });

    it("validates positive amount", async () => {
      render(<SplitTransactions />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create split transaction/i })).toBeInTheDocument();
      });

      // Fill in required fields first
      fireEvent.change(screen.getByPlaceholderText("Description"), {
        target: { value: "Negative test" },
      });
      fireEvent.change(screen.getByPlaceholderText("Parent Transaction ID"), {
        target: { value: "1" },
      });

      // Set amount to 0
      fireEvent.change(screen.getByPlaceholderText("Amount"), {
        target: { value: "0" },
      });

      // Submit form
      fireEvent.click(screen.getByRole("button", { name: /create split transaction/i }));

      // Check for validation message
      const alerts = screen.getAllByRole("alert");
      expect(alerts.some(a => a.textContent?.match(/amount.*greater than zero/i))).toBe(true);
    });
  });

  describe("API Integration", () => {
    it("handles successful split transaction creation", async () => {
      // Mock successful creation
      mock.onPost("/split-transactions").reply(200, {
        id: 3,
        description: "New Split",
        amount: 200,
        transaction: { id: 3, description: "New Transaction" }
      });

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
        expect(screen.getByRole("alert")).toHaveTextContent("Split transaction created successfully");
      });
    });

    it("handles creation failure", async () => {
      // Mock failed creation
      mock.onPost("/split-transactions").reply(500);

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
        expect(screen.getByRole("alert")).toHaveTextContent("Failed to create split transaction");
      });
    });

    it("handles fetch failure", async () => {
      // Mock failed fetch
      mock.onGet("/split-transactions").reply(500);

      render(<SplitTransactions />);

      // Check for error message
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Failed to fetch split transactions");
      });
    });
  });

  describe("Delete Functionality", () => {
    it("handles successful deletion", async () => {
      // Mock successful deletion
      mock.onDelete("/split-transactions/1").reply(200);

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
        expect(screen.getByRole("alert")).toHaveTextContent("Split transaction deleted successfully");
      });
    });

    it("handles deletion failure", async () => {
      // Mock failed deletion
      mock.onDelete("/split-transactions/1").reply(500);

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
        expect(screen.getByRole("alert")).toHaveTextContent("Failed to delete split transaction");
      });
    });
  });

  it('renders split transactions', async () => {
    mock.onGet('/api/transactions').reply(200, mockTransactions);

    render(<SplitTransactions />);

    await waitFor(() => {
      expect(screen.getByText('Test Transaction')).toBeInTheDocument();
    });
  });

  it('splits a transaction', async () => {
    mock.onPost('/api/transactions/split').reply(200, mockTransactions[0]);

    render(<SplitTransactions />);

    await waitFor(() => {
      expect(screen.getByText('Test Transaction')).toBeInTheDocument();
    });

    const splitButton = screen.getByText('Split');
    fireEvent.click(splitButton);

    await waitFor(() => {
      expect(screen.getByText('Split Transaction')).toBeInTheDocument();
    });
  });
}); 