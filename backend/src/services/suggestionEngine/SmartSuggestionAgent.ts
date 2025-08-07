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
      // Normalize description
      const normalizedDescription = this.normalizeDescription(request.description);
      
      // Don't suggest for very short descriptions (less than 4 characters)
      // This prevents "initi" from triggering suggestions
      if (normalizedDescription.length < 4) {
        console.log('⏭️ [SmartSuggest] Description too short (', normalizedDescription.length, 'chars), skipping suggestion');
        return null;
      }
      
      // Get user's accounts
      const userAccounts = await this.accountRepo.find({
        where: { user: { id: request.userId } },
        order: { updatedAt: 'DESC' }
      });

      if (userAccounts.length === 0) {
        return null;
      }

      // Business-focused keyword analysis
      const businessKeywords = this.analyzeBusinessKeywords(normalizedDescription);
      
      if (businessKeywords.confidence === 'LOW') {
        return null;
      }

      // Find best matching account
      const bestMatch = this.findBestAccountMatch(
        userAccounts,
        businessKeywords,
        normalizedDescription
      );

      if (!bestMatch) {
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
          // Core business revenue terms
          'sold', 'sale', 'sales', 'revenue', 'income', 'earnings', 'profit', 'commission', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment received', 'customer payment', 'client payment', 'customer', 'client', 'retail', 'wholesale', 'consulting fee', 'service fee', 'project payment',
          // Business transaction terms
          'billing', 'billed', 'charge', 'charged', 'receipt', 'received', 'payment', 'paid', 'cash', 'check', 'credit', 'debit', 'transfer', 'deposit', 'withdrawal',
          // Business service terms
          'consulting', 'professional service', 'contract work', 'project work', 'client work', 'customer work', 'service rendered', 'work completed', 'job completed', 'project completed'
        ],
        confidence: 'HIGH' as const,
        context: 'Business revenue transaction'
      },
      {
        name: 'Purchases & Inventory',
        keywords: [
          // Core business purchase terms
          'purchase', 'buy', 'bought', 'buying', 'procurement', 'inventory', 'stock', 'supplies', 'equipment', 'materials', 'vendor', 'supplier', 'cost of goods', 'cogs', 'inventory purchase', 'raw materials', 'component', 'part', 'tool', 'machinery',
          // Business purchase variations
          'purchased', 'buying', 'bought', 'buy', 'procure', 'procurement', 'inventory', 'stock', 'supplies', 'equipment', 'materials', 'vendor', 'supplier', 'cost', 'goods', 'cogs', 'raw', 'component', 'part', 'tool', 'machinery',
          // Business purchase terms
          'order', 'ordered', 'ordering', 'shipping', 'shipped', 'delivery', 'delivered', 'receiving', 'received', 'stock', 'inventory', 'supplies', 'equipment', 'materials', 'parts', 'tools', 'machinery', 'hardware', 'software', 'licenses', 'subscriptions',
          // Common business purchases
          'office supplies', 'computer', 'laptop', 'printer', 'paper', 'ink', 'toner', 'furniture', 'desk', 'chair', 'table', 'shelf', 'cabinet', 'filing', 'storage', 'boxes', 'packaging', 'shipping supplies', 'labels', 'tape', 'staples', 'pens', 'pencils', 'notebooks', 'folders', 'binders',
          // Business equipment and tools
          'business equipment', 'office equipment', 'work equipment', 'professional tools', 'business tools', 'work tools', 'business supplies', 'office supplies', 'work supplies'
        ],
        confidence: 'HIGH' as const,
        context: 'Business purchase transaction'
      },
      {
        name: 'Operating Expenses',
        keywords: [
          // Core business operating expense terms
          'rent', 'lease', 'utilities', 'electricity', 'water', 'internet', 'phone', 'insurance', 'marketing', 'advertising', 'promotion', 'travel', 'transportation', 'meals', 'lodging', 'legal', 'attorney', 'accounting', 'bookkeeping', 'cpa', 'software', 'subscription', 'saas',
          // Business expense variations
          'rental', 'leased', 'leasing', 'utility', 'electric', 'power', 'gas', 'sewer', 'trash', 'garbage', 'wifi', 'broadband', 'telephone', 'mobile', 'cell', 'cellular', 'insurance', 'marketing', 'advertise', 'promote', 'travel', 'transport', 'meal', 'lunch', 'dinner', 'breakfast', 'lodging', 'hotel', 'motel', 'legal', 'lawyer', 'attorney', 'accounting', 'bookkeeping', 'cpa', 'software', 'subscription', 'saas',
          // Business expense terms
          'office', 'workspace', 'co-working', 'meeting', 'conference', 'seminar', 'training', 'education', 'certification', 'license', 'permit', 'registration', 'membership', 'dues', 'fees', 'charges', 'bills', 'expenses', 'costs', 'overhead', 'operating', 'maintenance', 'repair', 'service', 'cleaning', 'janitorial', 'security', 'alarm', 'monitoring', 'backup', 'storage', 'cloud', 'hosting', 'domain', 'website', 'email', 'voip', 'phone system', 'internet service', 'broadband', 'fiber', 'cable', 'satellite',
          // Business-specific terms
          'business rent', 'office rent', 'commercial rent', 'business lease', 'office lease', 'commercial lease', 'business utilities', 'office utilities', 'business insurance', 'commercial insurance', 'business marketing', 'commercial advertising', 'business travel', 'work travel', 'business meals', 'work meals', 'business legal', 'commercial legal', 'business accounting', 'commercial accounting'
        ],
        confidence: 'MEDIUM' as const,
        context: 'Business operating expense'
      },
      {
        name: 'Payroll & HR',
        keywords: [
          // Core business payroll terms
          'payroll', 'wages', 'salary', 'employee', 'staff', 'bonus', 'commission', 'benefits', 'health insurance', 'retirement', '401k', 'pension',
          // Business payroll variations
          'pay', 'paid', 'payment', 'wage', 'salary', 'employee', 'staff', 'worker', 'bonus', 'commission', 'benefit', 'health', 'insurance', 'retirement', '401k', 'pension', 'hiring', 'hired', 'firing', 'fired', 'layoff', 'layoff', 'termination', 'terminated', 'resignation', 'resigned', 'quit', 'quitting',
          // Business HR and employment terms
          'hr', 'human resources', 'personnel', 'hiring', 'recruitment', 'interview', 'application', 'resume', 'cv', 'background check', 'drug test', 'physical', 'medical', 'dental', 'vision', 'life insurance', 'disability', 'workers comp', 'workers compensation', 'unemployment', 'social security', 'fica', 'medicare', 'withholding', 'garnish', 'garnishment', 'child support', 'alimony', 'tax withholding', 'federal tax', 'state tax', 'local tax',
          // Business-specific payroll terms
          'business payroll', 'company payroll', 'employee payroll', 'staff payroll', 'business wages', 'company wages', 'employee wages', 'business salary', 'company salary', 'employee salary', 'business benefits', 'company benefits', 'employee benefits', 'business insurance', 'company insurance', 'employee insurance'
        ],
        confidence: 'MEDIUM' as const,
        context: 'Payroll and human resources'
      },
      {
        name: 'Taxes & Compliance',
        keywords: [
          // Core business tax terms
          'tax', 'taxes', 'irs', 'income tax', 'sales tax', 'property tax', 'payroll tax', 'withholding', 'filing', 'compliance',
          // Business tax variations
          'tax', 'taxes', 'irs', 'income', 'sales', 'property', 'payroll', 'withholding', 'filing', 'compliance', 'audit', 'audited', 'auditing', 'penalty', 'penalties', 'fine', 'fines', 'late', 'extension', 'amendment', 'amended', 'quarterly', 'quarter', 'annual', 'yearly', 'monthly', 'weekly', 'daily',
          // Business tax and compliance terms
          'federal tax', 'state tax', 'local tax', 'city tax', 'county tax', 'property tax', 'real estate tax', 'personal property tax', 'business tax', 'corporate tax', 'partnership tax', 'llc tax', 's-corp tax', 'c-corp tax', 'sole proprietorship tax', 'self-employment tax', 'estimated tax', 'quarterly tax', 'annual tax', 'extension', 'amendment', 'audit', 'penalty', 'interest', 'late fee', 'filing fee', 'processing fee', 'electronic filing', 'e-file', 'paper filing', 'mail', 'postal', 'certified mail', 'registered mail', 'return receipt', 'proof of mailing', 'postmark', 'postmarked',
          // Business-specific tax terms
          'business tax', 'company tax', 'corporate tax', 'business income tax', 'company income tax', 'business sales tax', 'company sales tax', 'business property tax', 'company property tax', 'business payroll tax', 'company payroll tax', 'business withholding', 'company withholding', 'business filing', 'company filing', 'business compliance', 'company compliance'
        ],
        confidence: 'MEDIUM' as const,
        context: 'Tax and compliance related'
      },
      {
        name: 'Banking & Cash',
        keywords: [
          // Core business banking terms
          'atm', 'withdrawal', 'cash', 'bank', 'credit union', 'chase', 'bank of america', 'wells fargo', 'citibank', 'us bank', 'business account', 'merchant account', 'payment processing',
          // Business banking variations
          'atm', 'withdraw', 'withdrawal', 'cash', 'bank', 'credit union', 'chase', 'bank of america', 'wells fargo', 'citibank', 'us bank', 'business account', 'merchant account', 'payment processing', 'deposit', 'deposited', 'depositing', 'transfer', 'transferred', 'transferring', 'wire', 'wired', 'wiring', 'ach', 'electronic', 'electronic transfer', 'direct deposit', 'direct debit', 'automatic payment', 'auto pay', 'recurring payment', 'scheduled payment', 'standing order', 'bank transfer', 'wire transfer', 'ach transfer', 'electronic transfer', 'direct deposit', 'direct debit', 'automatic payment', 'auto pay', 'recurring payment', 'scheduled payment', 'standing order',
          // Business banking and financial terms
          'check', 'checking', 'savings', 'money market', 'cd', 'certificate of deposit', 'loan', 'credit line', 'line of credit', 'overdraft', 'overdraft protection', 'stop payment', 'cancel check', 'replacement check', 'duplicate check', 'check copy', 'bank statement', 'monthly statement', 'quarterly statement', 'annual statement', 'year-end statement', 'bank reconciliation', 'reconciled', 'reconciling', 'bank fees', 'monthly fee', 'quarterly fee', 'annual fee', 'maintenance fee', 'service charge', 'overdraft fee', 'nsf fee', 'returned check fee', 'stop payment fee', 'wire transfer fee', 'ach fee', 'electronic transfer fee', 'paper statement fee', 'check printing fee', 'replacement card fee', 'rush delivery fee', 'overnight delivery fee', 'express delivery fee', 'priority delivery fee',
          // Business-specific banking terms
          'business account', 'company account', 'business checking', 'company checking', 'business savings', 'company savings', 'business loan', 'company loan', 'business credit', 'company credit', 'business banking', 'company banking', 'business cash', 'company cash', 'business deposit', 'company deposit', 'business withdrawal', 'company withdrawal', 'business transfer', 'company transfer'
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
        return hasKeyword;
      });
      
      if (foundKeywords.length > 0) {
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
        score += 100; // Highest priority for exact keyword matches
        console.log('✅ [SmartSuggest] Exact keyword match for', account.name, 'with keyword');
      }
      
      // Check for category-specific account name matches (high priority)
      let categorySpecificMatch = false;
      let categorySpecificScore = 0;
      if (businessKeywords.category === 'Purchases & Inventory') {
        // Primary purchase keywords (highest priority)
        const primaryPurchaseKeywords = ['supplies', 'equipment', 'inventory', 'materials', 'parts', 'tools', 'machinery'];
        const primaryMatch = primaryPurchaseKeywords.some(keyword => {
          const accountNameLower = account.name.toLowerCase();
          const keywordLower = keyword.toLowerCase();
          
          const hasKeyword = accountNameLower === keywordLower || 
                           accountNameLower.includes(` ${keywordLower} `) ||
                           accountNameLower.startsWith(`${keywordLower} `) ||
                           accountNameLower.endsWith(` ${keywordLower}`);
          
          return hasKeyword;
        });
        if (primaryMatch) {
          categorySpecificScore = 90; // Very high priority for primary purchase keywords
        } else {
          // Secondary purchase keywords (medium priority)
          const secondaryPurchaseKeywords = ['hardware', 'software', 'licenses', 'subscriptions', 'office supplies', 'computer', 'laptop', 'printer', 'paper', 'ink', 'toner', 'furniture', 'desk', 'chair', 'table', 'shelf', 'cabinet', 'filing', 'storage', 'boxes', 'packaging', 'shipping supplies', 'labels', 'tape', 'staples', 'pens', 'pencils', 'notebooks', 'folders', 'binders'];
          const secondaryMatch = secondaryPurchaseKeywords.some(keyword => {
            const accountNameLower = account.name.toLowerCase();
            const keywordLower = keyword.toLowerCase();
            
            // Use word boundary matching to avoid substring issues
            const hasKeyword = accountNameLower === keywordLower || 
                             accountNameLower.includes(` ${keywordLower} `) ||
                             accountNameLower.startsWith(`${keywordLower} `) ||
                             accountNameLower.endsWith(` ${keywordLower}`);
            
            return hasKeyword;
          });
          if (secondaryMatch) {
            categorySpecificScore = 70; // Medium priority for secondary purchase keywords
          }
        }
        categorySpecificMatch = primaryMatch || categorySpecificScore > 0;
      } else if (businessKeywords.category === 'Revenue & Sales') {
        const revenueKeywords = ['sales', 'revenue', 'income', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment', 'customer', 'client', 'retail', 'wholesale', 'consulting', 'fee', 'project', 'billing', 'charged', 'receipt', 'received', 'paid', 'cash', 'check', 'credit', 'debit', 'transfer', 'deposit', 'withdrawal'];
        categorySpecificMatch = revenueKeywords.some(keyword => {
          const accountNameLower = account.name.toLowerCase();
          const keywordLower = keyword.toLowerCase();
          
          const hasKeyword = accountNameLower === keywordLower || 
                           accountNameLower.includes(` ${keywordLower} `) ||
                           accountNameLower.startsWith(`${keywordLower} `) ||
                           accountNameLower.endsWith(` ${keywordLower}`);
          
          return hasKeyword;
        });
        if (categorySpecificMatch) {
          categorySpecificScore = 80;
        }
      }
      if (categorySpecificMatch) {
        score += categorySpecificScore;
      }
      
      // Check category field match
      const categoryMatch = account.category?.toLowerCase().includes(businessKeywords.category.toLowerCase());
      if (categoryMatch) {
        score += 40; // Increased from 30
      }
      
      // Check subcategory match
      const subcategoryMatch = account.subcategory?.toLowerCase().includes(businessKeywords.category.toLowerCase());
      if (subcategoryMatch) {
        score += 30; // Increased from 20
      }
      
      // Bonus for recently used accounts (reduced weight)
      const daysSinceUpdate = (Date.now() - new Date(account.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        score += 5; // Reduced from 10
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { account, confidence: businessKeywords.confidence };
      }
    }
    
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