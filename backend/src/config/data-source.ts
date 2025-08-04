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
import { ClosedPeriod } from "../entities/ClosedPeriod";
import { SplitTransaction } from "../entities/SplitTransaction";
import { UserSuggestionPreference } from "../entities/UserSuggestionPreference";
import { SuggestionFeedback } from "../entities/SuggestionFeedback";

console.log("🔗 Connecting to Supabase with individual parameters...");

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "db.xblssfiyikarrdtsjrvn.supabase.co",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "sEGbhZpOgYBsGNcS",
  database: process.env.DB_NAME || "postgres",
  synchronize: true,
  logging: process.env.NODE_ENV === 'development' ? ["error", "warn", "query"] : ["error"],
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  entities: [
    User,
    Account,
    Transaction,
    JournalEntry,
    RecurringTransaction,
    FinancialGoal,
    Suggestion,
    ClosedPeriod,
    SplitTransaction,
    UserSuggestionPreference,
    SuggestionFeedback
  ],
  migrations: [__dirname + "/../migrations/*.ts"],
  subscribers: [],
  // Performance optimizations - connection pooling
  extra: {
    // Connection pooling
    max: 20, // Maximum number of connections in the pool
    min: 5,  // Minimum number of connections in the pool
    acquire: 30000, // Maximum time (ms) to acquire a connection
    idle: 10000, // Maximum time (ms) a connection can be idle
  },
});
