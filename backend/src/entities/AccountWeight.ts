import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity()
@Index(["userId", "keyword"], { unique: false })
@Index(["userId", "keyword", "accountId"], { unique: true })
@Index(["accountId"])
export class AccountWeight {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 100 })
  keyword: string; // Normalized keyword (e.g., "sold", "bought")

  @Column()
  accountId: number; // The account to weight for this keyword

  @Column({ type: 'int', default: 50 })
  weight: number; // 0-100 scale, higher = more likely to be suggested

  @Column({ type: 'varchar', length: 20, nullable: true })
  transactionType: string; // 'INCOME', 'EXPENSE', 'TRANSFER' - optional scope

  @Column({ type: 'boolean', default: false })
  isDefault: boolean; // System defaults vs user overrides

  @Column({ type: 'int', default: 0 })
  usageCount: number; // How many times this weight was used

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUsed: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 