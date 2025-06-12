import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Account } from "./Account";
import { Transaction } from "./Transaction";

export enum EntryType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

@Entity()
export class JournalEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: "enum", enum: EntryType })
  type!: EntryType;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => User, (user) => user.journalEntries, { eager: true })
  user!: User;

  @ManyToOne(() => Account, (account) => account.journalEntries, { eager: true })
  account!: Account;

  @ManyToOne(() => Transaction, (transaction) => transaction.entries)
  transaction!: Transaction;

  @CreateDateColumn()
  createdAt!: Date;
} 