export type AnalyticsEvent = 
  | 'suggestion_viewed'
  | 'goal_created_from_suggestion'
  | 'suggestions_generated'
  | 'view_suggestions'
  | 'smart_suggestion_agent_used';

export const logAnalytics = async (_event: AnalyticsEvent, _details?: Record<string, any>): Promise<void> => {
  // In production, this would send to an analytics service
  // console.log('📊 Analytics:', { event, details, timestamp: new Date().toISOString() });
}; 