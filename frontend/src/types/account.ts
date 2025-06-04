export enum AccountType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
  EQUITY = "EQUITY",
  REVENUE = "REVENUE",
  EXPENSE = "EXPENSE"
}

export enum FinancialCategory {
  CURRENT_ASSET = "CURRENT_ASSET",
  FIXED_ASSET = "FIXED_ASSET",
  CURRENT_LIABILITY = "CURRENT_LIABILITY",
  LONG_TERM_LIABILITY = "LONG_TERM_LIABILITY",
  EQUITY = "EQUITY",
  OPERATING_REVENUE = "OPERATING_REVENUE",
  NON_OPERATING_REVENUE = "NON_OPERATING_REVENUE",
  OPERATING_EXPENSE = "OPERATING_EXPENSE",
  NON_OPERATING_EXPENSE = "NON_OPERATING_EXPENSE"
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
  balance: number;
}

export interface AccountForm {
  name: string;
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
  balance: string;
}

export interface AccountPayload {
  name: string;
  type: AccountType;
  category: string | null;
  subcategory: string | null;
  financialCategory: FinancialCategory;
  financialSubcategory: string | null;
  balance: number;
} 