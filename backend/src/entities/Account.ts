import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  number!: string;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column()
  subtype!: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 