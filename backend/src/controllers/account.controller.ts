import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Account, AccountType, FinancialCategory } from "../entities/Account";
import { getUser } from "../utils/getUser";
import { AuthenticationError, NotFoundError } from "../utils/errors";
import { AuthenticatedRequest } from "../types/express";
import { getSuggestedMetadata, validateAccountMetadata } from "../utils/accountCategorizer";
import { BaseController } from "./base.controller";
import { AccountTemplateService } from "../services/accountTemplate.service";

const accountRepo = AppDataSource.getRepository(Account);

export class AccountController extends BaseController {
  async getAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accounts = await accountRepo.find({
        where: { user: { id: req.user.userId } },
      });
      this.sendResponse(res, 200, accounts);
    } catch (error) {
      console.error("Get accounts error:", error);
      this.sendError(res, 500, "Internal server error");
    }
  }

  async getAccountsWithRecalculatedBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      
      // Get all accounts for the user
      const accounts = await accountRepo.find({
        where: { user: { id: userId } },
      });

      // Get all journal entries for the user
      const journalEntries = await AppDataSource.getRepository("JournalEntry").find({
        where: { transaction: { user: { id: userId } } },
        relations: ['account', 'transaction']
      });

      console.log(`🔍 Calculating balances for ${accounts.length} accounts with ${journalEntries.length} journal entries`);

      // Calculate balances from journal entries
      const accountBalances = new Map<number, number>();
      accounts.forEach((account: any) => {
        accountBalances.set(account.id, 0);
      });

      journalEntries.forEach((entry: any) => {
        const currentBalance = accountBalances.get(entry.account.id) || 0;
        
        // Ensure entry.amount is a number
        const amount = parseFloat(entry.amount?.toString() || '0');
        if (isNaN(amount)) {
          console.warn(`⚠️ Invalid amount in journal entry:`, entry);
          return;
        }
        
        // Calculate balance change based on entry type and account type
        let balanceChange = 0;
        
        if (entry.type === 'DEBIT') {
          // For ASSET and EXPENSE accounts, debit increases balance
          // For LIABILITY, INCOME, and EQUITY accounts, debit decreases balance
          if (entry.account.type === 'ASSET' || entry.account.type === 'EXPENSE') {
            balanceChange = amount;
          } else {
            balanceChange = -amount;
          }
        } else if (entry.type === 'CREDIT') {
          // For ASSET and EXPENSE accounts, credit decreases balance
          // For LIABILITY, INCOME, and EQUITY accounts, credit increases balance
          if (entry.account.type === 'ASSET' || entry.account.type === 'EXPENSE') {
            balanceChange = -amount;
          } else {
            balanceChange = amount;
          }
        }
        
        const newBalance = currentBalance + balanceChange;
        accountBalances.set(entry.account.id, newBalance);
        
        console.log(`📝 Entry: Account ${entry.account.name} - Type: ${entry.type}, Amount: ${amount}, Balance Change: ${balanceChange}, New Balance: ${newBalance}`);
      });

      // Update account objects with recalculated balances
      const accountsWithRecalculatedBalances = accounts.map(account => {
        const calculatedBalance = accountBalances.get(account.id) || 0;
        console.log(`💰 Account ${account.name}: calculated balance = ${calculatedBalance}`);
        
        return {
          ...account,
          balance: calculatedBalance
        };
      });

      console.log('📤 Sending accounts data to frontend:', JSON.stringify(accountsWithRecalculatedBalances.map(acc => ({
        id: acc.id,
        name: acc.name,
        balance: acc.balance,
        balanceType: typeof acc.balance
      })), null, 2));

      this.sendResponse(res, 200, accountsWithRecalculatedBalances);
    } catch (error) {
      console.error("Get accounts with recalculated balances error:", error);
      this.sendError(res, 500, "Internal server error");
    }
  }

  async createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        name, 
        type, 
        balance, 
        isLiquid,
        category,
        subcategory,
        financialCategory,
        financialSubcategory
      } = req.body;
      
      // If no categorization data is provided, automatically suggest it based on the account name
      let validatedMetadata;
      if (!type && !category && !financialCategory) {
        console.log(`🔍 Auto-categorizing account: ${name}`);
        const suggestion = getSuggestedMetadata(name);
        if (suggestion) {
          validatedMetadata = suggestion;
          console.log(`✅ Auto-categorized as: ${suggestion.category} - ${suggestion.financialCategory}`);
        } else {
          validatedMetadata = validateAccountMetadata({
            type: AccountType.ASSET,
            category: "Uncategorized",
            subcategory: "",
            financialCategory: FinancialCategory.CURRENT_ASSET,
            financialSubcategory: "UNCATEGORIZED"
          });
        }
      } else {
        // Validate and clean the account metadata provided by frontend
        validatedMetadata = validateAccountMetadata({
          type,
          category,
          subcategory,
          financialCategory,
          financialSubcategory
        });
      }
      
      const account = accountRepo.create({
        name,
        type: validatedMetadata.type,
        balance,
        isLiquid,
        category: validatedMetadata.category,
        subcategory: validatedMetadata.subcategory,
        financialCategory: validatedMetadata.financialCategory,
        financialSubcategory: validatedMetadata.financialSubcategory,
        user: { id: req.user.userId },
      });

      await accountRepo.save(account);
      this.sendResponse(res, 201, account);
    } catch (error) {
      console.error("Create account error:", error);
      this.sendError(res, 500, "Internal server error");
    }
  }

  async updateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        name, 
        type, 
        balance, 
        isLiquid,
        category,
        subcategory,
        financialCategory,
        financialSubcategory
      } = req.body;

      const account = await accountRepo.findOne({
        where: { id: Number(id), user: { id: req.user.userId } },
      });

      if (!account) {
        this.sendError(res, 404, "Account not found");
        return;
      }

      // Validate and clean the account metadata if provided
      const validatedMetadata = validateAccountMetadata({
        type: type || account.type,
        category: category || account.category,
        subcategory: subcategory || account.subcategory,
        financialCategory: financialCategory || account.financialCategory,
        financialSubcategory: financialSubcategory || account.financialSubcategory
      });

      account.name = name ?? account.name;
      account.type = validatedMetadata.type;
      account.balance = balance ?? account.balance;
      account.isLiquid = isLiquid ?? account.isLiquid;
      account.category = validatedMetadata.category;
      account.subcategory = validatedMetadata.subcategory;
      account.financialCategory = validatedMetadata.financialCategory;
      account.financialSubcategory = validatedMetadata.financialSubcategory;

      await accountRepo.save(account);
      this.sendResponse(res, 200, account);
    } catch (error) {
      console.error("Update account error:", error);
      this.sendError(res, 500, "Internal server error");
    }
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const account = await accountRepo.findOne({
        where: { id: Number(id), user: { id: req.user.userId } },
      });

      if (!account) {
        this.sendError(res, 404, "Account not found");
        return;
      }

      await accountRepo.remove(account);
      this.sendResponse(res, 200, { message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      this.sendError(res, 500, "Internal server error");
    }
  }

  async getAccountById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await getUser(req);
      if (!user) throw new AuthenticationError();

      const account = await accountRepo.findOne({
        where: { id: parseInt(req.params.id), user: { id: user.id } },
      });

      if (!account) throw new NotFoundError("Account not found");
      this.sendResponse(res, 200, account);
    } catch (error) {
      next(error);
    }
  }

  async suggestAccountMetadata(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

      this.sendResponse(res, 200, {
        suggestedAccountId: match.id,
        suggestedAccountName: match.name,
      });
    } catch (error) {
      next(error);
    }
  }

  async suggestAccount(req: Request, res: Response): Promise<void> {
    try {
      console.log("📥 suggestAccount body:", req.body);
      
      const { name } = req.body;
      if (!name) {
        console.error("🔥 suggestAccount error: Missing name in request body");
        this.sendError(res, 400, "Account name is required.");
        return;
      }

      console.log("🔍 Getting suggestion for name:", name);
      const suggestion = getSuggestedMetadata(name);
      
      if (suggestion) {
        console.log("✅ Found suggestion:", suggestion);
        this.sendResponse(res, 200, suggestion);
      } else {
        console.log("ℹ️ No specific suggestion found, using default");
        this.sendResponse(res, 200, {
          type: "ASSET",
          category: "Uncategorized",
          subcategory: "",
          financialCategory: "OPERATING_EXPENSE",
          financialSubcategory: "Uncategorized",
        });
      }
    } catch (error) {
      console.error("🔥 suggestAccount error:", error);
      this.sendError(res, 500, { 
        message: "Suggestion failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }

  async suggestAccountAutoCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log("📥 suggestAccountAutoCategory body:", req.body);
      
      const user = await getUser(req);
      if (!user) {
        console.error("🔥 suggestAccountAutoCategory error: No authenticated user found");
        this.sendError(res, 401, "Authentication required");
        return;
      }

      const { name } = req.body;
      if (!name) {
        console.error("🔥 suggestAccountAutoCategory error: Missing name in request body");
        this.sendError(res, 400, "Account name is required.");
        return;
      }

      console.log("[AutoCategory] Incoming name:", name);

      // Get enhanced suggestion with explanation and confidence
      const suggestion = getSuggestedMetadata(name);
      if (suggestion) {
        console.log("[AutoCategory] Enhanced suggestion found:", {
          ...suggestion,
          confidence: suggestion.confidence,
          explanation: suggestion.explanation
        });
        
        // Return the enhanced suggestion with explanation
        this.sendResponse(res, 200, {
          type: suggestion.type,
          category: suggestion.category,
          subcategory: suggestion.subcategory,
          financialCategory: suggestion.financialCategory,
          financialSubcategory: suggestion.financialSubcategory,
          explanation: suggestion.explanation,
          confidence: suggestion.confidence
        });
      } else {
        // Fallback to user's existing accounts if no keyword match
        console.log("[AutoCategory] No keyword match, checking user accounts");
        const accounts = await accountRepo.find({ where: { user: { id: user.id } } });
        const match = accounts.find((acc) =>
          acc.name.toLowerCase().includes(name.toLowerCase()) ||
          acc.category?.toLowerCase().includes(name.toLowerCase()) ||
          acc.subcategory?.toLowerCase().includes(name.toLowerCase())
        );

        if (match) {
          console.log("[AutoCategory] Fallback matched user account:", match.name);
          this.sendResponse(res, 200, {
            type: match.type,
            category: match.category,
            subcategory: match.subcategory,
            financialCategory: match.financialCategory,
            financialSubcategory: match.financialSubcategory,
            explanation: `Matched existing account: ${match.name}`,
            confidence: 0.6
          });
        } else {
          // Final fallback with explanation
          console.log("[AutoCategory] No match found, using enhanced fallback");
          this.sendResponse(res, 200, {
            type: "ASSET",
            category: "Uncategorized",
            subcategory: "",
            financialCategory: "CURRENT_ASSET",
            financialSubcategory: "UNCATEGORIZED",
            explanation: "No specific category match found. This account has been classified as a current asset by default. You may want to adjust the classification based on the account's purpose.",
            confidence: 0.3
          });
        }
      }
    } catch (error) {
      console.error("[AutoCategory] Error:", error);
      this.sendError(res, 500, { 
        message: "Suggestion failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }

  async getAccountTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await getUser(req);
      if (!user) throw new AuthenticationError();

      const templates = AccountTemplateService.getAllTemplates();
      this.sendResponse(res, 200, templates);
    } catch (error) {
      console.error("Get account templates error:", error);
      this.sendError(res, 500, "Internal server error");
    }
  }
}



