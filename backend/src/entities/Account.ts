import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Transaction } from "./Transaction";
import { SplitTransaction } from "./SplitTransaction";

@Entity()
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  number!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column()
  type!: string;

  @Column()
  subtype!: string;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions!: Transaction[];

  @OneToMany(
    () => SplitTransaction,
    (splitTransaction) => splitTransaction.account
  )
  splitTransactions!: SplitTransaction[];
}
