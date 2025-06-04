// RecurringTransaction.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Account } from "./Account";
import { User } from "./User";

@Entity()
export class RecurringTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  description!: string;

  @Column()
  type!: "INCOME" | "EXPENSE";

  @Column()
  interval!: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

  @Column({ type: "timestamp" })
  startDate!: Date;

  @Column({ type: "timestamp", nullable: true })
  endDate!: Date | null;

  @ManyToOne(() => Account, (account) => account.recurringTransactions, {
    onDelete: "CASCADE",
  })
  account!: Account;

  @ManyToOne(() => User, (user) => user.recurringTransactions, {
    onDelete: "CASCADE",
  })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
