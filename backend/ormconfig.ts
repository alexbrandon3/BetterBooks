import { DataSource } from "typeorm";
import { User } from "./src/entities/User";
import { Account } from "./src/entities/Account";
import { Transaction } from "./src/entities/Transaction";
import { JournalEntry } from "./src/entities/JournalEntry";

export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "trojans3",
  database: process.env.DB_NAME || "betterbooks",
  synchronize: false,
  logging: true,
  entities: [
    User,
    Account,
    Transaction,
    JournalEntry
  ],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
}); 