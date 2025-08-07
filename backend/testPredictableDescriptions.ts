import { AppDataSource } from "./src/config/data-source";
import { SuggestionService } from "./src/services/suggestion.service";

async function testPredictableDescriptions() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    const suggestionService = new SuggestionService();
    const userId = 1;
    
    console.log("\n🔍 Testing predictable business descriptions for user:", userId);
    
    // Test cases organized by business transaction type
    const testCases = [
      // Revenue & Sales
      { description: "sold", expectedType: "INCOME", expectedEntry: "CREDIT", category: "Revenue" },
      { description: "sale", expectedType: "INCOME", expectedEntry: "CREDIT", category: "Revenue" },
      { description: "revenue", expectedType: "INCOME", expectedEntry: "CREDIT", category: "Revenue" },
      { description: "income", expectedType: "INCOME", expectedEntry: "CREDIT", category: "Revenue" },
      { description: "invoice", expectedType: "INCOME", expectedEntry: "CREDIT", category: "Revenue" },
      { description: "payment received", expectedType: "INCOME", expectedEntry: "CREDIT", category: "Revenue" },
      
      // Purchases & Expenses
      { description: "purchase", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Purchase" },
      { description: "buy", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Purchase" },
      { description: "supplies", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Purchase" },
      { description: "equipment", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Purchase" },
      { description: "inventory", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Purchase" },
      
      // Operating Expenses
      { description: "rent", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Operating" },
      { description: "utilities", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Operating" },
      { description: "electricity", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Operating" },
      { description: "internet", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Operating" },
      { description: "marketing", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Operating" },
      { description: "advertising", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Operating" },
      
      // Payroll & HR
      { description: "payroll", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Payroll" },
      { description: "salary", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Payroll" },
      { description: "employee", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Payroll" },
      { description: "bonus", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Payroll" },
      
      // Taxes & Compliance
      { description: "tax", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Tax" },
      { description: "irs", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Tax" },
      { description: "property tax", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Tax" },
      
      // Banking & Cash
      { description: "atm", expectedType: "ASSET", expectedEntry: "DEBIT", category: "Banking" },
      { description: "withdrawal", expectedType: "ASSET", expectedEntry: "DEBIT", category: "Banking" },
      { description: "deposit", expectedType: "ASSET", expectedEntry: "DEBIT", category: "Banking" },
      { description: "bank fee", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Banking" },
      
      // Equity & Capital
      { description: "initial contribution", expectedType: "EQUITY", expectedEntry: "CREDIT", category: "Equity" },
      { description: "owner contribution", expectedType: "EQUITY", expectedEntry: "CREDIT", category: "Equity" },
      { description: "draw", expectedType: "EQUITY", expectedEntry: "DEBIT", category: "Equity" },
      { description: "distribution", expectedType: "EQUITY", expectedEntry: "DEBIT", category: "Equity" },
      
      // Loans & Liabilities
      { description: "loan", expectedType: "LIABILITY", expectedEntry: "CREDIT", category: "Liability" },
      { description: "credit", expectedType: "LIABILITY", expectedEntry: "CREDIT", category: "Liability" },
      { description: "mortgage", expectedType: "LIABILITY", expectedEntry: "CREDIT", category: "Liability" },
      
      // Software & Subscriptions
      { description: "software", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Technology" },
      { description: "subscription", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Technology" },
      { description: "saas", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Technology" },
      
      // Professional Services
      { description: "accounting", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Professional" },
      { description: "legal", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Professional" },
      { description: "consulting", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Professional" },
      
      // Travel & Transportation
      { description: "travel", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Travel" },
      { description: "mileage", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Travel" },
      { description: "gas", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Travel" },
      
      // Insurance
      { description: "insurance", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Insurance" },
      { description: "business insurance", expectedType: "EXPENSE", expectedEntry: "DEBIT", category: "Insurance" },
      
      // Problematic short inputs (should be blocked)
      { description: "abc", expectedType: "NONE", expectedEntry: "NONE", category: "Short" },
      { description: "xy", expectedType: "NONE", expectedEntry: "NONE", category: "Short" },
      { description: "a", expectedType: "NONE", expectedEntry: "NONE", category: "Short" },
    ];
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: "${testCase.description}" (${testCase.category})`);
      
      const suggestion = await suggestionService.suggestAccountForDescription(testCase.description, userId);
      
      if (testCase.expectedType === "NONE") {
        // Should return no suggestion for short inputs
        if (!suggestion) {
          console.log(`  ✅ PASS: No suggestion returned (correctly blocked)`);
          passedTests++;
        } else {
          console.log(`  ❌ FAIL: Got suggestion "${suggestion.suggestedAccountName}" but expected none`);
        }
      } else {
        // Should return appropriate suggestion
        if (suggestion) {
          const typeMatch = suggestion.accountType === testCase.expectedType;
          const entryMatch = suggestion.suggestedEntryType === testCase.expectedEntry;
          const confidenceGood = suggestion.confidence >= 40;
          
          if (typeMatch && entryMatch && confidenceGood) {
            console.log(`  ✅ PASS: "${suggestion.suggestedAccountName}" (${suggestion.accountType}/${suggestion.suggestedEntryType}) - ${suggestion.confidence}% confident`);
            passedTests++;
          } else {
            console.log(`  ❌ FAIL: Got "${suggestion.suggestedAccountName}" (${suggestion.accountType}/${suggestion.suggestedEntryType}) but expected ${testCase.expectedType}/${testCase.expectedEntry}`);
            console.log(`     Confidence: ${suggestion.confidence}% (should be >= 40%)`);
          }
        } else {
          console.log(`  ❌ FAIL: No suggestion returned but expected ${testCase.expectedType}/${testCase.expectedEntry}`);
        }
      }
    }
    
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log("🎉 All tests passed! Smart Suggestions system is working correctly.");
    } else {
      console.log("⚠️  Some tests failed. Review the suggestions above.");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

testPredictableDescriptions();
