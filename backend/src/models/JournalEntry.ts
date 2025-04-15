import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Transaction } from './Transaction';
import { Account } from './Account';

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction;

  @Column()
  transactionId!: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column()
  accountId!: string;

  @Column('decimal', { precision: 19, scale: 4 })
  amount!: number;

  @Column()
  isDebit!: boolean;

  @Column()
  date!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 