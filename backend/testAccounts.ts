import { AppDataSource } from './src/config/data-source';
import { Account } from './src/entities/Account';

async function testAccounts() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const accountRepo = AppDataSource.getRepository(Account);
    
    // Get all accounts for user 1
    const accounts = await accountRepo.find({
      where: { user: { id: 1 } },
      order: { name: 'ASC' }
    });

    console.log('\n📋 Available accounts for user 1:');
    accounts.forEach(account => {
      console.log(`   - ID: ${account.id}, Name: "${account.name}", Type: ${account.type}, Category: ${account.financialCategory}`);
    });

    console.log('\n🔍 Looking for purchase/expense accounts:');
    accounts.forEach(account => {
      const name = account.name.toLowerCase();
      if (name.includes('purchase') || name.includes('expense') || name.includes('cost')) {
        console.log(`   ✅ Matches: "${account.name}" (ID: ${account.id})`);
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testAccounts(); 