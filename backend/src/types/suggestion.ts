export interface SuggestedGoal {
  id: string;
  title: string;
  targetAmount: number;
  reason: string;
  action: 'goals';
}

export interface SuggestionAnalytics {
  user_id: string;
  suggestion_count: number;
  suggestion_types: string[];
} 