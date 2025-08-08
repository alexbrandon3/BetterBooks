import { AppDataSource } from "../config/data-source";
import { Suggestion } from "../entities/Suggestion";
import { Account } from "../entities/Account";
import { UserSuggestionPreference } from "../entities/UserSuggestionPreference";
import { logError } from '../utils/logger';

// Type definitions for dual-side suggestions
interface DualSideSuggestion {
  debitAccount: {
    id: number;
    name: string;
    type: string;
    score: number;
    reason: string;
  };
  creditAccount: {
    id: number;
    name: string;
    type: string;
    score: number;
    reason: string;
  };
  overallConfidence: number;
  pairValidation: string;
  context: string;
}

type TransactionContext = {
  direction: 'incoming' | 'outgoing' | 'neutral';
  verbs: string[];
  context: string;
  alignment: number;
};

export class SuggestionService {
  private suggestionRepo = AppDataSource.getRepository(Suggestion);
  private accountRepo = AppDataSource.getRepository(Account);
  private userPreferenceRepo = AppDataSource.getRepository(UserSuggestionPreference);

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
      
      if (!description || description.trim().length === 0) {
        return null;
      }

      // Normalize description: lowercase, remove punctuation, trim whitespace
      const normalizedDescription = description.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      // Step 1: Check user preferences first (highest priority)
      const userPreference = await this.findUserPreference(normalizedDescription, userId);
      if (userPreference) {
        return await this.createSuggestionFromPreference(userPreference);
      }

      // Step 2: Try keyword matching (sole logic - no machine learning)
      const keywordSuggestion = await this.findKeywordSuggestionForUser(normalizedDescription, userId);
      console.log('🔍 [SuggestionService] Keyword suggestion result:', {
        description,
        hasKeywordSuggestion: !!keywordSuggestion,
        suggestedAccount: keywordSuggestion?.suggestedAccountName,
        confidence: keywordSuggestion?.confidence,
        entryType: keywordSuggestion?.suggestedEntryType
      });
      
      // Return keyword suggestion if found (no machine learning fallbacks)
      if (keywordSuggestion && keywordSuggestion.confidence >= 50) {
        console.log('✅ [SuggestionService] Using keyword-based suggestion:', keywordSuggestion.suggestedAccountName);
        return keywordSuggestion;
      }

      // No suggestions if keyword matching fails
      console.log('❌ [SuggestionService] No reliable keyword match found for:', description);
      return null;
    } catch (error) {
      logError(`Failed to suggest account for description: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      return null;
    }
  }

  async saveUserPreference(description: string, accountId: number, userId: number): Promise<void> {
    try {
      const normalizedDescription = this.normalizeDescription(description);
      
      // Find existing preference or create new one
      let preference = await this.userPreferenceRepo.findOne({
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
        preference = this.userPreferenceRepo.create({
          userId,
          description: normalizedDescription,
          accountId,
          accountName: account?.name || 'Unknown',
          usageCount: 1,
          lastUsed: new Date()
        });
      }

      await this.userPreferenceRepo.save(preference);
    } catch (error) {
      logError(`Failed to save user preference: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
    }
  }

  async saveSuggestionFeedback(data: {
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
      // Simple logging for keyword/rule-based system (no machine learning)
      console.log('📝 [SuggestionService] Feedback logged:', {
        description: data.description,
        feedbackType: data.feedbackType,
        suggestedAccount: data.suggestedAccountName,
        selectedAccount: data.selectedAccountName,
        confidence: data.confidence,
        timestamp: new Date().toISOString()
      });

      // Optional: Save simple user preference for accepted suggestions
      if (data.feedbackType === 'ACCEPTED' && data.selectedAccountId) {
        await this.saveUserPreference(data.description, data.selectedAccountId, data.userId);
      }
    } catch (error) {
      logError(`Failed to save suggestion feedback: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
    }
  }

  async getUserPreferences(userId: number): Promise<UserSuggestionPreference[]> {
    try {
      const preferences = await this.userPreferenceRepo.find({
        where: { userId },
        order: { lastUsed: 'DESC' }
      });
      
      return preferences;
    } catch (error) {
      logError(`Failed to get user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      return [];
    }
  }

  async clearUserPreferences(userId: number): Promise<void> {
    try {
      await this.userPreferenceRepo.delete({ userId });
      console.log(`✅ Cleared all preferences for user ${userId}`);
    } catch (error) {
      logError(`Failed to clear user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      throw error;
    }
  }

  async getSuggestionSettings(): Promise<{
    autoSuggestions: boolean;
    learnFromChoices: boolean;
    showConfidence: boolean;
    businessFocus: boolean;
  }> {
    try {
      // For now, return default settings
      // In the future, this could be stored in a database table
      return {
        autoSuggestions: true,
        learnFromChoices: true,
        showConfidence: true,
        businessFocus: true
      };
    } catch (error) {
      logError(`Failed to get suggestion settings: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      // Return default settings on error
      return {
        autoSuggestions: true,
        learnFromChoices: true,
        showConfidence: true,
        businessFocus: true
      };
    }
  }

  async updateSuggestionSettings(settings: any): Promise<void> {
    try {
      // For now, just log the settings update
      // In the future, this could be stored in a database table
      console.log(`⚙️ Updated suggestion settings:`, settings);
      
      // Validate settings
      const validSettings = ['autoSuggestions', 'learnFromChoices', 'showConfidence', 'businessFocus'];
      for (const setting of validSettings) {
        if (typeof settings[setting] === 'boolean') {
          console.log(`✅ Setting ${setting} to ${settings[setting]}`);
        }
      }
    } catch (error) {
      logError(`Failed to update suggestion settings: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      throw error;
    }
  }

  async suggestCategoryForDescription(description: string): Promise<{
    suggestedCategory: string;
    confidence: number;
    reason: string;
    detailedReason: string;
  } | null> {
    try {
      
      if (!description || description.trim().length === 0) {
        return null;
      }

      // Normalize description: lowercase, remove punctuation, trim whitespace
      const normalizedDescription = description.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      // Use the same keyword mapping as account suggestions but extract category information
      const keywordMap = [
        // PRIORITY 1: Core Business Revenue & Operations
        {
          keywords: ['sold', 'sale', 'sales', 'revenue', 'income', 'earnings', 'profit', 'commission', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment received', 'customer payment', 'client payment', 'customer', 'client', 'retail', 'wholesale', 'consulting fee', 'service fee', 'project payment'],
          categories: ['Sales', 'Revenue', 'Service Income', 'Product Sales', 'Consulting Revenue'],
          reason: 'Business revenue transaction',
          priority: 1
        },
        {
          keywords: ['purchase', 'buy', 'bought', 'buying', 'procurement', 'inventory', 'stock', 'supplies', 'equipment', 'materials', 'vendor', 'supplier', 'cost of goods', 'cogs', 'inventory purchase', 'raw materials', 'component', 'part', 'tool', 'machinery'],
          categories: ['Supplies', 'Equipment', 'Inventory', 'Cost of Goods Sold', 'Materials'],
          reason: 'Business purchase transaction',
          priority: 1
        },
        {
          keywords: ['payroll', 'salary', 'wage', 'employee', 'staff', 'labor', 'compensation', 'benefits', 'paycheck', 'w2', 'withholding', 'payroll tax', 'employee payroll', 'bonus', 'commission', 'overtime', 'holiday pay', 'sick pay', 'vacation pay'],
          categories: ['Payroll', 'Payroll Expense', 'Employee Benefits', 'Wages'],
          reason: 'Payroll and employee compensation transaction',
          priority: 1
        },
        {
          keywords: ['tax', 'taxes', 'taxation', 'irs', 'federal', 'state', 'local', 'property tax', 'income tax', 'sales tax', 'withholding', 'estimated tax', 'quarterly tax', 'business tax', 'payroll tax', 'futa', 'fica', 'medicare', 'social security'],
          categories: ['Taxes', 'Tax Expense', 'Tax Liability', 'Payroll Taxes'],
          reason: 'Tax related transaction',
          priority: 1
        },
        {
          keywords: ['loan', 'credit', 'debt', 'borrow', 'lending', 'mortgage', 'financing', 'principal', 'line of credit', 'business loan', 'bank loan', 'sba loan', 'equipment financing', 'working capital loan'],
          categories: ['Loan', 'Credit', 'Loan Payable', 'Business Loan'],
          reason: 'Loan and credit related transaction',
          priority: 1
        },
        // PRIORITY 2: Business Operations & Professional Services
        {
          keywords: ['marketing', 'advertising', 'promotion', 'campaign', 'social media', 'google ads', 'facebook ads', 'seo', 'branding', 'website', 'digital marketing', 'print advertising', 'trade show', 'exhibition', 'sponsorship', 'public relations', 'pr'],
          categories: ['Marketing', 'Marketing Expense', 'Advertising', 'Promotion'],
          reason: 'Marketing and advertising transaction',
          priority: 2
        },
        {
          keywords: ['rent', 'lease', 'rental', 'property', 'office space', 'warehouse', 'storage', 'facility', 'premises', 'commercial lease', 'office rent', 'warehouse rent'],
          categories: ['Rent', 'Rent Expense', 'Lease', 'Facility'],
          reason: 'Rent and lease transaction',
          priority: 2
        },
        {
          keywords: ['utility', 'utilities', 'electric', 'electricity', 'gas', 'water', 'sewer', 'internet', 'phone', 'telephone', 'cable', 'wifi', 'broadband', 'power', 'energy', 'heating', 'cooling', 'ac', 'hvac'],
          categories: ['Utilities', 'Utility Expense', 'Energy', 'Infrastructure'],
          reason: 'Utility and infrastructure transaction',
          priority: 2
        },
        {
          keywords: ['legal', 'lawyer', 'attorney', 'law firm', 'legal services', 'contract', 'litigation', 'compliance', 'regulatory', 'intellectual property', 'patent', 'trademark', 'copyright', 'legal advice'],
          categories: ['Legal', 'Legal Expense', 'Professional Services', 'Compliance'],
          reason: 'Legal and compliance transaction',
          priority: 2
        },
        {
          keywords: ['accounting', 'accountant', 'cpa', 'bookkeeping', 'audit', 'financial statement', 'tax preparation', 'consulting', 'advisory', 'financial advisor'],
          categories: ['Accounting', 'Professional Services', 'Consulting', 'Financial Advisory'],
          reason: 'Accounting and professional services transaction',
          priority: 2
        },
        // PRIORITY 3: Technology & Software
        {
          keywords: ['software', 'subscription', 'saas', 'cloud', 'microsoft', 'adobe', 'quickbooks', 'salesforce', 'hubspot', 'mailchimp', 'stripe', 'paypal', 'square', 'zoom', 'slack', 'trello', 'asana'],
          categories: ['Software', 'Subscriptions', 'Technology', 'SaaS'],
          reason: 'Business software and subscription transaction',
          priority: 3
        },
        // PRIORITY 4: Business-Specific Expenses
        {
          keywords: ['food', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'pizza', 'burger', 'sushi', 'coffee', 'business meal', 'client dinner', 'business lunch', 'catering', 'office lunch'],
          categories: ['Food', 'Dining', 'Meals & Entertainment', 'Business Meals'],
          reason: 'Food and dining related transaction',
          priority: 4
        },
        {
          keywords: ['gas', 'fuel', 'petrol', 'exxon', 'shell', 'bp', 'chevron', 'mobil', 'costco gas', 'business fuel', 'delivery vehicle', 'company car', 'fleet', 'truck', 'van'],
          categories: ['Transportation', 'Auto', 'Fuel', 'Vehicle Expense'],
          reason: 'Fuel and gas related transaction',
          priority: 4
        },
        {
          keywords: ['uber', 'lyft', 'taxi', 'transport', 'parking', 'toll', 'metro', 'subway', 'bus', 'train', 'transit', 'rideshare', 'business transport', 'delivery', 'courier', 'shipping'],
          categories: ['Transportation', 'Auto', 'Public Transport', 'Delivery'],
          reason: 'Transportation related transaction',
          priority: 4
        },
        {
          keywords: ['grocery', 'supermarket', 'walmart', 'target', 'costco', 'safeway', 'kroger', 'whole foods', 'trader joes', 'aldi', 'publix', 'wegmans', 'office supplies', 'break room', 'kitchen supplies'],
          categories: ['Food', 'Groceries', 'Office Supplies', 'Kitchen Supplies'],
          reason: 'Grocery and supplies transaction',
          priority: 4
        },
        {
          keywords: ['amazon', 'online', 'shopping', 'clothing', 'apparel', 'shoes', 'electronics', 'best buy', 'home depot', 'lowes', 'target', 'walmart', 'ebay', 'etsy', 'business purchase', 'uniform', 'safety equipment', 'ppe'],
          categories: ['Shopping', 'Retail', 'Online Shopping', 'Business Supplies'],
          reason: 'Shopping and retail transaction',
          priority: 4
        },
        {
          keywords: ['insurance', 'car insurance', 'home insurance', 'health insurance', 'life insurance', 'geico', 'state farm', 'allstate', 'progressive', 'farmers', 'business insurance', 'commercial insurance'],
          categories: ['Insurance', 'Business Insurance'],
          reason: 'Insurance related transaction',
          priority: 4
        }
      ];

      // Find matching keyword category with priority-based selection
      let matchedCategory = null;
      let matchedKeyword = null;
      let bestPriority = 999; // Start with high number (lower is better)
      
      for (const mapping of keywordMap) {
        const foundKeyword = mapping.keywords.find(keyword => normalizedDescription.includes(keyword));
        if (foundKeyword) {
          // Prioritize by priority number (lower number = higher priority)
          if (mapping.priority < bestPriority) {
            matchedCategory = mapping;
            matchedKeyword = foundKeyword;
            bestPriority = mapping.priority;
            console.log('✅ Found keyword match for category:', foundKeyword, 'Category:', mapping.categories[0], 'Priority:', mapping.priority);
          }
        }
      }

      if (!matchedCategory) {
        console.log('❌ No keyword category match found for:', normalizedDescription);
        return null;
      }

      // Select the first category from the matched category list
      const suggestedCategory = matchedCategory.categories[0];
      
      // Calculate confidence based on priority (higher priority = higher confidence)
      const confidence = Math.max(60, 100 - ((matchedCategory.priority - 1) * 10)); // 90% for priority 1, 80% for priority 2, etc.

      const reason = `Based on keyword "${matchedKeyword}" in description`;
      const detailedReason = `The description contains "${matchedKeyword}" which typically indicates a ${matchedCategory.reason}. This suggests the category "${suggestedCategory}".`;

      console.log('✅ Category suggestion found:', {
        suggestedCategory,
        confidence,
        reason,
        detailedReason
      });

      return {
        suggestedCategory,
        confidence,
        reason,
        detailedReason
      };
    } catch (error) {
      logError(`Failed to suggest category for description: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      return null;
    }
  }

  async suggestTransactionTypeForDescription(description: string, userId: number): Promise<{
    suggestedType: string;
    confidence: number;
    reason: string;
    detailedReason: string;
  } | null> {
    try {
      console.log('🔍 SuggestionService: Processing transaction type suggestion for description:', description, 'userId:', userId);
      
      if (!description || description.trim().length === 0) {
        console.log('❌ Empty description provided');
        return null;
      }

      // Normalize description: lowercase, remove punctuation, trim whitespace
      const normalizedDescription = description.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      console.log('📝 Normalized description for transaction type suggestion:', normalizedDescription);
      
      // Keyword mapping for transaction types
      const typeKeywordMap = [
        // Income/Revenue transactions
        {
          keywords: ['sold', 'sale', 'sales', 'revenue', 'income', 'earnings', 'profit', 'commission', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment received', 'customer payment', 'client payment', 'customer', 'client', 'retail', 'wholesale', 'consulting fee', 'service fee', 'project payment', 'rental income', 'interest income', 'dividend', 'refund', 'rebate'],
          suggestedType: 'INCOME',
          reason: 'Revenue or income transaction',
          priority: 1
        },
        // Expense transactions
        {
          keywords: ['purchase', 'buy', 'bought', 'buying', 'procurement', 'inventory', 'stock', 'supplies', 'equipment', 'materials', 'vendor', 'supplier', 'cost of goods', 'cogs', 'inventory purchase', 'raw materials', 'component', 'part', 'tool', 'machinery', 'payroll', 'salary', 'wage', 'employee', 'staff', 'labor', 'compensation', 'benefits', 'paycheck', 'w2', 'withholding', 'payroll tax', 'employee payroll', 'bonus', 'commission', 'overtime', 'holiday pay', 'sick pay', 'vacation pay', 'tax', 'taxes', 'taxation', 'irs', 'federal', 'state', 'local', 'property tax', 'income tax', 'sales tax', 'withholding', 'estimated tax', 'quarterly tax', 'business tax', 'payroll tax', 'futa', 'fica', 'medicare', 'social security', 'marketing', 'advertising', 'promotion', 'campaign', 'social media', 'google ads', 'facebook ads', 'seo', 'branding', 'website', 'digital marketing', 'print advertising', 'trade show', 'exhibition', 'sponsorship', 'public relations', 'pr', 'rent', 'lease', 'rental', 'property', 'office space', 'warehouse', 'storage', 'facility', 'premises', 'commercial lease', 'office rent', 'warehouse rent', 'utility', 'utilities', 'electric', 'electricity', 'gas', 'water', 'sewer', 'internet', 'phone', 'telephone', 'cable', 'wifi', 'broadband', 'power', 'energy', 'heating', 'cooling', 'ac', 'hvac', 'legal', 'lawyer', 'attorney', 'law firm', 'legal services', 'contract', 'litigation', 'compliance', 'regulatory', 'intellectual property', 'patent', 'trademark', 'copyright', 'legal advice', 'accounting', 'accountant', 'cpa', 'bookkeeping', 'audit', 'financial statement', 'tax preparation', 'consulting', 'advisory', 'financial advisor', 'software', 'subscription', 'saas', 'cloud', 'microsoft', 'adobe', 'quickbooks', 'salesforce', 'hubspot', 'mailchimp', 'stripe', 'paypal', 'square', 'zoom', 'slack', 'trello', 'asana', 'food', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'pizza', 'burger', 'sushi', 'coffee', 'business meal', 'client dinner', 'business lunch', 'catering', 'office lunch', 'gas', 'fuel', 'petrol', 'exxon', 'shell', 'bp', 'chevron', 'mobil', 'costco gas', 'business fuel', 'delivery vehicle', 'company car', 'fleet', 'truck', 'van', 'uber', 'lyft', 'taxi', 'transport', 'parking', 'toll', 'metro', 'subway', 'bus', 'train', 'transit', 'rideshare', 'business transport', 'delivery', 'courier', 'shipping', 'grocery', 'supermarket', 'walmart', 'target', 'costco', 'safeway', 'kroger', 'whole foods', 'trader joes', 'aldi', 'publix', 'wegmans', 'office supplies', 'break room', 'kitchen supplies', 'amazon', 'online', 'shopping', 'clothing', 'apparel', 'shoes', 'electronics', 'best buy', 'home depot', 'lowes', 'target', 'walmart', 'ebay', 'etsy', 'business purchase', 'uniform', 'safety equipment', 'ppe', 'insurance', 'car insurance', 'home insurance', 'health insurance', 'life insurance', 'geico', 'state farm', 'allstate', 'progressive', 'farmers', 'business insurance', 'commercial insurance'],
          suggestedType: 'EXPENSE',
          reason: 'Expense or cost transaction',
          priority: 1
        },
        // Transfer transactions
        {
          keywords: ['transfer', 'move', 'moved', 'moving', 'between accounts', 'account transfer', 'bank transfer', 'wire transfer', 'ach transfer', 'internal transfer', 'from account', 'to account'],
          suggestedType: 'TRANSFER',
          reason: 'Transfer between accounts',
          priority: 2
        },
        // Loan payment transactions
        {
          keywords: ['loan payment', 'loan repayment', 'principal payment', 'interest payment', 'mortgage payment', 'debt payment', 'credit card payment', 'line of credit payment', 'business loan payment', 'sba payment'],
          suggestedType: 'LOAN_PAYMENT',
          reason: 'Loan or debt payment transaction',
          priority: 2
        },
        // Asset purchase transactions
        {
          keywords: ['asset purchase', 'equipment purchase', 'vehicle purchase', 'machinery purchase', 'building purchase', 'property purchase', 'capital expenditure', 'capex', 'fixed asset', 'capital asset'],
          suggestedType: 'ASSET_PURCHASE',
          reason: 'Asset or capital purchase transaction',
          priority: 2
        },
        // Liability settlement transactions
        {
          keywords: ['liability settlement', 'debt settlement', 'creditor settlement', 'vendor payment', 'supplier payment', 'accounts payable', 'payable settlement'],
          suggestedType: 'LIABILITY_SETTLEMENT',
          reason: 'Liability settlement transaction',
          priority: 2
        },
        // Equity contribution transactions
        {
          keywords: ['equity contribution', 'owner contribution', 'capital contribution', 'initial contribution', 'partner contribution', 'shareholder contribution'],
          suggestedType: 'EQUITY_CONTRIBUTION',
          reason: 'Equity or capital contribution transaction',
          priority: 1
        },
        // Investment transactions (separate from equity contributions)
        {
          keywords: ['investment', 'owner investment'],
          suggestedType: 'EQUITY_CONTRIBUTION',
          reason: 'Investment transaction',
          priority: 2
        },
        // Equity withdrawal transactions
        {
          keywords: ['equity withdrawal', 'owner withdrawal', 'draw', 'drawing', 'owner draw', 'partner withdrawal', 'shareholder withdrawal', 'distribution'],
          suggestedType: 'EQUITY_WITHDRAWAL',
          reason: 'Equity or capital withdrawal transaction',
          priority: 2
        },
        // Adjustment transactions
        {
          keywords: ['adjustment', 'correction', 'reconciliation', 'balance adjustment', 'accounting adjustment', 'error correction', 'reversing entry', 'journal entry'],
          suggestedType: 'ADJUSTMENT',
          reason: 'Accounting adjustment or correction transaction',
          priority: 3
        }
      ];

      // Find matching keyword category with priority-based selection
      let matchedType = null;
      let matchedKeyword = null;
      let bestPriority = 999; // Start with high number (lower is better)
      
      for (const mapping of typeKeywordMap) {
        const foundKeyword = mapping.keywords.find(keyword => {
          // Check for exact phrase match first (higher priority)
          if (normalizedDescription.includes(keyword)) {
            return true;
          }
          
          // For multi-word keywords, also check if all words are present
          if (keyword.includes(' ')) {
            const keywordWords = keyword.split(' ');
            return keywordWords.every(word => normalizedDescription.includes(word));
          }
          
          return false;
        });
        
        if (foundKeyword) {
          // Prioritize by priority number (lower number = higher priority)
          // Also prioritize longer keywords over shorter ones to avoid partial matches
          const currentPriority = mapping.priority;
          const keywordLength = foundKeyword.length;
          
          if (currentPriority < bestPriority || 
              (currentPriority === bestPriority && keywordLength > (matchedKeyword?.length || 0))) {
            matchedType = mapping;
            matchedKeyword = foundKeyword;
            bestPriority = currentPriority;
            console.log('✅ Found keyword match for transaction type:', foundKeyword, 'Type:', mapping.suggestedType, 'Priority:', mapping.priority, 'Length:', keywordLength);
          }
        }
      }

      if (!matchedType) {
        console.log('❌ No keyword transaction type match found for:', normalizedDescription);
        return null;
      }

      const suggestedType = matchedType.suggestedType;
      
      // Calculate confidence based on priority (higher priority = higher confidence)
      const confidence = Math.max(60, 100 - ((matchedType.priority - 1) * 10)); // 90% for priority 1, 80% for priority 2, etc.

      const reason = `Based on keyword "${matchedKeyword}" in description`;
      const detailedReason = `The description contains "${matchedKeyword}" which typically indicates a ${matchedType.reason}. This suggests the transaction type "${suggestedType}".`;

      console.log('✅ Transaction type suggestion found:', {
        suggestedType,
        confidence,
        reason,
        detailedReason
      });

      return {
        suggestedType,
        confidence,
        reason,
        detailedReason
      };
    } catch (error) {
      logError(`Failed to suggest transaction type for description: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      return null;
    }
  }

  async suggestDualSidesForDescription(
    description: string,
    userId: number,
    isVagueDescription: boolean = false
  ): Promise<DualSideSuggestion | null> {
    console.log(`🔍 DUAL-SIDE SUGGESTION START: "${description}"`);
    console.log(`📊 Vague description flag: ${isVagueDescription}`);
    
    const normalizedDescription = description.toLowerCase().trim();
    console.log(`🔄 Normalized description: "${normalizedDescription}"`);
    
    // Apply phrase normalization
    const normalizedPhrases = this.normalizePhrases(normalizedDescription);
    console.log(`📝 Normalized phrases:`, normalizedPhrases);
    
    // Parse transaction context
    const context = this.parseTransactionContext(normalizedDescription);
    console.log(`🎯 Transaction context:`, context);
    
    // Get all accounts for the user
    const accounts = await this.accountRepo.find({
      where: { user: { id: userId } },
      order: { updatedAt: 'DESC' }
    });
    console.log(`📋 Total accounts available: ${accounts.length}`);
    
    // Find matching accounts for both sides using different strategies
    const debitAccount = this.findMatchingAccount(accounts, [normalizedDescription], 'debit', context);
          const creditAccount = this.findPaymentAccount(accounts); // Use payment account logic for credit
    
    console.log(`💳 Debit account found:`, debitAccount ? `${debitAccount.name} (score: ${debitAccount.score})` : 'null');
    console.log(`💳 Credit account found:`, creditAccount ? `${creditAccount.name} (score: ${creditAccount.score})` : 'null');
    
    if (!debitAccount || !creditAccount) {
      console.log(`❌ Missing debit or credit account - returning null`);
      return null;
    }
    
    // Validate the account pair
    const pairValidation = this.validateAccountPair(debitAccount, creditAccount);
    console.log(`🔗 Pair validation:`, pairValidation);
    
    // Calculate overall confidence
    const confidenceResult = this.calculatePairConfidence(
      { account: { id: debitAccount.id, name: debitAccount.name, type: debitAccount.type } as Account, score: debitAccount.score },
      { account: { id: creditAccount.id, name: creditAccount.name, type: creditAccount.type } as Account, score: creditAccount.score },
      context,
      pairValidation
    );
    
    console.log(`📊 Overall confidence: ${confidenceResult.overallConfidence}%`);
    console.log(`📊 Individual scores - Debit: ${debitAccount.score}, Credit: ${creditAccount.score}`);
    console.log(`📊 Context alignment: ${context.direction}, Pair validation: ${pairValidation.score}`);
    
    // Apply higher threshold for vague descriptions
    const confidenceThreshold = isVagueDescription ? 80 : 60;
    console.log(`🎯 Confidence threshold: ${confidenceThreshold}% (vague: ${isVagueDescription})`);
    
    if (confidenceResult.overallConfidence < confidenceThreshold) {
      console.log(`❌ Confidence too low - returning null`);
      return null;
    }
    
    const suggestion: DualSideSuggestion = {
      debitAccount: {
        id: debitAccount.id,
        name: debitAccount.name,
        type: debitAccount.type,
        score: debitAccount.score,
        reason: debitAccount.reason
      },
      creditAccount: {
        id: creditAccount.id,
        name: creditAccount.name,
        type: creditAccount.type,
        score: creditAccount.score,
        reason: creditAccount.reason
      },
      overallConfidence: confidenceResult.overallConfidence,
      pairValidation: pairValidation.reason,
      context: context.direction
    };
    
    console.log(`✅ DUAL-SIDE SUGGESTION COMPLETE:`, {
      debit: suggestion.debitAccount.name,
      credit: suggestion.creditAccount.name,
      confidence: suggestion.overallConfidence
    });
    
    return suggestion;
  }

  private findMatchingAccount(
    accounts: Account[],
    normalizedPhrases: string[],
    side: 'debit' | 'credit',
    context: TransactionContext
  ): { id: number; name: string; type: string; score: number; reason: string } | null {
    console.log(`\n🔍 Finding ${side} account...`);
    console.log(`📝 Phrases to match:`, normalizedPhrases);
    
    let bestMatch: { account: Account; score: number; reason: string } | null = null;
    
    for (const account of accounts) {
      console.log(`\n📋 Checking account: "${account.name}" (${account.type})`);
      
      let score = 0;
      let reason = '';
      
      // Check each pattern - using the existing keyword matching logic
      const keywordSuggestion = this.findKeywordSuggestion(normalizedPhrases[0], account);
      if (keywordSuggestion) {
        score = keywordSuggestion.score;
        reason = keywordSuggestion.reason;
        console.log(`    ✅ Keyword match: ${score} points. Reason: ${reason}`);
      }
      
      // Apply context alignment bonus
      if (context.direction !== 'neutral') {
        const contextBonus = this.calculateContextBonus(account.type, context.direction, side);
        console.log(`    🎯 Context bonus: ${contextBonus}`);
        score += contextBonus;
      }
      
      console.log(`    📊 Final score for "${account.name}": ${score}`);
      
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { account, score, reason };
        console.log(`    🏆 New best match: "${account.name}" with score ${score}`);
      }
    }
    
    if (bestMatch) {
      console.log(`\n✅ Best ${side} match: "${bestMatch.account.name}" (score: ${bestMatch.score})`);
      return {
        id: bestMatch.account.id,
        name: bestMatch.account.name,
        type: bestMatch.account.type,
        score: bestMatch.score,
        reason: bestMatch.reason
      };
    }
    
    console.log(`\n❌ No ${side} match found`);
    return null;
  }

  private findPaymentAccount(
    accounts: Account[]
  ): { id: number; name: string; type: string; score: number; reason: string } | null {
    console.log(`\n🔍 Finding payment account for credit side...`);
    
    let bestMatch: { account: Account; score: number; reason: string } | null = null;
    
    // Define payment account types and keywords
    const paymentAccounts = [
      { type: 'ASSET', keywords: ['cash', 'checking', 'savings', 'petty cash', 'undeposited funds'] },
      { type: 'LIABILITY', keywords: ['credit card', 'accounts payable', 'loan payable'] }
    ];
    
    for (const account of accounts) {
      console.log(`\n📋 Checking payment account: "${account.name}" (${account.type})`);
      
      let score = 0;
      let reason = '';
      
      // Check if this is a payment account type
      const paymentType = paymentAccounts.find(pa => pa.type === account.type);
      if (paymentType) {
        // Check for keyword matches in account name
        const accountNameLower = account.name.toLowerCase();
        for (const keyword of paymentType.keywords) {
          if (accountNameLower.includes(keyword)) {
            score = 80; // High score for payment accounts
            reason = `Payment account: ${account.name}`;
            console.log(`    ✅ Payment account match: ${score} points. Reason: ${reason}`);
            break;
          }
        }
        
        // If no keyword match but it's the right type, give a lower score
        if (score === 0) {
          score = 40; // Medium score for payment account types
          reason = `Payment account type: ${account.type}`;
          console.log(`    🎯 Payment account type match: ${score} points. Reason: ${reason}`);
        }
      }
      
      console.log(`    📊 Final score for "${account.name}": ${score}`);
      
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { account, score, reason };
        console.log(`    🏆 New best payment match: "${account.name}" with score ${score}`);
      }
    }
    
    if (bestMatch) {
      console.log(`\n✅ Best payment account: "${bestMatch.account.name}" (score: ${bestMatch.score})`);
      return {
        id: bestMatch.account.id,
        name: bestMatch.account.name,
        type: bestMatch.account.type,
        score: bestMatch.score,
        reason: bestMatch.reason
      };
    }
    
    console.log(`\n❌ No payment account found`);
    return null;
  }

  private findKeywordSuggestion(description: string, account: Account): { score: number; reason: string } | null {
    // Use existing keyword matching logic
    const score = this.scoreKeywordMatch(account.name, [description], []);
    if (score > 0) {
      return {
        score,
        reason: `Matched keyword: ${description}`
      };
    }
    return null;
  }

  private calculateContextBonus(accountType: string, direction: string, side: string): number {
    if (direction === 'incoming' && accountType === 'INCOME' && side === 'credit') {
      return 15;
    } else if (direction === 'outgoing' && accountType === 'EXPENSE' && side === 'debit') {
      return 15;
    }
    return 0;
  }

  private scoreKeywordMatch(accountName: string, keywords: string[], exclusions: string[]): number {
    const accountNameLower = accountName.toLowerCase();
    console.log(`    🔍 Scoring "${accountName}" against keywords: [${keywords.join(', ')}]`);
    console.log(`    🚫 Exclusions: [${exclusions.join(', ')}]`);
    
    let score = 0;
    
    // Check exclusions first
    for (const exclusion of exclusions) {
      if (accountNameLower.includes(exclusion.toLowerCase())) {
        console.log(`    ❌ Account contains excluded term "${exclusion}" - applying heavy penalty`);
        score -= 50;
        break;
      }
    }
    
    // Check each keyword
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      console.log(`    🔍 Checking keyword: "${keyword}"`);
      
      // Exact match (highest score)
      if (accountNameLower === keywordLower) {
        console.log(`    ✅ Exact match: +100 points`);
        score += 100;
        continue;
      }
      
      // Word boundary match
      const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i');
      if (wordBoundaryRegex.test(accountNameLower)) {
        console.log(`    ✅ Word boundary match: +80 points`);
        score += 80;
        continue;
      }
      
      // Substring match (with false positive filtering)
      if (accountNameLower.includes(keywordLower)) {
        // Check for false positives
        const falsePositives: Record<string, string[]> = {
          'cash': ['cash flow', 'cash management', 'cash equivalent'],
          'loan': ['loan payable', 'loan receivable'],
          'tax': ['tax payable', 'tax receivable'],
          'interest': ['interest expense', 'interest income', 'interest payable', 'interest receivable']
        };
        
        const falsePositiveList = falsePositives[keywordLower] || [];
        const isFalsePositive = falsePositiveList.some((fp: string) => 
          accountNameLower.includes(fp.toLowerCase())
        );
        
        if (isFalsePositive) {
          console.log(`    ❌ False positive detected: "${accountName}" contains "${keyword}" but matches false positive pattern`);
          continue;
        }
        
        console.log(`    ✅ Substring match: +30 points`);
        score += 30;
      }
    }
    
    console.log(`    📊 Final keyword score: ${score}`);
    return score;
  }

  private async findUserPreference(description: string, userId: number): Promise<UserSuggestionPreference | null> {
    try {
      const normalizedDescription = this.normalizeDescription(description);
      
      // Find exact match first
      let preference = await this.userPreferenceRepo.findOne({
        where: { userId, description: normalizedDescription }
      });

      if (!preference) {
        // Find partial matches (fuzzy matching for user preferences)
        const preferences = await this.userPreferenceRepo.find({
          where: { userId }
        });

        // Find the best partial match
        preference = this.findBestPartialMatch(normalizedDescription, preferences);
      }

      return preference;
    } catch (error) {
      logError(`Failed to find user preference: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      return null;
    }
  }

  private findBestPartialMatch(description: string, preferences: UserSuggestionPreference[]): UserSuggestionPreference | null {
    // Simple partial matching - can be enhanced with fuzzy matching later
    const words = description.split(' ');
    
    let bestMatch = null;
    let bestScore = 0;

    for (const preference of preferences) {
      const prefWords = preference.description.split(' ');
      let score = 0;

      // Count matching words
      for (const word of words) {
        if (prefWords.some(prefWord => prefWord.includes(word) || word.includes(prefWord))) {
          score += 1;
        }
      }

      // Weight by usage count and recency
      const daysSinceLastUse = (Date.now() - new Date(preference.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
      const recencyBonus = Math.max(0, 30 - daysSinceLastUse) / 30; // Bonus for recent usage
      const usageBonus = Math.min(preference.usageCount / 10, 1); // Bonus for frequent usage

      const totalScore = score + recencyBonus + usageBonus;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMatch = preference;
      }
    }

    return bestScore > 0.5 ? bestMatch : null; // Only return if score is reasonable
  }

  private async createSuggestionFromPreference(preference: UserSuggestionPreference): Promise<{
    suggestedAccountId: number;
    suggestedAccountName: string;
    reason: string;
    accountType: string;
    confidence: number;
    suggestedEntryType: 'DEBIT' | 'CREDIT';
    detailedReason: string;
  }> {
    // Get account details
    const account = await this.accountRepo.findOne({ where: { id: preference.accountId } });
    if (!account) {
      throw new Error('Account not found for preference');
    }

    // Determine entry type based on account type
    let suggestedEntryType: 'DEBIT' | 'CREDIT';
    switch (account.type) {
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

    const confidence = Math.min(95, 70 + (preference.usageCount * 2)); // Higher confidence for frequently used preferences

    return {
      suggestedAccountId: preference.accountId,
      suggestedAccountName: preference.accountName,
      reason: `Based on your previous choice for "${preference.description}"`,
      accountType: account.type,
      confidence: confidence,
      suggestedEntryType: suggestedEntryType,
      detailedReason: `You previously used ${preference.accountName} for similar transactions (used ${preference.usageCount} times)`
    };
  }

  private normalizeDescription(description: string): string {
    return description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Enhanced phrase normalization with synonyms
  private normalizePhrases(description: string): string {
    const synonyms = {
      // Purchase variations
      'bought': 'purchase',
      'purchased': 'purchase',
      'bought a': 'purchase',
      'paid for': 'purchase',
      'spent on': 'purchase',
      
      // Equity variations
      'initial contribution': 'owner contribution',
      'capital contribution': 'owner contribution',
      'equity contribution': 'owner contribution',
      'owner investment': 'owner contribution',
      'equity injection': 'owner contribution',
      'personal funds': 'owner contribution',
      
      // Draw variations
      'owner draw': 'owner withdrawal',
      'partner draw': 'owner withdrawal',
      'owner withdrawal': 'owner withdrawal',
      'personal use': 'owner withdrawal',
      'drawing': 'owner withdrawal',
      
      // Payment variations
      'loan payment': 'debt payment',
      'mortgage payment': 'debt payment',
      'credit card payment': 'debt payment',
      'principal payment': 'debt payment',
      
      // Equipment variations
      'equipment purchase': 'asset purchase',
      'machinery purchase': 'asset purchase',
      'computer purchase': 'asset purchase',
      'furniture purchase': 'asset purchase',
      'laptop purchase': 'asset purchase',
      'laptop computer': 'asset purchase',
      'computer equipment': 'asset purchase'
    };
    
    let normalized = description.toLowerCase();
    
    // Apply synonyms
    Object.entries(synonyms).forEach(([original, replacement]) => {
      normalized = normalized.replace(new RegExp(original, 'gi'), replacement);
    });
    
    // Clean up extra spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  // Context-aware description parsing for directionality
  private parseTransactionContext(description: string): TransactionContext {
    const normalizedDesc = description.toLowerCase();
    
    const outgoingVerbs = [
      'paid', 'bought', 'purchased', 'spent', 'withdrew', 'distributed',
      'purchased', 'bought', 'paid for', 'spent on', 'invested in',
      'withdrew', 'drew', 'took', 'removed', 'transferred out'
    ];
    
    const incomingVerbs = [
      'received', 'sold', 'earned', 'collected', 'deposited', 'invested',
      'received', 'got', 'obtained', 'acquired', 'gained', 'won',
      'refunded', 'reimbursed', 'returned', 'credited'
    ];
    
    const outgoingWords = outgoingVerbs.filter(verb => 
      normalizedDesc.includes(verb)
    );
    
    const incomingWords = incomingVerbs.filter(verb => 
      normalizedDesc.includes(verb)
    );
    
    let direction: 'incoming' | 'outgoing' | 'neutral' = 'neutral';
    let context = '';
    let alignment = 0;
    
    if (outgoingWords.length > incomingWords.length) {
      direction = 'outgoing';
      context = `Outgoing transaction (${outgoingWords[0]})`;
      alignment = 10;
    } else if (incomingWords.length > outgoingWords.length) {
      direction = 'incoming';
      context = `Incoming transaction (${incomingWords[0]})`;
      alignment = 10;
    } else {
      // Check for other context clues
      if (normalizedDesc.includes('contribution') || normalizedDesc.includes('investment')) {
        direction = 'incoming';
        context = 'Capital contribution/investment';
        alignment = 15;
      } else if (normalizedDesc.includes('draw') || normalizedDesc.includes('withdrawal')) {
        direction = 'outgoing';
        context = 'Owner withdrawal/draw';
        alignment = 15;
      } else if (normalizedDesc.includes('payment') && normalizedDesc.includes('received')) {
        direction = 'incoming';
        context = 'Payment received';
        alignment = 10;
      } else if (normalizedDesc.includes('payment') && normalizedDesc.includes('made')) {
        direction = 'outgoing';
        context = 'Payment made';
        alignment = 10;
      }
    }
    
    return {
      direction,
      verbs: [...outgoingWords, ...incomingWords],
      context,
      alignment
    };
  }

  // Pair compatibility validation
  private validateAccountPair(debitAccount: { id: number; name: string; type: string; score: number; reason: string }, creditAccount: { id: number; name: string; type: string; score: number; reason: string }): {
    isValid: boolean;
    score: number;
    reason: string;
  } {
    // Valid account type pairs for business transactions
    const validPairs: Record<string, string[]> = {
      'ASSET': ['LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'],
      'LIABILITY': ['ASSET', 'EXPENSE'],
      'EQUITY': ['ASSET', 'EXPENSE'],
      'INCOME': ['ASSET', 'LIABILITY'],
      'EXPENSE': ['ASSET', 'LIABILITY', 'EQUITY']
    };
    
    const isValidPair = validPairs[debitAccount.type]?.includes(creditAccount.type);
    
    if (!isValidPair) {
      return {
        isValid: false,
        score: 0,
        reason: `Invalid pair: ${debitAccount.type} ↔ ${creditAccount.type}`
      };
    }
    
    // Additional logical checks
    const logicalChecks = [
      // Can't have two income accounts
      {
        condition: debitAccount.type === 'INCOME' && creditAccount.type === 'INCOME',
        valid: false,
        reason: 'Cannot debit and credit income accounts in same entry'
      },
      // Can't have two expense accounts (unless adjusting entry)
      {
        condition: debitAccount.type === 'EXPENSE' && creditAccount.type === 'EXPENSE',
        valid: false,
        reason: 'Cannot debit and credit expense accounts in same entry'
      }
    ];
    
    for (const check of logicalChecks) {
      if (check.condition) {
        return {
          isValid: false,
          score: 0,
          reason: check.reason
        };
      }
    }
    
    return {
      isValid: true,
      score: 100,
      reason: `Valid pair: ${debitAccount.type} ↔ ${creditAccount.type}`
    };
  }

  private async findKeywordSuggestionForUser(normalizedDescription: string, userId: number): Promise<{
    suggestedAccountId: number;
    suggestedAccountName: string;
    reason: string;
    accountType: string;
    confidence: number;
    suggestedEntryType: 'DEBIT' | 'CREDIT';
    detailedReason: string;
  } | null> {
    try {
      // Get user's accounts
      const userAccounts = await this.accountRepo.find({
        where: { user: { id: userId } },
        order: { updatedAt: 'DESC' }
      });

      console.log('📊 [Fallback] Found user accounts:', userAccounts.length, userAccounts.map(acc => acc.name));
      console.log('🔍 [Fallback] Searching for keyword match in description:', normalizedDescription);
      
      // Simple keyword matching for now
      let bestMatch = null;
      let bestScore = 0;
      
      for (const account of userAccounts) {
        const score = this.scoreKeywordMatch(account.name, [normalizedDescription], []);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = account;
        }
      }
      
      if (!bestMatch || bestScore < 30) {
        return null;
      }
      
      // Determine entry type based on account type
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
      
      return {
        suggestedAccountId: bestMatch.id,
        suggestedAccountName: bestMatch.name,
        reason: `Matched keyword: ${normalizedDescription}`,
        accountType: bestMatch.type,
        confidence: Math.min(100, bestScore),
        suggestedEntryType,
        detailedReason: `Matched keyword "${normalizedDescription}" to account "${bestMatch.name}"`
      };
      
    } catch (error) {
      logError(`Failed to find keyword suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      return null;
    }
  }

  // Deterministic confidence composer
  private calculatePairConfidence(
    debitMatch: any,
    creditMatch: any,
    context: any,
    pairValidation: any
  ): {
    overallConfidence: number;
    debitConfidence: number;
    creditConfidence: number;
    pairScore: number;
    reason: string;
  } {
    const debitConfidence = debitMatch ? Math.min(100, debitMatch.score) : 0;
    const creditConfidence = creditMatch ? Math.min(100, creditMatch.score) : 0;
    const pairScore = pairValidation.score;
    
    // Base confidence is average of individual scores
    let baseConfidence = (debitConfidence + creditConfidence) / 2;
    
    // Adjust for context alignment
    let contextBonus = 0;
    if (context.direction === 'incoming' && creditMatch?.account.type === 'INCOME') {
      contextBonus += 10;
    } else if (context.direction === 'outgoing' && debitMatch?.account.type === 'EXPENSE') {
      contextBonus += 10;
    }
    
    // Adjust for pair validation
    let pairBonus = 0;
    if (pairValidation.isValid) {
      pairBonus += 15;
    }
    
    // Penalize if one side is missing
    if (!debitMatch || !creditMatch) {
      baseConfidence *= 0.5;
    }
    
    const overallConfidence = Math.min(100, Math.round(baseConfidence + contextBonus + pairBonus));
    
    // Build reason string
    const reasons = [];
    if (debitMatch) reasons.push(`DR: ${debitMatch.account.name} (${debitConfidence}%)`);
    if (creditMatch) reasons.push(`CR: ${creditMatch.account.name} (${creditConfidence}%)`);
    if (context.context) reasons.push(context.context);
    if (pairValidation.reason) reasons.push(pairValidation.reason);
    
    return {
      overallConfidence,
      debitConfidence,
      creditConfidence,
      pairScore,
      reason: reasons.join('; ')
    };
  }

} 