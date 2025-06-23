// Account.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { User } from "./User";
import { Transaction } from "./Transaction";
import { JournalEntry } from "./JournalEntry";

export enum AccountType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
  EQUITY = "EQUITY",
  INCOME = "INCOME",
  EXPENSE = "EXPENSE"
}

export enum FinancialCategory {
  CURRENT_ASSET = "CURRENT_ASSET",
  FIXED_ASSET = "FIXED_ASSET",
  CURRENT_LIABILITY = "CURRENT_LIABILITY",
  LONG_TERM_LIABILITY = "LONG_TERM_LIABILITY",
  EQUITY = "EQUITY",
  RETAINED_EARNINGS = "RETAINED_EARNINGS",
  DRAWINGS = "DRAWINGS",
  OPERATING_REVENUE = "OPERATING_REVENUE",
  NON_OPERATING_REVENUE = "NON_OPERATING_REVENUE",
  OPERATING_EXPENSE = "OPERATING_EXPENSE",
  NON_OPERATING_EXPENSE = "NON_OPERATING_EXPENSE"
}

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({
    type: "enum",
    enum: AccountType,
    default: AccountType.ASSET
  })
  type!: AccountType;

  @Column({
    type: "enum",
    enum: FinancialCategory,
    default: FinancialCategory.CURRENT_ASSET
  })
  financialCategory!: FinancialCategory;

  @Column({ default: "Uncategorized" })
  category!: string;

  @Column({ default: "" })
  subcategory!: string;

  @Column({ default: "Uncategorized" })
  financialSubcategory!: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  balance!: number;

  @Column({ default: true })
  isLiquid!: boolean;

  @ManyToOne(() => User, user => user.accounts)
  user!: User;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions!: Transaction[];

  @OneToMany(() => JournalEntry, (entry) => entry.account)
  journalEntries!: JournalEntry[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
