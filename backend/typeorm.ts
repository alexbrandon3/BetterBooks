// typeorm.ts
import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from './src/data-source';

const command = process.argv[2];

(async () => {
  try {
    await AppDataSource.initialize();
    console.log(`🟢 Connected to the database.`);

    if (command === 'schema:drop') {
      await AppDataSource.dropDatabase();
      console.log('🧨 Dropped schema successfully.');
    }

    if (command === 'schema:sync') {
      await AppDataSource.synchronize();
      console.log('🔄 Synced schema successfully.');
    }

    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error in schema operation:', err);
    process.exit(1);
  }
})();
