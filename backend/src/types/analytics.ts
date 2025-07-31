export type AnalyticsEvent = 
  | 'suggested_goal_added'
  | 'onboarding_dismissed'
  | 'onboarding_item_clicked'
  | 'onboarding_item_completed'
  | 'smart_suggestion_agent_used'
  | 'suggestion_feedback_saved';

export interface AnalyticsEntry {
  event: AnalyticsEvent;
  timestamp: string;
  details?: Record<string, any>;
} 