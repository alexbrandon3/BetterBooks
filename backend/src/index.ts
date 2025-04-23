import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

import 'reflect-metadata';
import express from 'express';

import cors from 'cors';
import { AppDataSource } from './data-source';
import routes from './routes'
import { generateRecurringTransactions } from './utils/generateRecurringTransactions';


// load the root .env file one level up`
const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());
app.use(routes);

AppDataSource.initialize()
  .then(async () => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

    try {
      await generateRecurringTransactions();
      console.log('✅ Recurring transactions processed successfully');
    } catch (error) {
      console.error('❌ Failed to process recurring transactions:', error);
    }
  })
  .catch((err: any) => {
    console.error('❌ Failed to initialize DB:', err);
  });

  setInterval(async () => {
    try {
      console.log('⏳ Checking for recurring transactions...');
      await generateRecurringTransactions();
      console.log('✅ Recurring transactions processed.');
    } catch (err) {
      console.error('❌ Error processing recurring transactions:', err);
    }
  }, 60 * 1000); // every minute