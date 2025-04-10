import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './Account';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  filePath!: string;

  @Column({ nullable: true })
  description!: string | null;

  @Column()
  mimeType!: string;

  @Column()
  size!: number;

  @ManyToOne(() => Account, account => account.documents)
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column()
  accountId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 