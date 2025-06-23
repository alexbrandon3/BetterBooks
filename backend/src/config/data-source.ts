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

const databaseUrl = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASS || "trojans3"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME || "betterbooks"}`;

console.log("🔗 Database URL being used:", databaseUrl.replace(/:[^:@]*@/, ':****@')); // Hide password in logs

export const AppDataSource = new DataSource({
  type: "postgres",
  url: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
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
