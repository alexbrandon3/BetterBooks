jest.unmock("axios");
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Transactions from "../pages/Transactions";
import api, { instance } from "../utils/axios";
import MockAdapter from "axios-mock-adapter";

const mock = new MockAdapter(instance);

describe("Split Transaction Editing", () => {
  beforeEach(() => {
    mock.reset();
    
    // Mock accounts endpoint
    mock.onGet("/accounts").reply(200, [
      { id: "1", name: "Checking", type: "ASSET", category: "CURRENT_ASSET", subcategory: "", financialCategory: "ASSET", financialSubcategory: "CURRENT_ASSET" },
    ]);

    // Mock transactions endpoint
    mock.onGet("/transactions").reply(200, [
      {
        id: "2",
        amount: 150.0,
        type: "EXPENSE",
        description: "Split Transaction",
        accountId: "1",
        date: "2024-03-20",
        isSplit: true,
        splits: [
          {
            id: "2-1",
            amount: 75.0,
            description: "Groceries",
            category: "FOOD",
          },
          {
            id: "2-2",
            amount: 50.0,
            description: "Household Items",
            category: "HOUSEHOLD",
          },
          {
            id: "2-3",
            amount: 25.0,
            description: "Personal Care",
            category: "PERSONAL",
          },
        ],
      },
    ]);

    // Mock split transaction update endpoint
    mock.onPut("/split-transactions/2").reply(200, { message: "Split transaction updated" });
  });

  test("edits a split transaction with multiple splits", async () => {
    render(<Transactions />);

    // Wait for the transaction to load
    const splitRow = await screen.findByTestId("transaction-row-2");
    expect(splitRow).toBeInTheDocument();
    
    // Find and click the edit button
    const editBtn = screen.getByTestId("edit-transaction-2");
    await userEvent.click(editBtn);

    // Verify split descriptions are loaded
    const allTextboxes = await screen.findAllByRole("textbox");
    const splitDescriptions = allTextboxes.filter((input) =>
      input.getAttribute("aria-label")?.toLowerCase().includes("split") &&
      input.getAttribute("aria-label")?.toLowerCase().endsWith("description")
    );
    expect(splitDescriptions).toHaveLength(3);

    // Update first split description
    await userEvent.clear(splitDescriptions[0]);
    await userEvent.type(splitDescriptions[0], "Updated Groceries");

    // Find and click the save button
    const saveBtn = screen.getByRole("button", { name: /update/i });
    await userEvent.click(saveBtn);

    // Verify the form closed and changes were saved
    await waitFor(() => {
      expect(screen.queryByTestId("edit-form-2")).toBeNull();
    });
  });

  test("adds a new split line and updates it", async () => {
    render(<Transactions />);
    await waitFor(() => screen.getByTestId("transaction-row-2"));

    await userEvent.click(screen.getByTestId("edit-transaction-2"));

    const addSplitBtn = await screen.findByRole("button", { name: /add split/i });
    await userEvent.click(addSplitBtn);

    const allTextboxes2 = await screen.findAllByRole("textbox");
    const allDescriptions = allTextboxes2.filter((input) =>
      input.getAttribute("aria-label")?.toLowerCase().includes("split") &&
      input.getAttribute("aria-label")?.toLowerCase().endsWith("description")
    );
    expect(allDescriptions).toHaveLength(4);

    await userEvent.type(allDescriptions[3], "New Split Item");
  });

  test("removes a split line", async () => {
    render(<Transactions />);
    await waitFor(() => screen.getByTestId("transaction-row-2"));

    await userEvent.click(screen.getByTestId("edit-transaction-2"));

    const removeBtns = await screen.findAllByRole("button", { name: /remove/i });
    const originalCount = removeBtns.length;

    await userEvent.click(removeBtns[0]);

    const allTextboxes3 = await screen.findAllByRole("textbox");
    const updatedDescriptions = allTextboxes3.filter((input) =>
      input.getAttribute("aria-label")?.toLowerCase().includes("split") &&
      input.getAttribute("aria-label")?.toLowerCase().endsWith("description")
    );
    expect(updatedDescriptions).toHaveLength(originalCount - 1);
  });

  test("prevents saving if any split has an empty amount", async () => {
    render(<Transactions />);
    await waitFor(() => screen.getByTestId("transaction-row-2"));

    await userEvent.click(screen.getByTestId("edit-transaction-2"));

    const allSpinbuttons = await screen.findAllByRole("spinbutton");
    const splitAmounts = allSpinbuttons.filter((input) =>
      input.getAttribute("aria-label")?.toLowerCase().includes("split") &&
      input.getAttribute("aria-label")?.toLowerCase().endsWith("amount")
    );
    await userEvent.clear(splitAmounts[0]);

    const saveBtn = screen.getByRole("button", { name: /update/i });
    await userEvent.click(saveBtn);

    const errors = await screen.findAllByText(/amount is required/i);
    expect(errors.length).toBeGreaterThan(0);
  });

  test("saves successfully when all splits are valid", async () => {
    render(<Transactions />);
    await waitFor(() => screen.getByTestId("transaction-row-2"));

    await userEvent.click(screen.getByTestId("edit-transaction-2"));

    const allSpinbuttons = await screen.findAllByRole("spinbutton");
    const splitAmounts = allSpinbuttons.filter((input) =>
      input.getAttribute("aria-label")?.toLowerCase().includes("split") &&
      input.getAttribute("aria-label")?.toLowerCase().endsWith("amount")
    );
    for (const input of splitAmounts) {
      await userEvent.clear(input);
      await userEvent.type(input, "10");
    }

    const saveBtn = screen.getByRole("button", { name: /update/i });
    await userEvent.click(saveBtn);

    // Wait for the success message and verify the form is closed
    await waitFor(() => {
      expect(screen.getByText(/transaction updated successfully/i)).toBeInTheDocument();
      expect(screen.queryByTestId("edit-form-2")).toBeNull();
    });
  });
}); 