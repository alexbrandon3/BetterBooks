export interface Activity {
  id: string;
  type: 'TRANSACTION' | 'GOAL' | 'ACCOUNT';
  action: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

const MAX_ACTIVITIES = 50;
const STORAGE_KEY = 'betterbooks_activities';

export const logActivity = (type: Activity['type'], action: string, details?: Record<string, unknown>): void => {
  console.log("🔥 [ACTIVITY] logActivity called:", { type, action, details });
  
  const activities = getRecentActivities();
  const newActivity: Activity = {
    id: crypto.randomUUID(),
    type,
    action,
    timestamp: new Date().toISOString(),
    details
  };

  activities.unshift(newActivity);
  if (activities.length > MAX_ACTIVITIES) {
    activities.pop();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
};

export const getRecentActivities = (): Activity[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const clearActivities = (): void => {
  localStorage.removeItem(STORAGE_KEY);
}; 