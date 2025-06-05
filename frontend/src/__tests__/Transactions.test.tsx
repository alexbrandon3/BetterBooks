import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Transactions from "../pages/Transactions";
import { AxiosResponse } from "axios";
import { MemoryRouter } from "react-router-dom";
import api from "../utils/axios";

// Mock axios
jest.mock("../utils/axios");
const mockApi = api as jest.Mocked<typeof api>;

const createAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as any
});

describe("Transactions", () => {
  const mockAccounts = [
    { id: "1", name: "Checking" },
    { id: "2", name: "Savings" },
  ];

  const mockTransactions = [
    {
      id: "1",
      amount: 100,
      type: "EXPENSE",
      description: "Test Transaction",
      accountId: "1",
      date: "2025-06-05",
      isRecurring: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockImplementation((url) => {
      if (url === "/accounts") {
        return Promise.resolve(createAxiosResponse(mockAccounts));
      }
      if (url === "/transactions") {
        return Promise.resolve(createAxiosResponse(mockTransactions));
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  describe("Initial Render", () => {
    it("loads accounts and transactions on mount", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for accounts to load
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith("/accounts");
      });

      // Wait for transactions to load
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith("/transactions");
      });

      // Verify form elements are present
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();

      // Verify transaction data is displayed
      expect(screen.getByText("Test Transaction")).toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("Checking")).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("creates a new transaction successfully", async () => {
      mockApi.post.mockResolvedValueOnce(createAxiosResponse(mockTransactions[0]));

      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for accounts to load
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith("/accounts");
      });

      // Fill out form
      await userEvent.type(screen.getByLabelText(/amount/i), "100");
      await userEvent.selectOptions(screen.getByLabelText(/type/i), "EXPENSE");
      await userEvent.type(screen.getByLabelText(/description/i), "Test Transaction");
      await userEvent.selectOptions(screen.getByLabelText(/account/i), "1");
      await userEvent.type(screen.getByLabelText(/date/i), "2025-06-05");

      // Submit form
      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      // Verify API call and form reset
      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith(
          "/transactions",
          {
            amount: 100,
            type: "EXPENSE",
            description: "Test Transaction",
            accountId: "1",
            date: "2025-06-05",
          }
        );
        expect(screen.getByLabelText(/amount/i)).toHaveValue(null);
        expect(screen.getByLabelText(/description/i)).toHaveValue("");
      });
    });

    it("handles API errors gracefully", async () => {
      mockApi.post.mockRejectedValueOnce(new Error("Failed to save"));

      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for accounts to load
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith("/accounts");
      });

      // Fill out form
      await userEvent.type(screen.getByLabelText(/amount/i), "100");
      await userEvent.selectOptions(screen.getByLabelText(/type/i), "EXPENSE");
      await userEvent.type(screen.getByLabelText(/description/i), "Test Transaction");
      await userEvent.selectOptions(screen.getByLabelText(/account/i), "1");
      await userEvent.type(screen.getByLabelText(/date/i), "2025-06-05");

      // Submit form
      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
      });
    });
  });

  describe("Transaction List", () => {
    it("displays transactions in a table", async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for transactions to load
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith("/transactions");
      });

      // Verify table headers
      expect(screen.getByRole('columnheader', { name: /date/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /amount/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /account/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

      // Verify transaction data
      expect(screen.getByText("Test Transaction")).toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("Checking")).toBeInTheDocument();
    });
  });
}); 