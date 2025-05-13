import "reflect-metadata";
import { DataSource } from "typeorm";
import { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } from "../config/index";
import { User } from "../entities/User";
import { Account } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { SplitTransaction } from "../entities/SplitTransaction";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  synchronize: true,
  logging: false,
  entities: [
    User,
    Account,
    Transaction,
    RecurringTransaction,
    SplitTransaction,
  ],
  migrations: [],
  subscribers: [],
});
