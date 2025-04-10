import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Transaction } from './Transaction';
import { Document } from './Document';
import { User } from './User';

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum AccountSubType {
  // Asset subtypes
  CASH = 'cash',
  ACCOUNTS_RECEIVABLE = 'accounts_receivable',
  INVENTORY = 'inventory',
  FIXED_ASSET = 'fixed_asset',
  PREPAID_EXPENSE = 'prepaid_expense',
  
  // Liability subtypes
  ACCOUNTS_PAYABLE = 'accounts_payable',
  ACCRUED_LIABILITY = 'accrued_liability',
  LONG_TERM_DEBT = 'long_term_debt',
  
  // Equity subtypes
  COMMON_STOCK = 'common_stock',
  RETAINED_EARNINGS = 'retained_earnings',
  
  // Revenue subtypes
  SALES = 'sales',
  INTEREST_INCOME = 'interest_income',
  
  // Expense subtypes
  COST_OF_GOODS_SOLD = 'cost_of_goods_sold',
  OPERATING_EXPENSE = 'operating_expense',
  INTEREST_EXPENSE = 'interest_expense',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type!: AccountType;

  @Column({
    type: 'enum',
    enum: AccountSubType,
    nullable: true,
  })
  subType!: AccountSubType | null;

  @Column('decimal', { precision: 19, scale: 4, default: 0 })
  balance!: number;

  @Column({ nullable: true })
  description!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => User, user => user.accounts)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions!: Transaction[];

  @OneToMany(() => Document, document => document.account)
  documents!: Document[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 