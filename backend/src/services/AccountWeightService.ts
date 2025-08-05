import { AppDataSource } from "../config/data-source";
import { AccountWeight } from "../entities/AccountWeight";
import { Account } from "../entities/Account";
import { logError } from '../utils/logger';

export interface AccountWeightData {
  keyword: string;
  accountId: number;
  weight: number;
  transactionType?: string;
  isDefault?: boolean;
}

export class AccountWeightService {
  private accountWeightRepo = AppDataSource.getRepository(AccountWeight);
  private accountRepo = AppDataSource.getRepository(Account);

  // Default weights for common business keywords
  private readonly defaultWeights: AccountWeightData[] = [
    // Revenue keywords
    { keyword: "sold", accountId: 0, weight: 90, transactionType: "INCOME" }, // Will be mapped to Sales Revenue
    { keyword: "sale", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "refund", accountId: 0, weight: 10, transactionType: "INCOME" },
    
    // Purchase keywords
    { keyword: "bought", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "buy", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "purchase", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "inventory", accountId: 0, weight: 15, transactionType: "EXPENSE" },
    
    // Equity and Contributions
    { keyword: "initial_contribution", accountId: 0, weight: 95, transactionType: "EQUITY" },
    { keyword: "owner_contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "capital_contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "business_formation", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "personal_funds", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "equity_investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner_investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner_draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner_draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "contribution", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "investment", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "equity", accountId: 0, weight: 95, transactionType: "EQUITY" },
    { keyword: "capital", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "partner", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "draw", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "withdrawal", accountId: 0, weight: 85, transactionType: "EQUITY" },
    
    // Assets & Liabilities
    { keyword: "loan_repayment", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "credit_card_payment", accountId: 0, weight: 85, transactionType: "LIABILITY" },
    { keyword: "equipment_purchase", accountId: 0, weight: 85, transactionType: "ASSET" },
    { keyword: "personal_use", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "deposit", accountId: 0, weight: 85, transactionType: "ASSET" },
    { keyword: "loan", accountId: 0, weight: 85, transactionType: "LIABILITY" },
    { keyword: "transfer", accountId: 0, weight: 85, transactionType: "TRANSFER" },
    { keyword: "repayment", accountId: 0, weight: 85, transactionType: "LIABILITY" },
    { keyword: "equipment", accountId: 0, weight: 85, transactionType: "ASSET" },
    
    // Operating expense keywords
    { keyword: "rent", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "utilities", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "marketing", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "advertising", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "accounting", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // Payroll keywords
    { keyword: "payroll", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "salary", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "wages", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "employee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // Tax keywords
    { keyword: "tax", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "taxes", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "irs", accountId: 0, weight: 90, transactionType: "EXPENSE" },
  ];

  async getUserWeights(userId: number): Promise<AccountWeight[]> {
    try {
      const weights = await this.accountWeightRepo.find({
        where: { userId },
        order: { keyword: 'ASC', weight: 'DESC' }
      });

      // Get account names for each weight
      const weightsWithAccounts = await Promise.all(
        weights.map(async (weight) => {
          const account = await this.accountRepo.findOne({
            where: { id: weight.accountId }
          });
          
          return {
            ...weight,
            accountName: account?.name || 'Unknown Account'
          };
        })
      );

      return weightsWithAccounts;
    } catch (error) {
      logError(`Failed to get user weights: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
      throw error;
    }
  }

  async createOrUpdateWeight(userId: number, data: AccountWeightData): Promise<AccountWeight> {
    try {
      // Check if weight already exists
      const whereClause: any = {
        userId,
        keyword: data.keyword,
        accountId: data.accountId
      };
      
      if (data.transactionType) {
        whereClause.transactionType = data.transactionType;
      }

      const existingWeight = await this.accountWeightRepo.findOne({
        where: whereClause
      });

      if (existingWeight) {
        // Update existing weight
        existingWeight.weight = data.weight;
        existingWeight.isDefault = data.isDefault || false;
        existingWeight.lastUsed = new Date();
        return await this.accountWeightRepo.save(existingWeight);
      } else {
        // Create new weight
        const weight = this.accountWeightRepo.create({
          userId,
          keyword: data.keyword,
          accountId: data.accountId,
          weight: data.weight,
          transactionType: data.transactionType,
          isDefault: data.isDefault || false,
          lastUsed: new Date()
        });
        return await this.accountWeightRepo.save(weight);
      }
    } catch (error) {
      logError(`Failed to create/update weight: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
      throw error;
    }
  }

  async deleteWeight(id: number, userId: number): Promise<void> {
    try {
      const weight = await this.accountWeightRepo.findOne({
        where: { id, userId }
      });

      if (!weight) {
        throw new Error('Weight not found');
      }

      await this.accountWeightRepo.remove(weight);
    } catch (error) {
      logError(`Failed to delete weight: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
      throw error;
    }
  }

  async getWeightsForKeyword(userId: number, keyword: string, transactionType?: string): Promise<AccountWeight[]> {
    try {
      const whereClause: any = {
        userId,
        keyword: keyword.toLowerCase()
      };

      if (transactionType) {
        whereClause.transactionType = transactionType;
      }

      return await this.accountWeightRepo.find({
        where: whereClause,
        order: { weight: 'DESC' }
      });
    } catch (error) {
      logError(`Failed to get weights for keyword: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
      throw error;
    }
  }

  async initializeDefaultWeights(userId: number): Promise<void> {
    try {
      // Get user's accounts to map default weights
      const userAccounts = await this.accountRepo.find({
        where: { user: { id: userId } }
      });

      // Map default weights to user's actual accounts
      for (const defaultWeight of this.defaultWeights) {
        // Find matching account by name pattern
        const matchingAccount = this.findMatchingAccount(userAccounts, defaultWeight);
        
        if (matchingAccount) {
          // Check if default weight already exists
          const existingWeight = await this.accountWeightRepo.findOne({
            where: {
              userId,
              keyword: defaultWeight.keyword,
              accountId: matchingAccount.id,
              isDefault: true
            }
          });

          if (!existingWeight) {
            // Create default weight
            await this.accountWeightRepo.save({
              userId,
              keyword: defaultWeight.keyword,
              accountId: matchingAccount.id,
              weight: defaultWeight.weight,
              transactionType: defaultWeight.transactionType,
              isDefault: true,
              lastUsed: new Date()
            });
          }
        }
      }
    } catch (error) {
      logError(`Failed to initialize default weights: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
      throw error;
    }
  }

  private findMatchingAccount(accounts: Account[], defaultWeight: AccountWeightData): Account | null {
    const keyword = defaultWeight.keyword.toLowerCase();

    // First, try to find exact name matches
    for (const account of accounts) {
      const accountName = account.name.toLowerCase();
      
      // For revenue keywords, look for sales/revenue accounts
      if (keyword === "sold" || keyword === "sale" || keyword === "sales" || keyword === "revenue" || keyword === "income") {
        if (accountName.includes("sales") || accountName.includes("revenue") || accountName.includes("income")) {
          return account;
        }
      }
      
      // For refund keyword, look for refund accounts
      if (keyword === "refund") {
        if (accountName.includes("refund")) {
          return account;
        }
      }
      
      // For purchase keywords, look for purchase/expense accounts
      if (keyword === "bought" || keyword === "buy" || keyword === "purchase") {
        // Prioritize accounts with "purchase" in the name
        if (accountName.includes("purchase")) {
          return account;
        }
        // Then look for general expense accounts, but avoid specific ones like "rent expense"
        if (accountName.includes("expense") && !accountName.includes("rent") && !accountName.includes("utilities") && !accountName.includes("marketing") && !accountName.includes("payroll")) {
          return account;
        }
        // Finally, look for cost-related accounts
        if (accountName.includes("cost")) {
          return account;
        }
      }
      
      // For inventory keyword, look for inventory accounts
      if (keyword === "inventory") {
        if (accountName.includes("inventory")) {
          return account;
        }
      }
      
      // For specific expense keywords, look for matching accounts
      if (keyword === "rent" && accountName.includes("rent")) return account;
      if (keyword === "utilities" && accountName.includes("utilities")) return account;
      if (keyword === "marketing" && accountName.includes("marketing")) return account;
      if (keyword === "advertising" && accountName.includes("advertising")) return account;
      if (keyword === "insurance" && accountName.includes("insurance")) return account;
      if (keyword === "legal" && accountName.includes("legal")) return account;
      if (keyword === "accounting" && accountName.includes("accounting")) return account;
      if (keyword === "payroll" && accountName.includes("payroll")) return account;
      if (keyword === "salary" && accountName.includes("salary")) return account;
      if (keyword === "wages" && accountName.includes("wages")) return account;
      if (keyword === "employee" && accountName.includes("employee")) return account;
      if (keyword === "tax" && accountName.includes("tax")) return account;
      if (keyword === "taxes" && accountName.includes("taxes")) return account;
      if (keyword === "irs" && accountName.includes("irs")) return account;
      
      // For equity keywords, look for equity accounts
      if (keyword === "contribution" || keyword === "investment" || keyword === "equity" || keyword === "capital" || 
          keyword === "owner" || keyword === "partner" || keyword === "draw" || keyword === "withdrawal" ||
          keyword.includes("contribution") || keyword.includes("investment") || keyword.includes("draw")) {
        if (accountName.includes("equity") || accountName.includes("capital") || accountName.includes("owner") || 
            accountName.includes("partner") || accountName.includes("draw") || accountName.includes("contribution")) {
          return account;
        }
      }

      // For asset keywords, look for asset accounts
      if (keyword === "equipment" || keyword === "deposit" || keyword.includes("equipment")) {
        if (accountName.includes("equipment") || accountName.includes("asset") || accountName.includes("deposit")) {
          return account;
        }
      }

      // For liability keywords, look for liability accounts
      if (keyword === "loan" || keyword === "repayment" || keyword.includes("loan") || keyword.includes("credit")) {
        if (accountName.includes("loan") || accountName.includes("liability") || accountName.includes("credit") || 
            accountName.includes("payable")) {
          return account;
        }
      }
    }

    return null;
  }

  async incrementUsageCount(weightId: number): Promise<void> {
    try {
      await this.accountWeightRepo.increment({ id: weightId }, 'usageCount', 1);
      await this.accountWeightRepo.update(weightId, { lastUsed: new Date() });
    } catch (error) {
      logError(`Failed to increment usage count: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
    }
  }
} 