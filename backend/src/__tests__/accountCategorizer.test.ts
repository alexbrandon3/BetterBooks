import { getSuggestedMetadata } from "../utils/accountCategorizer";
import { AccountType, FinancialCategory } from "../entities/Account";

describe("getSuggestedMetadata", () => {
  it("returns suggestion for Petty Cash", () => {
    const result = getSuggestedMetadata("Petty Cash");
    expect(result).toMatchObject({
      type: AccountType.ASSET,
      category: "Cash",
      subcategory: "Petty Cash",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_CASH_EQUIVALENTS"
    });
  });

  it("returns suggestion for Supplies Expense", () => {
    const result = getSuggestedMetadata("Office Supplies Expense");
    expect(result).toMatchObject({
      type: AccountType.EXPENSE,
      category: "Office",
      subcategory: "Supplies",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "GENERAL_ADMINISTRATIVE"
    });
  });

  it("returns suggestion for Loan Payable", () => {
    const result = getSuggestedMetadata("Business Loan Debt");
    expect(result).toMatchObject({
      type: AccountType.LIABILITY,
      category: "Loans",
      subcategory: "Business Loan",
      financialCategory: FinancialCategory.LONG_TERM_LIABILITY,
      financialSubcategory: "BANK_LOANS"
    });
  });

  it("returns null for unrecognized description", () => {
    const result = getSuggestedMetadata("Unicorn NFT");
    expect(result).toBeNull();
  });
}); 