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

const databaseUrl = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASS || "trojans3"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME || "betterbooks"}`;

// Only add SSL params if DB_SSL is set
let connectionUrl = databaseUrl;
if (process.env.DB_SSL === 'true') {
  connectionUrl = databaseUrl.includes('?') 
    ? `${databaseUrl}&sslmode=no-verify&connect_timeout=10`
    : `${databaseUrl}?sslmode=no-verify&connect_timeout=10`;
}

console.log("🔗 Database URL being used:", connectionUrl.replace(/:[^:@]*@/, ':****@')); // Hide password in logs

export const AppDataSource = new DataSource({
  type: "postgres",
  url: connectionUrl,
  synchronize: true,
  logging: process.env.NODE_ENV === 'development' ? ["error", "warn", "query"] : ["error"],
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
    UserSuggestionPreference
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
