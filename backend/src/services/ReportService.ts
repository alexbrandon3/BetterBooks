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

export const fetchBalanceSheet = async (userId: string): Promise<BalanceSheet> => {
  // Use optimized query to get account balances in one query
  const accountBalances = await AppDataSource.manager
    .createQueryBuilder(Account, 'account')
    .leftJoin('account.journalEntries', 'entry')
    .select('account.id', 'id')
    .addSelect('account.name', 'name')
    .addSelect('account.type', 'type')
    .addSelect('account.financialCategory', 'financialCategory')
    .addSelect('SUM(CASE WHEN entry.type = :debit THEN entry.amount ELSE -entry.amount END)', 'balance')
    .where('account.user.id = :userId', { userId: Number(userId) })
    .groupBy('account.id')
    .addGroupBy('account.name')
    .addGroupBy('account.type')
    .addGroupBy('account.financialCategory')
    .getRawMany();

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

  accountBalances.forEach(({ name, type, financialCategory, balance }) => {
    const accountBalance = Number(balance) || 0;

    if (type === AccountType.ASSET) {
      if (financialCategory === FinancialCategory.CURRENT_ASSET) {
        assets.current.subcategories[name] = accountBalance;
        assets.current.total += accountBalance;
      } else if (financialCategory === FinancialCategory.FIXED_ASSET) {
        assets.longTerm.subcategories[name] = accountBalance;
        assets.longTerm.total += accountBalance;
      }
      assets.total += accountBalance;
    } else if (type === AccountType.LIABILITY) {
      if (financialCategory === FinancialCategory.CURRENT_LIABILITY) {
        liabilities.current.subcategories[name] = accountBalance;
        liabilities.current.total += accountBalance;
      } else if (financialCategory === FinancialCategory.LONG_TERM_LIABILITY) {
        liabilities.longTerm.subcategories[name] = accountBalance;
        liabilities.longTerm.total += accountBalance;
      }
      liabilities.total += accountBalance;
    } else if (type === AccountType.EQUITY) {
      equity.subcategories[name] = accountBalance;
      equity.total += accountBalance;
    }
  });

  return { assets, liabilities, equity };
};

export const fetchIncomeStatement = async (userId: string, startDate?: string, endDate?: string): Promise<IncomeStatement> => {
  const queryBuilder = AppDataSource.manager
    .createQueryBuilder(Account, 'account')
    .leftJoin('account.journalEntries', 'entry')
    .select('account.id', 'id')
    .addSelect('account.name', 'name')
    .addSelect('account.type', 'type')
    .addSelect('SUM(CASE WHEN entry.type = :debit THEN entry.amount ELSE -entry.amount END)', 'balance')
    .where('account.user.id = :userId', { userId: Number(userId) })
    .andWhere('account.type IN (:...types)', { types: [AccountType.INCOME, AccountType.EXPENSE] })
    .andWhere('entry.debit = :debit', { debit: 'DEBIT' })
    .groupBy('account.id')
    .addGroupBy('account.name')
    .addGroupBy('account.type');

  // Add date range filter if provided
  if (startDate && endDate) {
    queryBuilder.andWhere('entry.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
  }

  const accountBalances = await queryBuilder
    .getRawMany();

  const revenue = { subcategories: {} as Record<string, number>, total: 0 };
  const expenses = { subcategories: {} as Record<string, number>, total: 0 };

  accountBalances.forEach(({ name, type, balance }) => {
    const accountBalance = Number(balance) || 0;

    if (type === AccountType.INCOME) {
      revenue.subcategories[name] = accountBalance;
      revenue.total += accountBalance;
    } else if (type === AccountType.EXPENSE) {
      expenses.subcategories[name] = accountBalance;
      expenses.total += accountBalance;
    }
  });

  return {
    revenue,
    expenses,
    netIncome: revenue.total - expenses.total
  };
};

export const fetchCashFlowStatement = async (userId: string, startDate?: string, endDate?: string): Promise<CashFlow> => {
  const queryBuilder = AppDataSource.manager
    .createQueryBuilder(Account, 'account')
    .leftJoin('account.journalEntries', 'entry')
    .select('account.id', 'id')
    .addSelect('account.name', 'name')
    .addSelect('account.financialSubcategory', 'financialSubcategory')
    .addSelect('SUM(CASE WHEN entry.type = :debit THEN entry.amount ELSE -entry.amount END)', 'balance')
    .where('account.user.id = :userId', { userId: Number(userId) })
    .andWhere('account.financialCategory = :category', { category: FinancialCategory.CURRENT_ASSET })
    .andWhere('entry.debit = :debit', { debit: 'DEBIT' })
    .groupBy('account.id')
    .addGroupBy('account.name')
    .addGroupBy('account.financialSubcategory');

  // Add date range filter if provided
  if (startDate && endDate) {
    queryBuilder.andWhere('entry.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
  }

  const accountBalances = await queryBuilder
    .getRawMany();

  const operating = { subcategories: {} as Record<string, number>, total: 0 };
  const investing = { subcategories: {} as Record<string, number>, total: 0 };
  const financing = { subcategories: {} as Record<string, number>, total: 0 };

  accountBalances.forEach(({ name, financialSubcategory, balance }) => {
    const accountBalance = Number(balance) || 0;

    if (financialSubcategory.includes('Operating')) {
      operating.subcategories[name] = accountBalance;
      operating.total += accountBalance;
    } else if (financialSubcategory.includes('Investing')) {
      investing.subcategories[name] = accountBalance;
      investing.total += accountBalance;
    } else if (financialSubcategory.includes('Financing')) {
      financing.subcategories[name] = accountBalance;
      financing.total += accountBalance;
    }
  });

  return {
    operating,
    investing,
    financing,
    netCashFlow: operating.total + investing.total + financing.total
  };
}; 