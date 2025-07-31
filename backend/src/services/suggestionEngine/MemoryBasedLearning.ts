import { AppDataSource } from "../../config/data-source";
import { SuggestionFeedback } from "../../entities/SuggestionFeedback";
import { UserSuggestionPreference } from "../../entities/UserSuggestionPreference";
import { Account } from "../../entities/Account";
import { logAnalytics } from '../../utils/analytics';

export interface LearningPattern {
  description: string;
  accountId: number;
  accountName: string;
  confidence: number;
  usageCount: number;
  successRate: number;
  lastUsed: Date;
  businessKeywords: string[];
  category: string;
}

export interface MemoryBasedSuggestion {
  accountId: number;
  accountName: string;
  confidence: number;
  reason: string;
  learningSource: 'PATTERN_MATCH' | 'SUCCESS_RATE' | 'RECENT_USAGE';
  patternData?: LearningPattern;
}

export class MemoryBasedLearning {
  private feedbackRepo = AppDataSource.getRepository(SuggestionFeedback);
  private preferenceRepo = AppDataSource.getRepository(UserSuggestionPreference);
  private accountRepo = AppDataSource.getRepository(Account);

  /**
   * Analyze user's feedback patterns to find learning opportunities
   */
  async analyzeUserPatterns(userId: number, description: string): Promise<LearningPattern[]> {
    try {
      const normalizedDescription = this.normalizeDescription(description);
      
      // Get all feedback for this user
      const userFeedback = await this.feedbackRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 1000 // Limit to recent feedback
      });

      if (userFeedback.length === 0) {
        return [];
      }

      // Group feedback by account and analyze patterns
      const accountPatterns = new Map<number, {
        accountId: number;
        accountName: string;
        totalSuggestions: number;
        acceptedCount: number;
        rejectedCount: number;
        ignoredCount: number;
        descriptions: string[];
        keywords: Set<string>;
        categories: Set<string>;
        lastUsed: Date;
        avgConfidence: number;
      }>();

      for (const feedback of userFeedback) {
        const accountId = feedback.suggestedAccountId;
        const existing = accountPatterns.get(accountId);
        
        if (existing) {
          existing.totalSuggestions++;
          if (feedback.feedbackType === 'ACCEPTED') existing.acceptedCount++;
          else if (feedback.feedbackType === 'REJECTED') existing.rejectedCount++;
          else if (feedback.feedbackType === 'IGNORED') existing.ignoredCount++;
          
          existing.descriptions.push(feedback.description);
          existing.lastUsed = feedback.createdAt;
        } else {
          accountPatterns.set(accountId, {
            accountId,
            accountName: feedback.suggestedAccountName,
            totalSuggestions: 1,
            acceptedCount: feedback.feedbackType === 'ACCEPTED' ? 1 : 0,
            rejectedCount: feedback.feedbackType === 'REJECTED' ? 1 : 0,
            ignoredCount: feedback.feedbackType === 'IGNORED' ? 1 : 0,
            descriptions: [feedback.description],
            keywords: new Set(),
            categories: new Set(),
            lastUsed: feedback.createdAt,
            avgConfidence: feedback.confidence
          });
        }
      }

      // Convert to LearningPattern array and filter out heavily rejected accounts
      const patterns: LearningPattern[] = [];
      
      for (const [, pattern] of accountPatterns) {
        // Skip accounts that have been heavily rejected for this description
        const descriptionRejections = pattern.descriptions
          .filter(desc => desc.toLowerCase().includes(normalizedDescription.split(' ')[0])) // Check for keyword overlap
          .length;
        
        const rejectionRate = pattern.rejectedCount / pattern.totalSuggestions;
        
        // Skip if this account has been rejected more than 50% of the time for similar descriptions
        if (rejectionRate > 0.5 && descriptionRejections > 0) {
          continue;
        }

        // Calculate success rate (acceptances / total)
        const successRate = pattern.totalSuggestions > 0 ? pattern.acceptedCount / pattern.totalSuggestions : 0;
        
        // Only include patterns with some success or recent activity
        if (successRate > 0 || pattern.totalSuggestions >= 2) {
          patterns.push({
            description: normalizedDescription,
            accountId: pattern.accountId,
            accountName: pattern.accountName,
            confidence: pattern.avgConfidence,
            usageCount: pattern.totalSuggestions,
            successRate,
            lastUsed: pattern.lastUsed,
            businessKeywords: this.extractBusinessKeywords(normalizedDescription),
            category: this.categorizeDescription(normalizedDescription)
          });
        }
      }

      return patterns;

    } catch (error) {
      console.error('❌ [MemoryLearning] Error analyzing patterns:', error);
      return [];
    }
  }

  /**
   * Find the best memory-based suggestion for a description
   */
  async findMemoryBasedSuggestion(
    userId: number, 
    description: string,
    userAccounts: Account[]
  ): Promise<MemoryBasedSuggestion | null> {
    try {
      const patterns = await this.analyzeUserPatterns(userId, description);
      
      if (patterns.length === 0) {
        return null;
      }

      // Filter patterns to only include accounts the user currently has
      const availableAccountIds = new Set(userAccounts.map(acc => acc.id));
      const validPatterns = patterns.filter(pattern => availableAccountIds.has(pattern.accountId));

      if (validPatterns.length === 0) {
        return null;
      }

      // Find the best pattern based on multiple criteria
      const bestPattern = this.findBestPattern(validPatterns, description);
      
      if (!bestPattern) {
        return null;
      }

      // Calculate confidence based on pattern strength
      const confidence = this.calculateMemoryConfidence(bestPattern);
      
      // Generate reason based on pattern data
      const reason = this.generateMemoryReason(bestPattern);

      const suggestion: MemoryBasedSuggestion = {
        accountId: bestPattern.accountId,
        accountName: bestPattern.accountName,
        confidence,
        reason,
        learningSource: this.determineLearningSource(bestPattern),
        patternData: bestPattern
      };

      return suggestion;

    } catch (error) {
      console.error('❌ [MemoryLearning] Error finding memory-based suggestion:', error);
      return null;
    }
  }

  /**
   * Save feedback for learning
   */
  async saveFeedback(data: {
    userId: number;
    description: string;
    suggestedAccountId: number;
    suggestedAccountName: string;
    confidence: number;
    feedbackType: 'ACCEPTED' | 'REJECTED' | 'IGNORED';
    selectedAccountId?: number;
    selectedAccountName?: string;
    userReason?: string;
    rejectionReason?: string;
    suggestionMetadata: any;
    contextData: any;
  }): Promise<void> {
    try {

      const feedback = this.feedbackRepo.create({
        userId: data.userId,
        description: this.normalizeDescription(data.description),
        suggestedAccountId: data.suggestedAccountId,
        suggestedAccountName: data.suggestedAccountName,
        confidence: data.confidence,
        feedbackType: data.feedbackType,
        selectedAccountId: data.selectedAccountId,
        selectedAccountName: data.selectedAccountName,
        userReason: data.userReason,
        rejectionReason: data.rejectionReason,
        suggestionMetadata: data.suggestionMetadata,
        contextData: data.contextData
      });

      await this.feedbackRepo.save(feedback);

      // Handle different feedback types for learning
      if (data.feedbackType === 'ACCEPTED' && data.selectedAccountId) {
        // User accepted the suggestion - save as preference
        await this.saveUserPreference(data.description, data.selectedAccountId, data.userId);
        console.log('✅ [MemoryLearning] Saved accepted preference');
      } else if (data.feedbackType === 'REJECTED' && data.selectedAccountId) {
        // User rejected suggestion but selected a different account
        // Learn that the selected account is preferred for this description
        await this.saveUserPreference(data.description, data.selectedAccountId, data.userId);
        console.log('✅ [MemoryLearning] Saved alternative account preference');
      } else if (data.feedbackType === 'REJECTED' && !data.selectedAccountId) {
        // User rejected suggestion without selecting alternative
        // Learn to avoid the suggested account for this description
        // Handle side-specific rejections
        if (data.rejectionReason?.includes('side only')) {
          // This will be used in pattern analysis to avoid suggesting that specific side
        }
      }

      // Log analytics
      await logAnalytics('suggestion_feedback_saved', {
        user_id: data.userId,
        feedback_type: data.feedbackType,
        confidence: data.confidence,
        has_user_reason: !!data.userReason,
        has_rejection_reason: !!data.rejectionReason,
        has_alternative_selection: !!data.selectedAccountId
      });

    } catch (error) {
      console.error('❌ [MemoryLearning] Error saving feedback:', error);
    }
  }

  /**
   * Update user preferences based on feedback patterns
   */
  async updateUserPreferences(userId: number): Promise<void> {
    try {
      
      // Get recent successful patterns (high success rate)
      const recentFeedback = await this.feedbackRepo.find({
        where: { 
          userId,
          feedbackType: 'ACCEPTED'
        },
        order: { createdAt: 'DESC' },
        take: 100
      });

      // Group by description and find most successful account for each
      const descriptionPatterns = new Map<string, {
        description: string;
        accountId: number;
        accountName: string;
        usageCount: number;
        lastUsed: Date;
      }>();

      for (const feedback of recentFeedback) {
        const description = feedback.description;
        
        if (!descriptionPatterns.has(description)) {
          descriptionPatterns.set(description, {
            description,
            accountId: feedback.selectedAccountId || feedback.suggestedAccountId,
            accountName: feedback.selectedAccountName || feedback.suggestedAccountName,
            usageCount: 1,
            lastUsed: feedback.createdAt
          });
        } else {
          const pattern = descriptionPatterns.get(description)!;
          pattern.usageCount++;
          pattern.lastUsed = feedback.createdAt > pattern.lastUsed ? feedback.createdAt : pattern.lastUsed;
        }
      }

      // Update or create user preferences for successful patterns
      for (const [description, pattern] of descriptionPatterns) {
        if (pattern.usageCount >= 2) { // Only create preferences for frequently used patterns
          let preference = await this.preferenceRepo.findOne({
            where: { userId, description }
          });

          if (preference) {
            // Update existing preference
            preference.accountId = pattern.accountId;
            preference.accountName = pattern.accountName;
            preference.usageCount = pattern.usageCount;
            preference.lastUsed = pattern.lastUsed;
          } else {
            // Create new preference
            preference = this.preferenceRepo.create({
              userId,
              description,
              accountId: pattern.accountId,
              accountName: pattern.accountName,
              usageCount: pattern.usageCount,
              lastUsed: pattern.lastUsed
            });
          }

          await this.preferenceRepo.save(preference);
        }
      }

    } catch (error) {
      console.error('❌ [MemoryLearning] Error updating user preferences:', error);
    }
  }

  private findBestPattern(patterns: LearningPattern[], description: string): LearningPattern | null {
    if (patterns.length === 0) return null;

    // Score patterns based on multiple criteria
    const scoredPatterns = patterns.map(pattern => {
      let score = 0;

      // Success rate (40% weight)
      score += pattern.successRate * 40;

      // Usage count (20% weight)
      score += Math.min(pattern.usageCount / 10, 1) * 20;

      // Recency (20% weight)
      const daysSinceLastUse = (Date.now() - new Date(pattern.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 30 - daysSinceLastUse) / 30;
      score += recencyScore * 20;

      // Keyword similarity (20% weight)
      const descriptionWords = new Set(description.toLowerCase().split(' '));
      const patternWords = new Set(pattern.businessKeywords);
      const commonWords = [...descriptionWords].filter(word => patternWords.has(word));
      const similarityScore = commonWords.length / Math.max(descriptionWords.size, patternWords.size);
      score += similarityScore * 20;

      return { ...pattern, score };
    });

    // Sort by score and return the best
    scoredPatterns.sort((a, b) => b.score - a.score);
    
    // Only return if score is above threshold
    if (scoredPatterns[0].score >= 30) {
      return scoredPatterns[0];
    }

    return null;
  }

  private calculateMemoryConfidence(pattern: LearningPattern): number {
    let confidence = 60; // Base confidence

    // Boost based on success rate
    confidence += pattern.successRate * 30;

    // Boost based on usage count
    confidence += Math.min(pattern.usageCount / 5, 10);

    // Boost based on recency
    const daysSinceLastUse = (Date.now() - new Date(pattern.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUse < 7) confidence += 10;
    else if (daysSinceLastUse < 30) confidence += 5;

    return Math.min(confidence, 95);
  }

  private generateMemoryReason(pattern: LearningPattern): string {
    const successRate = Math.round(pattern.successRate * 100);
    const usageCount = pattern.usageCount;
    
    if (usageCount >= 5 && successRate >= 80) {
      return `You've successfully used ${pattern.accountName} ${usageCount} times for similar transactions (${successRate}% success rate).`;
    } else if (usageCount >= 3) {
      return `Based on your previous usage, ${pattern.accountName} has been a good choice for similar transactions.`;
    } else {
      return `You've used ${pattern.accountName} before for similar transactions.`;
    }
  }

  private determineLearningSource(pattern: LearningPattern): 'PATTERN_MATCH' | 'SUCCESS_RATE' | 'RECENT_USAGE' {
    if (pattern.successRate >= 0.8) return 'SUCCESS_RATE';
    if (pattern.usageCount >= 5) return 'PATTERN_MATCH';
    return 'RECENT_USAGE';
  }

  private normalizeDescription(description: string): string {
    return description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractBusinessKeywords(description: string): string[] {
    const keywords = description.toLowerCase().split(' ');
    return keywords.filter(word => word.length > 2); // Filter out short words
  }

  private categorizeDescription(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('revenue') || lowerDesc.includes('sale') || lowerDesc.includes('income')) {
      return 'Revenue & Sales';
    } else if (lowerDesc.includes('purchase') || lowerDesc.includes('inventory') || lowerDesc.includes('supply')) {
      return 'Purchases & Inventory';
    } else if (lowerDesc.includes('expense') || lowerDesc.includes('cost') || lowerDesc.includes('utility')) {
      return 'Operating Expenses';
    } else if (lowerDesc.includes('payroll') || lowerDesc.includes('salary') || lowerDesc.includes('hr')) {
      return 'Payroll & HR';
    } else if (lowerDesc.includes('tax') || lowerDesc.includes('compliance') || lowerDesc.includes('legal')) {
      return 'Taxes & Compliance';
    } else if (lowerDesc.includes('bank') || lowerDesc.includes('cash') || lowerDesc.includes('checking')) {
      return 'Banking & Cash';
    } else {
      return 'Other';
    }
  }

  private async saveUserPreference(description: string, accountId: number, userId: number): Promise<void> {
    try {
      const normalizedDescription = this.normalizeDescription(description);
      
      // Find existing preference or create new one
      let preference = await this.preferenceRepo.findOne({
        where: { userId, description: normalizedDescription }
      });

      if (preference) {
        // Update existing preference
        preference.accountId = accountId;
        preference.usageCount += 1;
        preference.lastUsed = new Date();
      } else {
        // Create new preference
        const account = await this.accountRepo.findOne({ where: { id: accountId } });
        preference = this.preferenceRepo.create({
          userId,
          description: normalizedDescription,
          accountId,
          accountName: account?.name || 'Unknown',
          usageCount: 1,
          lastUsed: new Date()
        });
      }

      await this.preferenceRepo.save(preference);
      console.log('💾 [MemoryLearning] Saved user preference:', normalizedDescription, '->', accountId);
    } catch (error) {
      console.error('❌ [MemoryLearning] Error saving user preference:', error);
    }
  }
} 