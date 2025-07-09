import { AppDataSource } from "./src/config/data-source";
import { FinancialCategory } from "./src/entities/Account";
import { getSuggestedMetadata } from "./src/utils/accountCategorizer";

async function testInterestExpenseFix() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");
    
    // Test the categorization logic
    console.log("\n🔍 Testing interest expense categorization...");
    
    const suggestion = getSuggestedMetadata("Interest Expense");
    console.log("Suggestion result:", {
      type: suggestion?.type,
      financialCategory: suggestion?.financialCategory,
      financialSubcategory: suggestion?.financialSubcategory,
      explanation: suggestion?.explanation
    });
    
    if (suggestion) {
      console.log("\n✅ Interest expense categorization is working correctly:");
      console.log("- Type:", suggestion.type);
      console.log("- Financial Category:", suggestion.financialCategory);
      console.log("- Financial Subcategory:", suggestion.financialSubcategory);
      
      // Verify it's not being categorized as a current asset
      if (suggestion.financialCategory === FinancialCategory.OPERATING_EXPENSE) {
        console.log("✅ Correctly categorized as OPERATING_EXPENSE");
      } else {
        console.log("❌ Incorrectly categorized as:", suggestion.financialCategory);
      }
    } else {
      console.log("❌ No suggestion found for 'Interest Expense'");
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

testInterestExpenseFix(); 