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
        console.log('❌ No suitable account match found');
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
        keywords: ['sold', 'sale', 'sales', 'revenue', 'income', 'earnings', 'profit', 'commission', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment received', 'customer payment', 'client payment', 'customer', 'client', 'retail', 'wholesale', 'consulting fee', 'service fee', 'project payment'],
        confidence: 'HIGH' as const,
        context: 'Business revenue transaction'
      },
      {
        name: 'Purchases & Inventory',
        keywords: ['purchase', 'buy', 'bought', 'buying', 'procurement', 'inventory', 'stock', 'supplies', 'equipment', 'materials', 'vendor', 'supplier', 'cost of goods', 'cogs', 'inventory purchase', 'raw materials', 'component', 'part', 'tool', 'machinery'],
        confidence: 'HIGH' as const,
        context: 'Business purchase transaction'
      },
      {
        name: 'Operating Expenses',
        keywords: ['rent', 'lease', 'utilities', 'electricity', 'water', 'internet', 'phone', 'insurance', 'marketing', 'advertising', 'promotion', 'travel', 'transportation', 'meals', 'lodging', 'legal', 'attorney', 'accounting', 'bookkeeping', 'cpa', 'software', 'subscription', 'saas'],
        confidence: 'MEDIUM' as const,
        context: 'Business operating expense'
      },
      {
        name: 'Payroll & HR',
        keywords: ['payroll', 'wages', 'salary', 'employee', 'staff', 'bonus', 'commission', 'benefits', 'health insurance', 'retirement', '401k', 'pension'],
        confidence: 'MEDIUM' as const,
        context: 'Payroll and human resources'
      },
      {
        name: 'Taxes & Compliance',
        keywords: ['tax', 'taxes', 'irs', 'income tax', 'sales tax', 'property tax', 'payroll tax', 'withholding', 'filing', 'compliance'],
        confidence: 'MEDIUM' as const,
        context: 'Tax and compliance related'
      },
      {
        name: 'Banking & Cash',
        keywords: ['atm', 'withdrawal', 'cash', 'bank', 'credit union', 'chase', 'bank of america', 'wells fargo', 'citibank', 'us bank', 'business account', 'merchant account', 'payment processing'],
        confidence: 'LOW' as const,
        context: 'Cash and banking related'
      }
    ];

    // Find matching category
    for (const category of businessCategories) {
      const foundKeywords = category.keywords.filter(keyword => 
        description.includes(keyword)
      );
      
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
    let bestMatch = null;
    let bestScore = 0;

    for (const account of accounts) {
      let score = 0;
      
      // Check for exact keyword matches in account name (highest priority)
      const exactKeywordMatch = businessKeywords.keywords.some((keyword: string) => 
        account.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (exactKeywordMatch) {
        score += 50;
      }
      
      // Check category match
      const categoryMatch = account.category?.toLowerCase().includes(businessKeywords.category.toLowerCase());
      if (categoryMatch) {
        score += 30;
      }
      
      // Check subcategory match
      const subcategoryMatch = account.subcategory?.toLowerCase().includes(businessKeywords.category.toLowerCase());
      if (subcategoryMatch) {
        score += 20;
      }
      
      // Bonus for recently used accounts
      const daysSinceUpdate = (Date.now() - new Date(account.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        score += 10;
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