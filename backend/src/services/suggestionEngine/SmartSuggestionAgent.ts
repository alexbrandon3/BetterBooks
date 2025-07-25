import { AppDataSource } from "../../config/data-source";
import { Account } from "../../entities/Account";
import { logAnalytics } from '../../utils/analytics';

export interface AgentSuggestionRequest {
  description: string;
  amount?: number;
  userId: number;
  role: string;
  contextOverrides?: Record<string, any>;
}

export interface AgentSuggestionResult {
  suggestedAccountName: string;
  accountType: string;
  category: string;
  financialCategory: string;
  suggestedEntryType: 'DEBIT' | 'CREDIT';
  toneMessage: string;
  detailedReason: string;
  confidence: number;
}

export class SmartSuggestionAgent {
  private accountRepo = AppDataSource.getRepository(Account);

  async suggest(request: AgentSuggestionRequest): Promise<AgentSuggestionResult | null> {
    try {
      console.log('🤖 SmartSuggestionAgent: Processing request:', {
        description: request.description,
        userId: request.userId,
        role: request.role
      });

      // Normalize description
      const normalizedDescription = this.normalizeDescription(request.description);
      
      // Get user's accounts
      const userAccounts = await this.accountRepo.find({
        where: { user: { id: request.userId } },
        order: { updatedAt: 'DESC' }
      });

      if (userAccounts.length === 0) {
        console.log('❌ No accounts found for user');
        return null;
      }

      // Business-focused keyword analysis
      const businessKeywords = this.analyzeBusinessKeywords(normalizedDescription);
      
      // Debug logging for keyword classification
      console.log('🧠 [SmartSuggest] Keywords found:', businessKeywords.keywords);
      console.log('🧠 [SmartSuggest] Classified Category:', businessKeywords.category);
      console.log('🧠 [SmartSuggest] Confidence:', businessKeywords.confidence);
      console.log('🧠 [SmartSuggest] Business Context:', businessKeywords.businessContext);
      
      if (businessKeywords.confidence === 'LOW') {
        console.log('❌ Low confidence business keywords detected');
        return null;
      }

      // Find best matching account
      const bestMatch = this.findBestAccountMatch(
        userAccounts,
        businessKeywords,
        normalizedDescription
      );

      if (!bestMatch) {
        console.log('❌ [SmartSuggest] No suitable account match found');
        console.log('⚠️ [SmartSuggest] Agent will return null, triggering fallback logic');
        return null;
      }

      // Determine entry type based on account type and business context
      const entryType = this.determineEntryType(bestMatch.account, businessKeywords);

      // Generate classification based on business keywords
      const classification = this.classifyAccount(businessKeywords, bestMatch.account);

      // Generate human-friendly reason
      const detailedReason = this.generateReason(bestMatch.account, businessKeywords, normalizedDescription);

      // Generate tone message for business context
      const toneMessage = this.generateToneMessage(businessKeywords, bestMatch.account);

      // Convert confidence to number
      const confidenceNumber = this.convertConfidenceToNumber(bestMatch.confidence);

      const result: AgentSuggestionResult = {
        suggestedAccountName: bestMatch.account.name,
        accountType: classification.accountType,
        category: classification.category,
        financialCategory: classification.financialCategory,
        suggestedEntryType: entryType,
        toneMessage: toneMessage,
        detailedReason: detailedReason,
        confidence: confidenceNumber
      };

      console.log('✅ SmartSuggestionAgent result:', result);

      // Log analytics
      await logAnalytics('smart_suggestion_agent_used', {
        user_id: request.userId,
        description: normalizedDescription,
        confidence: result.confidence,
        account_type: result.accountType
      });

      return result;

    } catch (error) {
      console.error('❌ SmartSuggestionAgent error:', error);
      return null;
    }
  }

  private normalizeDescription(description: string): string {
    return description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private analyzeBusinessKeywords(description: string): {
    category: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    keywords: string[];
    businessContext: string;
  } {
    // Business-focused keyword categories (prioritized for small business accounting)
    const businessCategories = [
      {
        name: 'Revenue & Sales',
        keywords: [
          // Core revenue terms
          'sold', 'sale', 'sales', 'revenue', 'income', 'earnings', 'profit', 'commission', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment received', 'customer payment', 'client payment', 'customer', 'client', 'retail', 'wholesale', 'consulting fee', 'service fee', 'project payment',
          // Common variations and partial matches
          'sell', 'selling', 'sold', 'sale', 'sales', 'revenue', 'income', 'earn', 'earning', 'profit', 'commission', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment', 'customer', 'client', 'retail', 'wholesale', 'consulting', 'fee', 'project',
          // Business transaction terms
          'billing', 'billed', 'charge', 'charged', 'receipt', 'received', 'payment', 'paid', 'cash', 'check', 'credit', 'debit', 'transfer', 'deposit', 'withdrawal'
        ],
        confidence: 'HIGH' as const,
        context: 'Business revenue transaction'
      },
      {
        name: 'Purchases & Inventory',
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
        confidence: 'HIGH' as const,
        context: 'Business purchase transaction'
      },
      {
        name: 'Operating Expenses',
        keywords: [
          // Core operating expense terms
          'rent', 'lease', 'utilities', 'electricity', 'water', 'internet', 'phone', 'insurance', 'marketing', 'advertising', 'promotion', 'travel', 'transportation', 'meals', 'lodging', 'legal', 'attorney', 'accounting', 'bookkeeping', 'cpa', 'software', 'subscription', 'saas',
          // Common variations and partial matches
          'rental', 'leased', 'leasing', 'utility', 'electric', 'power', 'gas', 'sewer', 'trash', 'garbage', 'wifi', 'broadband', 'telephone', 'mobile', 'cell', 'cellular', 'insurance', 'marketing', 'advertise', 'promote', 'travel', 'transport', 'meal', 'lunch', 'dinner', 'breakfast', 'lodging', 'hotel', 'motel', 'legal', 'lawyer', 'attorney', 'accounting', 'bookkeeping', 'cpa', 'software', 'subscription', 'saas',
          // Business expense terms
          'office', 'workspace', 'co-working', 'meeting', 'conference', 'seminar', 'training', 'education', 'certification', 'license', 'permit', 'registration', 'membership', 'dues', 'fees', 'charges', 'bills', 'expenses', 'costs', 'overhead', 'operating', 'maintenance', 'repair', 'service', 'cleaning', 'janitorial', 'security', 'alarm', 'monitoring', 'backup', 'storage', 'cloud', 'hosting', 'domain', 'website', 'email', 'voip', 'phone system', 'internet service', 'broadband', 'fiber', 'cable', 'satellite'
        ],
        confidence: 'MEDIUM' as const,
        context: 'Business operating expense'
      },
      {
        name: 'Payroll & HR',
        keywords: [
          // Core payroll terms
          'payroll', 'wages', 'salary', 'employee', 'staff', 'bonus', 'commission', 'benefits', 'health insurance', 'retirement', '401k', 'pension',
          // Common variations and partial matches
          'pay', 'paid', 'payment', 'wage', 'salary', 'employee', 'staff', 'worker', 'worker', 'bonus', 'commission', 'benefit', 'health', 'insurance', 'retirement', '401k', 'pension', 'hiring', 'hired', 'firing', 'fired', 'layoff', 'layoff', 'termination', 'terminated', 'resignation', 'resigned', 'quit', 'quitting',
          // HR and employment terms
          'hr', 'human resources', 'personnel', 'hiring', 'recruitment', 'interview', 'application', 'resume', 'cv', 'background check', 'drug test', 'physical', 'medical', 'dental', 'vision', 'life insurance', 'disability', 'workers comp', 'workers compensation', 'unemployment', 'social security', 'fica', 'medicare', 'withholding', 'garnish', 'garnishment', 'child support', 'alimony', 'tax withholding', 'federal tax', 'state tax', 'local tax'
        ],
        confidence: 'MEDIUM' as const,
        context: 'Payroll and human resources'
      },
      {
        name: 'Taxes & Compliance',
        keywords: [
          // Core tax terms
          'tax', 'taxes', 'irs', 'income tax', 'sales tax', 'property tax', 'payroll tax', 'withholding', 'filing', 'compliance',
          // Common variations and partial matches
          'tax', 'taxes', 'irs', 'income', 'sales', 'property', 'payroll', 'withholding', 'filing', 'compliance', 'audit', 'audited', 'auditing', 'penalty', 'penalties', 'fine', 'fines', 'late', 'extension', 'amendment', 'amended', 'quarterly', 'quarter', 'annual', 'yearly', 'monthly', 'weekly', 'daily',
          // Tax and compliance terms
          'federal tax', 'state tax', 'local tax', 'city tax', 'county tax', 'property tax', 'real estate tax', 'personal property tax', 'business tax', 'corporate tax', 'partnership tax', 'llc tax', 's-corp tax', 'c-corp tax', 'sole proprietorship tax', 'self-employment tax', 'estimated tax', 'quarterly tax', 'annual tax', 'extension', 'amendment', 'audit', 'penalty', 'interest', 'late fee', 'filing fee', 'processing fee', 'electronic filing', 'e-file', 'paper filing', 'mail', 'postal', 'certified mail', 'registered mail', 'return receipt', 'proof of mailing', 'postmark', 'postmarked'
        ],
        confidence: 'MEDIUM' as const,
        context: 'Tax and compliance related'
      },
      {
        name: 'Banking & Cash',
        keywords: [
          // Core banking terms
          'atm', 'withdrawal', 'cash', 'bank', 'credit union', 'chase', 'bank of america', 'wells fargo', 'citibank', 'us bank', 'business account', 'merchant account', 'payment processing',
          // Common variations and partial matches
          'atm', 'withdraw', 'withdrawal', 'cash', 'bank', 'credit union', 'chase', 'bank of america', 'wells fargo', 'citibank', 'us bank', 'business account', 'merchant account', 'payment processing', 'deposit', 'deposited', 'depositing', 'transfer', 'transferred', 'transferring', 'wire', 'wired', 'wiring', 'ach', 'electronic', 'electronic transfer', 'direct deposit', 'direct debit', 'automatic payment', 'auto pay', 'recurring payment', 'scheduled payment', 'standing order', 'bank transfer', 'wire transfer', 'ach transfer', 'electronic transfer', 'direct deposit', 'direct debit', 'automatic payment', 'auto pay', 'recurring payment', 'scheduled payment', 'standing order',
          // Banking and financial terms
          'check', 'checking', 'savings', 'money market', 'cd', 'certificate of deposit', 'loan', 'credit line', 'line of credit', 'overdraft', 'overdraft protection', 'stop payment', 'cancel check', 'replacement check', 'duplicate check', 'check copy', 'bank statement', 'monthly statement', 'quarterly statement', 'annual statement', 'year-end statement', 'bank reconciliation', 'reconciled', 'reconciling', 'bank fees', 'monthly fee', 'quarterly fee', 'annual fee', 'maintenance fee', 'service charge', 'overdraft fee', 'nsf fee', 'returned check fee', 'stop payment fee', 'wire transfer fee', 'ach fee', 'electronic transfer fee', 'paper statement fee', 'check printing fee', 'replacement card fee', 'rush delivery fee', 'overnight delivery fee', 'express delivery fee', 'priority delivery fee'
        ],
        confidence: 'LOW' as const,
        context: 'Cash and banking related'
      }
    ];

    // Find matching category
    console.log('🔍 [SmartSuggest] Analyzing description:', description);
    for (const category of businessCategories) {
      console.log('🔍 [SmartSuggest] Checking category:', category.name, 'keywords:', category.keywords);
      const foundKeywords = category.keywords.filter(keyword => {
        // Check for exact match first
        const exactMatch = description.toLowerCase().includes(keyword.toLowerCase());
        // Check for partial match (keyword starts with description or description starts with keyword)
        const partialMatch = keyword.toLowerCase().startsWith(description.toLowerCase()) || description.toLowerCase().startsWith(keyword.toLowerCase());
        const hasKeyword = exactMatch || partialMatch;
        console.log('🔍 [SmartSuggest] Keyword:', keyword, 'exact:', exactMatch, 'partial:', partialMatch, 'found:', hasKeyword);
        return hasKeyword;
      });
      
      if (foundKeywords.length > 0) {
        console.log('✅ [SmartSuggest] Found keywords:', foundKeywords, 'for category:', category.name);
        return {
          category: category.name,
          confidence: category.confidence,
          keywords: foundKeywords,
          businessContext: category.context
        };
      }
    }

    // No business keywords found
    return {
      category: 'Unknown',
      confidence: 'LOW',
      keywords: [],
      businessContext: 'Personal or unclear transaction'
    };
  }

  private findBestAccountMatch(
    accounts: Account[],
    businessKeywords: any,
    _description: string
  ): { account: Account; confidence: 'HIGH' | 'MEDIUM' | 'LOW' } | null {
    console.log('🔍 [SmartSuggest] Searching best match for category:', businessKeywords.category);
    console.log('📂 [SmartSuggest] Available Accounts:', accounts.map((a: Account) => ({
      name: a.name,
      type: a.type,
      category: a.category,
      financialCategory: a.financialCategory
    })));
    
    // Determine expected account type based on business category
    let expectedAccountType: string | null = null;
    switch (businessKeywords.category) {
      case 'Revenue & Sales':
        expectedAccountType = 'INCOME';
        break;
      case 'Purchases & Inventory':
        expectedAccountType = 'EXPENSE';
        break;
      case 'Operating Expenses':
        expectedAccountType = 'EXPENSE';
        break;
      case 'Payroll & HR':
        expectedAccountType = 'EXPENSE';
        break;
      case 'Taxes & Compliance':
        expectedAccountType = 'EXPENSE';
        break;
      case 'Banking & Cash':
        expectedAccountType = 'ASSET';
        break;
    }
    
    console.log('🎯 [SmartSuggest] Expected account type for category:', expectedAccountType);
    
    let bestMatch = null;
    let bestScore = 0;

    for (const account of accounts) {
      let score = 0;
      
      // HIGHEST PRIORITY: Account type must match expected type
      if (expectedAccountType && account.type !== expectedAccountType) {
        console.log('⏭️ Skipping account', account.name, '- type', account.type, 'does not match expected', expectedAccountType);
        continue;
      }
      
      // Check for exact keyword matches in account name (highest priority)
      const exactKeywordMatch = businessKeywords.keywords.some((keyword: string) => 
        account.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (exactKeywordMatch) {
        score += 80; // Increased from 50
        console.log('✅ [SmartSuggest] Exact keyword match for', account.name, 'with keyword');
      }
      
      // Check for category-specific account name matches (high priority)
      let categorySpecificMatch = false;
      if (businessKeywords.category === 'Purchases & Inventory') {
        const purchaseKeywords = ['supplies', 'equipment', 'inventory', 'materials', 'parts', 'tools', 'machinery', 'hardware', 'software', 'licenses', 'subscriptions', 'office supplies', 'computer', 'laptop', 'printer', 'paper', 'ink', 'toner', 'furniture', 'desk', 'chair', 'table', 'shelf', 'cabinet', 'filing', 'storage', 'boxes', 'packaging', 'shipping supplies', 'labels', 'tape', 'staples', 'pens', 'pencils', 'notebooks', 'folders', 'binders'];
        categorySpecificMatch = purchaseKeywords.some(keyword => {
          const hasKeyword = account.name.toLowerCase().includes(keyword.toLowerCase());
          console.log('🔍 [SmartSuggest] Checking', account.name, 'for keyword:', keyword, 'found:', hasKeyword);
          return hasKeyword;
        });
      } else if (businessKeywords.category === 'Revenue & Sales') {
        const revenueKeywords = ['sales', 'revenue', 'income', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment', 'customer', 'client', 'retail', 'wholesale', 'consulting', 'fee', 'project', 'billing', 'charged', 'receipt', 'received', 'paid', 'cash', 'check', 'credit', 'debit', 'transfer', 'deposit', 'withdrawal'];
        categorySpecificMatch = revenueKeywords.some(keyword => 
          account.name.toLowerCase().includes(keyword.toLowerCase())
        );
      }
      if (categorySpecificMatch) {
        score += 60; // High priority for category-specific matches
        console.log('✅ [SmartSuggest] Category-specific match for', account.name, 'score +60');
      }
      
      // Check category field match
      const categoryMatch = account.category?.toLowerCase().includes(businessKeywords.category.toLowerCase());
      if (categoryMatch) {
        score += 40; // Increased from 30
        console.log('✅ [SmartSuggest] Category field match for', account.name);
      }
      
      // Check subcategory match
      const subcategoryMatch = account.subcategory?.toLowerCase().includes(businessKeywords.category.toLowerCase());
      if (subcategoryMatch) {
        score += 30; // Increased from 20
        console.log('✅ [SmartSuggest] Subcategory match for', account.name);
      }
      
      // Bonus for recently used accounts (reduced weight)
      const daysSinceUpdate = (Date.now() - new Date(account.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        score += 5; // Reduced from 10
        console.log('✅ [SmartSuggest] Recently used bonus for', account.name);
      }

      console.log('📊 [SmartSuggest] Account', account.name, 'final score:', score);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { account, confidence: businessKeywords.confidence };
      }
    }

    console.log('✅ [SmartSuggest] Best Match:', bestMatch?.account?.name ?? 'No match found');
    console.log('📊 [SmartSuggest] Best Score:', bestScore);
    
    return bestMatch;
  }

  private determineEntryType(account: Account, _businessKeywords: any): 'DEBIT' | 'CREDIT' {
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

  private generateReason(account: Account, businessKeywords: any, _description: string): string {
    const keyword = businessKeywords.keywords[0] || 'transaction';
    const context = businessKeywords.businessContext;
    
    return `Based on "${keyword}" in your description, this appears to be a ${context.toLowerCase()}. I've suggested ${account.name} which is typically used for ${account.category || 'business'} transactions.`;
  }

  private generateToneMessage(businessKeywords: any, account: Account): string {
    if (businessKeywords.confidence === 'HIGH') {
      return `This looks like a clear business transaction. ${account.name} is a good match for ${businessKeywords.category.toLowerCase()} expenses.`;
    } else if (businessKeywords.confidence === 'MEDIUM') {
      return `This could be a business expense. Consider using ${account.name} for proper categorization.`;
    } else {
      return `I'm not entirely sure about this transaction. You may want to review the account selection.`;
    }
  }

  private classifyAccount(businessKeywords: any, _account: Account): {
    accountType: string;
    category: string;
    financialCategory: string;
  } {
    // Map business keywords to account classification
    const classificationMap = {
      'Revenue & Sales': {
        accountType: 'INCOME',
        category: 'Sales',
        financialCategory: 'OPERATING_REVENUE'
      },
      'Purchases & Inventory': {
        accountType: 'EXPENSE',
        category: 'Cost of Goods Sold',
        financialCategory: 'OPERATING_EXPENSE'
      },
      'Operating Expenses': {
        accountType: 'EXPENSE',
        category: 'Operating Expenses',
        financialCategory: 'OPERATING_EXPENSE'
      },
      'Payroll & HR': {
        accountType: 'EXPENSE',
        category: 'Payroll',
        financialCategory: 'OPERATING_EXPENSE'
      },
      'Taxes & Compliance': {
        accountType: 'EXPENSE',
        category: 'Taxes',
        financialCategory: 'OPERATING_EXPENSE'
      },
      'Banking & Cash': {
        accountType: 'ASSET',
        category: 'Cash',
        financialCategory: 'CURRENT_ASSET'
      }
    };

    const category = businessKeywords.category;
    const defaultClassification = {
      accountType: 'EXPENSE',
      category: 'Other',
      financialCategory: 'OPERATING_EXPENSE'
    };

    return classificationMap[category as keyof typeof classificationMap] || defaultClassification;
  }

  private convertConfidenceToNumber(confidence: 'HIGH' | 'MEDIUM' | 'LOW'): number {
    switch (confidence) {
      case 'HIGH':
        return 90;
      case 'MEDIUM':
        return 70;
      case 'LOW':
        return 30;
      default:
        return 50;
    }
  }
} 