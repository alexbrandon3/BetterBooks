import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Account, FinancialCategory, AccountType } from "../entities/Account";
import { getUser } from "../utils/getUser";
import { AuthenticationError, NotFoundError } from "../utils/errors";
import { AuthenticatedRequest } from "../types/express";
import { getSuggestedMetadata } from "../utils/accountCategorizer";

const accountRepo = AppDataSource.getRepository(Account);

const isValidEnumValue = <T extends { [key: string]: string }>(enumObj: T, value: any): value is T[keyof T] =>
  Object.values(enumObj).includes(value);

export const createAccount = async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const {
      name,
      type,
      category,
      subcategory,
      financialCategory,
      financialSubcategory,
      balance,
    } = req.body;

    const normalized = name.toLowerCase();
    const existing = await accountRepo
      .createQueryBuilder("account")
      .where("LOWER(account.name) = :name", { name: normalized })
      .andWhere("account.userId = :userId", { userId: user.id })
      .getOne();

    if (existing) {
      return res.status(400).json({
        message: "An account with that name already exists."
      });
    }

    // Field validation
    if (!name?.trim()) {
      return res.status(400).json({ 
        message: "Account name is required" 
      });
    }

    if (!type) {
      return res.status(400).json({ 
        message: "Account type is required" 
      });
    }

    if (balance === undefined || balance === null || isNaN(parseFloat(balance))) {
      return res.status(400).json({ 
        message: "A valid balance is required" 
      });
    }

    // Enum validation
    if (!isValidEnumValue(AccountType, type)) {
      return res.status(400).json({ 
        message: "Invalid account type. Must be one of: " + Object.values(AccountType).join(", ") 
      });
    }

    if (!isValidEnumValue(FinancialCategory, financialCategory)) {
      return res.status(400).json({ 
        message: "Invalid financial category. Must be one of: " + Object.values(FinancialCategory).join(", ") 
      });
    }

    const account = accountRepo.create({
      name: name.trim(),
      type,
      category: category?.trim() || "Uncategorized",
      subcategory: subcategory?.trim() || "",
      financialCategory,
      financialSubcategory: financialSubcategory?.trim() || "Uncategorized",
      balance: parseFloat(balance),
      user,
    });

    await accountRepo.save(account);
    return res.status(201).json(account);
  } catch (error) {
    console.error("Error creating account:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const getAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const accounts = await accountRepo.find({ where: { user: { id: user.id } } });
    res.status(200).json(accounts);
  } catch (error) {
    next(error);
  }
};

export const getAccountById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const account = await accountRepo.findOne({
      where: { id: parseInt(req.params.id), user: { id: user.id } },
    });

    if (!account) throw new NotFoundError("Account not found");
    res.status(200).json(account);
  } catch (error) {
    next(error);
  }
};

export const updateAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const account = await accountRepo.findOne({
      where: { id: parseInt(req.params.id), user: { id: user.id } },
    });

    if (!account) throw new NotFoundError("Account not found");

    const { name } = req.body;
    if (name) {
      const normalized = name.toLowerCase();
      const duplicate = await accountRepo
        .createQueryBuilder("account")
        .where("LOWER(account.name) = :name", { name: normalized })
        .andWhere("account.userId = :userId", { userId: user.id })
        .andWhere("account.id != :currentId", { currentId: account.id })
        .getOne();

      if (duplicate) {
        return res.status(400).json({
          message: "Another account with that name already exists."
        });
      }
    }

    Object.assign(account, req.body);
    await accountRepo.save(account);
    return res.status(200).json(account);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const account = await accountRepo.findOne({
      where: { id: parseInt(req.params.id), user: { id: user.id } },
    });

    if (!account) throw new NotFoundError("Account not found");

    await accountRepo.delete(account.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const suggestAccountMetadata = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const { description } = req.body;
    const accounts = await accountRepo.find({ where: { user: { id: user.id } } });

    const lower = description.toLowerCase();
    const match = accounts.find(acc =>
      acc.name.toLowerCase().includes(lower) ||
      acc.category?.toLowerCase().includes(lower) ||
      acc.subcategory?.toLowerCase().includes(lower)
    );

    if (!match) throw new NotFoundError("No matching account found");

    res.json({
      suggestedAccountId: match.id,
      suggestedAccountName: match.name,
    });
  } catch (error) {
    next(error);
  }
};

// 💡 New smarter auto-categorization logic
export const suggestAccount = async (req: Request, res: Response) => {
  try {
    console.log("📥 suggestAccount body:", req.body);
    
    const { name } = req.body;
    if (!name) {
      console.error("🔥 suggestAccount error: Missing name in request body");
      return res.status(400).json({ message: "Account name is required." });
    }

    console.log("🔍 Getting suggestion for name:", name);
    const suggestion = getSuggestedMetadata(name);
    
    if (suggestion) {
      console.log("✅ Found suggestion:", suggestion);
      return res.json(suggestion);
    }

    console.log("ℹ️ No specific suggestion found, using default");
    return res.json({
      type: "ASSET",
      category: "Uncategorized",
      subcategory: "",
      financialCategory: "OPERATING_EXPENSE",
      financialSubcategory: "Uncategorized",
    });
  } catch (error) {
    console.error("🔥 suggestAccount error:", error);
    return res.status(500).json({ 
      message: "Suggestion failed", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
};

export const suggestAccountAutoCategory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    console.log("�� suggestAccountAutoCategory body:", req.body);
    
    const user = await getUser(req);
    if (!user) {
      console.error("🔥 suggestAccountAutoCategory error: No authenticated user found");
      return res.status(401).json({ message: "Authentication required" });
    }

    const { name } = req.body;
    if (!name) {
      console.error("🔥 suggestAccountAutoCategory error: Missing name in request body");
      return res.status(400).json({ message: "Account name is required." });
    }

    console.log("[AutoCategory] Incoming name:", name);

    // 1. Check against keyword map FIRST
    const suggestion = getSuggestedMetadata(name);
    if (suggestion) {
      console.log("[AutoCategory] Keyword match found:", suggestion);
      return res.status(200).json(suggestion);
    }

    // 2. If no keyword match, look through user's existing accounts
    console.log("[AutoCategory] No keyword match, checking user accounts");
    const accounts = await accountRepo.find({ where: { user: { id: user.id } } });
    const match = accounts.find((acc) =>
      acc.name.toLowerCase().includes(name.toLowerCase()) ||
      acc.category?.toLowerCase().includes(name.toLowerCase()) ||
      acc.subcategory?.toLowerCase().includes(name.toLowerCase())
    );

    if (match) {
      console.log("[AutoCategory] Fallback matched user account:", match.name);
      return res.status(200).json({
        type: match.type,
        category: match.category,
        subcategory: match.subcategory,
        financialCategory: match.financialCategory,
        financialSubcategory: match.financialSubcategory,
      });
    }

    // 3. Final fallback
    console.log("[AutoCategory] No match found, using full fallback");
    return res.status(200).json({
      type: "ASSET",
      category: "Uncategorized",
      subcategory: "",
      financialCategory: "CURRENT_ASSET",
      financialSubcategory: "Uncategorized",
    });
  } catch (error) {
    console.error("[AutoCategory] Error:", error);
    return res.status(500).json({ 
      message: "Suggestion failed", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
};



