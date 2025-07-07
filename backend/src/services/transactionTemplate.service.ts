import { TransactionType, EntryType, TransactionTemplate } from '../types/transaction.types';
import { AccountType } from '../entities/Account';

export class TransactionTemplateService {
  private static templates: TransactionTemplate[] = [
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

  static getTemplates(): TransactionTemplate[] {
    return this.templates;
  }

  static getTemplateByType(type: TransactionType): TransactionTemplate | undefined {
    return this.templates.find(template => template.type === type);
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