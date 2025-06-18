import { AnalyticsEvent } from './analytics';

interface AnalyticsEntry {
  event: AnalyticsEvent;
  timestamp: string;
  details?: Record<string, any>;
}

export interface Recommendation {
  id: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
  status: 'new' | 'completed' | 'ignored';
  lastShown?: string;
}

const DEBUG = true; // Enable debug mode

// Mock analytics data for testing
const mockAnalyticsData: AnalyticsEntry[] = [
  {
    event: 'suggested_goal_added',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    details: { type: 'savings', amount: 1000 }
  },
  {
    event: 'onboarding_item_clicked',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    details: { item: 'goals' }
  }
];

const getAnalyticsData = (): AnalyticsEntry[] => {
  try {
    const stored = localStorage.getItem('analytics');
    const data = stored ? JSON.parse(stored) : [];
    
    // Add mock data in debug mode
    if (DEBUG && data.length === 0) {
      localStorage.setItem('analytics', JSON.stringify(mockAnalyticsData));
      console.log('📊 Added mock analytics data');
      return mockAnalyticsData;
    }

    if (DEBUG) {
      console.log('📊 Raw analytics data:', data);
    }
    return data;
  } catch {
    return [];
  }
};

const hasEvent = (events: AnalyticsEntry[], eventType: AnalyticsEvent): boolean => {
  const result = events.some(entry => entry.event === eventType);
  if (DEBUG) {
    console.log(`🔍 Checking for event "${eventType}":`, result);
  }
  return result;
};

const countEvents = (events: AnalyticsEntry[], eventType: AnalyticsEvent): number => {
  const count = events.filter(entry => entry.event === eventType).length;
  if (DEBUG) {
    console.log(`🔢 Count of event "${eventType}":`, count);
  }
  return count;
};



export const generateRecommendations = (): Recommendation[] => {
  const events = getAnalyticsData();
  const recommendations: Recommendation[] = [];

  // Check for goal-related activity
  const hasAnyGoal = hasEvent(events, 'suggested_goal_added');
  const lastShown = localStorage.getItem('last_goal_suggestion');

  if (!hasAnyGoal || DEBUG) {
    const status = hasAnyGoal ? 'completed' : 
                  lastShown ? 'ignored' : 'new';
    
    recommendations.push({
      id: 'savings-goal',
      message: 'Set up a savings goal to track your progress',
      priority: 'high',
      action: 'goals',
      status,
      lastShown: lastShown || undefined
    });

    // Update last shown timestamp
    if (!lastShown) {
      localStorage.setItem('last_goal_suggestion', new Date().toISOString());
    }
  }

  // Check onboarding completion
  const hasOnboardingDismissed = hasEvent(events, 'onboarding_dismissed');
  const hasOnboardingCompleted = hasEvent(events, 'onboarding_item_completed');
  
  if ((hasOnboardingDismissed && !hasOnboardingCompleted) || DEBUG) {
    recommendations.push({
      id: 'revisit-onboarding',
      message: 'Revisit your onboarding checklist to get started',
      priority: 'high',
      action: 'onboarding',
      status: hasOnboardingCompleted ? 'completed' : 'new'
    });
  }

  // Check for onboarding item clicks
  const itemClicks = countEvents(events, 'onboarding_item_clicked');
  if (itemClicks === 0 || DEBUG) {
    recommendations.push({
      id: 'start-onboarding',
      message: 'Complete your onboarding checklist to get the most out of BetterBooks',
      priority: 'high',
      action: 'onboarding',
      status: 'new'
    });
  }

  if (DEBUG) {
    console.log('🎯 Final recommendations:', recommendations);
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}; 