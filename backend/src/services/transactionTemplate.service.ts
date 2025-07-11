import { TransactionType, EntryType, TransactionTemplate } from '../types/transaction.types';
import { AccountType } from '../entities/Account';
import { AppDataSource } from '../config/data-source';
import { TransactionTemplate as TransactionTemplateEntity } from '../entities/TransactionTemplate';
import { User } from '../entities/User';
import {  logSuccess, logError } from '../utils/logger';

export class TransactionTemplateService {
  private static systemTemplates: TransactionTemplate[] = [
    // Transfer between accounts
    {
      type: TransactionType.TRANSFER,
      name: "Account Transfer",
      description: "Move money between accounts",
      requiredAccounts: [
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.CREDIT,
          description: "From Account (decrease)",
          isDebit: false
        },
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.DEBIT,
          description: "To Account (increase)",
          isDebit: true
        }
      ]
    },

    // Income transaction
    {
      type: TransactionType.INCOME,
      name: "Income",
      description: "Record income or revenue",
      requiredAccounts: [
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.DEBIT,
          description: "Asset Account (increase)",
          isDebit: true
        },
        {
          accountType: AccountType.INCOME,
          entryType: EntryType.CREDIT,
          description: "Income Account (increase)",
          isDebit: false
        }
      ]
    },

    // Expense transaction
    {
      type: TransactionType.EXPENSE,
      name: "Expense",
      description: "Record an expense",
      requiredAccounts: [
        {
          accountType: AccountType.EXPENSE,
          entryType: EntryType.DEBIT,
          description: "Expense Account (increase)",
          isDebit: true
        },
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.CREDIT,
          description: "Asset Account (decrease)",
          isDebit: false
        }
      ]
    },

    // Loan payment (principal + interest)
    {
      type: TransactionType.LOAN_PAYMENT,
      name: "Loan Payment",
      description: "Record a loan payment with principal and interest",
      requiredAccounts: [
        {
          accountType: AccountType.LIABILITY,
          entryType: EntryType.DEBIT,
          description: "Loan Principal (decrease)",
          isDebit: true
        },
        {
          accountType: AccountType.EXPENSE,
          entryType: EntryType.DEBIT,
          description: "Interest Expense (increase)",
          isDebit: true
        },
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.CREDIT,
          description: "Asset Account (decrease)",
          isDebit: false
        }
      ]
    },

    // Asset purchase
    {
      type: TransactionType.ASSET_PURCHASE,
      name: "Asset Purchase",
      description: "Purchase an asset",
      requiredAccounts: [
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.DEBIT,
          description: "Asset Account (increase)",
          isDebit: true
        },
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.CREDIT,
          description: "Asset Account (decrease)",
          isDebit: false
        }
      ]
    },

    // Liability settlement
    {
      type: TransactionType.LIABILITY_SETTLEMENT,
      name: "Liability Settlement",
      description: "Pay off a liability",
      requiredAccounts: [
        {
          accountType: AccountType.LIABILITY,
          entryType: EntryType.DEBIT,
          description: "Liability Account (decrease)",
          isDebit: true
        },
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.CREDIT,
          description: "Asset Account (decrease)",
          isDebit: false
        }
      ]
    },

    // Equity contribution
    {
      type: TransactionType.EQUITY_CONTRIBUTION,
      name: "Equity Contribution",
      description: "Owner contribution to business",
      requiredAccounts: [
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.DEBIT,
          description: "Asset Account (increase)",
          isDebit: true
        },
        {
          accountType: AccountType.EQUITY,
          entryType: EntryType.CREDIT,
          description: "Equity Account (increase)",
          isDebit: false
        }
      ]
    },

    // Equity withdrawal
    {
      type: TransactionType.EQUITY_WITHDRAWAL,
      name: "Equity Withdrawal",
      description: "Owner withdrawal from business",
      requiredAccounts: [
        {
          accountType: AccountType.EQUITY,
          entryType: EntryType.DEBIT,
          description: "Equity Account (decrease)",
          isDebit: true
        },
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.CREDIT,
          description: "Asset Account (decrease)",
          isDebit: false
        }
      ]
    },

    // Balance adjustment
    {
      type: TransactionType.ADJUSTMENT,
      name: "Balance Adjustment",
      description: "Correct account balances",
      requiredAccounts: [
        {
          accountType: AccountType.ASSET,
          entryType: EntryType.DEBIT,
          description: "Account to Adjust",
          isDebit: true
        },
        {
          accountType: AccountType.EXPENSE,
          entryType: EntryType.CREDIT,
          description: "Adjustment Account",
          isDebit: false
        }
      ]
    }
  ];

  static getSystemTemplates(): TransactionTemplate[] {
    return this.systemTemplates;
  }

  static async getUserTemplates(userId: number): Promise<TransactionTemplate[]> {
    try {
      const templateRepo = AppDataSource.getRepository(TransactionTemplateEntity);
      const userTemplates = await templateRepo.find({
        where: { user: { id: userId } },
        order: { usageCount: 'DESC', name: 'ASC' }
      });

      return userTemplates.map(template => ({
        type: template.type,
        name: template.name,
        description: template.description,
        requiredAccounts: template.requiredAccounts,
        optionalAccounts: template.optionalAccounts
      }));
    } catch (error) {
      logError(`Error fetching user templates: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionTemplateService');
      return [];
    }
  }

  static async getAllTemplates(userId: number): Promise<TransactionTemplate[]> {
    const systemTemplates = this.getSystemTemplates();
    const userTemplates = await this.getUserTemplates(userId);
    
    return [...systemTemplates, ...userTemplates];
  }

  static async createUserTemplate(
    userId: number,
    templateData: {
      name: string;
      description: string;
      type: TransactionType;
      requiredAccounts: any[];
      optionalAccounts?: any[];
    }
  ): Promise<TransactionTemplate> {
    try {
      const templateRepo = AppDataSource.getRepository(TransactionTemplateEntity);
      const userRepo = AppDataSource.getRepository(User);
      
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const template = templateRepo.create({
        ...templateData,
        user,
        isSystemTemplate: false,
        usageCount: 0
      });

      const savedTemplate = await templateRepo.save(template);
      logSuccess(`User template created: ${savedTemplate.name}`, 'TransactionTemplateService');

      return {
        type: savedTemplate.type,
        name: savedTemplate.name,
        description: savedTemplate.description,
        requiredAccounts: savedTemplate.requiredAccounts,
        optionalAccounts: savedTemplate.optionalAccounts
      };
    } catch (error) {
      logError(`Error creating user template: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionTemplateService');
      throw error;
    }
  }

  static async updateTemplateUsage(templateId: number): Promise<void> {
    try {
      const templateRepo = AppDataSource.getRepository(TransactionTemplateEntity);
      const template = await templateRepo.findOne({ where: { id: templateId } });
      
      if (template && !template.isSystemTemplate) {
        template.usageCount += 1;
        await templateRepo.save(template);
      }
    } catch (error) {
      logError(`Error updating template usage: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionTemplateService');
    }
  }

  static async deleteUserTemplate(templateId: number, userId: number): Promise<void> {
    try {
      const templateRepo = AppDataSource.getRepository(TransactionTemplateEntity);
      const template = await templateRepo.findOne({
        where: { id: templateId, user: { id: userId }, isSystemTemplate: false }
      });

      if (!template) {
        throw new Error('Template not found or not owned by user');
      }

      await templateRepo.remove(template);
      logSuccess(`User template deleted: ${template.name}`, 'TransactionTemplateService');
    } catch (error) {
      logError(`Error deleting user template: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionTemplateService');
      throw error;
    }
  }

  static getTemplateByType(type: TransactionType): TransactionTemplate | undefined {
    return this.systemTemplates.find(template => template.type === type);
  }

  static suggestTemplate(description: string, entries: any[]): TransactionTemplate | undefined {
    const lowerDescription = description.toLowerCase();
    
    // Simple keyword matching for template suggestions
    if (lowerDescription.includes('transfer') || lowerDescription.includes('move')) {
      return this.getTemplateByType(TransactionType.TRANSFER);
    }
    
    if (lowerDescription.includes('loan') || lowerDescription.includes('payment')) {
      return this.getTemplateByType(TransactionType.LOAN_PAYMENT);
    }
    
    if (lowerDescription.includes('purchase') || lowerDescription.includes('buy')) {
      return this.getTemplateByType(TransactionType.ASSET_PURCHASE);
    }
    
    if (lowerDescription.includes('contribution') || lowerDescription.includes('investment')) {
      return this.getTemplateByType(TransactionType.EQUITY_CONTRIBUTION);
    }
    
    if (lowerDescription.includes('withdrawal') || lowerDescription.includes('draw')) {
      return this.getTemplateByType(TransactionType.EQUITY_WITHDRAWAL);
    }
    
    if (lowerDescription.includes('adjustment') || lowerDescription.includes('correction')) {
      return this.getTemplateByType(TransactionType.ADJUSTMENT);
    }
    
    // Default to income/expense based on entry patterns
    const hasAssetDebit = entries.some(entry => 
      entry.accountType === AccountType.ASSET && entry.type === EntryType.DEBIT
    );
    const hasIncomeCredit = entries.some(entry => 
      entry.accountType === AccountType.INCOME && entry.type === EntryType.CREDIT
    );
    
    if (hasIncomeCredit) {
      return this.getTemplateByType(TransactionType.INCOME);
    }
    
    if (hasAssetDebit) {
      return this.getTemplateByType(TransactionType.EXPENSE);
    }
    
    return undefined;
  }

  static validateTemplate(transactionType: TransactionType, entries: any[]): { isValid: boolean; errors: string[] } {
    const template = this.getTemplateByType(transactionType);
    if (!template) {
      return { isValid: false, errors: ['Invalid transaction type'] };
    }

    const errors: string[] = [];
    
    // Check if required accounts are present
    for (const requiredAccount of template.requiredAccounts) {
      const hasRequiredAccount = entries.some(entry => 
        entry.accountType === requiredAccount.accountType && 
        entry.type === requiredAccount.entryType
      );
      
      if (!hasRequiredAccount) {
        errors.push(`Missing required ${requiredAccount.accountType} account with ${requiredAccount.entryType} entry`);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
} 