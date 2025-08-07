import { AppDataSource } from "./src/config/data-source";
import { UserSuggestionPreference } from "./src/entities/UserSuggestionPreference";
import { SuggestionFeedback } from "./src/entities/SuggestionFeedback";
import { User } from "./src/entities/User";

async function clearProductionPreferences() {
  try {
    // Use production database URL
    const productionUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL;
    if (!productionUrl) {
      console.log('❌ No production database URL found. Please set DATABASE_URL or SUPABASE_URL environment variable.');
      return;
    }

    console.log('🔗 Connecting to production database...');
    await AppDataSource.initialize();
    console.log('✅ Production database connected');

    // Find demo user
    const userRepo = AppDataSource.getRepository(User);
    const demoUser = await userRepo.findOne({
      where: { email: 'demo@smallbusiness.com' }
    });

    if (!demoUser) {
      console.log('❌ Demo user not found in production');
      return;
    }

    console.log(`✅ Found demo user: ${demoUser.email} (ID: ${demoUser.id})`);

    // Clear user preferences for "initial contribution"
    const preferenceRepo = AppDataSource.getRepository(UserSuggestionPreference);
    const preferencesToDelete = await preferenceRepo.find({
      where: { 
        userId: demoUser.id,
        description: 'initial contribution'
      }
    });

    console.log(`🔍 Found ${preferencesToDelete.length} user preferences for "initial contribution" in production`);

    if (preferencesToDelete.length > 0) {
      await preferenceRepo.remove(preferencesToDelete);
      console.log('✅ Cleared user preferences for "initial contribution" in production');
    }

    // Clear suggestion feedback for "initial contribution" that might be affecting memory-based learning
    const feedbackRepo = AppDataSource.getRepository(SuggestionFeedback);
    const feedbackToDelete = await feedbackRepo.find({
      where: { 
        userId: demoUser.id,
        description: 'initial contribution'
      }
    });

    console.log(`🔍 Found ${feedbackToDelete.length} suggestion feedback entries for "initial contribution" in production`);

    if (feedbackToDelete.length > 0) {
      await feedbackRepo.remove(feedbackToDelete);
      console.log('✅ Cleared suggestion feedback for "initial contribution" in production');
    }

    // Also clear any partial matches that might be causing issues
    const partialPreferences = await preferenceRepo.find({
      where: { userId: demoUser.id }
    });

    const partialToDelete = partialPreferences.filter(pref => 
      pref.description.toLowerCase().includes('initial') || 
      pref.description.toLowerCase().includes('contribution')
    );

    console.log(`🔍 Found ${partialToDelete.length} partial user preferences containing "initial" or "contribution" in production`);

    if (partialToDelete.length > 0) {
      await preferenceRepo.remove(partialToDelete);
      console.log('✅ Cleared partial user preferences in production');
    }

    console.log('✅ Production cleanup complete! The memory-based learning system should now use keyword matching for "initial contribution"');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

clearProductionPreferences();
