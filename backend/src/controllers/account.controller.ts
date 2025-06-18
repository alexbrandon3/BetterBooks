import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/Account";
import { getUser } from "../utils/getUser";
import { AuthenticationError, NotFoundError } from "../utils/errors";
import { AuthenticatedRequest } from "../types/express";
import { getSuggestedMetadata } from "../utils/accountCategorizer";
import { BaseController } from "./base.controller";

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

  async createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, type, balance, isLiquid } = req.body;
      
      const account = accountRepo.create({
        name,
        type,
        balance,
        isLiquid,
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
      const { name, type, balance, isLiquid } = req.body;

      const account = await accountRepo.findOne({
        where: { id: Number(id), user: { id: req.user.userId } },
      });

      if (!account) {
        this.sendError(res, 404, "Account not found");
        return;
      }

      account.name = name ?? account.name;
      account.type = type ?? account.type;
      account.balance = balance ?? account.balance;
      account.isLiquid = isLiquid ?? account.isLiquid;

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

      // 1. Check against keyword map FIRST
      const suggestion = getSuggestedMetadata(name);
      if (suggestion) {
        console.log("[AutoCategory] Keyword match found:", suggestion);
        this.sendResponse(res, 200, suggestion);
      } else {
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
          this.sendResponse(res, 200, {
            type: match.type,
            category: match.category,
            subcategory: match.subcategory,
            financialCategory: match.financialCategory,
            financialSubcategory: match.financialSubcategory,
          });
        } else {
          // 3. Final fallback
          console.log("[AutoCategory] No match found, using full fallback");
          this.sendResponse(res, 200, {
            type: "ASSET",
            category: "Uncategorized",
            subcategory: "",
            financialCategory: "CURRENT_ASSET",
            financialSubcategory: "Uncategorized",
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
}



