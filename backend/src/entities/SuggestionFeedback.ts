import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity()
@Index(["userId", "description"], { unique: false })
@Index(["userId", "suggestedAccountId"])
@Index(["feedbackType", "createdAt"])
export class SuggestionFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'text' })
  description: string; // Normalized description

  @Column()
  suggestedAccountId: number;

  @Column()
  suggestedAccountName: string;

  @Column()
  confidence: number; // Original confidence score (0-100)

  @Column({
    type: 'enum',
    enum: ['ACCEPTED', 'REJECTED', 'IGNORED'],
    default: 'IGNORED'
  })
  feedbackType: 'ACCEPTED' | 'REJECTED' | 'IGNORED';

  @Column({ nullable: true })
  selectedAccountId: number; // What user actually selected (if different from suggested)

  @Column({ nullable: true })
  selectedAccountName: string;

  @Column({ type: 'text', nullable: true }) userReason: string;
  @Column({ type: 'text', nullable: true }) rejectionReason: string;
  
  // Simplified metadata for keyword/rule-based system
  @Column({ type: 'jsonb', nullable: true }) suggestionMetadata: {
    accountType?: string;
    confidence?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  contextData: {
    timestamp: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 