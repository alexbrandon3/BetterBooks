import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Transaction } from "./Transaction";

@Entity()
export class SplitTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  description!: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.splits)
  transaction!: Transaction;
}
