export type AnalyticsEvent = 
  | 'suggested_goal_added'
  | 'onboarding_dismissed'
  | 'onboarding_item_clicked'
  | 'onboarding_item_completed';

export interface AnalyticsEntry {
  event: AnalyticsEvent;
  timestamp: string;
  details?: Record<string, any>;
} 