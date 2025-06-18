// User.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Transaction } from "./Transaction";
import { Account } from "./Account";
import { JournalEntry } from "./JournalEntry";
import { FinancialGoal } from './FinancialGoal';

export enum RiskTolerance {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: RiskTolerance,
    nullable: true
  })
  riskTolerance: RiskTolerance;

  @OneToMany(() => Account, account => account.user)
  accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions!: Transaction[];

  @OneToMany(() => JournalEntry, (entry) => entry.user)
  journalEntries!: JournalEntry[];

  @OneToMany(() => FinancialGoal, goal => goal.user)
  goals: FinancialGoal[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
