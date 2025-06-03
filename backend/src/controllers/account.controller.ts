import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/Account";
import { getUser } from "../utils/getUser"; // <-- Changed path
import { QueryFailedError } from "typeorm";
import { FinancialCategory } from "../entities/Account";

const accountRepo = AppDataSource.getRepository(Account);

const validFinancialCategories = Object.values(FinancialCategory);

// Create Account
export const createAccount = async (req: Request, res: Response) => {
  try {
    console.log("📥 Account creation payload:", req.body);

    const user = await getUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const {
      name,
      type,
      balance,
      category = "Uncategorized",
      subcategory = "",
      financialCategory,
      financialSubcategory = "",
    } = req.body;

    // Set default financialCategory based on type
    let resolvedFinancialCategory = financialCategory;
    if (!resolvedFinancialCategory) {
      if (type === "REVENUE") {
        resolvedFinancialCategory = FinancialCategory.OPERATING_REVENUE;
      } else if (type === "EXPENSE") {
        resolvedFinancialCategory = FinancialCategory.OPERATING_EXPENSE;
      } else {
        resolvedFinancialCategory = FinancialCategory.CURRENT_ASSET;
      }
    }

    // Validate financial category
    if (!validFinancialCategories.includes(resolvedFinancialCategory)) {
      return res.status(400).json({ message: "Invalid financial category" });
    }

    if (!name || !type || typeof balance !== "number") {
      console.warn("⚠️ Validation failed. Payload:", {
        name,
        type,
        balance,
        financialCategory: resolvedFinancialCategory,
      });
      return res.status(400).json({ message: "Missing required fields" });
    }

    const account = new Account();
    account.name = name;
    account.type = type;
    account.balance = balance;
    account.category = category;
    account.subcategory = subcategory;
    account.financialCategory = resolvedFinancialCategory;
    account.financialSubcategory = financialSubcategory;
    account.user = user;

    const saved = await accountRepo.save(account);

    res.status(201).json({
      id: saved.id,
      name: saved.name,
      type: saved.type,
      category: saved.category,
      subcategory: saved.subcategory,
      financialCategory: saved.financialCategory,
      financialSubcategory: saved.financialSubcategory,
    });
  } catch (error: unknown) {
    console.error("💥 Error creating account:", error);
    if (error instanceof QueryFailedError) {
      console.error("Database error details:", {
        message: error.message,
        query: error.query,
        parameters: error.parameters,
      });
    }
    res.status(500).json({
      message:
        process.env.NODE_ENV === "production"
          ? "An error occurred while creating the account"
          : error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
};


// Get Account by ID
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await accountRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["user"],
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const cleanAccount = {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      user: {
        id: account.user.id,
        email: account.user.email,
      },
    };

    res.status(200).json(cleanAccount);
  } catch (error) {
    console.error("Error in getAccountById:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Account
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      balance,
      category = "Uncategorized",
      subcategory = "",
    } = req.body;

    const account = await accountRepo.findOneBy({ id: parseInt(id) });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Update fields
    account.name = name ?? account.name;
    account.type = type ?? account.type;
    account.balance = balance ?? account.balance;

    await accountRepo.save(account);

    const responsePayload = {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error in updateAccount:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get All Accounts
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const accounts = await accountRepo.find({
      where: { user: { id: user.id } },
    });

    const response = accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      category: acc.category,
      subcategory: acc.subcategory,
      financialCategory: acc.financialCategory,
      financialSubcategory: acc.financialSubcategory,
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await accountRepo.findOneBy({ id: parseInt(id) });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    await accountRepo.remove(account);

    res.status(204).send(); // No Content, delete was successful
  } catch (error) {
    console.error("Error in deleteAccount:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const suggestionMap: Record<string, Partial<Account>> = {
  rent: {
    category: "Facilities",
    subcategory: "Monthly Rent",
    financialCategory: FinancialCategory.OPERATING_EXPENSE,
    financialSubcategory: "Occupancy Costs"
  },
  utilities: {
    category: "Utilities",
    subcategory: "Electricity",
    financialCategory: FinancialCategory.OPERATING_EXPENSE,
    financialSubcategory: "Operating Overhead"
  },
  salary: {
    category: "Payroll",
    subcategory: "Employee Wages",
    financialCategory: FinancialCategory.OPERATING_EXPENSE,
    financialSubcategory: "Labor"
  },
  sales: {
    category: "Revenue",
    subcategory: "Product Sales",
    financialCategory: FinancialCategory.OPERATING_REVENUE,
    financialSubcategory: "Primary Income"
  }
};

export const suggestAccountMetadata = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  const normalizedName = name.toLowerCase().trim();
  const suggestion = suggestionMap[normalizedName] || {};

  if (!suggestion.financialCategory) {
    if (normalizedName.includes("rent")) {
      suggestion.financialCategory = FinancialCategory.OPERATING_EXPENSE;
      suggestion.financialSubcategory = "Occupancy Costs";
    } else if (normalizedName.includes("utilities")) {
      suggestion.financialCategory = FinancialCategory.OPERATING_EXPENSE;
      suggestion.financialSubcategory = "Utilities";
    } else if (normalizedName.includes("revenue") || name === "INCOME") {
      suggestion.financialCategory = FinancialCategory.OPERATING_REVENUE;
      suggestion.financialSubcategory = "Sales Revenue";
    } else if (normalizedName.includes("loan")) {
      suggestion.financialCategory = FinancialCategory.CURRENT_LIABILITY;
      suggestion.financialSubcategory = "Loan Payable";
    } else {
      return {
        category: "Uncategorized",
        subcategory: "",
        financialCategory: req.body.type === 'REVENUE' ? FinancialCategory.OPERATING_REVENUE : FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "Uncategorized",
      };
    }
  }

  res.status(200).json(suggestion);
};
