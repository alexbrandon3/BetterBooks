// src/config/data-source.ts

import "reflect-metadata";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { DataSource } from "typeorm";

import { User } from "../entities/User";
import { Account } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { JournalEntry } from "../entities/JournalEntry";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { FinancialGoal } from "../entities/FinancialGoal";
import { Suggestion } from "../entities/Suggestion";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "trojans3",
  database: process.env.DB_NAME || "betterbooks",
  synchronize: true,
  logging: true,
  entities: [
    User,
    Account,
    Transaction,
    JournalEntry,
    RecurringTransaction,
    FinancialGoal,
    Suggestion
  ],
  migrations: [__dirname + "/../migrations/*.ts"],
  subscribers: [],
});
