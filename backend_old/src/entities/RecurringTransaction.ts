// src/entities/RecurringTransaction.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Account } from './Account';
import { Transaction } from './Transaction';

export type RecurrenceType = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Yearly';

@Entity()
export class RecurringTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  description!: string;

  @Column('numeric', { precision: 12, scale: 2 })
  amount!: number;

  @Column()
  type!: 'Income' | 'Expense' | 'Transfer';

  @Column({ nullable: true })
  reference?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column()
  recurrence!: RecurrenceType;

  @Column()
  startDate!: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @Column()
  frequency!: string;

  @Column()
  interval!: number;

  @Column({ type: 'timestamp' })
  nextRun!: Date;

  @ManyToOne(() => Account, (account) => account.recurringTransactions, { onDelete: 'CASCADE' })
  account!: Account;

  @ManyToOne(() => User, (user) => user.recurringTransactions, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => Transaction, (transaction) => transaction.recurringTransaction)
  transactions!: Transaction[];

  @OneToOne(() => Transaction)
  @JoinColumn()
  transaction!: Transaction;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
