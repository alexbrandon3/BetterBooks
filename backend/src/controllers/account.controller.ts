import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/Account";
import { getUser } from "../utils/getUser";
import { AuthenticationError, NotFoundError } from "../utils/errors";
import { AuthenticatedRequest } from "../types/express";
import { getSuggestedMetadata } from "../utils/accountCategorizer";
import { BaseController } from "./base.controller";
import { AccountTemplateService } from "../services/accountTemplate.service";
import { JournalEntry } from '../entities/JournalEntry';


const accountRepo = AppDataSource.getRepository(Account);
const journalEntryRepo = AppDataSource.getRepository(JournalEntry);


export class AccountController extends BaseController {
  getAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const accounts = await accountRepo.find({
        where: { user: { id: user.id } },
        order: { name: 'ASC' }
      });

      res.json(accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ message: 'Failed to fetch accounts' });
    }
  }

  getAccountsWithRecalculatedBalances = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const accounts = await accountRepo.find({
        where: { user: { id: user.id } },
        order: { name: 'ASC' }
      });

      // Calculate balances from journal entries
      const accountBalances = new Map<number, number>();
      accounts.forEach(account => {
        accountBalances.set(account.id, 0);
      });

      const journalEntries = await journalEntryRepo.find({
        where: { transaction: { user: { id: user.id } } },
        relations: ['account', 'transaction']
      });

      journalEntries.forEach(entry => {
        const currentBalance = accountBalances.get(entry.account.id) || 0;
        // Ensure entry.amount is a number
        const amount = Number(entry.amount);
        
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
        
        accountBalances.set(entry.account.id, currentBalance + balanceChange);
      });

      // Update account balances
      const accountsWithBalances = accounts.map(account => ({
        ...account,
        balance: Number(accountBalances.get(account.id) || 0) // Ensure balance is a number
      }));

      res.json(accountsWithBalances);
    } catch (error) {
      console.error('Error fetching accounts with recalculated balances:', error);
      res.status(500).json({ message: 'Failed to fetch accounts' });
    }
  }

  getAccountBalances = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const accounts = await accountRepo.find({
        where: { user: { id: user.id } },
        order: { name: 'ASC' }
      });

      // Calculate balances from journal entries
      const accountBalances = new Map<number, number>();
      accounts.forEach(account => {
        accountBalances.set(account.id, 0);
      });

      const journalEntries = await journalEntryRepo.find({
        where: { transaction: { user: { id: user.id } } },
        relations: ['account', 'transaction']
      });

      journalEntries.forEach(entry => {
        const currentBalance = accountBalances.get(entry.account.id) || 0;
        // Ensure entry.amount is a number
        const amount = Number(entry.amount);
        
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
        
        accountBalances.set(entry.account.id, currentBalance + balanceChange);
      });

      // Return balances in the format expected by frontend
      const balances = Array.from(accountBalances.entries()).map(([accountId, balance]) => ({
        accountId,
        balance: Number(balance) // Ensure balance is a number
      }));

      res.json(balances);
    } catch (error) {
      console.error('Error fetching account balances:', error);
      res.status(500).json({ message: 'Failed to fetch account balances' });
    }
  }

  createAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { name, type, category, subcategory, financialCategory, financialSubcategory, balance } = req.body;

      // Validate required fields
      if (!name || !name.trim()) {
        res.status(400).json({ message: 'Account name is required' });
        return;
      }

      // Check for duplicate account names (case-insensitive)
      const existingAccount = await accountRepo.findOne({
        where: { 
          name: name.trim(),
          user: { id: user.id }
        }
      });

      if (existingAccount) {
        res.status(400).json({ 
          message: `Account "${name.trim()}" already exists. Please choose a different name.`,
          duplicateName: name.trim()
        });
        return;
      }

      const accountData = {
        name: name.trim(),
        type,
        category: category?.trim() || 'Uncategorized',
        subcategory: subcategory?.trim() || '',
        financialCategory,
        financialSubcategory: financialSubcategory?.trim() || 'UNCATEGORIZED',
        balance: balance || 0,
        user: { id: user.id }
      };

      const account = accountRepo.create(accountData);
      const savedAccount = await accountRepo.save(account);

      // Automatically index the new account for SmartSuggestions
      try {
        await this.indexAccountForSuggestions(savedAccount, user.id);
      } catch (indexError) {
        console.error('Error indexing account for suggestions:', indexError);
        // Don't fail account creation if indexing fails
      }

      res.status(201).json(savedAccount);
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ message: 'Failed to create account' });
    }
  }

  /**
   * Index a new account for SmartSuggestions by extracting keywords and creating weight mappings
   */
  private async indexAccountForSuggestions(account: Account, userId: number): Promise<void> {
    try {
      const { extractKeywords } = await import('../utils/accountCategorizer');
      const AccountWeightService = (await import('../services/AccountWeightService')).AccountWeightService;
      
      const accountWeightService = new AccountWeightService();
      
      // Extract keywords from account name, category, and subcategory
      const keywords = extractKeywords(account.name);
      const categoryKeywords = account.category ? extractKeywords(account.category) : [];
      const subcategoryKeywords = account.subcategory ? extractKeywords(account.subcategory) : [];
      
      // Combine all keywords and remove duplicates
      const allKeywords = [...new Set([...keywords, ...categoryKeywords, ...subcategoryKeywords])];
      
      // Create weight mappings for each keyword
      for (const keyword of allKeywords) {
        if (keyword.length > 2) { // Only index meaningful keywords
          await accountWeightService.createOrUpdateWeight(userId, {
            keyword: keyword.toLowerCase(),
            accountId: account.id,
            weight: 75, // Default weight for account name keywords
            transactionType: this.getTransactionTypeFromAccountType(account.type),
            isDefault: false
          });
        }
      }
      
      console.log(`✅ Indexed account "${account.name}" with ${allKeywords.length} keywords for SmartSuggestions`);
    } catch (error) {
      console.error('Error indexing account for suggestions:', error);
      throw error;
    }
  }

  /**
   * Map account type to transaction type for SmartSuggestions
   */
  private getTransactionTypeFromAccountType(accountType: string): string {
    switch (accountType) {
      case 'ASSET':
        return 'ASSET';
      case 'LIABILITY':
        return 'LIABILITY';
      case 'EQUITY':
        return 'EQUITY';
      case 'INCOME':
        return 'INCOME';
      case 'EXPENSE':
        return 'EXPENSE';
      default:
        return 'TRANSFER';
    }
  }

  updateAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const account = await accountRepo.findOne({
        where: { id: Number(id), user: { id: user.id } }
      });

      if (!account) {
        res.status(404).json({ message: 'Account not found' });
        return;
      }

      Object.assign(account, req.body);
      const updatedAccount = await accountRepo.save(account);

      res.json(updatedAccount);
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({ message: 'Failed to update account' });
    }
  }

  deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const account = await accountRepo.findOne({
        where: { id: Number(id), user: { id: user.id } },
        relations: ['journalEntries']
      });

      if (!account) {
        res.status(404).json({ message: 'Account not found' });
        return;
      }

      // Check if account has journal entries (transactions)
      if (account.journalEntries && account.journalEntries.length > 0) {
        res.status(400).json({ 
          message: 'Cannot delete account with existing transactions. Please delete all transactions for this account first.',
          transactionCount: account.journalEntries.length
        });
        return;
      }

      await accountRepo.remove(account);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ message: 'Failed to delete account' });
    }
  }

  getAccountById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

  suggestAccountMetadata = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

  suggestAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { name } = req.body;
      if (!name) {
        res.status(400).json({ message: 'Account name is required' });
        return;
      }

      const suggestion = getSuggestedMetadata(name);
      
      // Add confidence scoring based on SmartSuggestions logic
      const enhancedSuggestion = {
        ...suggestion,
        confidence: this.calculateConfidenceScore(suggestion, name),
        reportingPreview: this.getReportingPreview(suggestion)
      };
      
      res.json(enhancedSuggestion);
    } catch (error) {
      console.error('Error suggesting account:', error);
      res.status(500).json({ message: 'Failed to suggest account' });
    }
  }

  checkDuplicateAccountName = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { name } = req.body;
      if (!name) {
        res.status(400).json({ message: 'Account name is required' });
        return;
      }

      // Check for duplicate account names
      const existingAccount = await accountRepo.findOne({
        where: { 
          name: name.trim(),
          user: { id: user.id }
        }
      });

      if (existingAccount) {
        res.json({ 
          isDuplicate: true, 
          message: `Account "${name.trim()}" already exists`,
          existingAccount: {
            id: existingAccount.id,
            name: existingAccount.name,
            type: existingAccount.type,
            category: existingAccount.category
          }
        });
        return;
      }

      res.json({ isDuplicate: false });
    } catch (error) {
      console.error('Error checking account name:', error);
      res.status(500).json({ message: 'Failed to check account name' });
    }
  }

  suggestAccountAutoCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { name } = req.body;
      if (!name) {
        res.status(400).json({ message: 'Account name is required' });
        return;
      }

      const suggestion = getSuggestedMetadata(name);
      res.json(suggestion);
    } catch (error) {
      console.error('Error suggesting account metadata:', error);
      res.status(500).json({ message: 'Failed to suggest account metadata' });
    }
  }

  /**
   * Calculate confidence score based on SmartSuggestions logic
   */
  private calculateConfidenceScore(suggestion: any, accountName: string): number {
    if (!suggestion) return 0;

    let score = 0;
    const normalizedName = accountName.toLowerCase();

    // Base confidence from suggestion engine (0-40 points)
    if (suggestion.confidence === 'high') score += 35;
    else if (suggestion.confidence === 'medium') score += 25;
    else if (suggestion.confidence === 'low') score += 15;

    // Exact keyword matches (0-20 points)
    const exactMatches = ['cash', 'bank', 'credit', 'loan', 'salary', 'rent', 'utilities', 'insurance', 'marketing', 'advertising', 'expense', 'expenses'];
    for (const match of exactMatches) {
      if (normalizedName.includes(match)) {
        score += 15;
        break; // Only count the first match to avoid over-scoring
      }
    }

    // Business context scoring (0-10 points)
    const businessKeywords = ['business', 'company', 'corp', 'llc', 'inc', 'ltd'];
    const hasBusinessContext = businessKeywords.some(keyword => normalizedName.includes(keyword));
    if (hasBusinessContext) score += 8;

    // Length and complexity scoring (0-5 points)
    if (accountName.length > 10) score += 3;
    if (accountName.split(' ').length > 2) score += 2;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Get reporting preview for how account will appear in financial statements
   */
  private getReportingPreview(suggestion: any): any {
    if (!suggestion) return null;

    const preview: {
      balanceSheet: any;
      incomeStatement: any;
      cashFlow: any;
    } = {
      balanceSheet: null,
      incomeStatement: null,
      cashFlow: null
    };

    switch (suggestion.financialCategory) {
      case 'CURRENT_ASSET':
      case 'FIXED_ASSET':
        preview.balanceSheet = {
          section: 'Assets',
          subsection: suggestion.financialCategory === 'CURRENT_ASSET' ? 'Current Assets' : 'Fixed Assets',
          category: suggestion.category
        };
        break;
      case 'CURRENT_LIABILITY':
      case 'LONG_TERM_LIABILITY':
        preview.balanceSheet = {
          section: 'Liabilities',
          subsection: suggestion.financialCategory === 'CURRENT_LIABILITY' ? 'Current Liabilities' : 'Long-term Liabilities',
          category: suggestion.category
        };
        break;
      case 'EQUITY':
      case 'RETAINED_EARNINGS':
      case 'DRAWINGS':
        preview.balanceSheet = {
          section: 'Equity',
          subsection: suggestion.financialCategory === 'DRAWINGS' ? 'Owner Withdrawals' : 'Owner Equity',
          category: suggestion.category
        };
        break;
      case 'OPERATING_REVENUE':
      case 'NON_OPERATING_REVENUE':
        preview.incomeStatement = {
          section: 'Revenue',
          subsection: suggestion.financialCategory === 'OPERATING_REVENUE' ? 'Operating Revenue' : 'Other Income',
          category: suggestion.category
        };
        break;
      case 'OPERATING_EXPENSE':
      case 'NON_OPERATING_EXPENSE':
        preview.incomeStatement = {
          section: 'Expenses',
          subsection: suggestion.financialCategory === 'OPERATING_EXPENSE' ? 'Operating Expenses' : 'Other Expenses',
          category: suggestion.category
        };
        break;
    }

    // Cash flow categorization
    if (suggestion.financialCategory === 'CURRENT_ASSET' && suggestion.financialSubcategory === 'CASH_AND_EQUIVALENTS') {
      preview.cashFlow = {
        section: 'Operating Activities',
        category: 'Cash and Cash Equivalents'
      };
    } else if (suggestion.financialCategory === 'FIXED_ASSET') {
      preview.cashFlow = {
        section: 'Investing Activities',
        category: 'Capital Expenditures'
      };
    } else if (suggestion.financialCategory === 'LONG_TERM_LIABILITY') {
      preview.cashFlow = {
        section: 'Financing Activities',
        category: 'Long-term Debt'
      };
    }

    return preview;
  }

  getAccountTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const templates = AccountTemplateService.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching account templates:', error);
      res.status(500).json({ message: 'Failed to fetch account templates' });
    }
  }
}



