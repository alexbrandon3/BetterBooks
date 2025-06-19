import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Account } from "../entities/Account";
import { SuggestionService } from "../services/suggestion.service";

async function debugSuggestions() {
  try {
    console.log('🔍 Debugging suggestion logic...');
    await AppDataSource.initialize();

    // Get demo user
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email: 'demo@demo.com' } });
    
    if (!user) {
      console.log('❌ Demo user not found.');
      return;
    }

    console.log('👤 User found:', user.email, 'ID:', user.id);

    // Get all user accounts
    const accountRepo = AppDataSource.getRepository(Account);
    const userAccounts = await accountRepo.find({
      where: { user: { id: user.id } }
    });

    console.log('\n📊 User Accounts:');
    console.log('================');
    userAccounts.forEach(account => {
      console.log(`- ${account.name} (${account.type}) - Category: "${account.category}", Subcategory: "${account.subcategory}"`);
    });

    // Test suggestion service
    const suggestionService = new SuggestionService();
    
    const testDescriptions = ['restaurant', 'coffee', 'groceries', 'food'];
    
    console.log('\n🧪 Testing Suggestions:');
    console.log('=====================');
    
    for (const description of testDescriptions) {
      console.log(`\nTesting: "${description}"`);
      const suggestion = await suggestionService.suggestAccountForDescription(description, user.id);
      
      if (suggestion) {
        console.log(`✅ Suggestion found: ${suggestion.suggestedAccountName} (${suggestion.reason})`);
      } else {
        console.log(`❌ No suggestion found`);
      }
    }

    // Test the matching logic manually
    console.log('\n🔍 Manual Matching Test:');
    console.log('======================');
    
    const lowerDescription = 'restaurant';
    const keywordMap = [
      {
        keywords: ['food', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'pizza', 'burger', 'sushi', 'coffee', 'starbucks', 'mcdonalds', 'subway'],
        accountTypes: ['EXPENSE'],
        categories: ['Food', 'Dining', 'Meals & Entertainment'],
        reason: 'Food and dining related transaction'
      }
    ];

    // Find matching keyword category
    let matchedCategory = null;
    let matchedKeyword = null;
    for (const mapping of keywordMap) {
      const foundKeyword = mapping.keywords.find(keyword => lowerDescription.includes(keyword));
      if (foundKeyword) {
        matchedCategory = mapping;
        matchedKeyword = foundKeyword;
        break;
      }
    }

    console.log('Matched keyword:', matchedKeyword);
    console.log('Matched category:', matchedCategory?.categories);

    // Find matching user account
    const matchingAccount = userAccounts.find(account => 
      matchedCategory!.accountTypes.includes(account.type) &&
      (matchedCategory!.categories.some(cat => 
        account.category?.toLowerCase().includes(cat.toLowerCase()) ||
        account.name.toLowerCase().includes(cat.toLowerCase())
      ))
    );

    console.log('Matching account found:', matchingAccount?.name || 'None');
    
    if (!matchingAccount) {
      console.log('\n🔍 Why no match? Let\'s check each account:');
      userAccounts.forEach(account => {
        const typeMatch = matchedCategory!.accountTypes.includes(account.type);
        const categoryMatch = matchedCategory!.categories.some(cat => 
          account.category?.toLowerCase().includes(cat.toLowerCase()) ||
          account.name.toLowerCase().includes(cat.toLowerCase())
        );
        console.log(`- ${account.name}: Type match: ${typeMatch}, Category match: ${categoryMatch}`);
        console.log(`  Category: "${account.category}", Looking for: ${matchedCategory!.categories.join(', ')}`);
      });
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

debugSuggestions(); 