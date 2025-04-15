import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './Account';

export enum TransactionType {
  EXPENSE = 'expense',
  REVENUE = 'revenue',
  TRANSFER = 'transfer'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  date!: Date;

  @Column()
  description!: string;

  @Column('decimal', { precision: 19, scale: 4 })
  amount!: number;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column()
  accountId!: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type!: TransactionType;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'categoryAccountId' })
  categoryAccount!: Account;

  @Column()
  categoryAccountId!: string;

  @Column({ nullable: true })
  referenceNumber?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ default: false })
  isReconciled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 