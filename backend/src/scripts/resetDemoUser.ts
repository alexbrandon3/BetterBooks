import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { JournalEntry } from "../entities/JournalEntry";
import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";
import bcrypt from 'bcryptjs';

async function resetDemoUser() {
  try {
    console.log('🔄 Resetting demo user...');
    await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(User);
    const journalEntryRepo = AppDataSource.getRepository(JournalEntry);
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const accountRepo = AppDataSource.getRepository(Account);
    
    // Find the demo user
    const demoUser = await userRepo.findOne({ where: { email: 'demo@demo.com' } });
    
    if (demoUser) {
      console.log('🗑️ Deleting related records...');
      
      // Delete in correct order to respect foreign key constraints
      await journalEntryRepo.delete({ user: { id: demoUser.id } });
      console.log('✅ Deleted journal entries');
      
      await transactionRepo.delete({ user: { id: demoUser.id } });
      console.log('✅ Deleted transactions');
      
      await accountRepo.delete({ user: { id: demoUser.id } });
      console.log('✅ Deleted accounts');
      
      await userRepo.delete({ id: demoUser.id });
      console.log('✅ Deleted demo user');
    }

    // Create new demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const user = userRepo.create({
      email: 'demo@demo.com',
      password: hashedPassword,
    });
    await userRepo.save(user);
    console.log('✅ Created new demo user:', user.email);

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error resetting demo user:', error);
    process.exit(1);
  }
}

resetDemoUser(); 