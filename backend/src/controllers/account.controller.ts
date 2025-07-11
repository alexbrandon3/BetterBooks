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

      const accountData = {
        ...req.body,
        user: { id: user.id }
      };

      const account = accountRepo.create(accountData);
      const savedAccount = await accountRepo.save(account);

      res.status(201).json(savedAccount);
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ message: 'Failed to create account' });
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
      res.json(suggestion);
    } catch (error) {
      console.error('Error suggesting account:', error);
      res.status(500).json({ message: 'Failed to suggest account' });
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



