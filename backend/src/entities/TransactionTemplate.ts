import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { TransactionType, EntryType } from "../types/transaction.types";

@Entity()
export class TransactionTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({
    type: "enum",
    enum: TransactionType,
  })
  type!: TransactionType;

  @Column('json')
  requiredAccounts!: {
    accountType: string;
    entryType: EntryType;
    description: string;
    isDebit: boolean;
  }[];

  @Column('json', { nullable: true })
  optionalAccounts?: {
    accountType: string;
    entryType: EntryType;
    description: string;
    isDebit: boolean;
  }[];

  @Column({ default: false })
  isSystemTemplate!: boolean; // Distinguish between system and user templates

  @Column({ default: 0 })
  usageCount!: number; // Track how often this template is used

  @ManyToOne(() => User, { eager: true })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 