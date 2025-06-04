import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Transactions from "../pages/Transactions";
import { AxiosResponse } from "axios";

// Mock the entire axios module
jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Import the mocked axios instance
import axios from "../utils/axios";

const createAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as any
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Transactions Component", () => {
  // Test 1: Renders form and fields
  test("renders form and transaction list", async () => {
    jest.spyOn(axios, "get").mockImplementation((url) => {
      if (url === "/accounts") return Promise.resolve(createAxiosResponse([]));
      if (url === "/transactions") return Promise.resolve(createAxiosResponse([]));
      return Promise.resolve(createAxiosResponse([]));
    });
    render(<Transactions />);
    expect(await screen.findByLabelText("Amount *")).toBeInTheDocument();
    expect(screen.getByLabelText("Type *")).toBeInTheDocument();
    expect(screen.getByLabelText("Date *")).toBeInTheDocument();
    expect(screen.getByLabelText("Description *")).toBeInTheDocument();
    expect(screen.getByLabelText("Account *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add transaction|update transaction|creating|updating/i })).toBeInTheDocument();
  });

  // Test 2: Validates empty form
  test("shows error on empty submit", async () => {
    jest.spyOn(axios, "get").mockResolvedValue(createAxiosResponse([]));
    render(<Transactions />);
    await waitFor(() => {
      expect(screen.getByLabelText("Amount *")).toBeInTheDocument();
    });
    const submitButton = screen.getByRole("button", { name: /add transaction|update transaction|creating|updating/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Amount must be a positive number");
    }, { timeout: 3000 });
  });

  // Test 3: Validates negative amount
  test("shows error on negative amount", async () => {
    jest.spyOn(axios, "get").mockResolvedValue(createAxiosResponse([]));
    render(<Transactions />);
    await waitFor(() => {
      expect(screen.getByLabelText("Amount *")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText("Amount *"), { target: { value: "-100" } });
    const submitButton = screen.getByRole("button", { name: /add transaction|update transaction|creating|updating/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Amount must be a positive number");
    }, { timeout: 3000 });
  });

  // Test 4: Submits valid transaction
  test("submits new transaction", async () => {
    jest.spyOn(axios, "get").mockImplementation((url) => {
      if (url === "/accounts") return Promise.resolve(createAxiosResponse([{ id: "1", name: "Test Account" }]));
      if (url === "/transactions") return Promise.resolve(createAxiosResponse([]));
      return Promise.resolve(createAxiosResponse([]));
    });
    jest.spyOn(axios, "post").mockResolvedValue(createAxiosResponse({ id: "123" }));
    render(<Transactions />);
    fireEvent.change(await screen.findByLabelText("Amount *"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Description *"), { target: { value: "Test Transaction" } });
    fireEvent.change(screen.getByLabelText("Type *"), { target: { value: "INCOME" } });
    fireEvent.change(screen.getByLabelText("Account *"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Date *"), { target: { value: "2024-03-20" } });
    fireEvent.click(screen.getByRole("button", { name: /add transaction|update transaction|creating|updating/i }));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/transactions", expect.objectContaining({
        amount: 100,
        type: "INCOME",
        description: "Test Transaction",
        accountId: "1",
        date: "2024-03-20"
      }));
    });
  });

  // Test 5: Deletes a transaction
  test("deletes a transaction", async () => {
    const mockTransaction = {
      id: "1",
      amount: 50,
      type: "EXPENSE",
      description: "Test Expense",
      accountId: "1",
      date: "2024-03-20",
      account: { id: "1", name: "Test Account" }
    };
    jest.spyOn(axios, "get").mockImplementation((url) => {
      if (url === "/accounts") return Promise.resolve(createAxiosResponse([{ id: "1", name: "Test Account" }]));
      if (url === "/transactions") return Promise.resolve(createAxiosResponse([mockTransaction]));
      return Promise.resolve(createAxiosResponse([]));
    });
    jest.spyOn(axios, "delete").mockResolvedValue(createAxiosResponse({}));
    render(<Transactions />);
    await waitFor(() => {
      expect(screen.getByText("Test Expense")).toBeInTheDocument();
    });
    window.confirm = jest.fn(() => true);
    fireEvent.click(screen.getByText(/delete/i));
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/transactions/1");
    });
  });

  // Test 6: Edits a transaction
  test("edits an existing transaction", async () => {
    const mockTransaction = {
      id: "1",
      amount: 50,
      type: "EXPENSE",
      description: "Original Description",
      accountId: "1",
      date: "2024-03-20",
      account: { id: "1", name: "Test Account" }
    };
    jest.spyOn(axios, "get").mockImplementation((url) => {
      if (url === "/accounts") return Promise.resolve(createAxiosResponse([{ id: "1", name: "Test Account" }]));
      if (url === "/transactions") return Promise.resolve(createAxiosResponse([mockTransaction]));
      return Promise.resolve(createAxiosResponse([]));
    });
    jest.spyOn(axios, "put").mockResolvedValue(createAxiosResponse({ ...mockTransaction, description: "Updated Description" }));
    render(<Transactions />);
    await waitFor(() => {
      expect(screen.getByText("Original Description")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/edit/i));
    expect(screen.getByLabelText("Amount *")).toHaveValue(50);
    expect(screen.getByLabelText("Description *")).toHaveValue("Original Description");
    fireEvent.change(screen.getByLabelText("Description *"), {
      target: { value: "Updated Description" }
    });
    fireEvent.click(screen.getByRole("button", { name: /add transaction|update transaction|creating|updating/i }));
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/transactions/1", expect.objectContaining({
        amount: 50,
        type: "EXPENSE",
        description: "Updated Description",
        accountId: "1",
        date: "2024-03-20"
      }));
    });
  });

  // Test 7: Handles API errors
  test("handles API errors gracefully", async () => {
    jest.spyOn(axios, "get").mockImplementation((url) => {
      if (url === "/accounts") return Promise.reject(new Error("Failed to fetch accounts"));
      if (url === "/transactions") return Promise.resolve(createAxiosResponse([]));
      return Promise.resolve(createAxiosResponse([]));
    });
    render(<Transactions />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to fetch accounts/i);
    });
  });
}); 