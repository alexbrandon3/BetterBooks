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
  async getAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  async getAccountsWithRecalculatedBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        if (entry.type === 'CREDIT') {
          accountBalances.set(entry.account.id, currentBalance + entry.amount);
        } else {
          accountBalances.set(entry.account.id, currentBalance - entry.amount);
        }
      });

      // Update account balances
      const accountsWithBalances = accounts.map(account => ({
        ...account,
        balance: accountBalances.get(account.id) || 0
      }));

      res.json(accountsWithBalances);
    } catch (error) {
      console.error('Error fetching accounts with recalculated balances:', error);
      res.status(500).json({ message: 'Failed to fetch accounts' });
    }
  }

  async getAccountBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        if (entry.type === 'CREDIT') {
          accountBalances.set(entry.account.id, currentBalance + entry.amount);
        } else {
          accountBalances.set(entry.account.id, currentBalance - entry.amount);
        }
      });

      // Return balances in the format expected by frontend
      const balances = Array.from(accountBalances.entries()).map(([accountId, balance]) => ({
        accountId,
        balance
      }));

      res.json(balances);
    } catch (error) {
      console.error('Error fetching account balances:', error);
      res.status(500).json({ message: 'Failed to fetch account balances' });
    }
  }

  async createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  async updateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      await accountRepo.remove(account);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ message: 'Failed to delete account' });
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

  async suggestAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  async suggestAccountAutoCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  async getAccountTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
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



