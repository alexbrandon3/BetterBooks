import { AppDataSource } from '../config/data-source';
import { Account, AccountType, FinancialCategory } from '../entities/Account';

export interface BalanceSheet {
  assets: {
    current: {
      subcategories: Record<string, number>;
      total: number;
    };
    longTerm: {
      subcategories: Record<string, number>;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      subcategories: Record<string, number>;
      total: number;
    };
    longTerm: {
      subcategories: Record<string, number>;
      total: number;
    };
    total: number;
  };
  equity: {
    subcategories: Record<string, number>;
    total: number;
  };
}

export interface IncomeStatement {
  revenue: {
    subcategories: Record<string, number>;
    total: number;
  };
  expenses: {
    subcategories: Record<string, number>;
    total: number;
  };
  netIncome: number;
}

export interface CashFlow {
  operating: {
    subcategories: Record<string, number>;
    total: number;
  };
  investing: {
    subcategories: Record<string, number>;
    total: number;
  };
  financing: {
    subcategories: Record<string, number>;
    total: number;
  };
  netCashFlow: number;
}

export const fetchBalanceSheet = async (): Promise<BalanceSheet> => {
  const accountRepository = AppDataSource.getRepository(Account);
  const accounts = await accountRepository.find({
    relations: ['journalEntries']
  });

  const assets = {
    current: { subcategories: {} as Record<string, number>, total: 0 },
    longTerm: { subcategories: {} as Record<string, number>, total: 0 },
    total: 0
  };

  const liabilities = {
    current: { subcategories: {} as Record<string, number>, total: 0 },
    longTerm: { subcategories: {} as Record<string, number>, total: 0 },
    total: 0
  };

  const equity = {
    subcategories: {} as Record<string, number>,
    total: 0
  };

  accounts.forEach(account => {
    const balance = account.journalEntries.reduce((sum, entry) => {
      return sum + (entry.type === 'DEBIT' ? entry.amount : -entry.amount);
    }, 0);

    if (account.type === AccountType.ASSET) {
      if (account.financialCategory === FinancialCategory.CURRENT_ASSET) {
        assets.current.subcategories[account.name] = balance;
        assets.current.total += balance;
      } else if (account.financialCategory === FinancialCategory.FIXED_ASSET) {
        assets.longTerm.subcategories[account.name] = balance;
        assets.longTerm.total += balance;
      }
      assets.total += balance;
    } else if (account.type === AccountType.LIABILITY) {
      if (account.financialCategory === FinancialCategory.CURRENT_LIABILITY) {
        liabilities.current.subcategories[account.name] = balance;
        liabilities.current.total += balance;
      } else if (account.financialCategory === FinancialCategory.LONG_TERM_LIABILITY) {
        liabilities.longTerm.subcategories[account.name] = balance;
        liabilities.longTerm.total += balance;
      }
      liabilities.total += balance;
    } else if (account.type === AccountType.EQUITY) {
      equity.subcategories[account.name] = balance;
      equity.total += balance;
    }
  });

  return { assets, liabilities, equity };
};

export const fetchIncomeStatement = async (): Promise<IncomeStatement> => {
  const accountRepository = AppDataSource.getRepository(Account);
  const accounts = await accountRepository.find({
    relations: ['journalEntries'],
    where: [
      { type: AccountType.INCOME },
      { type: AccountType.EXPENSE }
    ]
  });

  const revenue = { subcategories: {} as Record<string, number>, total: 0 };
  const expenses = { subcategories: {} as Record<string, number>, total: 0 };

  accounts.forEach(account => {
    const balance = account.journalEntries.reduce((sum, entry) => {
      return sum + (entry.type === 'DEBIT' ? entry.amount : -entry.amount);
    }, 0);

    if (account.type === AccountType.INCOME) {
      revenue.subcategories[account.name] = balance;
      revenue.total += balance;
    } else if (account.type === AccountType.EXPENSE) {
      expenses.subcategories[account.name] = balance;
      expenses.total += balance;
    }
  });

  return {
    revenue,
    expenses,
    netIncome: revenue.total - expenses.total
  };
};

export const fetchCashFlowStatement = async (): Promise<CashFlow> => {
  const accountRepository = AppDataSource.getRepository(Account);
  const accounts = await accountRepository.find({
    relations: ['journalEntries'],
    where: [
      { financialCategory: FinancialCategory.CURRENT_ASSET }
    ]
  });

  const operating = { subcategories: {} as Record<string, number>, total: 0 };
  const investing = { subcategories: {} as Record<string, number>, total: 0 };
  const financing = { subcategories: {} as Record<string, number>, total: 0 };

  accounts.forEach(account => {
    const balance = account.journalEntries.reduce((sum, entry) => {
      return sum + (entry.type === 'DEBIT' ? entry.amount : -entry.amount);
    }, 0);

    if (account.financialSubcategory.includes('Operating')) {
      operating.subcategories[account.name] = balance;
      operating.total += balance;
    } else if (account.financialSubcategory.includes('Investing')) {
      investing.subcategories[account.name] = balance;
      investing.total += balance;
    } else if (account.financialSubcategory.includes('Financing')) {
      financing.subcategories[account.name] = balance;
      financing.total += balance;
    }
  });

  return {
    operating,
    investing,
    financing,
    netCashFlow: operating.total + investing.total + financing.total
  };
}; 