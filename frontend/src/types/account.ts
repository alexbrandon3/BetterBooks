export enum AccountType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
  EQUITY = "EQUITY",
  INCOME = "INCOME",
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
  id: number;
  name: string;
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
  balance: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
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
  category?: string;
  subcategory?: string;
  financialCategory: FinancialCategory;
  financialSubcategory?: string;
  balance: number;
}

export interface AccountSuggestion {
  suggestedAccountId: number;
  suggestedAccountName: string;
  accountType: string;
  category: string;
  financialCategory: string;
  suggestedEntryType: 'DEBIT' | 'CREDIT';
  detailedReason: string;
  toneMessage?: string;
  confidence: number;
}

export interface AccountTemplate {
  id: string;
  name: string;
  description: string;
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
  icon?: string;
  isPopular?: boolean;
} 