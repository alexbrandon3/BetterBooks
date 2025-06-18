import { AccountType, FinancialCategory } from "../entities/Account";

interface AccountMetadata {
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
}

export const getSuggestedMetadata = (name: string): AccountMetadata | null => {
  const lower = name.toLowerCase();
  const keywordMap = [
    {
      keywords: ["cash", "petty"],
      result: {
        type: AccountType.ASSET,
        category: "Cash",
        subcategory: "Petty Cash",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "CASH_AND_CASH_EQUIVALENTS",
      },
    },
    {
      keywords: ["supplies", "office"],
      result: {
        type: AccountType.EXPENSE,
        category: "Office",
        subcategory: "Supplies",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "GENERAL_ADMINISTRATIVE",
      },
    },
    {
      keywords: ["loan", "debt", "credit"],
      result: {
        type: AccountType.LIABILITY,
        category: "Loans",
        subcategory: "Business Loan",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "BANK_LOANS",
      },
    },
    {
      keywords: ["sales", "income", "revenue"],
      result: {
        type: AccountType.INCOME,
        category: "Sales",
        subcategory: "Product Sales",
        financialCategory: FinancialCategory.OPERATING_REVENUE,
        financialSubcategory: "PRODUCT_REVENUE",
      },
    },
    {
      keywords: ["equity", "owner"],
      result: {
        type: AccountType.EQUITY,
        category: "Equity",
        subcategory: "Owner's Equity",
        financialCategory: FinancialCategory.EQUITY,
        financialSubcategory: "RETAINED_EARNINGS",
      },
    },
    {
      keywords: ["receivable", "invoice"],
      result: {
        type: AccountType.ASSET,
        category: "Sales",
        subcategory: "Accounts Receivable",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "ACCOUNTS_RECEIVABLE",
      },
    },
  ];

  for (const entry of keywordMap) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.result;
    }
  }

  return null;
}; 