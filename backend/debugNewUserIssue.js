const { AppDataSource } = require("./dist/config/data-source");
const { AccountWeightService } = require("./dist/services/AccountWeightService");
const { SuggestionService } = require("./dist/services/suggestion.service");
const { Account } = require("./dist/entities/Account");
const { User } = require("./dist/entities/User");

async function debugNewUserIssue() {
  try {
    await AppDataSource.initialize();
    console.log('🔍 Debugging new user issue...');

    // Find the newest user
    const userRepo = AppDataSource.getRepository(User);
    const newestUser = await userRepo.findOne({
      where: {},
      order: { createdAt: 'DESC' }
    });

    if (!newestUser) {
      console.log('❌ No users found');
      return;
    }

    console.log(`👤 Testing with newest user: ID ${newestUser.id}, Email: ${newestUser.email}`);

    // Check if weights exist for this user
    const accountWeightService = new AccountWeightService();
    const weights = await accountWeightService.getUserWeights(newestUser.id);
    console.log(`📊 Found ${weights.length} weights for user ${newestUser.id}`);

    // Check for "initial_contribution" weight specifically
    const initialContributionWeight = weights.find(w => w.keyword === 'initial_contribution');
    if (initialContributionWeight) {
      console.log('✅ Found initial_contribution weight:', {
        keyword: initialContributionWeight.keyword,
        weight: initialContributionWeight.weight,
        transactionType: initialContributionWeight.transactionType,
        accountId: initialContributionWeight.accountId
      });
    } else {
      console.log('❌ No initial_contribution weight found');
    }

    // Get user's accounts
    const accountRepo = AppDataSource.getRepository(Account);
    const userAccounts = await accountRepo.find({
      where: { user: { id: newestUser.id } }
    });

    console.log(`📋 User has ${userAccounts.length} accounts:`);
    userAccounts.forEach(account => {
      console.log(`  - ${account.name} (${account.type}) - ID: ${account.id}`);
    });

    // Test the findMatchingAccount method directly
    console.log('\n🔍 Testing findMatchingAccount for "initial_contribution":');
    const matchingAccount = await accountWeightService['findMatchingAccount']('initial_contribution', userAccounts);
    if (matchingAccount) {
      console.log(`✅ findMatchingAccount returned: ${matchingAccount.name} (${matchingAccount.type}) - ID: ${matchingAccount.id}`);
    } else {
      console.log('❌ findMatchingAccount returned null');
    }

    // Test the full suggestion pipeline
    console.log('\n🔍 Testing full suggestion pipeline for "initial contribution":');
    const suggestionService = new SuggestionService();
    
    // Test keyword extraction
    const keywords = suggestionService['extractKeywords']('initial contribution');
    console.log(`📝 Extracted keywords: ${keywords.join(', ')}`);

    // Test weighted suggestion
    const weightedSuggestion = await suggestionService['findWeightedSuggestion']('initial contribution', newestUser.id);
    if (weightedSuggestion) {
      console.log('✅ Weighted suggestion found:', {
        accountName: weightedSuggestion.accountName,
        confidence: weightedSuggestion.confidence,
        suggestedEntryType: weightedSuggestion.suggestedEntryType,
        detailedReason: weightedSuggestion.detailedReason,
        learningSource: weightedSuggestion.learningSource
      });
    } else {
      console.log('❌ No weighted suggestion found');
    }

    // Test full suggestion
    const fullSuggestion = await suggestionService.suggestAccountForDescription('initial contribution', newestUser.id);
    console.log('🎯 Full suggestion result:', {
      accountName: fullSuggestion.accountName,
      confidence: fullSuggestion.confidence,
      suggestedEntryType: fullSuggestion.suggestedEntryType,
      detailedReason: fullSuggestion.detailedReason,
      learningSource: fullSuggestion.learningSource
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugNewUserIssue(); 