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
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

export interface CashFlow {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
} 