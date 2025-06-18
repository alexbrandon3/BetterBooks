export type AnalyticsEvent = 
  | 'suggestion_viewed'
  | 'goal_created_from_suggestion'
  | 'suggestions_generated'
  | 'view_suggestions';

export const logAnalytics = async (event: AnalyticsEvent, details?: Record<string, any>): Promise<void> => {
  // In production, this would send to an analytics service
  console.log('📊 Analytics:', { event, details, timestamp: new Date().toISOString() });
}; 