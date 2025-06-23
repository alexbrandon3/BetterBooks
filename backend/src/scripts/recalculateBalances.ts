import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { TransactionService } from "../services/transaction.service";

const recalculateAllBalances = async () => {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("✅ Database connection established successfully.");

    const userRepo = AppDataSource.getRepository(User);
    const transactionService = new TransactionService();

    // Get all users
    const users = await userRepo.find();
    console.log(`Found ${users.length} users to process.`);

    // Recalculate balances for each user
    for (const user of users) {
      console.log(`Processing user: ${user.email} (ID: ${user.id})`);
      try {
        await transactionService.recalculateAccountBalances(user.id);
        console.log(`✅ Successfully recalculated balances for user ${user.email}`);
      } catch (error) {
        console.error(`❌ Error recalculating balances for user ${user.email}:`, error);
      }
    }

    console.log("🎉 Account balance recalculation completed for all users!");
  } catch (error) {
    console.error("❌ Error in recalculateAllBalances:", error);
  } finally {
    await AppDataSource.destroy();
  }
};

// Run the script if this file is executed directly
if (require.main === module) {
  recalculateAllBalances()
    .then(() => {
      console.log("🎉 Balance recalculation script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Balance recalculation script failed:", error);
      process.exit(1);
    });
} 