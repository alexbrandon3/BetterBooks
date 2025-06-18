import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { DataSource } from 'typeorm';
import { User, Account, Transaction, FinancialGoal, JournalEntry } from './entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [User, Account, Transaction, FinancialGoal, JournalEntry],
  migrations: [],
  subscribers: [],
}); 