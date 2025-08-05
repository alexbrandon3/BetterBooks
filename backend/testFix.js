const { AppDataSource } = require("./dist/config/data-source");
const { AccountWeightService } = require("./dist/services/AccountWeightService");
const { SuggestionService } = require("./dist/services/suggestion.service");

async function testFix() {
  try {
    await AppDataSource.initialize();
    console.log('🧪 Testing the fix for "initial contribution"...');

    // Find the newest user
    const { User } = require("./dist/entities/User");
    const userRepo = AppDataSource.getRepository(User);
    const newestUser = await userRepo.findOne({
      where: {},
      order: { createdAt: 'DESC' }
    });

    if (!newestUser) {
      console.log('❌ No users found');
      return;
    }

    console.log(`👤 Testing with newest user: ID ${newestUser.id}`);

    // Test the suggestion service directly
    const suggestionService = new SuggestionService();
    const result = await suggestionService.suggestAccountForDescription('initial contribution', newestUser.id);
    
    console.log('🎯 Suggestion result:', {
      accountName: result?.suggestedAccountName,
      confidence: result?.confidence,
      suggestedEntryType: result?.suggestedEntryType,
      detailedReason: result?.detailedReason,
      learningSource: result?.learningSource
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFix(); 