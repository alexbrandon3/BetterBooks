export interface AccountBalance {
  id: number;
  name: string;
  balance: number;
}

export interface SubcategoryGroup {
  subcategoryName: string;
  accounts: AccountBalance[];
  subtotal: number;
  displayOrder: number;
}

export interface BalanceSheet {
  assets: SubcategoryGroup[];
  liabilities: SubcategoryGroup[];
  equity: SubcategoryGroup[];
}

export interface IncomeStatement {
  revenue: SubcategoryGroup[];
  expenses: SubcategoryGroup[];
  totalIncome: number;
  totalExpenses: number;
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