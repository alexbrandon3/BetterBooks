import { AppDataSource } from './src/config/data-source';

async function findUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('\n👥 ALL USERS IN DATABASE:');
    console.log('=' .repeat(50));

    const users = await AppDataSource.getRepository('User').find({
      select: ['id', 'email', 'displayName', 'createdAt']
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    users.forEach(user => {
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Display Name: ${user.displayName || 'N/A'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('   ---');
    });

    console.log('\n💡 To initialize weights for a user, run:');
    console.log('   npx ts-node initializeUserWeights.ts <USER_ID>');

  } catch (error) {
    console.error('❌ Failed to find users:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

findUser(); 