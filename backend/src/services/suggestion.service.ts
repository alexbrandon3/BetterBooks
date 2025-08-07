import { AppDataSource } from "../config/data-source";
import { Suggestion } from "../entities/Suggestion";
import { Account } from "../entities/Account";
import { UserSuggestionPreference } from "../entities/UserSuggestionPreference";
import { logError } from '../utils/logger';

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
      const keywordSuggestion = await this.findKeywordSuggestion(normalizedDescription, userId);
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

  async suggestDualSidesForDescription(description: string, userId: number): Promise<{
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
  } | null> {
    try {
      if (!description || description.trim().length === 0) {
        return null;
      }

      // Normalize description
      const normalizedDescription = description.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Get user's accounts
      const userAccounts = await this.accountRepo.find({
        where: { user: { id: userId } },
        order: { updatedAt: 'DESC' }
      });

      // Define common transaction patterns for small businesses
      const transactionPatterns = [
        // Equity Contributions
        {
          keywords: ['initial contribution', 'owner contribution', 'capital contribution', 'business formation', 'personal funds', 'equity investment', 'partner investment'],
          debitSide: { accountTypes: ['ASSET'], keywords: ['cash', 'bank', 'checking', 'savings'], reason: 'Cash received from owner' },
          creditSide: { accountTypes: ['EQUITY'], keywords: ['owner', 'capital', 'equity', 'contributed'], reason: 'Owner equity increased' },
          transactionType: 'EQUITY_CONTRIBUTION',
          rationale: 'Owner contributing personal funds to business',
          priority: 1
        },
        // Owner Draws/Distributions
        {
          keywords: ['owner draw', 'partner draw', 'owner withdrawal', 'distribution', 'draw', 'drawing', 'personal use'],
          debitSide: { accountTypes: ['EQUITY'], keywords: ['owner', 'draw', 'drawing', 'withdrawal'], reason: 'Owner equity decreased' },
          creditSide: { accountTypes: ['ASSET'], keywords: ['cash', 'bank', 'checking', 'savings'], reason: 'Cash paid to owner' },
          transactionType: 'EQUITY_WITHDRAWAL',
          rationale: 'Owner withdrawing funds from business',
          priority: 1
        },
        // Equipment Purchases
        {
          keywords: ['equipment purchase', 'machinery purchase', 'computer purchase', 'furniture purchase', 'asset purchase', 'capital expenditure'],
          debitSide: { accountTypes: ['ASSET'], keywords: ['equipment', 'machinery', 'computer', 'furniture', 'asset'], reason: 'Asset acquired' },
          creditSide: { accountTypes: ['ASSET'], keywords: ['cash', 'bank', 'checking', 'savings'], reason: 'Cash paid for asset' },
          transactionType: 'ASSET_PURCHASE',
          rationale: 'Business purchasing equipment or assets',
          priority: 2
        },
        // Loan Payments
        {
          keywords: ['loan payment', 'mortgage payment', 'debt payment', 'credit card payment', 'principal payment', 'interest payment'],
          debitSide: { accountTypes: ['LIABILITY'], keywords: ['loan', 'mortgage', 'debt', 'credit card', 'payable'], reason: 'Liability reduced' },
          creditSide: { accountTypes: ['ASSET'], keywords: ['cash', 'bank', 'checking', 'savings'], reason: 'Cash used to pay debt' },
          transactionType: 'LOAN_PAYMENT',
          rationale: 'Paying down business debt',
          priority: 2
        },
        // Sales/Revenue
        {
          keywords: ['sold', 'sale', 'sales', 'revenue', 'income', 'earnings', 'commission', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment received', 'customer payment', 'client payment'],
          debitSide: { accountTypes: ['ASSET'], keywords: ['cash', 'bank', 'checking', 'savings', 'accounts receivable'], reason: 'Cash received or receivable increased' },
          creditSide: { accountTypes: ['INCOME'], keywords: ['sales', 'revenue', 'income', 'service', 'product'], reason: 'Revenue recognized' },
          transactionType: 'INCOME',
          rationale: 'Business earning revenue',
          priority: 1
        },
        // Expense Purchases
        {
          keywords: ['purchase', 'buy', 'bought', 'buying', 'procurement', 'inventory', 'stock', 'supplies', 'equipment', 'materials', 'vendor', 'supplier', 'cost of goods', 'cogs'],
          debitSide: { accountTypes: ['EXPENSE', 'ASSET'], keywords: ['supplies', 'equipment', 'inventory', 'expense', 'cost'], reason: 'Expense or asset acquired' },
          creditSide: { accountTypes: ['ASSET'], keywords: ['cash', 'bank', 'checking', 'savings'], reason: 'Cash paid for expense' },
          transactionType: 'EXPENSE',
          rationale: 'Business purchasing goods or services',
          priority: 2
        },
        // Payroll
        {
          keywords: ['payroll', 'salary', 'wage', 'employee', 'staff', 'labor', 'compensation', 'benefits', 'paycheck', 'w2', 'withholding', 'payroll tax'],
          debitSide: { accountTypes: ['EXPENSE'], keywords: ['payroll', 'salary', 'wage', 'employee', 'labor'], reason: 'Payroll expense recognized' },
          creditSide: { accountTypes: ['ASSET'], keywords: ['cash', 'bank', 'checking', 'savings'], reason: 'Cash paid to employees' },
          transactionType: 'EXPENSE',
          rationale: 'Paying employee wages',
          priority: 1
        },
        // Tax Payments
        {
          keywords: ['tax', 'taxes', 'taxation', 'irs', 'federal', 'state', 'local', 'property tax', 'income tax', 'sales tax', 'withholding', 'estimated tax', 'quarterly tax'],
          debitSide: { accountTypes: ['EXPENSE'], keywords: ['tax', 'taxes', 'taxation'], reason: 'Tax expense recognized' },
          creditSide: { accountTypes: ['ASSET'], keywords: ['cash', 'bank', 'checking', 'savings'], reason: 'Cash paid for taxes' },
          transactionType: 'EXPENSE',
          rationale: 'Paying business taxes',
          priority: 1
        },
        // Rent Payments
        {
          keywords: ['rent', 'lease', 'rental', 'landlord', 'property', 'real estate', 'office space', 'warehouse', 'storage'],
          debitSide: { accountTypes: ['EXPENSE'], keywords: ['rent', 'lease', 'rental'], reason: 'Rent expense recognized' },
          creditSide: { accountTypes: ['ASSET'], keywords: ['cash', 'bank', 'checking', 'savings'], reason: 'Cash paid for rent' },
          transactionType: 'EXPENSE',
          rationale: 'Paying rent for business space',
          priority: 2
        },
        // Utility Payments
        {
          keywords: ['utility', 'utilities', 'electric', 'water', 'gas', 'internet', 'phone', 'cable', 'wifi', 'electricity', 'power', 'sewer', 'trash'],
          debitSide: { accountTypes: ['EXPENSE'], keywords: ['utility', 'utilities', 'electric', 'water', 'gas'], reason: 'Utility expense recognized' },
          creditSide: { accountTypes: ['ASSET'], keywords: ['cash', 'bank', 'checking', 'savings'], reason: 'Cash paid for utilities' },
          transactionType: 'EXPENSE',
          rationale: 'Paying utility bills',
          priority: 2
        }
      ];

      // Find matching pattern
      let matchedPattern = null;
      let matchedKeyword = null;
      let bestPriority = 999;

      for (const pattern of transactionPatterns) {
        const foundKeyword = pattern.keywords.find(keyword => 
          normalizedDescription.includes(keyword)
        );
        
        if (foundKeyword && pattern.priority < bestPriority) {
          matchedPattern = pattern;
          matchedKeyword = foundKeyword;
          bestPriority = pattern.priority;
        }
      }

      if (!matchedPattern) {
        console.log('❌ No dual-side pattern match found for:', normalizedDescription);
        return null;
      }

      console.log('✅ Found dual-side pattern:', matchedPattern.transactionType, 'for keyword:', matchedKeyword);

      // Find matching accounts for both sides
      const findMatchingAccount = (sidePattern: any): any => {
        let bestMatch = null;
        let bestScore = 0;

        for (const account of userAccounts) {
          if (!sidePattern.accountTypes.includes(account.type)) {
            continue;
          }

          let score = 0;
          
          // Check for keyword matches in account name
          const keywordMatch = sidePattern.keywords.some((keyword: string) => 
            account.name.toLowerCase().includes(keyword.toLowerCase())
          );
          if (keywordMatch) {
            score += 50;
          }

          // Check for category matches
          const categoryMatch = sidePattern.keywords.some((keyword: string) => 
            account.category?.toLowerCase().includes(keyword.toLowerCase())
          );
          if (categoryMatch) {
            score += 30;
          }

          // Bonus for recently used accounts
          const daysSinceUpdate = (Date.now() - new Date(account.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceUpdate < 7) {
            score += 10;
          }

          if (score > bestScore) {
            bestScore = score;
            bestMatch = { account, score };
          }
        }

        return bestMatch;
      };

      const debitMatch = findMatchingAccount(matchedPattern.debitSide);
      const creditMatch = findMatchingAccount(matchedPattern.creditSide);

      // Calculate overall confidence
      const debitConfidence = debitMatch ? Math.min(100, debitMatch.score) : 0;
      const creditConfidence = creditMatch ? Math.min(100, creditMatch.score) : 0;
      const overallConfidence = Math.round((debitConfidence + creditConfidence) / 2);

      // Only return if we have reasonable confidence for both sides
      if (overallConfidence < 40) {
        console.log('❌ Overall confidence too low for dual-side suggestion:', overallConfidence);
        return null;
      }

      return {
        debitSide: debitMatch ? {
          suggestedAccountId: debitMatch.account.id,
          suggestedAccountName: debitMatch.account.name,
          reason: matchedPattern.debitSide.reason,
          accountType: debitMatch.account.type,
          confidence: debitConfidence
        } : null,
        creditSide: creditMatch ? {
          suggestedAccountId: creditMatch.account.id,
          suggestedAccountName: creditMatch.account.name,
          reason: matchedPattern.creditSide.reason,
          accountType: creditMatch.account.type,
          confidence: creditConfidence
        } : null,
        overallConfidence,
        transactionType: matchedPattern.transactionType,
        rationale: matchedPattern.rationale
      };

    } catch (error) {
      logError(`Failed to suggest dual sides for description: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      return null;
    }
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
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  private normalizeMultiWordPhrases(description: string): string {
    // Convert multi-word phrases to underscore format for better matching
    const multiWordPhrases = [
      // Equity and Contributions
      'initial contribution',
      'owner contribution', 
      'capital contribution',
      'business formation',
      'personal funds',
      'equity investment',
      'partner investment',
      'owner draw',
      'partner draw',
      'loan repayment',
      'credit card payment',
      'equipment purchase',
      'personal use',
      
      // 🏦 Banking & Financial Services
      'bank fee',
      'overdraft fee',
      'wire transfer',
      'ach transfer',
      'atm fee',
      'monthly service charge',
      'account maintenance',
      'direct deposit',
      'cash withdrawal',
      'bank charges',
      
      // 💳 Credit Card & Payment Processing
      'credit card fee',
      'merchant fee',
      'processing fee',
      'transaction fee',
      'chargeback',
      'gateway fee',
      'payment processing',
      'credit card processing',
      'merchant processing',
      
      // ☁️ Technology & Digital Services
      'cloud hosting',
      'domain registration',
      'ssl certificate',
      'backup service',
      'cybersecurity',
      'data recovery',
      'it support',
      'managed services',
      'web hosting',
      'email hosting',
      
      // 👩‍💼 Professional Services
      'web design',
      'graphic design',
      'photography',
      'copywriting',
      'seo',
      'social media',
      'event planning',
      'public relations',
      'branding',
      
      // 👥 Employee Benefits
      'health insurance',
      'dental insurance',
      'vision insurance',
      '401k',
      'hsa',
      'fringe benefits',
      'employee training',
      'background check',
      
      // 🏛️ Regulatory & Compliance
      'business license',
      'permit',
      'inspection fee',
      'regulatory filing',
      'audit',
      'compliance',
      'bond',
      'filing fee'
    ];
    
    let normalized = description.toLowerCase().trim();
    
    // Replace multi-word phrases with underscore format
    for (const phrase of multiWordPhrases) {
      const underscorePhrase = phrase.replace(/\s+/g, '_');
      normalized = normalized.replace(new RegExp(phrase, 'gi'), underscorePhrase);
    }
    
    return normalized;
  }





  private async findKeywordSuggestion(normalizedDescription: string, userId: number): Promise<{
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
        order: { updatedAt: 'DESC' } // Prioritize recently used accounts
      });

      console.log('📊 [Fallback] Found user accounts:', userAccounts.length, userAccounts.map(acc => acc.name));
      console.log('🔍 [Fallback] Searching for keyword match in description:', normalizedDescription);
      
      // Enhanced keyword mapping for SMALL BUSINESS accounting (reoriented from personal finance)
      const keywordMap = [
        // PRIORITY 1: Core Business Revenue & Operations
        {
          keywords: ['sold', 'sale', 'sales', 'revenue', 'income', 'earnings', 'profit', 'commission', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment received', 'customer payment', 'client payment', 'customer', 'client', 'retail', 'wholesale', 'consulting fee', 'service fee', 'project payment'],
          accountTypes: ['INCOME', 'REVENUE'],
          categories: ['Sales', 'Revenue', 'Service Income', 'Product Sales', 'Consulting Revenue'],
          reason: 'Business revenue transaction',
          priority: 1
        },
        {
          keywords: [
            // Core purchase terms
            'purchase', 'buy', 'bought', 'buying', 'procurement', 'inventory', 'stock', 'supplies', 'equipment', 'materials', 'vendor', 'supplier', 'cost of goods', 'cogs', 'inventory purchase', 'raw materials', 'component', 'part', 'tool', 'machinery',
            // Common variations and partial matches
            'purchased', 'buying', 'bought', 'buy', 'procure', 'procurement', 'inventory', 'stock', 'supplies', 'equipment', 'materials', 'vendor', 'supplier', 'cost', 'goods', 'cogs', 'raw', 'component', 'part', 'tool', 'machinery',
            // Business purchase terms
            'order', 'ordered', 'ordering', 'shipping', 'shipped', 'delivery', 'delivered', 'receiving', 'received', 'stock', 'inventory', 'supplies', 'equipment', 'materials', 'parts', 'tools', 'machinery', 'hardware', 'software', 'licenses', 'subscriptions',
            // Common business purchases
            'office supplies', 'computer', 'laptop', 'printer', 'paper', 'ink', 'toner', 'furniture', 'desk', 'chair', 'table', 'shelf', 'cabinet', 'filing', 'storage', 'boxes', 'packaging', 'shipping supplies', 'labels', 'tape', 'staples', 'pens', 'pencils', 'notebooks', 'folders', 'binders'
          ],
          accountTypes: ['EXPENSE', 'ASSET'],
          categories: ['Supplies', 'Equipment', 'Inventory', 'Cost of Goods Sold', 'Materials'],
          reason: 'Business purchase transaction',
          priority: 1
        },
        {
          keywords: ['payroll', 'salary', 'wage', 'employee', 'staff', 'labor', 'compensation', 'benefits', 'paycheck', 'w2', 'withholding', 'payroll tax', 'employee payroll', 'bonus', 'commission', 'overtime', 'holiday pay', 'sick pay', 'vacation pay'],
          accountTypes: ['EXPENSE'],
          categories: ['Payroll', 'Payroll Expense', 'Employee Benefits', 'Wages'],
          reason: 'Payroll and employee compensation transaction',
          priority: 1
        },
        {
          keywords: ['tax', 'taxes', 'taxation', 'irs', 'federal', 'state', 'local', 'property tax', 'income tax', 'sales tax', 'withholding', 'estimated tax', 'quarterly tax', 'business tax', 'payroll tax', 'futa', 'fica', 'medicare', 'social security'],
          accountTypes: ['EXPENSE'],
          categories: ['Taxes', 'Tax Expense', 'Tax Liability', 'Payroll Taxes'],
          reason: 'Tax related transaction',
          priority: 1
        },
        {
          keywords: ['loan', 'credit', 'debt', 'borrow', 'lending', 'mortgage', 'financing', 'principal', 'line of credit', 'business loan', 'bank loan', 'sba loan', 'equipment financing', 'working capital loan'],
          accountTypes: ['LIABILITY', 'EXPENSE'],
          categories: ['Loan', 'Credit', 'Loan Payable', 'Business Loan'],
          reason: 'Loan and credit related transaction',
          priority: 1
        },

        // PRIORITY 2: Business Operations & Professional Services
        {
          keywords: ['marketing', 'advertising', 'promotion', 'campaign', 'social media', 'google ads', 'facebook ads', 'seo', 'branding', 'website', 'digital marketing', 'print advertising', 'trade show', 'exhibition', 'sponsorship', 'public relations', 'pr'],
          accountTypes: ['EXPENSE'],
          categories: ['Marketing', 'Marketing Expense', 'Advertising', 'Promotion'],
          reason: 'Marketing and advertising transaction',
          priority: 2
        },
        {
          keywords: ['accounting', 'bookkeeping', 'cpa', 'attorney', 'lawyer', 'legal', 'consulting', 'professional services', 'contractor', 'freelancer', 'professional fee', 'audit', 'tax preparation', 'legal services', 'business consulting', 'financial advisor'],
          accountTypes: ['EXPENSE'],
          categories: ['Professional Services', 'Legal', 'Accounting', 'Consulting'],
          reason: 'Professional services transaction',
          priority: 2
        },
        {
          keywords: ['business travel', 'conference', 'trade show', 'meeting', 'client visit', 'business trip', 'mileage', 'travel expense', 'business lunch', 'client lunch', 'meals entertainment', 'airfare', 'hotel', 'car rental', 'parking', 'toll', 'mileage expense', 'travel mileage'],
          accountTypes: ['EXPENSE'],
          categories: ['Travel', 'Business Travel', 'Travel Expense', 'Meals & Entertainment', 'Travel Expense'],
          reason: 'Business travel transaction',
          priority: 2
        },
        // PRIORITY 0: Equity and Capital Transactions (highest priority)
        {
          keywords: [
            // Multi-word equity phrases (exact matches)
            'initial contribution', 'owner contribution', 'capital contribution', 'business formation',
            'personal funds', 'equity investment', 'partner investment', 'owner draw', 'partner draw',
            'loan repayment', 'credit card payment', 'equipment purchase', 'personal use',
            // Single word equity keywords
            'initial', 'contribution', 'draw', 'drawing', 'withdrawal', 'owner', 'partner', 'distribution', 'dividend', 
            'capital contribution', 'investment', 'member distribution', 'contribution', 'equity', 'capital',
            'personal funds', 'partner funds', 'owner funds', 'business formation', 'startup capital'
          ],
          accountTypes: ['EQUITY'],
          categories: ['Owner Equity', 'Capital', 'Contributed Capital', 'Drawings', 'Partner Capital'],
          reason: 'Equity-related contribution or distribution',
          priority: 0  // Highest priority to override equipment/asset matches
        },
        {
          keywords: ['insurance', 'business insurance', 'liability insurance', 'property insurance', 'workers comp', 'workers compensation', 'professional liability', 'errors omissions', 'e&o', 'general liability', 'commercial auto', 'business interruption', 'car insurance', 'auto insurance', 'health insurance', 'life insurance', 'disability insurance'],
          accountTypes: ['EXPENSE'],
          categories: ['Insurance', 'Business Insurance', 'Liability Insurance', 'Insurance Expense'],
          reason: 'Business insurance transaction',
          priority: 2
        },

        // PRIORITY 3: Business Infrastructure & Operations
        {
          keywords: ['utility', 'utilities', 'electric', 'water', 'gas', 'internet', 'phone', 'cable', 'wifi', 'electricity', 'power', 'sewer', 'trash', 'garbage', 'office utilities', 'telephone', 'internet service', 'broadband'],
          accountTypes: ['EXPENSE'],
          categories: ['Utilities', 'Bills', 'Office Utilities', 'Telecommunications'],
          reason: 'Business utility transaction',
          priority: 3
        },
        {
          keywords: ['rent', 'lease', 'rental', 'landlord', 'property', 'real estate', 'office space', 'warehouse', 'storage', 'office rent', 'warehouse rent', 'storage unit', 'parking space', 'retail space'],
          accountTypes: ['EXPENSE'],
          categories: ['Rent', 'Rent Expense', 'Office Rent', 'Warehouse Rent'],
          reason: 'Business rent transaction',
          priority: 3
        },
        {
          keywords: ['tax', 'taxes', 'irs', 'income tax', 'sales tax', 'property tax', 'business tax', 'corporate tax', 'tax payment', 'tax filing', 'tax expense'],
          accountTypes: ['EXPENSE'],
          categories: ['Tax', 'Tax Expense', 'Income Tax', 'Business Tax', 'Income Taxes'],
          reason: 'Business tax transaction',
          priority: 2
        },
        {
          keywords: ['equipment', 'machinery', 'computer', 'furniture', 'office equipment', 'tools', 'machinery purchase', 'computer equipment', 'office furniture', 'production equipment', 'manufacturing equipment', 'office supplies', 'desk', 'chair', 'printer', 'copier'],
          accountTypes: ['EXPENSE', 'ASSET'],
          categories: ['Equipment', 'Fixed Assets', 'Equipment Purchase', 'Office Equipment'],
          reason: 'Business equipment transaction',
          priority: 3
        },
        {
          keywords: ['maintenance', 'repair', 'service call', 'technician', 'janitorial', 'cleaning', 'landscaping', 'security', 'alarm', 'camera', 'building maintenance', 'equipment maintenance', 'preventive maintenance'],
          accountTypes: ['EXPENSE'],
          categories: ['Maintenance', 'Repairs', 'Janitorial', 'Security'],
          reason: 'Business maintenance transaction',
          priority: 3
        },
        {
          keywords: ['software', 'subscription', 'saas', 'cloud', 'microsoft', 'adobe', 'quickbooks', 'salesforce', 'hubspot', 'mailchimp', 'stripe', 'paypal', 'square', 'zoom', 'slack', 'trello', 'asana'],
          accountTypes: ['EXPENSE'],
          categories: ['Software', 'Subscriptions', 'Technology', 'SaaS'],
          reason: 'Business software and subscription transaction',
          priority: 3
        },

        // PRIORITY 4: Business-Specific Expenses (deprioritized personal finance)
        {
          keywords: ['food', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'pizza', 'burger', 'sushi', 'coffee', 'business meal', 'client dinner', 'business lunch', 'catering', 'office lunch'],
          accountTypes: ['EXPENSE'],
          categories: ['Food', 'Dining', 'Meals & Entertainment', 'Business Meals'],
          reason: 'Food and dining related transaction',
          priority: 4
        },
        {
          keywords: ['gas', 'fuel', 'petrol', 'exxon', 'shell', 'bp', 'chevron', 'mobil', 'costco gas', 'business fuel', 'delivery vehicle', 'company car', 'fleet', 'truck', 'van'],
          accountTypes: ['EXPENSE'],
          categories: ['Transportation', 'Auto', 'Fuel', 'Vehicle Expense'],
          reason: 'Fuel and gas related transaction',
          priority: 4
        },
        {
          keywords: ['uber', 'lyft', 'taxi', 'transport', 'parking', 'toll', 'metro', 'subway', 'bus', 'train', 'transit', 'rideshare', 'business transport', 'delivery', 'courier', 'shipping'],
          accountTypes: ['EXPENSE'],
          categories: ['Transportation', 'Auto', 'Public Transport', 'Delivery'],
          reason: 'Transportation related transaction',
          priority: 4
        },
        {
          keywords: ['grocery', 'supermarket', 'walmart', 'target', 'costco', 'safeway', 'kroger', 'whole foods', 'trader joes', 'aldi', 'publix', 'wegmans', 'office supplies', 'break room', 'kitchen supplies'],
          accountTypes: ['EXPENSE'],
          categories: ['Food', 'Groceries', 'Office Supplies', 'Kitchen Supplies'],
          reason: 'Grocery and supplies transaction',
          priority: 4
        },
        {
          keywords: ['amazon', 'online', 'shopping', 'clothing', 'apparel', 'shoes', 'electronics', 'best buy', 'home depot', 'lowes', 'target', 'walmart', 'ebay', 'etsy', 'business purchase', 'uniform', 'safety equipment', 'ppe'],
          accountTypes: ['EXPENSE'],
          categories: ['Shopping', 'Retail', 'Online Shopping', 'Business Supplies'],
          reason: 'Shopping and retail transaction',
          priority: 4
        },
        {
          keywords: ['medical', 'doctor', 'pharmacy', 'cvs', 'walgreens', 'health', 'dental', 'vision', 'hospital', 'clinic', 'urgent care', 'emergency room', 'er', 'prescription', 'medication', 'health insurance', 'workers comp medical'],
          accountTypes: ['EXPENSE'],
          categories: ['Healthcare', 'Medical', 'Workers Compensation'],
          reason: 'Healthcare related transaction',
          priority: 4
        },
        {
          keywords: ['entertainment', 'movie', 'netflix', 'spotify', 'hulu', 'disney', 'game', 'concert', 'theater', 'youtube', 'apple music', 'amazon prime', 'hbo', 'peacock', 'paramount', 'client entertainment'],
          accountTypes: ['EXPENSE'],
          categories: ['Entertainment', 'Recreation', 'Client Entertainment'],
          reason: 'Entertainment related transaction',
          priority: 4
        },
        {
          keywords: ['gym', 'fitness', 'workout', 'planet fitness', 'la fitness', '24 hour fitness', 'ymca', 'personal trainer', 'yoga', 'pilates', 'employee wellness', 'health club'],
          accountTypes: ['EXPENSE'],
          categories: ['Healthcare', 'Fitness', 'Wellness', 'Employee Benefits'],
          reason: 'Fitness and wellness related transaction',
          priority: 4
        },
        {
          keywords: ['school', 'tuition', 'books', 'education', 'college', 'university', 'textbook', 'course', 'class', 'training', 'workshop', 'seminar', 'business training', 'employee training', 'professional development', 'certification'],
          accountTypes: ['EXPENSE'],
          categories: ['Education', 'Training', 'Professional Development'],
          reason: 'Education related transaction',
          priority: 4
        },
        {
          keywords: ['vacation', 'airbnb', 'hotel', 'travel', 'flight', 'airline', 'delta', 'united', 'american', 'southwest', 'jetblue', 'booking', 'expedia', 'trip', 'resort', 'business trip', 'conference travel'],
          accountTypes: ['EXPENSE'],
          categories: ['Travel', 'Vacation', 'Business Travel'],
          reason: 'Travel and vacation related transaction',
          priority: 4
        },
        {
          keywords: ['childcare', 'babysitter', 'daycare', 'nanny', 'preschool', 'after school', 'summer camp', 'child care', 'dependent care'],
          accountTypes: ['EXPENSE'],
          categories: ['Family', 'Childcare', 'Dependent Care'],
          reason: 'Childcare related transaction',
          priority: 4
        },
        {
          keywords: ['atm', 'withdrawal', 'cash', 'bank', 'credit union', 'chase', 'bank of america', 'wells fargo', 'citibank', 'us bank', 'business account', 'merchant account', 'payment processing'],
          accountTypes: ['ASSET', 'EXPENSE'],
          categories: ['Cash', 'Banking', 'Merchant Services'],
          reason: 'Cash and banking related transaction',
          priority: 4
        },
        {
          keywords: ['insurance', 'car insurance', 'home insurance', 'health insurance', 'life insurance', 'geico', 'state farm', 'allstate', 'progressive', 'farmers', 'business insurance', 'commercial insurance'],
          accountTypes: ['EXPENSE'],
          categories: ['Insurance', 'Business Insurance'],
          reason: 'Insurance related transaction',
          priority: 4
        },
        
        // 🏦 Banking & Financial Services (Priority 2 - High Business Impact)
        {
          keywords: ['bank fee', 'overdraft fee', 'monthly service charge', 'atm fee', 'account maintenance', 'wire transfer', 'ach transfer', 'direct deposit', 'cash withdrawal', 'bank charges', 'overdraft', 'wire', 'ach', 'atm', 'monthly', 'service', 'maintenance', 'direct', 'withdrawal', 'charges'],
          accountTypes: ['EXPENSE'],
          categories: ['Bank Fees', 'Banking Services', 'Financial Services'],
          reason: 'Bank service fees and charges',
          priority: 2
        },
        
        // 💳 Credit Card & Payment Processing (Priority 2 - High Business Impact)
        {
          keywords: ['credit card fee', 'merchant fee', 'processing fee', 'transaction fee', 'chargeback', 'gateway fee', 'payment processing', 'credit card processing', 'merchant processing', 'merchant', 'processing', 'transaction', 'chargeback', 'gateway', 'payment'],
          accountTypes: ['EXPENSE'],
          categories: ['Payment Processing Fees', 'Merchant Services', 'Credit Card Fees'],
          reason: 'Merchant and credit card processing costs',
          priority: 2
        },
        
        // ☁️ Technology & Digital Services (Priority 2 - High Business Impact)
        {
          keywords: ['cloud hosting', 'ssl certificate', 'domain registration', 'it support', 'cybersecurity', 'data recovery', 'managed services', 'web hosting', 'email hosting', 'cloud', 'hosting', 'ssl', 'certificate', 'domain', 'registration', 'support', 'cybersecurity', 'data', 'recovery', 'managed', 'web', 'email', 'it', 'technology', 'digital', 'services'],
          accountTypes: ['EXPENSE'],
          categories: ['Technology Services', 'Software Subscriptions', 'Digital Services', 'IT Services'],
          reason: 'Digital service or infrastructure expense',
          priority: 2
        },
        
        // 👩‍💼 Professional Services (Priority 2 - High Business Impact)
        {
          keywords: ['web design', 'graphic design', 'photography', 'copywriting', 'seo', 'social media', 'public relations', 'branding', 'web', 'design', 'graphic', 'photo', 'copy', 'seo', 'social', 'media', 'pr', 'brand', 'creative', 'designer', 'photographer', 'writer', 'marketing'],
          accountTypes: ['EXPENSE'],
          categories: ['Professional Services', 'Marketing Services', 'Creative Services', 'Design Services'],
          reason: 'Digital or creative business services',
          priority: 2
        },
        
        // 👥 Employee Benefits (Priority 2 - High Business Impact)
        {
          keywords: ['health_insurance', 'dental_insurance', 'vision_insurance', '401k', 'hsa', 'fringe_benefits', 'employee_training', 'background_check', 'health insurance', 'dental insurance', 'vision insurance', 'fringe benefits', 'employee training', 'background check', 'employee', 'benefit', 'hr', 'human resources', 'wellness'],
          accountTypes: ['EXPENSE'],
          categories: ['Employee Benefits', 'HR Expenses', 'Health Insurance', 'Employee Training'],
          reason: 'Employee-related benefit or incentive',
          priority: 2
        },
        
        // 🏛️ Regulatory & Compliance (Priority 2 - High Business Impact)
        {
          keywords: ['business license', 'permit', 'inspection fee', 'regulatory filing', 'audit', 'compliance', 'bond', 'filing fee', 'license', 'permit', 'inspection', 'regulatory', 'filing', 'audit', 'compliance', 'bond', 'government', 'regulatory', 'legal', 'compliance', 'licensing'],
          accountTypes: ['EXPENSE'],
          categories: ['Regulatory Compliance', 'Licenses & Permits', 'Government Fees', 'Compliance Costs'],
          reason: 'Government or compliance-related expense',
          priority: 2
        }
      ];

      // Normalize multi-word phrases for better matching
      const normalizedDescriptionForMatching = this.normalizeMultiWordPhrases(normalizedDescription);
      console.log('🔍 [Fallback] Normalized description for matching:', normalizedDescriptionForMatching);
      
      // Find matching keyword category with priority-based selection
      let matchedCategory = null;
      let matchedKeyword = null;
      let bestPriority = 999; // Start with high number (lower is better)
      
      for (const mapping of keywordMap) {
        const foundKeyword = mapping.keywords.find(keyword => {
          // Normalize the keyword for matching
          const normalizedKeyword = this.normalizeMultiWordPhrases(keyword);
          
          // Check for exact match first
          const exactMatch = normalizedDescriptionForMatching.toLowerCase().includes(normalizedKeyword.toLowerCase());
          
          // For very short descriptions (less than 4 characters), only allow exact matches
          // This prevents "initi" from matching "initial contribution"
          if (normalizedDescriptionForMatching.length < 4) {
            if (exactMatch) {
              console.log('🔍 [Fallback] Found exact keyword match for short description:', keyword, 'Category:', mapping.categories[0], 'Priority:', mapping.priority);
            }
            return exactMatch;
          }
          
          // For longer descriptions, allow partial matches but be more strict
          const partialMatch = normalizedKeyword.toLowerCase().startsWith(normalizedDescriptionForMatching.toLowerCase()) || 
                             normalizedDescriptionForMatching.toLowerCase().startsWith(normalizedKeyword.toLowerCase());
          
          // For equity keywords, be more strict about matching to avoid false positives
          const isEquityKeyword = mapping.accountTypes.includes('EQUITY');
          const hasKeyword = isEquityKeyword ? exactMatch : (exactMatch || partialMatch);
          
          // Reduced verbosity - only log when keyword is found
          if (hasKeyword) {
            console.log('🔍 [Fallback] Found keyword:', keyword, 'Category:', mapping.categories[0], 'Priority:', mapping.priority);
          }
          return hasKeyword;
        });
        
        if (foundKeyword) {
          // Prioritize by priority number (lower number = higher priority)
          if (mapping.priority < bestPriority) {
            matchedCategory = mapping;
            matchedKeyword = foundKeyword;
            bestPriority = mapping.priority;
            console.log('✅ [Fallback] Found keyword match:', foundKeyword, 'Category:', mapping.categories[0], 'Priority:', mapping.priority);
          }
        }
      }

      if (!matchedCategory) {
        console.log('❌ No keyword category match found for:', normalizedDescription);
        return null;
      }

      // Find matching user account with better prioritization
      let bestMatch = null;
      let bestScore = 0;
      let bestMatchHadExactKeyword = false;

      console.log('🔍 [Keyword] Looking for accounts matching category:', matchedCategory.categories[0], 'accountTypes:', matchedCategory.accountTypes);
      console.log('🔍 [Keyword] Available accounts after type filtering:', userAccounts.filter(acc => matchedCategory!.accountTypes.includes(acc.type)).map(acc => acc.name));

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
        
        // Check for partial keyword matches in account name (medium priority)
        const partialKeywordMatch = matchedCategory!.keywords.some(keyword => {
          const keywordWords = keyword.toLowerCase().split(' ');
          return keywordWords.some(word => 
            word.length > 2 && account.name.toLowerCase().includes(word)
          );
        });
        if (partialKeywordMatch && !exactKeywordMatch) {
          score += 30; // Medium priority for partial keyword matches
          reasoning.push('partial keyword match in account name');
        }
        
        // Bonus for high priority categories (business-focused)
        if (matchedCategory!.priority <= 2) {
          score += 20;
          reasoning.push('high priority business category');
        }
        
        // Check name match (higher priority)
        const nameMatch = matchedCategory!.categories.some(cat => 
          account.name.toLowerCase().includes(cat.toLowerCase())
        );
        if (nameMatch) {
          score += 40; // Increased from 30
          reasoning.push('category match in account name');
        }
        
        // Check category match
        const categoryMatch = matchedCategory!.categories.some(cat => 
          account.category?.toLowerCase().includes(cat.toLowerCase())
        );
        if (categoryMatch) {
          score += 25; // Increased from 15
          reasoning.push('category field match');
        }
        
        // Check subcategory match
        const subcategoryMatch = matchedCategory!.categories.some(cat => 
          account.subcategory?.toLowerCase().includes(cat.toLowerCase())
        );
        if (subcategoryMatch) {
          score += 15; // Increased from 10
          reasoning.push('subcategory field match');
        }

        // Bonus for recently used accounts (reduced weight)
        const daysSinceUpdate = (Date.now() - new Date(account.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) {
          score += 3; // Reduced from 5
          reasoning.push('recently used account');
        }

        // Only log the best match or if score is very high
        if (score > bestScore || score > 100) {
          console.log('📊 Account', account.name, 'score:', score, 'reasoning:', reasoning.join(', '));
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = account;
          bestMatchHadExactKeyword = exactKeywordMatch;
        }
      }

      if (!bestMatch) {
        console.log('❌ No matching account found');
        return null;
      }

      console.log('✅ [Fallback] Best match found:', bestMatch.name, 'with score:', bestScore);
      console.log('🎯 [Fallback] Final suggested account:', bestMatch.name, 'type:', bestMatch.type);

      // Calculate confidence score (0-100)
      const maxPossibleScore = 130; // 50 + 20 + 30 + 15 + 10 + 5 (added priority bonus)
      let confidence = Math.min(100, Math.round((bestScore / maxPossibleScore) * 100));
      
      // Boost confidence for equity keywords if it's low
      if (matchedCategory && matchedCategory.accountTypes.includes('EQUITY') && confidence < 85) {
        confidence = Math.min(100, confidence + 15); // Boost by 15 points
        console.log('🚀 [Fallback] Boosting equity keyword confidence from', confidence - 15, 'to', confidence);
      }
      
      // Don't suggest if confidence is too low (prevents bad suggestions)
      // But allow higher confidence for exact keyword matches
      if (confidence < 15) {
        console.log('❌ [Fallback] Confidence too low (', confidence, '), not suggesting');
        return null;
      }
      
      // For exact keyword matches, allow lower confidence
      if (bestMatchHadExactKeyword && confidence >= 20) {
        confidence = Math.min(confidence + 20, 100); // Boost confidence for exact matches
        console.log('🚀 [Fallback] Boosting exact keyword match confidence from', confidence - 20, 'to', confidence);
      }

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
      logError(`Failed to find keyword suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
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



} 