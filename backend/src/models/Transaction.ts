import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './Account';

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column('decimal', { precision: 19, scale: 4 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column()
  description: string;

  @ManyToOne(() => Account, account => account.transactions)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  accountId: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  isReconciled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 