import { Request, Response } from 'express';
import { SuggestionService } from '../services/suggestion.service';
import { wrapAsync } from '../utils/asyncHandler';

export class IndustryPackController {
  private suggestionService = new SuggestionService();

  // Get all available industry packs
  getIndustryPacks = wrapAsync(async (_req: Request, res: Response) => {
    const packs = await this.suggestionService.getIndustryPacks();
    
    res.json({
      success: true,
      data: packs,
      message: 'Industry packs retrieved successfully'
    });
  });

  // Get current industry pack settings for a user
  getIndustryPackSettings = wrapAsync(async (_req: Request, res: Response) => {
    const settings = await this.suggestionService.getIndustryPackSettings();
    
    res.json({
      success: true,
      data: settings,
      message: 'Industry pack settings retrieved successfully'
    });
  });

  // Update industry pack settings
  updateIndustryPackSettings = wrapAsync(async (req: Request, res: Response) => {
    const { industryPacksEnabled, selectedPacks, shadowMode, loggingEnabled } = req.body;
    
    await this.suggestionService.updateIndustryPackSettings({
      industryPacksEnabled,
      selectedPacks,
      shadowMode,
      loggingEnabled
    });
    
    res.json({
      success: true,
      message: 'Industry pack settings updated successfully'
    });
  });

  // Get shadow mode metrics (placeholder for future implementation)
  getShadowModeMetrics = wrapAsync(async (_req: Request, res: Response) => {
    // This would typically query a database for shadow mode metrics
    // For now, return placeholder data
    const metrics = {
      totalDescriptions: 0,
      industryPackMatches: 0,
      traditionalFallbacks: 0,
      matchRate: 0,
      topMissingPhrases: [],
      suggestedRules: []
    };
    
    res.json({
      success: true,
      data: metrics,
      message: 'Shadow mode metrics retrieved successfully'
    });
  });

  // Get industry pack coverage analysis
  getIndustryPackCoverage = wrapAsync(async (_req: Request, res: Response) => {
    const enabledPacks = await this.suggestionService.getEnabledIndustryPacks();
    
    const coverage = enabledPacks.map(pack => ({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      version: pack.version,
      ruleCount: pack.rules.length,
      coverage: pack.metadata.coverage,
      targetIndustries: pack.metadata.targetIndustries,
      confidenceThreshold: pack.metadata.confidenceThreshold,
      rules: pack.rules.map(rule => ({
        category: rule.category,
        priority: rule.priority,
        direction: rule.direction,
        transactionType: rule.transactionType,
        keywordCount: rule.keywords.length,
        validationRules: rule.validationRules
      }))
    }));
    
    res.json({
      success: true,
      data: {
        enabledPacks: coverage,
        totalPacks: enabledPacks.length,
        totalRules: enabledPacks.reduce((sum, pack) => sum + pack.rules.length, 0)
      },
      message: 'Industry pack coverage analysis retrieved successfully'
    });
  });

  // Test industry pack rules with a specific description
  testIndustryPackRules = wrapAsync(async (req: Request, res: Response) => {
    const { description, userId } = req.body;
    
    if (!description || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Description and userId are required'
      });
    }

    // Get user accounts for testing
    const accounts = await this.suggestionService['accountRepo'].find({
      where: { user: { id: userId } }
    });

    // Test the description against industry pack rules
    const suggestion = await this.suggestionService['applyIndustryPackRules'](
      description, 
      userId, 
      accounts
    );

    return res.json({
      success: true,
      data: {
        description,
        suggestion,
        accountsAvailable: accounts.length
      },
      message: 'Industry pack rule test completed'
    });
  });
}
