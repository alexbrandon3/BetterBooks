import { AppDataSource } from "../data-source";
import { Suggestion } from "../entities/Suggestion";
import { Account } from "../entities/Account";
import { logError } from '../utils/logger';

export class SuggestionService {
  private suggestionRepo = AppDataSource.getRepository(Suggestion);
  private accountRepo = AppDataSource.getRepository(Account);

  async getSuggestions(userId: number): Promise<Suggestion[]> {
    try {
      return await this.suggestionRepo.find({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      logError(`Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      throw error;
    }
  }

  async createSuggestion(data: { userId: number; [key: string]: any }): Promise<Suggestion> {
    try {
      const suggestion = this.suggestionRepo.create({
        ...data,
        user: { id: data.userId }
      });
      return await this.suggestionRepo.save(suggestion);
    } catch (error) {
      logError(`Failed to create suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      throw error;
    }
  }

  async updateSuggestion(id: string, userId: number, data: any): Promise<Suggestion> {
    try {
      const suggestion = await this.suggestionRepo.findOne({
        where: { id, user: { id: userId } }
      });

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      Object.assign(suggestion, data);
      return await this.suggestionRepo.save(suggestion);
    } catch (error) {
      logError(`Failed to update suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      throw error;
    }
  }

  async deleteSuggestion(id: string, userId: number): Promise<void> {
    try {
      const suggestion = await this.suggestionRepo.findOne({
        where: { id, user: { id: userId } }
      });

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      await this.suggestionRepo.remove(suggestion);
    } catch (error) {
      logError(`Failed to delete suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      throw error;
    }
  }

  async suggestAccountForDescription(description: string, userId: number): Promise<{
    suggestedAccountId: number;
    suggestedAccountName: string;
    reason: string;
  } | null> {
    try {
      if (!description || description.trim().length === 0) {
        return null;
      }

      const lowerDescription = description.toLowerCase();
      
      // Get user's accounts
      const userAccounts = await this.accountRepo.find({
        where: { user: { id: userId } },
        order: { updatedAt: 'DESC' } // Prioritize recently used accounts
      });

      // Keyword mapping for account types
      const keywordMap = [
        {
          keywords: ['food', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'pizza', 'burger', 'sushi', 'coffee', 'starbucks', 'mcdonalds', 'subway'],
          accountTypes: ['EXPENSE'],
          categories: ['Food', 'Dining', 'Meals & Entertainment'],
          reason: 'Food and dining related transaction'
        },
        {
          keywords: ['gas', 'fuel', 'petrol', 'exxon', 'shell', 'bp', 'chevron', 'mobil'],
          accountTypes: ['EXPENSE'],
          categories: ['Transportation', 'Auto', 'Fuel'],
          reason: 'Fuel and gas related transaction'
        },
        {
          keywords: ['uber', 'lyft', 'taxi', 'transport', 'parking', 'toll', 'metro', 'subway', 'bus'],
          accountTypes: ['EXPENSE'],
          categories: ['Transportation', 'Auto', 'Public Transport'],
          reason: 'Transportation related transaction'
        },
        {
          keywords: ['grocery', 'supermarket', 'walmart', 'target', 'costco', 'safeway', 'kroger', 'whole foods', 'trader joes'],
          accountTypes: ['EXPENSE'],
          categories: ['Food', 'Groceries'],
          reason: 'Grocery shopping transaction'
        },
        {
          keywords: ['amazon', 'online', 'shopping', 'clothing', 'apparel', 'shoes', 'electronics', 'best buy', 'home depot', 'lowes'],
          accountTypes: ['EXPENSE'],
          categories: ['Shopping', 'Retail', 'Online Shopping'],
          reason: 'Shopping and retail transaction'
        },
        {
          keywords: ['salary', 'payroll', 'income', 'wage', 'commission', 'bonus', 'payment', 'deposit'],
          accountTypes: ['INCOME'],
          categories: ['Income', 'Salary', 'Revenue'],
          reason: 'Income related transaction'
        },
        {
          keywords: ['rent', 'mortgage', 'housing', 'apartment', 'lease'],
          accountTypes: ['EXPENSE'],
          categories: ['Housing', 'Rent', 'Mortgage'],
          reason: 'Housing related transaction'
        },
        {
          keywords: ['utility', 'electric', 'water', 'gas', 'internet', 'phone', 'cable', 'wifi'],
          accountTypes: ['EXPENSE'],
          categories: ['Utilities', 'Bills'],
          reason: 'Utility bill transaction'
        },
        {
          keywords: ['medical', 'doctor', 'hospital', 'pharmacy', 'cvs', 'walgreens', 'health', 'dental', 'vision'],
          accountTypes: ['EXPENSE'],
          categories: ['Healthcare', 'Medical'],
          reason: 'Healthcare related transaction'
        },
        {
          keywords: ['entertainment', 'movie', 'netflix', 'spotify', 'hulu', 'disney', 'game', 'concert', 'theater'],
          accountTypes: ['EXPENSE'],
          categories: ['Entertainment', 'Recreation'],
          reason: 'Entertainment related transaction'
        }
      ];

      // Find matching keyword category
      let matchedCategory = null;
      let matchedKeyword = null;
      for (const mapping of keywordMap) {
        const foundKeyword = mapping.keywords.find(keyword => lowerDescription.includes(keyword));
        if (foundKeyword) {
          matchedCategory = mapping;
          matchedKeyword = foundKeyword;
          break;
        }
      }

      if (!matchedCategory) {
        return null;
      }

      // Find matching user account
      const matchingAccount = userAccounts.find(account => 
        matchedCategory!.accountTypes.includes(account.type) &&
        (matchedCategory!.categories.some(cat => 
          account.category?.toLowerCase().includes(cat.toLowerCase()) ||
          account.name.toLowerCase().includes(cat.toLowerCase())
        ))
      );

      if (!matchingAccount) {
        return null;
      }

      // Create detailed reason with matched keyword
      const detailedReason = `Matched keyword: '${matchedKeyword}' → Category: ${matchedCategory.categories[0]}`;

      return {
        suggestedAccountId: matchingAccount.id,
        suggestedAccountName: matchingAccount.name,
        reason: detailedReason
      };

    } catch (error) {
      logError(`Failed to suggest account for description: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      return null;
    }
  }
} 