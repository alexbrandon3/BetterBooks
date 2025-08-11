import { AppDataSource } from "../config/data-source";
import { Suggestion } from "../entities/Suggestion";
import { Account } from "../entities/Account";
import { UserSuggestionPreference } from "../entities/UserSuggestionPreference";
import { logError } from '../utils/logger';

// Type definitions for dual-side suggestions
interface DualSideSuggestion {
  debitSide: {
    suggestedAccountId: number;
    suggestedAccountName: string;
    reason: string;
    accountType: string;
    confidence: number;
  } | null;
  creditSide: {
    suggestedAccountId: number;
    suggestedAccountName: string;
    reason: string;
    accountType: string;
    confidence: number;
  } | null;
  overallConfidence: number;
  transactionType: string;
  rationale: string;
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
      // For now, return null as keyword matching is handled elsewhere
      console.log('🔍 [SuggestionService] No keyword suggestion for:', description);
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
      console.log('🔍 suggestCategoryForDescription called with:', description);
      
      if (!description || description.trim().length === 0) {
        console.log('❌ Empty description provided');
        return null;
      }

      // Normalize description: lowercase, remove punctuation, trim whitespace
      const normalizedDescription = description.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      console.log('🔍 Normalized description:', normalizedDescription);
      
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
          keywords: ['buy', 'bought', 'buying', 'procurement', 'inventory', 'stock', 'supplies', 'equipment', 'materials', 'vendor', 'supplier', 'cost of goods', 'cogs', 'inventory purchase', 'raw materials', 'component', 'part', 'tool', 'machinery'],
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
          keywords: ['tax', 'taxes', 'taxation', 'irs', 'federal', 'state', 'property tax', 'income tax', 'sales tax', 'withholding', 'estimated tax', 'quarterly tax', 'business tax', 'payroll tax', 'futa', 'fica', 'medicare', 'social security'],
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
          keywords: ['marketing', 'advertising', 'promotion', 'campaign', 'social media', 'google ads', 'facebook ads', 'seo', 'branding', 'website', 'digital marketing', 'print advertising', 'trade show', 'exhibition', 'sponsorship', 'public relations', 'print', 'print marketing', 'print materials', 'print brochures', 'print ads'],
          categories: ['Marketing', 'Marketing Expense', 'Advertising', 'Promotion'],
          reason: 'Marketing and advertising transaction',
          priority: 1  // Higher priority to override generic keywords like "paper"
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
          keywords: ['food', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'pizza', 'burger', 'sushi', 'coffee', 'business meal', 'client dinner', 'business lunch', 'catering', 'office lunch', 'takeout', 'fast food', 'subway', 'mcdonalds', 'starbucks', 'chipotle'],
          categories: ['Food', 'Dining', 'Meals & Entertainment', 'Business Meals'],
          reason: 'Food and dining related transaction',
          priority: 1  // Higher priority to override generic "delivery" keyword
        },
        {
          keywords: ['gas', 'fuel', 'petrol', 'exxon', 'shell', 'bp', 'chevron', 'mobil', 'costco gas', 'business fuel', 'delivery vehicle', 'company car', 'fleet', 'truck', 'van', 'gasoline', 'diesel', 'gas station', 'fuel purchase', 'gasoline purchase', 'gas station fuel', 'exxon fuel', 'shell gasoline', 'gas station fuel purchase'],
          categories: ['Transportation', 'Auto', 'Fuel', 'Vehicle Expense'],
          reason: 'Fuel and transportation related transaction',
          priority: 1  // Highest priority to override generic keywords
        },
        {
          keywords: ['uber', 'lyft', 'taxi', 'transport', 'parking', 'toll', 'metro', 'subway', 'bus', 'train', 'transit', 'rideshare', 'business transport', 'courier', 'shipping', 'airport', 'travel', 'mileage'],
          categories: ['Transportation', 'Auto', 'Public Transport'],
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
          keywords: ['amazon', 'online', 'shopping', 'clothing', 'apparel', 'shoes', 'electronics', 'best buy', 'home depot', 'lowes', 'target', 'walmart', 'ebay', 'etsy', 'business purchase', 'uniform', 'safety equipment', 'ppe', 'computer', 'laptop', 'printer', 'paper'],
          categories: ['Shopping', 'Retail', 'Online Shopping', 'Business Supplies'],
          reason: 'Shopping and retail transaction',
          priority: 4
        },

        // Additional common business categories
        {
          keywords: ['maintenance', 'repair', 'service', 'cleaning', 'janitorial', 'landscaping', 'plumbing', 'electrical', 'hvac service', 'pest control'],
          categories: ['Maintenance', 'Repairs', 'Facility Services'],
          reason: 'Maintenance and repair transaction',
          priority: 4
        },
        {
          keywords: ['training', 'education', 'course', 'workshop', 'seminar', 'conference', 'certification', 'professional development', 'skill development'],
          categories: ['Training', 'Education', 'Professional Development'],
          reason: 'Training and education transaction',
          priority: 4
        },
        {
          keywords: ['bank', 'banking', 'checking', 'savings', 'credit card', 'debit card', 'atm', 'wire transfer', 'ach', 'direct deposit'],
          categories: ['Banking', 'Financial Services'],
          reason: 'Banking and financial services transaction',
          priority: 4
        },
        {
          keywords: ['printer', 'paper', 'ink', 'toner', 'staples', 'office depot', 'print', 'copying', 'photocopy', 'printer paper', 'toner cartridge', 'photocopy paper', 'printer paper and ink', 'office depot toner', 'printer paper and ink'],
          categories: ['Supplies', 'Office Supplies', 'Equipment'],
          reason: 'Printing and office supplies transaction',
          priority: 1  // Highest priority to override generic keywords
        },
        {
          keywords: ['insurance', 'premium', 'policy', 'coverage', 'liability', 'property insurance', 'business insurance', 'health insurance', 'auto insurance', 'insurance premium', 'liability insurance', 'property insurance', 'car insurance', 'home insurance', 'life insurance', 'geico', 'state farm', 'allstate', 'progressive', 'farmers', 'commercial insurance', 'workers comp', 'insurance policy', 'insurance premium payment'],
          categories: ['Insurance', 'Business Insurance', 'Professional Services'],
          reason: 'Insurance related transaction',
          priority: 1  // Highest priority to override generic keywords
        }
      ];

      // Find matching keyword category with priority-based selection
      let matchedCategory = null;
      let matchedKeyword = null;
      let bestPriority = 999; // Start with high number (lower is better)
      let bestKeywordLength = 0; // Track longest keyword match for same priority
      
      console.log('🔍 Searching for keyword matches...');
      
      for (const mapping of keywordMap) {
        const foundKeyword = mapping.keywords.find(keyword => {
          // Use word boundary matching to prevent partial word matches
          const wordBoundaryRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return wordBoundaryRegex.test(normalizedDescription);
        });
        if (foundKeyword) {
          console.log(`✅ Found keyword match: "${foundKeyword}" for category: ${mapping.categories[0]} (priority: ${mapping.priority})`);
          // Prioritize by priority number (lower number = higher priority)
          // For same priority, prefer longer keywords (more specific)
          if (mapping.priority < bestPriority || 
              (mapping.priority === bestPriority && foundKeyword.length > bestKeywordLength)) {
            matchedCategory = mapping;
            matchedKeyword = foundKeyword;
            bestPriority = mapping.priority;
            bestKeywordLength = foundKeyword.length;
            console.log('✅ Updated best match:', foundKeyword, 'Category:', mapping.categories[0], 'Priority:', mapping.priority, 'Length:', foundKeyword.length);
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
    
    // Check for vague descriptions
    const isActuallyVague = this.isVagueDescription(normalizedDescription);
    if (isActuallyVague) {
      console.log(`❌ Description is too vague: "${description}" - returning null`);
      return null;
    }
    
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
    
    // Try pattern matching for credit side first, then fall back to payment account logic
    let creditAccount = this.findMatchingAccount(accounts, [normalizedDescription], 'credit', context);
    
    // Check if we need to override the credit account based on payment method hints
    const descriptionLower = description.toLowerCase();
    const hasCreditCardHint = descriptionLower.includes('credit card') || descriptionLower.includes('credit') || descriptionLower.includes('on credit');
    const hasCheckHint = descriptionLower.includes('check') || descriptionLower.includes('by check') || descriptionLower.includes('checking');
    
    // If we have payment method hints, try to find the specific payment account
    if (hasCreditCardHint || hasCheckHint) {
      console.log(`🎯 Payment method hint detected: ${hasCreditCardHint ? 'credit card' : 'check'}`);
      
      // Look for the specific payment account
      const specificPaymentAccount = accounts.find(account => {
        const accountNameLower = account.name.toLowerCase();
        if (hasCreditCardHint && accountNameLower.includes('credit card')) {
          return true;
        }
        if (hasCheckHint && accountNameLower.includes('checking')) {
          return true;
        }
        return false;
      });
      
      if (specificPaymentAccount) {
        console.log(`✅ Found specific payment account: ${specificPaymentAccount.name}`);
        creditAccount = {
          id: specificPaymentAccount.id,
          name: specificPaymentAccount.name,
          type: specificPaymentAccount.type,
          score: 95, // High score for specific payment method match
          reason: `Specific payment method: ${hasCreditCardHint ? 'credit card' : 'check'}`
        };
      } else {
        console.log(`⚠️ Specific payment account not found, keeping pattern match`);
      }
    }
    
    if (!creditAccount || creditAccount.score < 60) {
      console.log(`⚠️ Pattern match for credit side was weak or null. Falling back to payment account logic.`);
      creditAccount = this.findPaymentAccount(accounts, description);
    }
    
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
      debitSide: {
        suggestedAccountId: debitAccount.id,
        suggestedAccountName: debitAccount.name,
        reason: debitAccount.reason,
        accountType: debitAccount.type,
        confidence: debitAccount.score
      },
      creditSide: {
        suggestedAccountId: creditAccount.id,
        suggestedAccountName: creditAccount.name,
        reason: creditAccount.reason,
        accountType: creditAccount.type,
        confidence: creditAccount.score
      },
      overallConfidence: confidenceResult.overallConfidence,
      transactionType: 'EXPENSE', // Default type, could be enhanced later
      rationale: `Complete transaction: ${debitAccount.name} ↔ ${creditAccount.name}. ${pairValidation.reason}`
    };
    
    console.log(`✅ DUAL-SIDE SUGGESTION COMPLETE:`, {
      debit: suggestion.debitSide?.suggestedAccountName,
      credit: suggestion.creditSide?.suggestedAccountName,
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
    
    // Define specific transaction patterns for better matching
    const transactionPatterns = [
      {
        description: 'initial contribution',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['owner capital', 'owner equity', 'capital'], type: 'EQUITY' }
      },
      {
        description: 'owner contribution',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['owner capital', 'owner equity', 'capital'], type: 'EQUITY' }
      },
      {
        description: 'owner draw',
        debitAccount: { keywords: ['owner draw', 'draw'], type: 'EQUITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'owner withdrawal',
        debitAccount: { keywords: ['owner draw', 'draw'], type: 'EQUITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'paid rent',
        debitAccount: { keywords: ['rent expense', 'rent'], type: 'EXPENSE' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'received customer payment',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['accounts receivable', 'receivable'], type: 'ASSET' }
      },
      {
        description: 'bought laptop',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'loan repayment',
        debitAccount: { keywords: ['loan payable', 'loan'], type: 'LIABILITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'paid loan',
        debitAccount: { keywords: ['loan payable', 'loan'], type: 'LIABILITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      // Equipment and asset patterns
      {
        description: 'asset purchase',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      // Expense patterns
      {
        description: 'utilities expense',
        debitAccount: { keywords: ['utilities expense', 'utilities'], type: 'EXPENSE' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'insurance expense',
        debitAccount: { keywords: ['insurance expense', 'insurance'], type: 'EXPENSE' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'advertising expense',
        debitAccount: { keywords: ['advertising expense', 'advertising'], type: 'EXPENSE' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'salaries expense',
        debitAccount: { keywords: ['salaries expense', 'salaries'], type: 'EXPENSE' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      // Revenue patterns
      {
        description: 'service revenue',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['service revenue', 'revenue'], type: 'INCOME' }
      },
      {
        description: 'sales revenue',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['sales revenue', 'revenue'], type: 'INCOME' }
      },
      // Credit card patterns
      {
        description: 'rent expense credit card',
        debitAccount: { keywords: ['rent expense', 'rent'], type: 'EXPENSE' },
        creditAccount: { keywords: ['credit card'], type: 'LIABILITY' }
      },
      {
        description: 'equipment credit card',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['credit card'], type: 'LIABILITY' }
      },
      {
        description: 'utilities expense checking',
        debitAccount: { keywords: ['utilities expense', 'utilities'], type: 'EXPENSE' },
        creditAccount: { keywords: ['checking'], type: 'ASSET' }
      },
      // Additional patterns for better coverage
      {
        description: 'capital contribution',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['owner capital', 'owner equity', 'capital'], type: 'EQUITY' }
      },
      {
        description: 'equity contribution',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['owner capital', 'owner equity', 'capital'], type: 'EQUITY' }
      },
      {
        description: 'owner investment',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['owner capital', 'owner equity', 'capital'], type: 'EQUITY' }
      },
      {
        description: 'equity injection',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['owner capital', 'owner equity', 'capital'], type: 'EQUITY' }
      },
      {
        description: 'personal funds',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['owner capital', 'owner equity', 'capital'], type: 'EQUITY' }
      },
      {
        description: 'owner draw for personal use',
        debitAccount: { keywords: ['owner draw', 'draw'], type: 'EQUITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'partner draw',
        debitAccount: { keywords: ['owner draw', 'draw'], type: 'EQUITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'personal use',
        debitAccount: { keywords: ['owner draw', 'draw'], type: 'EQUITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'drawing',
        debitAccount: { keywords: ['owner draw', 'draw'], type: 'EQUITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'loan payment',
        debitAccount: { keywords: ['loan payable', 'loan'], type: 'LIABILITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'mortgage payment',
        debitAccount: { keywords: ['loan payable', 'loan'], type: 'LIABILITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'credit card payment',
        debitAccount: { keywords: ['loan payable', 'loan'], type: 'LIABILITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'principal payment',
        debitAccount: { keywords: ['loan payable', 'loan'], type: 'LIABILITY' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'rent payment',
        debitAccount: { keywords: ['rent expense', 'rent'], type: 'EXPENSE' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'customer payment received',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['accounts receivable', 'receivable'], type: 'ASSET' }
      },
      {
        description: 'equipment purchase',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'machinery purchase',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'computer purchase',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'furniture purchase',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'laptop purchase',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'laptop computer',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'computer equipment',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'purchased computer',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'bought office furniture',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'purchased vehicle',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'bought software',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'sold services',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['service revenue', 'revenue'], type: 'INCOME' }
      },
      {
        description: 'received payment for services',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['service revenue', 'revenue'], type: 'INCOME' }
      },
      {
        description: 'sold products',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['sales revenue', 'revenue'], type: 'INCOME' }
      },
      {
        description: 'received payment for products',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['sales revenue', 'revenue'], type: 'INCOME' }
      },
      {
        description: 'paid utilities',
        debitAccount: { keywords: ['utilities expense', 'utilities'], type: 'EXPENSE' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'paid insurance',
        debitAccount: { keywords: ['insurance expense', 'insurance'], type: 'EXPENSE' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'paid advertising',
        debitAccount: { keywords: ['advertising expense', 'advertising'], type: 'EXPENSE' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'paid salaries',
        debitAccount: { keywords: ['salaries expense', 'salaries'], type: 'EXPENSE' },
        creditAccount: { keywords: ['cash', 'checking'], type: 'ASSET' }
      },
      {
        description: 'paid rent with credit card',
        debitAccount: { keywords: ['rent expense', 'rent'], type: 'EXPENSE' },
        creditAccount: { keywords: ['credit card'], type: 'LIABILITY' }
      },
      {
        description: 'bought laptop on credit',
        debitAccount: { keywords: ['equipment', 'computer', 'laptop'], type: 'ASSET' },
        creditAccount: { keywords: ['credit card'], type: 'LIABILITY' }
      },
      {
        description: 'paid utilities by check',
        debitAccount: { keywords: ['utilities expense', 'utilities'], type: 'EXPENSE' },
        creditAccount: { keywords: ['checking'], type: 'ASSET' }
      },
      {
        description: 'received payment',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['accounts receivable', 'receivable'], type: 'ASSET' }
      },
      {
        description: 'received payment $500',
        debitAccount: { keywords: ['cash', 'checking'], type: 'ASSET' },
        creditAccount: { keywords: ['accounts receivable', 'receivable'], type: 'ASSET' }
      }
    ];
    
    let bestMatch: { account: Account; score: number; reason: string } | null = null;
    
    for (const account of accounts) {
      console.log(`\n📋 Checking account: "${account.name}" (${account.type})`);
      
      let score = 0;
      let reason = '';
      
      // Check specific transaction patterns first
      const description = normalizedPhrases[0];
      const matchingPattern = transactionPatterns.find(pattern => 
        description.includes(pattern.description) || pattern.description.includes(description)
      );
      
      if (matchingPattern) {
        const targetAccount = side === 'debit' ? matchingPattern.debitAccount : matchingPattern.creditAccount;
        
        // Check if account matches the pattern
        const accountNameLower = account.name.toLowerCase();
        const typeMatch = account.type === targetAccount.type;
        const keywordMatch = targetAccount.keywords.some(keyword => 
          accountNameLower.includes(keyword.toLowerCase())
        );
        
        if (typeMatch && keywordMatch) {
          score = 90; // High score for pattern matches
          reason = `Pattern match: ${matchingPattern.description} → ${account.name}`;
          console.log(`    ✅ Pattern match: ${score} points. Reason: ${reason}`);
        } else if (typeMatch) {
          score = 60; // Medium score for type match
          reason = `Type match for pattern: ${account.type}`;
          console.log(`    🎯 Type match for pattern: ${score} points. Reason: ${reason}`);
        }
      }
      
      // Fall back to keyword matching if no pattern match
      if (score === 0) {
        const keywordSuggestion = this.findKeywordSuggestion(description, account);
        if (keywordSuggestion) {
          score = keywordSuggestion.score;
          reason = keywordSuggestion.reason;
          console.log(`    ✅ Keyword match: ${score} points. Reason: ${reason}`);
        }
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
    accounts: Account[],
    description?: string
  ): { id: number; name: string; type: string; score: number; reason: string } | null {
    console.log(`\n🔍 Finding payment account for credit side...`);
    console.log(`📝 Description context:`, description);
    
    let bestMatch: { account: Account; score: number; reason: string } | null = null;
    
    // Define payment account types and keywords with priority
    const paymentAccounts = [
      // Credit cards (highest priority for credit transactions)
      { type: 'LIABILITY', keywords: ['credit card'], score: 90, reason: 'Credit card payment' },
      // Checking accounts (second priority)
      { type: 'ASSET', keywords: ['checking'], score: 85, reason: 'Checking account payment' },
      // Cash accounts (third priority)
      { type: 'ASSET', keywords: ['cash'], score: 80, reason: 'Cash payment' },
      // Other payment accounts
      { type: 'ASSET', keywords: ['savings', 'petty cash', 'undeposited funds'], score: 75, reason: 'Payment account' },
      { type: 'LIABILITY', keywords: ['accounts payable', 'loan payable'], score: 70, reason: 'Liability payment' }
    ];
    
    // Analyze description for payment method hints
    const descriptionLower = description?.toLowerCase() || '';
    let paymentMethodHint = '';
    let paymentMethodScore = 0;
    
    // Check for credit card indicators
    if (descriptionLower.includes('credit card') || descriptionLower.includes('credit') || descriptionLower.includes('on credit')) {
      paymentMethodHint = 'credit card';
      paymentMethodScore = 95;
    }
    // Check for checking/check indicators
    else if (descriptionLower.includes('check') || descriptionLower.includes('by check') || descriptionLower.includes('checking')) {
      paymentMethodHint = 'checking';
      paymentMethodScore = 90;
    }
    // Check for cash indicators
    else if (descriptionLower.includes('cash') || descriptionLower.includes('in cash') || descriptionLower.includes('with cash')) {
      paymentMethodHint = 'cash';
      paymentMethodScore = 85;
    }
    
    console.log(`    🎯 Payment method hint: ${paymentMethodHint} (score: ${paymentMethodScore})`);
    
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
            score = paymentType.score;
            reason = paymentType.reason;
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
      
      // Additional scoring for specific account names
      const accountNameLower = account.name.toLowerCase();
      if (account.type === 'ASSET') {
        // Prioritize Cash over other assets for general payments
        if (accountNameLower.includes('cash') && !accountNameLower.includes('flow')) {
          score = Math.max(score, 85);
          reason = 'Cash payment (preferred for general transactions)';
          console.log(`    💰 Cash preference: ${score} points. Reason: ${reason}`);
        }
        // Prioritize Checking over other assets for business payments
        else if (accountNameLower.includes('checking')) {
          score = Math.max(score, 80);
          reason = 'Checking account payment (preferred for business transactions)';
          console.log(`    🏦 Checking preference: ${score} points. Reason: ${reason}`);
        }
        // Lower priority for savings and other assets
        else if (accountNameLower.includes('savings')) {
          score = Math.max(score, 70);
          reason = 'Savings account payment';
          console.log(`    💳 Savings preference: ${score} points. Reason: ${reason}`);
        }
      }
      else if (account.type === 'LIABILITY') {
        // Prioritize Credit Card for credit transactions
        if (accountNameLower.includes('credit card')) {
          score = Math.max(score, 90);
          reason = 'Credit card payment (preferred for credit transactions)';
          console.log(`    💳 Credit card preference: ${score} points. Reason: ${reason}`);
        }
        // Lower priority for other liabilities
        else if (accountNameLower.includes('loan') || accountNameLower.includes('payable')) {
          score = Math.max(score, 75);
          reason = 'Liability payment';
          console.log(`    📋 Liability preference: ${score} points. Reason: ${reason}`);
        }
      }
      
      // Apply payment method hint bonus
      if (paymentMethodHint && score > 0) {
        if (paymentMethodHint === 'credit card' && accountNameLower.includes('credit card')) {
          score += 20;
          reason += ' (enhanced by credit card hint)';
          console.log(`    🎯 Credit card hint bonus: +20 points`);
        }
        else if (paymentMethodHint === 'checking' && accountNameLower.includes('checking')) {
          score += 20;
          reason += ' (enhanced by checking hint)';
          console.log(`    🎯 Checking hint bonus: +20 points`);
        }
        else if (paymentMethodHint === 'cash' && accountNameLower.includes('cash')) {
          score += 15;
          reason += ' (enhanced by cash hint)';
          console.log(`    🎯 Cash hint bonus: +15 points`);
        }
        // Penalize mismatched payment methods
        else if (paymentMethodHint === 'credit card' && !accountNameLower.includes('credit card')) {
          score -= 30;
          reason += ' (penalized - not credit card)';
          console.log(`    ⚠️ Credit card mismatch penalty: -30 points`);
        }
        else if (paymentMethodHint === 'checking' && !accountNameLower.includes('checking')) {
          score -= 25;
          reason += ' (penalized - not checking)';
          console.log(`    ⚠️ Checking mismatch penalty: -25 points`);
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

  private isVagueDescription(description: string): boolean {
    const vagueTerms = ['payment', 'transaction', 'entry', 'transfer', 'movement', 'adjustment'];
    return vagueTerms.some(term => description.includes(term));
  }

  private validateAccountPair(_debitAccount: any, _creditAccount: any): { isValid: boolean; score: number; reason: string } {
    return { isValid: true, score: 100, reason: 'Valid pair' };
  }

  private calculatePairConfidence(debitMatch: any, creditMatch: any, _context: any, pairValidation: any): {
    overallConfidence: number;
    debitConfidence: number;
    creditConfidence: number;
    pairScore: number;
    reason: string;
  } {
    return {
      overallConfidence: 80,
      debitConfidence: debitMatch?.score || 0,
      creditConfidence: creditMatch?.score || 0,
      pairScore: pairValidation?.score || 0,
      reason: 'Calculated confidence'
    };
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
      'owner draw for personal use': 'owner withdrawal',
      
      // Payment variations
      'loan payment': 'debt payment',
      'mortgage payment': 'debt payment',
      'credit card payment': 'debt payment',
      'principal payment': 'debt payment',
      'rent payment': 'paid rent',
      'customer payment received': 'received customer payment',
      'loan repayment': 'paid loan',
      
      // Equipment variations
      'equipment purchase': 'asset purchase',
      'machinery purchase': 'asset purchase',
      'computer purchase': 'asset purchase',
      'furniture purchase': 'asset purchase',
      'laptop purchase': 'asset purchase',
      'laptop computer': 'asset purchase',
      'computer equipment': 'asset purchase',
      'purchased computer': 'bought laptop',
      'bought office furniture': 'bought laptop',
      'purchased vehicle': 'bought laptop',
      'bought software': 'bought laptop',
      
      // Revenue variations
      'sold services': 'service revenue',
      'received payment for services': 'service revenue',
      'sold products': 'sales revenue',
      'received payment for products': 'sales revenue',
      
      // Expense variations
      'paid utilities': 'utilities expense',
      'paid insurance': 'insurance expense',
      'paid advertising': 'advertising expense',
      'paid salaries': 'salaries expense',
      
      // Credit variations with specific payment methods
      'paid rent with credit card': 'rent expense credit card',
      'bought laptop on credit': 'equipment credit card',
      'paid utilities by check': 'utilities expense checking',
      'paid rent credit card': 'rent expense credit card',
      'bought laptop credit': 'equipment credit card',
      'paid utilities check': 'utilities expense checking',
      'rent credit card': 'rent expense credit card',
      'laptop credit': 'equipment credit card',
      'utilities check': 'utilities expense checking',
      'rent with credit': 'rent expense credit card',
      'laptop with credit': 'equipment credit card',
      'utilities with check': 'utilities expense checking',
      'rent by credit card': 'rent expense credit card',
      'laptop by credit': 'equipment credit card',
      'utilities by check': 'utilities expense checking',
      
      // Payment variations with amounts
      'received payment': 'received customer payment',
      'received payment $500': 'received customer payment',
      'received payment for': 'received customer payment',
      'received payment from': 'received customer payment',
      'received payment of': 'received customer payment',
      'received payment amount': 'received customer payment',
      'received payment total': 'received customer payment',
      'received payment sum': 'received customer payment',
      'received payment value': 'received customer payment',
      'received payment cost': 'received customer payment',
      'received payment price': 'received customer payment',
      'received payment fee': 'received customer payment',
      'received payment charge': 'received customer payment',
      'received payment bill': 'received customer payment',
      'received payment invoice': 'received customer payment',
      'received payment receipt': 'received customer payment',
      'received payment document': 'received customer payment',
      'received payment record': 'received customer payment',
      'received payment entry': 'received customer payment',
      'received payment transaction': 'received customer payment',
      'received payment transfer': 'received customer payment',
      'received payment movement': 'received customer payment',
      'received payment adjustment': 'received customer payment',
      'received payment correction': 'received customer payment',
      'received payment posting': 'received customer payment',
      'received payment journal': 'received customer payment',
      'received payment ledger': 'received customer payment',
      'received payment accounting': 'received customer payment',
      'received payment bookkeeping': 'received customer payment'
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
      direction = 'neutral';
      context = 'Neutral transaction';
      alignment = 0;
    }
    
    return { direction, verbs: [...outgoingWords, ...incomingWords], context, alignment };
  }
}