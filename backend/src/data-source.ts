import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Account } from './entities/Account';
import { User } from './entities/User'; 
import { Transaction } from './entities/Transaction';
import { RecurringTransaction } from './entities/RecurringTransaction';
import * as dotenv from 'dotenv';

// ✅ Load environment variables from the correct file FIRST
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile });

// ✅ Log after loading the file
console.log('Loaded DB_PASSWORD:', typeof process.env.DB_PASSWORD, process.env.DB_PASSWORD);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // Consider false in production or for serious migrations
  logging: true,
  entities: [Account, User, Transaction, RecurringTransaction],
  migrations: [],
  subscribers: [],
});
