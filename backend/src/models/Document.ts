import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './Account';
import { Transaction } from './Transaction';

export enum DocumentType {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  STATEMENT = 'statement',
  CONTRACT = 'contract',
  OTHER = 'other',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  fileKey: string; // S3 object key

  @Column()
  fileType: string;

  @Column('int')
  fileSize: number;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  type: DocumentType;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Account, account => account.documents, { nullable: true })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ nullable: true })
  accountId: string;

  @ManyToOne(() => Transaction, transaction => transaction.documents, { nullable: true })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column({ nullable: true })
  transactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 