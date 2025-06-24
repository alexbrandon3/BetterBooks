import { AppDataSource } from "../config/data-source";
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
    accountType: string;
    confidence: number;
    suggestedEntryType: 'DEBIT' | 'CREDIT';
    detailedReason: string;
  } | null> {
    try {
      console.log('🔍 SuggestionService: Processing description:', description, 'userId:', userId);
      
      if (!description || description.trim().length === 0) {
        console.log('❌ Empty description provided');
        return null;
      }

      // Normalize description: lowercase, remove punctuation, trim whitespace
      const normalizedDescription = description.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      console.log('📝 Normalized description:', normalizedDescription);
      
      // Get user's accounts
      const userAccounts = await this.accountRepo.find({
        where: { user: { id: userId } },
        order: { updatedAt: 'DESC' } // Prioritize recently used accounts
      });

      console.log('📊 Found user accounts:', userAccounts.length, userAccounts.map(acc => acc.name));
      
      // Enhanced keyword mapping for account types with personal finance terms
      const keywordMap = [
        {
          keywords: ['food', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'pizza', 'burger', 'sushi', 'coffee', 'starbucks', 'mcdonalds', 'subway', 'doordash', 'ubereats', 'grubhub'],
          accountTypes: ['EXPENSE'],
          categories: ['Food', 'Dining', 'Meals & Entertainment'],
          reason: 'Food and dining related transaction'
        },
        {
          keywords: ['gas', 'fuel', 'petrol', 'exxon', 'shell', 'bp', 'chevron', 'mobil', 'costco gas', 'sam club gas'],
          accountTypes: ['EXPENSE'],
          categories: ['Transportation', 'Auto', 'Fuel'],
          reason: 'Fuel and gas related transaction'
        },
        {
          keywords: ['uber', 'lyft', 'taxi', 'transport', 'parking', 'toll', 'metro', 'subway', 'bus', 'train', 'transit', 'rideshare'],
          accountTypes: ['EXPENSE'],
          categories: ['Transportation', 'Auto', 'Public Transport'],
          reason: 'Transportation related transaction'
        },
        {
          keywords: ['grocery', 'supermarket', 'walmart', 'target', 'costco', 'safeway', 'kroger', 'whole foods', 'trader joes', 'aldi', 'publix', 'wegmans'],
          accountTypes: ['EXPENSE'],
          categories: ['Food', 'Groceries'],
          reason: 'Grocery shopping transaction'
        },
        {
          keywords: ['amazon', 'online', 'shopping', 'clothing', 'apparel', 'shoes', 'electronics', 'best buy', 'home depot', 'lowes', 'target', 'walmart', 'ebay', 'etsy'],
          accountTypes: ['EXPENSE'],
          categories: ['Shopping', 'Retail', 'Online Shopping'],
          reason: 'Shopping and retail transaction'
        },
        {
          keywords: ['salary', 'payroll', 'income', 'wage', 'commission', 'bonus', 'payment', 'deposit', 'paycheck', 'direct deposit'],
          accountTypes: ['INCOME'],
          categories: ['Income', 'Salary', 'Revenue'],
          reason: 'Income related transaction'
        },
        {
          keywords: ['rent', 'mortgage', 'housing', 'apartment', 'lease', 'landlord', 'property management'],
          accountTypes: ['EXPENSE'],
          categories: ['Housing', 'Rent', 'Mortgage'],
          reason: 'Housing related transaction'
        },
        {
          keywords: ['utility', 'electric', 'water', 'gas', 'internet', 'phone', 'cable', 'wifi', 'electricity', 'power', 'sewer', 'trash', 'garbage'],
          accountTypes: ['EXPENSE'],
          categories: ['Utilities', 'Bills'],
          reason: 'Utility bill transaction'
        },
        {
          keywords: ['medical', 'doctor', 'pharmacy', 'cvs', 'walgreens', 'health', 'dental', 'vision', 'hospital', 'clinic', 'urgent care', 'emergency room', 'er', 'prescription', 'medication'],
          accountTypes: ['EXPENSE'],
          categories: ['Healthcare', 'Medical'],
          reason: 'Healthcare related transaction'
        },
        {
          keywords: ['entertainment', 'movie', 'netflix', 'spotify', 'hulu', 'disney', 'game', 'concert', 'theater', 'youtube', 'apple music', 'amazon prime', 'hbo', 'peacock', 'paramount'],
          accountTypes: ['EXPENSE'],
          categories: ['Entertainment', 'Recreation'],
          reason: 'Entertainment related transaction'
        },
        {
          keywords: ['gym', 'fitness', 'workout', 'planet fitness', 'la fitness', '24 hour fitness', 'ymca', 'personal trainer', 'yoga', 'pilates'],
          accountTypes: ['EXPENSE'],
          categories: ['Healthcare', 'Fitness', 'Wellness'],
          reason: 'Fitness and wellness related transaction'
        },
        {
          keywords: ['school', 'tuition', 'books', 'education', 'college', 'university', 'textbook', 'course', 'class', 'training', 'workshop', 'seminar'],
          accountTypes: ['EXPENSE'],
          categories: ['Education', 'Training'],
          reason: 'Education related transaction'
        },
        {
          keywords: ['vacation', 'airbnb', 'hotel', 'travel', 'flight', 'airline', 'delta', 'united', 'american', 'southwest', 'jetblue', 'booking', 'expedia', 'trip', 'resort'],
          accountTypes: ['EXPENSE'],
          categories: ['Travel', 'Vacation'],
          reason: 'Travel and vacation related transaction'
        },
        {
          keywords: ['childcare', 'babysitter', 'daycare', 'nanny', 'preschool', 'after school', 'summer camp', 'child care'],
          accountTypes: ['EXPENSE'],
          categories: ['Family', 'Childcare'],
          reason: 'Childcare related transaction'
        },
        {
          keywords: ['atm', 'withdrawal', 'cash', 'bank', 'credit union', 'chase', 'bank of america', 'wells fargo', 'citibank', 'us bank'],
          accountTypes: ['ASSET', 'EXPENSE'],
          categories: ['Cash', 'Banking'],
          reason: 'Cash and banking related transaction'
        },
        {
          keywords: ['insurance', 'car insurance', 'home insurance', 'health insurance', 'life insurance', 'geico', 'state farm', 'allstate', 'progressive', 'farmers'],
          accountTypes: ['EXPENSE'],
          categories: ['Insurance'],
          reason: 'Insurance related transaction'
        },
        {
          keywords: ['car', 'auto', 'automotive', 'dealership', 'ford', 'toyota', 'honda', 'bmw', 'mercedes', 'audi', 'volkswagen', 'nissan', 'hyundai', 'kia'],
          accountTypes: ['EXPENSE', 'ASSET'],
          categories: ['Transportation', 'Auto'],
          reason: 'Automotive related transaction'
        },
        {
          keywords: ['pet', 'veterinary', 'vet', 'petco', 'petsmart', 'dog', 'cat', 'animal', 'pet food', 'pet supplies'],
          accountTypes: ['EXPENSE'],
          categories: ['Pets', 'Veterinary'],
          reason: 'Pet related transaction'
        },
        {
          keywords: ['home', 'house', 'maintenance', 'repair', 'home depot', 'lowes', 'ace hardware', 'true value', 'plumber', 'electrician', 'contractor'],
          accountTypes: ['EXPENSE'],
          categories: ['Housing', 'Home Maintenance'],
          reason: 'Home maintenance related transaction'
        },
        // Business and sales related keywords
        {
          keywords: ['sold', 'sale', 'sales', 'revenue', 'income', 'earnings', 'profit', 'commission', 'service', 'product', 'merchandise', 'goods'],
          accountTypes: ['INCOME', 'REVENUE'],
          categories: ['Income', 'Sales', 'Revenue', 'Service Income'],
          reason: 'Sales and revenue related transaction'
        },
        {
          keywords: ['purchase', 'buy', 'bought', 'buying', 'procurement', 'inventory', 'stock', 'supplies', 'equipment', 'materials'],
          accountTypes: ['EXPENSE', 'ASSET'],
          categories: ['Supplies', 'Equipment', 'Inventory', 'Equipment Purchase'],
          reason: 'Purchase and procurement transaction'
        },
        {
          keywords: ['tax', 'taxes', 'taxation', 'irs', 'federal', 'state', 'local', 'property tax', 'income tax', 'sales tax', 'withholding'],
          accountTypes: ['EXPENSE'],
          categories: ['Taxes', 'Expenses'],
          reason: 'Tax related transaction'
        },
        {
          keywords: ['payroll', 'salary', 'wage', 'employee', 'staff', 'labor', 'compensation', 'benefits', 'paycheck'],
          accountTypes: ['EXPENSE'],
          categories: ['Payroll', 'Expenses'],
          reason: 'Payroll and employee compensation transaction'
        },
        {
          keywords: ['marketing', 'advertising', 'promotion', 'campaign', 'social media', 'google ads', 'facebook ads', 'seo', 'branding'],
          accountTypes: ['EXPENSE'],
          categories: ['Marketing', 'Marketing Expense'],
          reason: 'Marketing and advertising transaction'
        },
        {
          keywords: ['loan', 'credit', 'debt', 'borrow', 'lending', 'mortgage', 'financing', 'interest', 'principal'],
          accountTypes: ['LIABILITY', 'EXPENSE'],
          categories: ['Loan', 'Credit', 'Loan Payable'],
          reason: 'Loan and credit related transaction'
        },
        {
          keywords: ['draw', 'drawing', 'withdrawal', 'owner', 'partner', 'distribution', 'dividend'],
          accountTypes: ['EXPENSE', 'EQUITY'],
          categories: ['Drawings', 'Owner Equity'],
          reason: 'Owner withdrawal or distribution transaction'
        },
        {
          keywords: ['utility', 'utilities', 'electric', 'water', 'gas', 'internet', 'phone', 'cable', 'wifi', 'electricity', 'power', 'sewer', 'trash', 'garbage'],
          accountTypes: ['EXPENSE'],
          categories: ['Utilities', 'Bills'],
          reason: 'Utility bill transaction'
        },
        {
          keywords: ['rent', 'lease', 'rental', 'landlord', 'property', 'real estate', 'office space', 'warehouse'],
          accountTypes: ['EXPENSE'],
          categories: ['Rent', 'Rent Expense'],
          reason: 'Rent and lease transaction'
        },
        {
          keywords: ['interest', 'dividend', 'investment', 'return', 'yield', 'earnings', 'capital gains'],
          accountTypes: ['INCOME'],
          categories: ['Interest', 'Interest Income'],
          reason: 'Interest and investment income transaction'
        }
      ];

      // Find matching keyword category
      let matchedCategory = null;
      let matchedKeyword = null;
      for (const mapping of keywordMap) {
        const foundKeyword = mapping.keywords.find(keyword => normalizedDescription.includes(keyword));
        if (foundKeyword) {
          matchedCategory = mapping;
          matchedKeyword = foundKeyword;
          console.log('✅ Found keyword match:', foundKeyword, 'Category:', mapping.categories[0]);
          break;
        }
      }

      if (!matchedCategory) {
        console.log('❌ No keyword category match found for:', normalizedDescription);
        return null;
      }

      // Find matching user account with better prioritization
      let bestMatch = null;
      let bestScore = 0;

      console.log('🔍 Looking for accounts matching category:', matchedCategory.categories[0], 'accountTypes:', matchedCategory.accountTypes);

      for (const account of userAccounts) {
        if (!matchedCategory!.accountTypes.includes(account.type)) {
          console.log('⏭️ Skipping account', account.name, '- type', account.type, 'not in', matchedCategory!.accountTypes);
          continue;
        }

        let score = 0;
        let reasoning = [];
        
        // Check for exact keyword matches in account name (highest priority)
        const exactKeywordMatch = matchedCategory!.keywords.some(keyword => 
          account.name.toLowerCase().includes(keyword.toLowerCase())
        );
        if (exactKeywordMatch) {
          score += 50; // Higher priority for exact keyword matches
          reasoning.push('exact keyword match in account name');
        }
        
        // Check name match (higher priority)
        const nameMatch = matchedCategory!.categories.some(cat => 
          account.name.toLowerCase().includes(cat.toLowerCase())
        );
        if (nameMatch) {
          score += 30;
          reasoning.push('category match in account name');
        }
        
        // Check category match
        const categoryMatch = matchedCategory!.categories.some(cat => 
          account.category?.toLowerCase().includes(cat.toLowerCase())
        );
        if (categoryMatch) {
          score += 15;
          reasoning.push('category field match');
        }
        
        // Check subcategory match
        const subcategoryMatch = matchedCategory!.categories.some(cat => 
          account.subcategory?.toLowerCase().includes(cat.toLowerCase())
        );
        if (subcategoryMatch) {
          score += 10;
          reasoning.push('subcategory field match');
        }

        // Bonus for recently used accounts
        const daysSinceUpdate = (Date.now() - new Date(account.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) {
          score += 5;
          reasoning.push('recently used account');
        }

        console.log('📊 Account', account.name, 'score:', score, 'reasoning:', reasoning.join(', '));

        if (score > bestScore) {
          bestScore = score;
          bestMatch = account;
        }
      }

      if (!bestMatch) {
        console.log('❌ No matching account found');
        return null;
      }

      console.log('✅ Best match found:', bestMatch.name, 'with score:', bestScore);

      // Calculate confidence score (0-100)
      const maxPossibleScore = 110; // 50 + 30 + 15 + 10 + 5
      const confidence = Math.min(100, Math.round((bestScore / maxPossibleScore) * 100));

      // Determine optimal entry type based on account type
      let suggestedEntryType: 'DEBIT' | 'CREDIT';
      
      switch (bestMatch.type) {
        case 'EXPENSE':
          suggestedEntryType = 'DEBIT';
          break;
        case 'INCOME':
          suggestedEntryType = 'CREDIT';
          break;
        case 'ASSET':
          suggestedEntryType = 'DEBIT';
          break;
        case 'LIABILITY':
          suggestedEntryType = 'CREDIT';
          break;
        case 'EQUITY':
          suggestedEntryType = 'CREDIT';
          break;
        default:
          suggestedEntryType = 'DEBIT';
      }

      // Create human-friendly reason
      const humanFriendlyReason = this.createHumanFriendlyReason(matchedKeyword || 'unknown', bestMatch, confidence, suggestedEntryType);

      return {
        suggestedAccountId: bestMatch.id,
        suggestedAccountName: bestMatch.name,
        reason: humanFriendlyReason,
        accountType: bestMatch.type,
        confidence: confidence,
        suggestedEntryType: suggestedEntryType,
        detailedReason: humanFriendlyReason
      };

    } catch (error) {
      logError(`Failed to suggest account for description: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      return null;
    }
  }

  private createHumanFriendlyReason(matchedKeyword: string, bestMatch: Account, confidence: number, suggestedEntryType: 'DEBIT' | 'CREDIT'): string {
    // Create natural, concise explanations
    const accountType = bestMatch.type.toLowerCase();
    const accountName = bestMatch.name;
    
    // Base explanation based on account type
    let baseExplanation = '';
    switch (accountType) {
      case 'income':
        baseExplanation = `"${matchedKeyword}" suggests income, so I selected ${accountName}`;
        break;
      case 'expense':
        baseExplanation = `"${matchedKeyword}" suggests an expense, so I selected ${accountName}`;
        break;
      case 'asset':
        baseExplanation = `"${matchedKeyword}" suggests an asset transaction, so I selected ${accountName}`;
        break;
      case 'liability':
        baseExplanation = `"${matchedKeyword}" suggests a liability, so I selected ${accountName}`;
        break;
      case 'equity':
        baseExplanation = `"${matchedKeyword}" suggests an equity transaction, so I selected ${accountName}`;
        break;
      default:
        baseExplanation = `Based on "${matchedKeyword}", I selected ${accountName}`;
    }

    // Add entry type explanation
    const entryExplanation = suggestedEntryType === 'CREDIT' 
      ? ' (credit side)' 
      : ' (debit side)';

    // Add confidence if it's not 100%
    const confidenceText = confidence < 100 
      ? ` (${confidence}% confident)`
      : '';

    return `${baseExplanation}${entryExplanation}${confidenceText}`;
  }
} 