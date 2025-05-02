// src/entities/SuggestionLog.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Account } from "./Account";

@Entity()
export class SuggestionLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: string;

  @Column()
  description!: string;

  @ManyToOne(() => Account, { eager: false, nullable: true })
  @JoinColumn({ name: "suggestedAccountId" })
  suggestedAccount!: Account;

  @Column({ nullable: true })
  suggestedAccountId!: string | null;

  @ManyToOne(() => Account, { eager: false })
  @JoinColumn({ name: "selectedAccountId" })
  selectedAccount!: Account;

  @Column()
  selectedAccountId!: string;

  @Column()
  matched!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
