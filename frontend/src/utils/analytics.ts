export type AnalyticsEvent = 
  | 'suggested_goal_added'
  | 'onboarding_dismissed'
  | 'onboarding_item_clicked'
  | 'onboarding_item_completed'
  | 'suggestion_viewed'
  | 'goal_created_from_suggestion'
  | 'suggestion_action_taken'
  | 'dismiss_goal';

export const logAnalytics = (event: AnalyticsEvent, details?: Record<string, any>): void => {
  // In production, this would send to an analytics service
  // console.log('📊 Analytics:', { event, details });
}; 