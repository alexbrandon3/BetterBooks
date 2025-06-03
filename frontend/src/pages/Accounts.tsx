import React, { useEffect, useState } from "react";
import api from "../utils/axios";

// Enums for account types and financial categories
enum AccountType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
  EQUITY = "EQUITY",
  REVENUE = "REVENUE",
  EXPENSE = "EXPENSE"
}

// src/entities/Account.ts

export enum FinancialCategory {
  CURRENT_ASSET = "CURRENT_ASSET",
  FIXED_ASSET = "FIXED_ASSET",
  CURRENT_LIABILITY = "CURRENT_LIABILITY",
  LONG_TERM_LIABILITY = "LONG_TERM_LIABILITY",
  EQUITY = "EQUITY",
  OPERATING_REVENUE = "OPERATING_REVENUE",
  NON_OPERATING_REVENUE = "NON_OPERATING_REVENUE",
  OPERATING_EXPENSE = "OPERATING_EXPENSE",
  NON_OPERATING_EXPENSE = "NON_OPERATING_EXPENSE"
}

// TypeScript interfaces
interface Account {
  id: string;
  name: string;
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
}

interface AccountForm {
  name: string;
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
}

const initialFormState: AccountForm = {
  name: "",
  type: AccountType.ASSET,
  category: "",
  subcategory: "",
  financialCategory: FinancialCategory.OPERATING_EXPENSE,
  financialSubcategory: ""
};

const suggestAccountMetadata = (name: string) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("rent")) {
    return {
      category: "Facilities",
      subcategory: "Monthly Rent",
      financialSubcategory: "Occupancy Costs",
    };
  } else if (nameLower.includes("utilities")) {
    return {
      category: "Utilities",
      subcategory: "Monthly Utilities",
      financialSubcategory: "Utilities",
    };
  } else if (nameLower.includes("revenue")) {
    return {
      category: "Sales",
      subcategory: "Sales Revenue",
      financialSubcategory: "Sales Revenue",
    };
  } else if (nameLower.includes("loan")) {
    return {
      category: "Loans",
      subcategory: "Loan Payable",
      financialSubcategory: "Loan Payable",
    };
  } else {
    return {
      category: "Uncategorized",
      subcategory: "",
      financialSubcategory: "Uncategorized",
    };
  }
};

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<AccountForm>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestedFields, setSuggestedFields] = useState<string[]>([]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/accounts");
      setAccounts(res.data);
    } catch (err) {
      setError("Failed to fetch accounts. Please try again later.");
      console.error("Error fetching accounts", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.name.trim()) {
      setError("Account name is required");
      return;
    }
    if (!form.type) {
      setError("Account type is required");
      return;
    }
    if (!form.financialCategory) {
      setError("Financial category is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Prepare the payload with proper data types and defaults
    const payload = {
      name: form.name.trim(),
      type: form.type,
      category: form.category.trim() || "Uncategorized",
      subcategory: form.subcategory.trim() || "",
      financialCategory: form.financialCategory,
      financialSubcategory: form.financialSubcategory.trim() || "Uncategorized",
      balance: 0,
    };
    console.log("Submitting account payload:", payload);

    try {
      const response = await api.post("/accounts", payload);
      
      if (response.status >= 400) {
        throw new Error(response.data.message || "Failed to create account");
      }

      setForm(initialFormState);
      setSuccessMessage("Account created successfully!");
      fetchAccounts();
    } catch (err: any) {
      // Handle different types of errors
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = err.response.data?.message || err.response.data?.error || "Server error occurred";
        setError(`Failed to create account: ${errorMessage}`);
        console.error("Server error:", err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        setError("No response from server. Please check your connection.");
        console.error("Network error:", err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        setError("An unexpected error occurred. Please try again.");
        console.error("Error:", err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Remove field from suggestions if user overrides it
    setSuggestedFields((prev) => prev.filter((field) => field !== name));
  };

  const handleNameBlur = async () => {
    if (!form.name.trim()) return;

    try {
      const res = await api.post("/accounts/suggest-metadata", { name: form.name });
      console.log("Suggested metadata:", res.data);

      setForm((prev) => {
        const newForm = { ...prev };
        if (res.data.category && !prev.category) newForm.category = res.data.category;
        if (res.data.subcategory && !prev.subcategory) newForm.subcategory = res.data.subcategory;
        if (res.data.financialCategory && !prev.financialCategory) newForm.financialCategory = res.data.financialCategory;
        if (res.data.financialSubcategory && !prev.financialSubcategory) newForm.financialSubcategory = res.data.financialSubcategory;
        return newForm;
      });

      // Update suggestedFields based on what was suggested
      const suggested = [];
      if (res.data.category) suggested.push("category");
      if (res.data.subcategory) suggested.push("subcategory");
      if (res.data.financialCategory) suggested.push("financialCategory");
      if (res.data.financialSubcategory) suggested.push("financialSubcategory");
      setSuggestedFields(suggested);
    } catch (err) {
      console.error("Error fetching metadata suggestions:", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Accounts</h1>

      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                onBlur={handleNameBlur}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type *
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.values(AccountType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Classification Section */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
            </button>
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    General Category
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="category"
                      value={form.category}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {suggestedFields.includes("category") && (
                      <span className="absolute top-0 right-0 mt-1 mr-2 text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded">
                        Suggested
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Used for classification in financial reports. We'll suggest a value when possible.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Subcategory
                  </label>
                  <input
                    type="text"
                    name="subcategory"
                    value={form.subcategory}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Only needed if you want deeper categorization.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reporting Category (GAAP) *
                  </label>
                  <select
                    name="financialCategory"
                    value={form.financialCategory}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.values(FinancialCategory).map((category) => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Used for classification in financial reports. We'll suggest a value when possible.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reporting Subcategory
                  </label>
                  <input
                    type="text"
                    name="financialSubcategory"
                    value={form.financialSubcategory}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Only needed if you want deeper categorization.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Add Account"}
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial Subcategory
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No accounts found
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof account.type === "string" ? account.type.replace(/_/g, " ") : "Uncategorized"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.category || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.subcategory || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof account.financialCategory === "string" ? account.financialCategory.replace(/_/g, " ") : "Uncategorized"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.financialSubcategory || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Accounts;