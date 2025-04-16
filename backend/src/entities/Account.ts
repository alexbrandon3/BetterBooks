import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from './User';

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
export type AccountSubtype =
  | 'Cash'
  | 'Bank'
  | 'Accounts Receivable'
  | 'Inventory'
  | 'Fixed Asset'
  | 'Accounts Payable'
  | 'Credit Card'
  | 'Loan'
  | 'Owner Equity'
  | 'Retained Earnings'
  | 'Sales'
  | 'Service Revenue'
  | 'Cost of Goods Sold'
  | 'Operating Expense'
  | 'Payroll'
  | 'Rent';

@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  number!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] })
  type!: AccountType;

  @Column({ type: 'enum', enum: [
    'Cash', 'Bank', 'Accounts Receivable', 'Inventory', 'Fixed Asset',
    'Accounts Payable', 'Credit Card', 'Loan', 'Owner Equity', 'Retained Earnings',
    'Sales', 'Service Revenue', 'Cost of Goods Sold', 'Operating Expense', 'Payroll', 'Rent'
  ] })
  subtype!: AccountSubtype;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
