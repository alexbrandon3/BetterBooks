import React, { useState } from 'react';
import { Layout, Paper, Typography, Box, Chip } from '@mui/material';
import { JournalEntry } from '../types/JournalEntry';
import { CHART_OF_ACCOUNTS } from '../constants/chartOfAccounts';

interface IndustryContext {
  type: string;
  keywords: string[];
  accountMappings: Record<string, string[]>;
}

interface AccountMapping {
  account: string;
  keywords: string[];
  patterns: RegExp[];
  vendors?: string[];
  defaultFor?: string[];
  confidenceBoost?: number;
  tags?: string[];
  industrySpecific?: boolean;
  priority?: number;
}

interface AccountPrediction {
  account: string;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{
    account: string;
    confidence: number;
    reasoning: string;
  }>;
  needsMoreInfo?: boolean;
  suggestedQuestions?: string[];
}

// Industry-specific contexts
const INDUSTRY_CONTEXTS: Record<string, IndustryContext> = {
  landscaping: {
    type: 'landscaping',
    keywords: ['landscape', 'garden', 'lawn', 'drainage', 'irrigation'],
    accountMappings: {
      'Subcontractor Expense': ['contractor', 'labor', 'crew', 'help', 'worker'],
      'Materials': ['soil', 'plants', 'mulch', 'fertilizer', 'pavers'],
      'Equipment Rental': ['rental', 'machine', 'truck', 'trailer'],
    },
  },
  construction: {
    type: 'construction',
    keywords: ['build', 'construction', 'contractor', 'subcontractor', 'job site'],
    accountMappings: {
      'Subcontractor Expense': ['contractor', 'subcontractor', 'labor', 'crew'],
      'Materials': ['lumber', 'concrete', 'drywall', 'paint', 'supplies'],
      'Equipment Rental': ['rental', 'machine', 'truck', 'trailer'],
    },
  },
  retail: {
    type: 'retail',
    keywords: ['store', 'retail', 'merchandise', 'inventory', 'sales'],
    accountMappings: {
      'Cost of Goods Sold': ['inventory', 'merchandise', 'product', 'stock'],
      'Advertising': ['ad', 'marketing', 'promotion', 'social media'],
      'Store Supplies': ['supplies', 'bags', 'boxes', 'packaging'],
    },
  },
};

// Enhanced account mappings with detailed keywords and patterns
const ACCOUNT_MAPPINGS: Record<string, AccountMapping[]> = {
  expense: [
    {
      account: CHART_OF_ACCOUNTS.cogs.subcontractor,
      keywords: ['contractor', 'subcontractor', 'helper', 'temp labor', 'crew', 'worker', 'labor', 'help', 'construction', 'build'],
      patterns: [/paid\s*to\s*contractor/i, /hired\s*labor/i, /subcontractor\s*work/i, /contractor\s*payment/i, /construction\s*labor/i],
      vendors: ['labor', 'crew', 'helper', 'contractor', 'subcontractor', 'construction'],
      confidenceBoost: 0.3,
      tags: ['labor', 'external', 'job-related'],
      industrySpecific: true,
      priority: 1,
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.advertising,
      keywords: ['facebook', 'instagram', 'adwords', 'google ads', 'seo', 'marketing', 'promotion', 'social media'],
      patterns: [/marketing\s*campaign/i, /ad\s*campaign/i, /social\s*media\s*ad/i],
      vendors: ['google ads', 'facebook ads', 'linkedin ads', 'instagram ads'],
      tags: ['marketing', 'promotion'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.software,
      keywords: ['adobe', 'microsoft', 'software', 'license', 'subscription', 'saas', 'app'],
      patterns: [/software\s*subscription/i, /saas\s*service/i],
      vendors: ['adobe', 'microsoft', 'quickbooks', 'salesforce', 'slack', 'zoom'],
      tags: ['technology', 'subscription'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.meals,
      keywords: ['restaurant', 'lunch', 'dinner', 'coffee', 'cafe', 'meal', 'food'],
      patterns: [/business\s*lunch/i, /client\s*meeting\s*food/i],
      vendors: ['restaurant', 'cafe', 'coffee shop', 'food'],
      tags: ['entertainment', 'food'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.office_supplies,
      keywords: ['staples', 'office depot', 'paper', 'pens', 'printer ink', 'supplies', 'stationery'],
      patterns: [/office\s*supplies/i, /stationery\s*purchase/i],
      vendors: ['staples', 'office depot', 'amazon office'],
      tags: ['supplies', 'office'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.bank_fees,
      keywords: ['stripe', 'square', 'merchant fees', 'bank charge', 'processing fee'],
      patterns: [/merchant\s*fee/i, /processing\s*fee/i],
      vendors: ['stripe', 'square', 'paypal', 'bank'],
      tags: ['fees', 'banking'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.insurance,
      keywords: ['insurance', 'liability', 'coverage', 'policy', 'premium'],
      patterns: [/insurance\s*premium/i, /policy\s*payment/i],
      vendors: ['insurance', 'coverage'],
      tags: ['insurance', 'protection'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.utilities,
      keywords: ['electric', 'water', 'utility', 'spectrum', 'at&t', 'internet', 'phone'],
      patterns: [/utility\s*bill/i, /service\s*charge/i],
      vendors: ['utility', 'service provider'],
      tags: ['utilities', 'services'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.rent,
      keywords: ['rent', 'lease', 'office space', 'rental'],
      patterns: [/rent\s*payment/i, /lease\s*payment/i],
      vendors: ['landlord', 'property management'],
      tags: ['rent', 'property'],
    },
    {
      account: CHART_OF_ACCOUNTS.assets.equipment,
      keywords: ['tools', 'equipment', 'mower', 'saw', 'drill', 'computer'],
      patterns: [/equipment\s*purchase/i, /tool\s*purchase/i],
      vendors: ['equipment', 'tools'],
      tags: ['equipment', 'assets'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.training,
      keywords: ['training', 'seminar', 'webinar', 'education', 'course'],
      patterns: [/training\s*course/i, /professional\s*development/i],
      vendors: ['training', 'education'],
      tags: ['training', 'development'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.professional_services,
      keywords: ['accountant', 'lawyer', 'cpa', 'legal', 'consultant'],
      patterns: [/professional\s*service/i, /consulting\s*fee/i],
      vendors: ['professional', 'consultant'],
      tags: ['professional', 'services'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.repairs,
      keywords: ['vehicle repair', 'tire', 'oil change', 'mechanic', 'repair', 'maintenance'],
      patterns: [/repair\s*service/i, /maintenance\s*work/i],
      vendors: ['repair', 'maintenance'],
      tags: ['repairs', 'maintenance'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.taxes,
      keywords: ['tax', 'irs', 'filing', 'taxes', 'license'],
      patterns: [/tax\s*payment/i, /license\s*fee/i],
      vendors: ['tax', 'license'],
      tags: ['taxes', 'licenses'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.travel,
      keywords: ['travel', 'flight', 'hotel', 'uber', 'lyft', 'transportation'],
      patterns: [/travel\s*expense/i, /transportation\s*cost/i],
      vendors: ['travel', 'transportation'],
      tags: ['travel', 'transportation'],
    },
    {
      account: CHART_OF_ACCOUNTS.expenses.wages,
      keywords: ['wages', 'payroll', 'paycheck', 'direct deposit', 'salary'],
      patterns: [/payroll\s*payment/i, /salary\s*payment/i],
      vendors: ['payroll', 'salary'],
      tags: ['payroll', 'wages'],
    },
  ],
  income: [
    {
      account: CHART_OF_ACCOUNTS.income.service_revenue,
      keywords: ['service', 'consulting', 'professional', 'work', 'project'],
      patterns: [/service\s*provided/i, /consulting\s*work/i],
    },
    {
      account: CHART_OF_ACCOUNTS.income.product_sales,
      keywords: ['sale', 'product', 'merchandise', 'inventory', 'item'],
      patterns: [/product\s*sale/i, /merchandise\s*sale/i],
    },
  ],
};

const JournalEntryPage: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [industryContext, setIndustryContext] = useState<IndustryContext | null>(null);
  const [userCorrections, setUserCorrections] = useState<Array<{
    description: string;
    selectedAccount: string;
    timestamp: Date;
  }>>([]);

  // Function to detect industry context from description
  const detectIndustryContext = (description: string): IndustryContext | null => {
    const lowerDesc = description.toLowerCase();
    for (const [key, context] of Object.entries(INDUSTRY_CONTEXTS)) {
      if (context.keywords.some(keyword => lowerDesc.includes(keyword))) {
        return context;
      }
    }
    return null;
  };

  // Test cases for account prediction
  const TEST_CASES = [
    { description: 'rent', expectedAccount: CHART_OF_ACCOUNTS.expenses.other },
    { description: 'gas', expectedAccount: CHART_OF_ACCOUNTS.expenses.other },
    { description: 'fuel', expectedAccount: CHART_OF_ACCOUNTS.expenses.other },
    { description: 'contractor payment', expectedAccount: CHART_OF_ACCOUNTS.cogs.subcontractor },
    { description: 'office supplies', expectedAccount: CHART_OF_ACCOUNTS.expenses.office_supplies },
  ];

  // Enhanced account prediction with fallback logic
  const getSuggestedAccount = (description: string, entryType: 'debit' | 'credit'): AccountPrediction | null => {
    const lowerDesc = description.toLowerCase();
    const mappings = ACCOUNT_MAPPINGS[entryType === 'debit' ? 'expense' : 'income'] || [];
    const detectedIndustry = detectIndustryContext(description);
    
    let bestMatch: AccountPrediction | null = null;
    const alternatives: AccountPrediction[] = [];

    // Check user corrections first
    const userCorrection = userCorrections.find(correction => 
      correction.description.toLowerCase() === lowerDesc
    );
    if (userCorrection) {
      return {
        account: userCorrection.selectedAccount,
        confidence: 0.95,
        reasoning: 'Based on your previous correction for similar transactions',
      };
    }

    // Sort mappings by priority first
    const sortedMappings = [...mappings].sort((a, b) => (a.priority || 0) - (b.priority || 0));

    // Check for exact matches first
    for (const mapping of sortedMappings) {
      let confidence = 0;
      let reasoning = '';

      // Check for exact keyword matches
      if (mapping.keywords.some(keyword => 
        lowerDesc.includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(lowerDesc)
      )) {
        confidence = 0.9;
        reasoning = 'Exact keyword match found';
      }
      // Check for pattern matches
      else if (mapping.patterns.some(pattern => pattern.test(description))) {
        confidence = 0.8;
        reasoning = 'Pattern match found';
      }
      // Check for vendor matches
      else if (mapping.vendors?.some(vendor => lowerDesc.includes(vendor.toLowerCase()))) {
        confidence = 0.85;
        reasoning = 'Vendor match found';
      }
      // Check for partial matches
      else {
        const partialMatch = mapping.keywords.some(keyword => {
          const words = keyword.split(/[\s,]+/);
          return words.some(word => lowerDesc.includes(word.toLowerCase()));
        });
        if (partialMatch) {
          confidence = 0.6;
          reasoning = 'Partial keyword match found';
        }
      }

      // Apply industry-specific boost
      if (mapping.industrySpecific && detectedIndustry) {
        const industryMapping = detectedIndustry.accountMappings[mapping.account];
        if (industryMapping?.some(keyword => lowerDesc.includes(keyword))) {
          confidence += 0.1;
          reasoning += ' (Industry context boost)';
        }
      }

      // Apply confidence boost if specified
      if (mapping.confidenceBoost) {
        confidence += mapping.confidenceBoost;
      }

      // Apply priority boost
      if (mapping.priority === 1) {
        confidence += 0.2;
        reasoning += ' (High priority match)';
      }

      if (confidence > 0) {
        const prediction: AccountPrediction = {
          account: mapping.account,
          confidence,
          reasoning,
        };

        if (!bestMatch || confidence > bestMatch.confidence) {
          if (bestMatch) {
            alternatives.push(bestMatch);
          }
          bestMatch = prediction;
        } else {
          alternatives.push(prediction);
        }
      }
    }

    // If no good matches found or confidence is too low, always prompt for more details
    if (!bestMatch || bestMatch.confidence < 0.7) {
      return {
        account: CHART_OF_ACCOUNTS.expenses.other,
        confidence: 0.3,
        reasoning: 'Please provide more details about this transaction to help us categorize it correctly.',
        alternatives: [
          {
            account: CHART_OF_ACCOUNTS.expenses.other,
            confidence: 0.3,
            reasoning: 'Consider adding more context like: vendor name, purpose, or specific service/product',
          },
        ],
        needsMoreInfo: true,
        suggestedQuestions: [
          'What type of expense is this?',
          'Who is the vendor?',
          'What was purchased or what service was provided?',
          'Is this related to a specific project or job?',
        ],
      };
    }

    // Sort alternatives by confidence
    alternatives.sort((a, b) => b.confidence - a.confidence);

    if (bestMatch) {
      bestMatch.alternatives = alternatives.slice(0, 2);
    }

    return bestMatch;
  };

  // Function to handle user corrections
  const handleAccountSelect = (entryId: string, account: string, side: 'debit' | 'credit') => {
    setJournalEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          [side]: {
            ...entry[side],
            account,
          },
        };
      }
      return entry;
    }));

    // Store user correction for learning
    const entry = journalEntries.find(e => e.id === entryId);
    if (entry?.description) {
      setUserCorrections(prev => [
        ...prev,
        {
          description: entry.description,
          selectedAccount: account,
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Function to analyze journal entry
  const analyzeEntry = (entry: JournalEntry) => {
    const debitPrediction = getSuggestedAccount(entry.description, 'debit');
    const creditPrediction = getSuggestedAccount(entry.description, 'credit');

    // If we need more information or confidence is low, return a prompt for details
    if (!debitPrediction || debitPrediction.confidence < 0.7) {
      return {
        debit: {
          account: CHART_OF_ACCOUNTS.expenses.other,
          confidence: 0.3,
          reasoning: 'Please provide more details about this transaction to help us categorize it correctly.',
          alternatives: [
            {
              account: CHART_OF_ACCOUNTS.expenses.other,
              confidence: 0.3,
              reasoning: 'Consider adding more context like: vendor name, purpose, or specific service/product',
            },
          ],
          needsMoreInfo: true,
          suggestedQuestions: [
            'What type of expense is this?',
            'Who is the vendor?',
            'What was purchased or what service was provided?',
            'Is this related to a specific project or job?',
          ],
        },
        credit: {
          account: creditPrediction?.account || CHART_OF_ACCOUNTS.income.other_income,
          confidence: creditPrediction?.confidence || 0.42,
          reasoning: creditPrediction?.reasoning || 'No specific prediction available',
          alternatives: creditPrediction?.alternatives,
        },
      };
    }

    // For all other cases, use the predictions from getSuggestedAccount
    return {
      debit: {
        account: debitPrediction.account,
        confidence: debitPrediction.confidence,
        reasoning: debitPrediction.reasoning,
        alternatives: debitPrediction.alternatives || [],
      },
      credit: {
        account: creditPrediction?.account || CHART_OF_ACCOUNTS.income.other_income,
        confidence: creditPrediction?.confidence || 0.42,
        reasoning: creditPrediction?.reasoning || 'No specific prediction available',
        alternatives: creditPrediction?.alternatives,
      },
    };
  };

  // Test the account prediction logic
  const testAccountPrediction = () => {
    console.log('Testing account prediction logic...');
    
    // Direct test for fuel expense
    const fuelTest = getSuggestedAccount('fuel', 'debit');
    console.log('Fuel test result:', {
      account: fuelTest?.account,
      confidence: fuelTest?.confidence,
      needsMoreInfo: fuelTest?.needsMoreInfo,
      reasoning: fuelTest?.reasoning
    });
    
    // Verify it's not fuel expense
    if (fuelTest?.account === CHART_OF_ACCOUNTS.expenses.fuel) {
      console.error('ERROR: Fuel expense is still being returned as default!');
    }

    TEST_CASES.forEach(testCase => {
      const prediction = getSuggestedAccount(testCase.description, 'debit');
      console.log(`Test case: "${testCase.description}"`);
      console.log(`Expected account: ${testCase.expectedAccount}`);
      console.log(`Actual account: ${prediction?.account}`);
      console.log(`Confidence: ${prediction?.confidence}`);
      console.log(`Reasoning: ${prediction?.reasoning}`);
      console.log(`Needs more info: ${prediction?.needsMoreInfo}`);
      console.log('---');
    });
  };

  // Run tests when component mounts
  React.useEffect(() => {
    testAccountPrediction();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      {journalEntries.map((entry) => {
        const analysis = analyzeEntry(entry);
        return (
          <Paper key={entry.id} sx={{ p: 2, mb: 2 }}>
            {/* ... existing entry display ... */}
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Suggested Accounts
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Debit
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                      {analysis.debit.account}
                    </Typography>
                    <Chip
                      label={`${Math.round(analysis.debit.confidence * 100)}%`}
                      size="small"
                      color={analysis.debit.confidence > 0.8 ? 'success' : 'warning'}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {analysis.debit.reasoning}
                  </Typography>
                  
                  {analysis.debit.alternatives && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Alternatives:
                      </Typography>
                      {analysis.debit.alternatives.map((alt, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1,
                            mt: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                          onClick={() => handleAccountSelect(entry.id, alt.account, 'debit')}
                        >
                          <Typography variant="body2">
                            {alt.account}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alt.reasoning}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Credit
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                      {analysis.credit.account}
                    </Typography>
                    <Chip
                      label={`${Math.round(analysis.credit.confidence * 100)}%`}
                      size="small"
                      color={analysis.credit.confidence > 0.8 ? 'success' : 'warning'}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {analysis.credit.reasoning}
                  </Typography>
                  
                  {analysis.credit.alternatives && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Alternatives:
                      </Typography>
                      {analysis.credit.alternatives.map((alt, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1,
                            mt: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                          onClick={() => handleAccountSelect(entry.id, alt.account, 'credit')}
                        >
                          <Typography variant="body2">
                            {alt.account}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alt.reasoning}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

export default JournalEntryPage; 