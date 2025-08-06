import { AppDataSource } from "../config/data-source";
import { Suggestion } from "../entities/Suggestion";
import { Account } from "../entities/Account";
import { UserSuggestionPreference } from "../entities/UserSuggestionPreference";
import { logError } from '../utils/logger';
import { SmartSuggestionAgent } from './suggestionEngine/SmartSuggestionAgent';
import { MemoryBasedLearning } from './suggestionEngine/MemoryBasedLearning';
import { AccountWeightService } from './AccountWeightService';

export class SuggestionService {
  private suggestionRepo = AppDataSource.getRepository(Suggestion);
  private accountRepo = AppDataSource.getRepository(Account);
  private userPreferenceRepo = AppDataSource.getRepository(UserSuggestionPreference);
  private smartSuggestionAgent = new SmartSuggestionAgent();
  private memoryLearning = new MemoryBasedLearning();
  private accountWeightService = new AccountWeightService();

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
    learningSource?: string;
    patternData?: any;
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

      // Step 2: TEMPORARILY BYPASSED - Account weighting (new priority between preferences and memory)
      // TODO: Re-enable when weighting logic is stable
      const weightedSuggestion = await this.findWeightedSuggestion(normalizedDescription, userId);
      if (weightedSuggestion) {
        console.log('🔍 [SuggestionService] Weighting system would have suggested:', {
          description,
          keywords: this.extractKeywords(description),
          suggestedAccount: weightedSuggestion.suggestedAccountName,
          confidence: weightedSuggestion.confidence,
          entryType: weightedSuggestion.suggestedEntryType,
          reason: weightedSuggestion.reason
        });
        // Temporarily skip weighted suggestions to restore reliability
        // return weightedSuggestion;
      }

      // Step 3: Try memory-based learning
      const userAccounts = await this.accountRepo.find({
        where: { user: { id: userId } },
        order: { updatedAt: 'DESC' }
      });
      
      const memorySuggestion = await this.memoryLearning.findMemoryBasedSuggestion(
        userId, 
        normalizedDescription, 
        userAccounts
      );
      
      console.log('🔍 [SuggestionService] Memory-based suggestion:', {
        description,
        hasMemorySuggestion: !!memorySuggestion,
        confidence: memorySuggestion?.confidence,
        accountName: memorySuggestion?.accountName
      });
      
      if (memorySuggestion && memorySuggestion.confidence >= 60) {
        
        // Find the account to get additional details
        const suggestedAccount = await this.accountRepo.findOne({
          where: { id: memorySuggestion.accountId }
        });
        
        if (suggestedAccount) {
          return {
            suggestedAccountId: memorySuggestion.accountId,
            suggestedAccountName: memorySuggestion.accountName,
            reason: memorySuggestion.reason,
            accountType: suggestedAccount.type,
            confidence: memorySuggestion.confidence,
            suggestedEntryType: this.determineEntryType(suggestedAccount),
            detailedReason: memorySuggestion.reason,
            learningSource: memorySuggestion.learningSource,
            patternData: memorySuggestion.patternData
          };
        }
      }

      // Step 2: Try SmartSuggestionAgent (new logic)
      const agentResult = await this.smartSuggestionAgent.suggest({
        description,
        userId,
        role: 'OWNER', // TODO: Use real role when available
        contextOverrides: {}
      });

      console.log('🔍 [SuggestionService] SmartSuggestionAgent result:', {
        description,
        hasAgentResult: !!agentResult,
        confidence: agentResult?.confidence,
        suggestedAccount: agentResult?.suggestedAccountName,
        entryType: agentResult?.suggestedEntryType
      });

      if (agentResult && agentResult.confidence >= 50) {
        
        // Find the account by name to get the ID
        const suggestedAccount = await this.accountRepo.findOne({
          where: { 
            name: agentResult.suggestedAccountName,
            user: { id: userId }
          }
        });

        if (suggestedAccount) {
          return {
            suggestedAccountId: suggestedAccount.id,
            suggestedAccountName: agentResult.suggestedAccountName,
            reason: agentResult.detailedReason,
            accountType: agentResult.accountType,
            confidence: agentResult.confidence,
            suggestedEntryType: agentResult.suggestedEntryType,
            detailedReason: agentResult.toneMessage
          };
        }
      }

      // Step 3: Fallback to keyword matching (existing logic)
      if (!agentResult) {
        console.log('🔄 [SuggestionService] Agent returned null, falling back to keyword matching');
      } else {
        console.log('🔄 [SuggestionService] Agent confidence too low (', agentResult.confidence, '), falling back to keyword matching');
      }
      console.log('🔄 [SuggestionService] Falling back to keyword matching...');
      
      const keywordSuggestion = await this.findKeywordSuggestion(normalizedDescription, userId);
      console.log('🔍 [SuggestionService] Keyword fallback result:', {
        description,
        hasKeywordSuggestion: !!keywordSuggestion,
        suggestedAccount: keywordSuggestion?.suggestedAccountName,
        confidence: keywordSuggestion?.confidence,
        entryType: keywordSuggestion?.suggestedEntryType
      });
      
      return keywordSuggestion;
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
      // Save feedback for memory learning
      await this.memoryLearning.saveFeedback(data);

      // If accepted, also save as user preference
      if (data.feedbackType === 'ACCEPTED' && data.selectedAccountId) {
        await this.saveUserPreference(data.description, data.selectedAccountId, data.userId);
      }

      // Update user preferences based on feedback patterns
      await this.memoryLearning.updateUserPreferences(data.userId);
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
          keywords: ['equity contribution', 'owner contribution', 'capital contribution', 'investment', 'owner investment', 'partner contribution', 'shareholder contribution'],
          suggestedType: 'EQUITY_CONTRIBUTION',
          reason: 'Equity or capital contribution transaction',
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
        const foundKeyword = mapping.keywords.find(keyword => normalizedDescription.includes(keyword));
        if (foundKeyword) {
          // Prioritize by priority number (lower number = higher priority)
          if (mapping.priority < bestPriority) {
            matchedType = mapping;
            matchedKeyword = foundKeyword;
            bestPriority = mapping.priority;
            console.log('✅ Found keyword match for transaction type:', foundKeyword, 'Type:', mapping.suggestedType, 'Priority:', mapping.priority);
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

  private determineEntryType(account: Account): 'DEBIT' | 'CREDIT' {
    switch (account.type) {
      case 'EXPENSE':
        return 'DEBIT';
      case 'INCOME':
        return 'CREDIT';
      case 'ASSET':
        return 'DEBIT';
      case 'LIABILITY':
        return 'CREDIT';
      case 'EQUITY':
        return 'CREDIT';
      default:
        return 'DEBIT';
    }
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
          keywords: ['business travel', 'conference', 'trade show', 'meeting', 'client visit', 'business trip', 'mileage', 'travel expense', 'business lunch', 'client lunch', 'meals entertainment', 'airfare', 'hotel', 'car rental', 'parking', 'toll'],
          accountTypes: ['EXPENSE'],
          categories: ['Travel', 'Business Travel', 'Travel Expense', 'Meals & Entertainment'],
          reason: 'Business travel transaction',
          priority: 2
        },
        {
          keywords: [
            // Multi-word equity phrases
            'initial contribution', 'owner contribution', 'capital contribution', 'business formation',
            'personal funds', 'equity investment', 'partner investment', 'owner draw', 'partner draw',
            'loan repayment', 'credit card payment', 'equipment purchase', 'personal use',
            // Single word equity keywords
            'draw', 'drawing', 'withdrawal', 'owner', 'partner', 'distribution', 'dividend', 
            'capital contribution', 'investment', 'member distribution', 'contribution', 'equity', 'capital'
          ],
          accountTypes: ['EQUITY', 'ASSET', 'LIABILITY'],
          categories: ['Owner Equity', 'Contributed Capital', 'Drawings', 'Partner Capital', 'Equipment', 'Loans Payable'],
          reason: 'Non-revenue/expense business activity',
          priority: 1
        },
        {
          keywords: ['insurance', 'business insurance', 'liability insurance', 'property insurance', 'workers comp', 'workers compensation', 'professional liability', 'errors omissions', 'e&o', 'general liability', 'commercial auto', 'business interruption'],
          accountTypes: ['EXPENSE'],
          categories: ['Insurance', 'Business Insurance', 'Liability Insurance'],
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
        }
      ];

      // Find matching keyword category with priority-based selection
      let matchedCategory = null;
      let matchedKeyword = null;
      let bestPriority = 999; // Start with high number (lower is better)
      
      for (const mapping of keywordMap) {
                        const foundKeyword = mapping.keywords.find(keyword => {
                  // Check for exact match first
                  const exactMatch = normalizedDescription.toLowerCase().includes(keyword.toLowerCase());
                  // Check for partial match (keyword starts with description or description starts with keyword)
                  const partialMatch = keyword.toLowerCase().startsWith(normalizedDescription.toLowerCase()) || normalizedDescription.toLowerCase().startsWith(keyword.toLowerCase());
                  const hasKeyword = exactMatch || partialMatch;
                  console.log('🔍 [Fallback] Keyword:', keyword, 'exact:', exactMatch, 'partial:', partialMatch, 'found:', hasKeyword);
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

      console.log('🔍 [Fallback] Looking for accounts matching category:', matchedCategory.categories[0], 'accountTypes:', matchedCategory.accountTypes);
      console.log('🔍 [Fallback] Available accounts after type filtering:', userAccounts.filter(acc => matchedCategory!.accountTypes.includes(acc.type)).map(acc => acc.name));

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

      console.log('✅ [Fallback] Best match found:', bestMatch.name, 'with score:', bestScore);
      console.log('🎯 [Fallback] Final suggested account:', bestMatch.name, 'type:', bestMatch.type);

      // Calculate confidence score (0-100)
      const maxPossibleScore = 130; // 50 + 20 + 30 + 15 + 10 + 5 (added priority bonus)
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

  private async findWeightedSuggestion(normalizedDescription: string, userId: number): Promise<{
    suggestedAccountId: number;
    suggestedAccountName: string;
    reason: string;
    accountType: string;
    confidence: number;
    suggestedEntryType: 'DEBIT' | 'CREDIT';
    detailedReason: string;
    learningSource?: string;
  } | null> {
    try {
      // Extract keywords from description
      const keywords = this.extractKeywords(normalizedDescription);
      
      if (keywords.length === 0) {
        return null;
      }

      // Get user's accounts
      const userAccounts = await this.accountRepo.find({
        where: { user: { id: userId } }
      });

      let bestWeightedSuggestion: {
        accountId: number;
        accountName: string;
        weight: number;
        keyword: string;
      } | null = null;

      // Check each keyword for weights
      for (const keyword of keywords) {
        const weights = await this.accountWeightService.getWeightsForKeyword(userId, keyword);
        
        for (const weight of weights) {
          // Find the account
          const account = userAccounts.find(acc => acc.id === weight.accountId);
          if (!account) continue;

          // Calculate weighted score (base score * weight multiplier)
          const baseScore = 85; // Increased base confidence for weighted suggestions
          const weightMultiplier = weight.weight / 50; // Normalize to 0-2 range
          const finalScore = baseScore * weightMultiplier;

          if (!bestWeightedSuggestion || finalScore > bestWeightedSuggestion.weight) {
            bestWeightedSuggestion = {
              accountId: weight.accountId,
              accountName: account.name,
              weight: finalScore,
              keyword: keyword
            };
          }
        }
      }

      if (bestWeightedSuggestion && bestWeightedSuggestion.weight >= 75) {
        const account = userAccounts.find(acc => acc.id === bestWeightedSuggestion!.accountId);
        if (!account) return null;

        // Increment usage count for the weight
        const weights = await this.accountWeightService.getWeightsForKeyword(userId, bestWeightedSuggestion.keyword);
        const matchingWeight = weights.find(w => w.accountId === bestWeightedSuggestion!.accountId);
        if (matchingWeight) {
          await this.accountWeightService.incrementUsageCount(matchingWeight.id);
        }

        // Determine entry type based on weight's transaction type, not account type
        let suggestedEntryType: 'DEBIT' | 'CREDIT';
        if (matchingWeight && matchingWeight.transactionType) {
          switch (matchingWeight.transactionType) {
            case 'INCOME':
              suggestedEntryType = 'CREDIT';
              break;
            case 'EXPENSE':
              suggestedEntryType = 'DEBIT';
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
            case 'TRANSFER':
              suggestedEntryType = 'DEBIT'; // Default for transfers
              break;
            default:
              suggestedEntryType = this.determineEntryType(account);
          }
        } else {
          suggestedEntryType = this.determineEntryType(account);
        }

        return {
          suggestedAccountId: bestWeightedSuggestion.accountId,
          suggestedAccountName: bestWeightedSuggestion.accountName,
          reason: `Based on keyword "${bestWeightedSuggestion.keyword}" with account weighting`,
          accountType: account.type,
          confidence: Math.min(bestWeightedSuggestion.weight, 95), // Cap at 95%
          suggestedEntryType: suggestedEntryType,
          detailedReason: `Account weighting system found "${bestWeightedSuggestion.accountName}" as the preferred account for keyword "${bestWeightedSuggestion.keyword}" (${matchingWeight?.transactionType || 'unknown'} transaction type)`,
          learningSource: 'ACCOUNT_WEIGHTING'
        };
      }

      return null;
    } catch (error) {
      logError(`Failed to find weighted suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SuggestionService');
      return null;
    }
  }

  private extractKeywords(description: string): string[] {
    // Extract meaningful keywords from description
    const normalizedDescription = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Multi-word phrase detection (check before single word extraction)
    const multiWordPhrases = [
      // Equity and Contributions
      'initial contribution', 'owner contribution', 'capital contribution', 'business formation',
      'personal funds', 'partner investment', 'equity investment', 'owner draw', 'partner draw',
      
      // Employee Payments
      'employee pay', 'staff payment', 'holiday pay', 'payroll tax', 'withholding', 'deductions',
      
      // Contractor Payments
      'contractor payment', 'vendor payment', 'independent contractor', 'service payment',
      'contract work', 'project payment', 'professional services', '1099 payment',
      
      // Assets & Liabilities
      'loan repayment', 'credit card payment', 'equipment purchase', 'personal use',
      
      // Additional Business Operations
      'office supplies', 'bank fees', 'credit card fees', 'processing fees', 'interest expense',
      'late fees', 'income tax', 'sales tax', 'property tax', 'business tax'
    ];

    // Check for multi-word phrases first
    for (const phrase of multiWordPhrases) {
      if (normalizedDescription.includes(phrase)) {
        return [phrase.replace(/\s+/g, '_')]; // Return as single keyword
      }
    }

    // Single word extraction
    const words = normalizedDescription.split(' ').filter(word => word.length > 2);
    
    // Expanded business keywords to look for
    const businessKeywords = [
      // Revenue & Sales
      'sold', 'sale', 'sales', 'revenue', 'income', 'refund',
      
      // Purchases & Expenses
      'bought', 'buy', 'purchase', 'inventory',
      'rent', 'utilities', 'marketing', 'advertising', 'insurance', 'legal', 'accounting',
      
      // Employee Payments
      'payroll', 'salary', 'wages', 'employee', 'staff', 'bonus', 'commission', 'overtime',
      
      // Contractor Payments
      'contractor', 'freelancer', 'consultant', 'vendor', 'service',
      
      // Tax Keywords
      'tax', 'taxes', 'irs', 'withholding', 'deductions',
      
      // Equity and Contributions
      'contribution', 'investment', 'equity', 'capital',
      'owner', 'partner', 'draw', 'withdrawal',
      
      // Assets & Liabilities
      'deposit', 'loan', 'transfer', 'repayment', 'reimbursement',
      'overdraft', 'credit', 'interest', 'dividend',
      
      // Business Operations
      'equipment', 'machinery', 'furniture', 'supplies', 'maintenance', 'repair',
      'software', 'subscription', 'membership', 'licenses', 'permits',
      
      // Travel & Transportation
      'travel', 'meals', 'entertainment', 'mileage', 'gas', 'fuel',
      
      // Fees & Charges
      'fees', 'charges', 'penalties', 'fines', 'late',
      
      // Context Keywords
      'initial', 'business', 'personal', 'formation', 'funds'
    ];

    return words.filter(word => businessKeywords.includes(word.toLowerCase()));
  }
} 