import React, { createContext, useContext, useState, useCallback } from 'react';
import { Account } from '../types/account';
import { JournalEntry } from '../types/JournalEntry';
import { 
  LedgerEntry, 
  AccountLedger, 
  GeneralLedger, 
  LedgerValidationResult,
  BalanceChange,
  LedgerFilters,
  LedgerSummary,
  ValidationResult,
  LedgerContextType
} from '../types/ledger';

export const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
};

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ledger, setLedger] = useState<GeneralLedger>({
    accounts: {},
    flaggedTransactions: [],
    lastUpdated: new Date().toISOString()
  });

  const validateJournalEntry = useCallback((entry: JournalEntry): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if debits equal credits
    const totalDebits = entry.debits.reduce((sum, debit) => sum + debit.amount, 0);
    const totalCredits = entry.credits.reduce((sum, credit) => sum + credit.amount, 0);
    if (totalDebits !== totalCredits) {
      errors.push(`Debits (${totalDebits}) do not equal credits (${totalCredits})`);
    }

    // Check for negative amounts
    if (entry.debits.some(debit => debit.amount < 0) || entry.credits.some(credit => credit.amount < 0)) {
      errors.push('Negative amounts are not allowed');
    }

    // Check for zero amounts
    if (totalDebits === 0 && totalCredits === 0) {
      warnings.push('Transaction amount is zero');
    }

    // Check for large amounts
    if (totalDebits > 1000000) {
      warnings.push('Large transaction amount detected');
    }

    // Check for future dates
    const entryDate = new Date(entry.date);
    if (entryDate > new Date()) {
      warnings.push('Transaction date is in the future');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }, []);

  const calculateNewBalance = useCallback((
    currentBalance: number,
    changes: BalanceChange[]
  ): number => {
    return changes.reduce((balance, change) => {
      return change.isDebit 
        ? balance + change.amount 
        : balance - change.amount;
    }, currentBalance);
  }, []);

  const detectUnusualActivity = useCallback((entry: JournalEntry): boolean => {
    // Check for unusual patterns
    const totalAmount = entry.debits.reduce((sum, debit) => sum + debit.amount, 0);
    
    // Flag transactions with ambiguous descriptions
    if (entry.description.toLowerCase().includes('misc') || 
        entry.description.toLowerCase().includes('other') ||
        entry.description.toLowerCase().includes('various')) {
      return true;
    }

    // Flag transactions with round numbers (potential estimates)
    if (totalAmount % 100 === 0) {
      return true;
    }

    return false;
  }, []);

  const postJournalEntry = useCallback(async (entry: JournalEntry): Promise<ValidationResult> => {
    const validation = validateJournalEntry(entry);
    if (!validation.isValid) {
      return validation;
    }

    const isUnusual = detectUnusualActivity(entry);
    if (isUnusual) {
      validation.warnings = [...(validation.warnings || []), 'Some entries were flagged for review'];
    }

    // Update ledger state
    setLedger(prevLedger => {
      const newLedger = { ...prevLedger };
      
      // Update account balances
      entry.debits.forEach(debit => {
        if (!newLedger.accounts[debit.account.id]) {
          newLedger.accounts[debit.account.id] = {
            account: debit.account,
            entries: [],
            currentBalance: 0
          };
        }
        newLedger.accounts[debit.account.id].currentBalance += debit.amount;
        newLedger.accounts[debit.account.id].entries.push({
          id: `${entry.id}-debit`,
          transactionId: entry.id,
          account: debit.account,
          date: entry.date,
          description: entry.description,
          debit: debit.amount,
          credit: 0,
          balanceAfter: newLedger.accounts[debit.account.id].currentBalance,
          userId: entry.userId,
          timestamp: entry.timestamp,
          isFlagged: isUnusual,
          auditTrail: [{
            id: `AT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            action: 'CREATE',
            entityType: 'TRANSACTION',
            entityId: entry.id,
            timestamp: new Date().toISOString(),
            userId: entry.userId,
            changes: [],
            metadata: {}
          }]
        });
      });

      entry.credits.forEach(credit => {
        if (!newLedger.accounts[credit.account.id]) {
          newLedger.accounts[credit.account.id] = {
            account: credit.account,
            entries: [],
            currentBalance: 0
          };
        }
        newLedger.accounts[credit.account.id].currentBalance -= credit.amount;
        newLedger.accounts[credit.account.id].entries.push({
          id: `${entry.id}-credit`,
          transactionId: entry.id,
          account: credit.account,
          date: entry.date,
          description: entry.description,
          debit: 0,
          credit: credit.amount,
          balanceAfter: newLedger.accounts[credit.account.id].currentBalance,
          userId: entry.userId,
          timestamp: entry.timestamp,
          isFlagged: isUnusual,
          auditTrail: [{
            id: `AT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            action: 'CREATE',
            entityType: 'TRANSACTION',
            entityId: entry.id,
            timestamp: new Date().toISOString(),
            userId: entry.userId,
            changes: [],
            metadata: {}
          }]
        });
      });

      // Update flagged transactions
      if (isUnusual) {
        newLedger.flaggedTransactions.push({
          id: entry.id,
          transactionId: entry.id,
          account: entry.debits[0].account,
          date: entry.date,
          description: entry.description,
          debit: entry.debits[0].amount,
          credit: 0,
          balanceAfter: newLedger.accounts[entry.debits[0].account.id].currentBalance,
          userId: entry.userId,
          timestamp: entry.timestamp,
          isFlagged: true,
          auditTrail: [{
            id: `AT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            action: 'CREATE',
            entityType: 'TRANSACTION',
            entityId: entry.id,
            timestamp: new Date().toISOString(),
            userId: entry.userId,
            changes: [],
            metadata: {}
          }]
        });
      }

      newLedger.lastUpdated = new Date().toISOString();
      return newLedger;
    });

    return validation;
  }, [validateJournalEntry, detectUnusualActivity]);

  const getAccountLedger = useCallback((accountId: string) => {
    return ledger.accounts[accountId];
  }, [ledger]);

  const getFlaggedTransactions = useCallback(() => {
    return ledger.flaggedTransactions;
  }, [ledger]);

  const filterLedgerEntries = useCallback((filters: LedgerFilters) => {
    let entries: LedgerEntry[] = [];
    
    // Collect all entries from all accounts
    Object.values(ledger.accounts).forEach(account => {
      entries = entries.concat(account.entries);
    });

    // Apply filters
    if (filters.accountId) {
      entries = entries.filter(entry => entry.account.id === filters.accountId);
    }

    if (filters.dateRange) {
      entries = entries.filter(entry => {
        const entryDate = new Date(entry.date).getTime();
        return entryDate >= filters.dateRange![0] && entryDate <= filters.dateRange![1];
      });
    }

    if (filters.amountRange) {
      entries = entries.filter(entry => {
        const amount = entry.debit || entry.credit;
        return amount >= filters.amountRange!.min && amount <= filters.amountRange!.max;
      });
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      entries = entries.filter(entry => 
        entry.description.toLowerCase().includes(searchTerm) ||
        entry.account.name.toLowerCase().includes(searchTerm)
      );
    }

    return entries;
  }, [ledger]);

  const getLedgerSummary = useCallback(() => {
    let totalDebits = 0;
    let totalCredits = 0;
    let attachmentCount = 0;
    let minDate = Infinity;
    let maxDate = -Infinity;

    Object.values(ledger.accounts).forEach(account => {
      account.entries.forEach(entry => {
        totalDebits += entry.debit;
        totalCredits += entry.credit;
        if (entry.attachments) {
          attachmentCount += entry.attachments.length;
        }
        const entryDate = new Date(entry.date).getTime();
        minDate = Math.min(minDate, entryDate);
        maxDate = Math.max(maxDate, entryDate);
      });
    });

    return {
      totalDebits,
      totalCredits,
      netChange: totalDebits - totalCredits,
      flaggedCount: ledger.flaggedTransactions.length,
      attachmentCount,
      dateRange: {
        start: minDate === Infinity ? 0 : minDate,
        end: maxDate === -Infinity ? 0 : maxDate
      }
    };
  }, [ledger]);

  const value: LedgerContextType = {
    ledger,
    postJournalEntry,
    getAccountLedger,
    getFlaggedTransactions,
    filterLedgerEntries,
    getLedgerSummary,
    validateJournalEntry,
    detectUnusualActivity
  };

  return (
    <LedgerContext.Provider value={value}>
      {children}
    </LedgerContext.Provider>
  );
}; 