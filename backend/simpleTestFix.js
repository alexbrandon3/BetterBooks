console.log('Starting test...');

const { AppDataSource } = require("./dist/config/data-source");

async function simpleTest() {
  try {
    console.log('Initializing database...');
    await AppDataSource.initialize();
    console.log('Database initialized successfully');
    
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

    console.log(`👤 Found newest user: ID ${newestUser.id}, Email: ${newestUser.email}`);

    // Test the suggestion service
    const { SuggestionService } = require("./dist/services/suggestion.service");
    const suggestionService = new SuggestionService();
    
    console.log('Testing "initial contribution"...');
    const result = await suggestionService.suggestAccountForDescription('initial contribution', newestUser.id);
    
    console.log('🎯 Suggestion result:', {
      accountName: result?.suggestedAccountName,
      confidence: result?.confidence,
      suggestedEntryType: result?.suggestedEntryType,
      detailedReason: result?.detailedReason,
      learningSource: result?.learningSource
    });

    await AppDataSource.destroy();
    console.log('Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

simpleTest(); 