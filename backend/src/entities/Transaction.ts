// src/entities/Transaction.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "../entities/User";
import { Account } from "./Account";
import { RecurringTransaction } from "./RecurringTransaction";
import { SplitTransaction } from "./SplitTransaction"; // ✅ Only keep this

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  description!: string;

  @Column("decimal")
  amount!: number;

  @Column({ type: "enum", enum: TransactionType })
  type!: TransactionType;

  @Column({ type: "date", default: () => "CURRENT_DATE" })
  date!: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isRecurring!: boolean;

  @Column({ nullable: true })
  recurrenceRule!: string;

  @Column({ nullable: true })
  recurrence!: string;

  @Column({ nullable: true })
  interval!: number;

  @Column({ nullable: true })
  recurrencePattern!: string;

  @Column({ nullable: true })
  nextOccurrence!: Date;

  @ManyToOne(() => Account, { eager: true })
  account!: Account;

  @ManyToOne(() => User, { eager: true })
  user!: User;

  @ManyToOne(() => RecurringTransaction, (rec) => rec.transactions, {
    nullable: true,
    onDelete: "SET NULL",
  })
  recurringTransaction?: RecurringTransaction;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  reference?: string;

  @OneToMany(() => SplitTransaction, (entry) => entry.transaction, {
    cascade: true,
  })
  entries!: SplitTransaction[]; // ✅ Final definition
}
