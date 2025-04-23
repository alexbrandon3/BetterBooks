import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Account } from './Account';
import { RecurringTransaction } from './RecurringTransaction';

export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense',
  TRANSFER = 'Transfer',
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  description!: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type!: TransactionType;

  @Column({ nullable: true })
  reference!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Account, (account) => account.transactions, {
    onDelete: 'CASCADE',
  })
  account!: Account;

  @ManyToOne(() => User, (user) => user.transactions, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @OneToOne(() => RecurringTransaction, (recurring) => recurring.transaction, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn()
  recurringTransaction?: RecurringTransaction;

  @Column({ default: false })
  isRecurring!: boolean;

  @Column({ nullable: true })
  recurrenceRule?: string;

  @Column({ nullable: true })
  recurrence?: string;

  @Column({ nullable: true })
  interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @Column({ nullable: true })
  recurrencePattern?: string;

  @Column({ nullable: true, type: 'date' })
  nextOccurrence?: Date;
}
