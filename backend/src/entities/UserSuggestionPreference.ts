import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity()
@Index(["userId", "description"], { unique: true })
export class UserSuggestionPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'text' })
  description: string; // Normalized description

  @Column()
  accountId: number; // The account the user chose

  @Column()
  accountName: string; // For quick reference

  @Column({ default: 1 })
  usageCount: number; // How many times this preference was used

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUsed: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 