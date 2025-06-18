import React, { useEffect, useRef, useState } from 'react';
import { Activity, clearActivities } from '../utils/activityLog';

interface ActivityFeedProps {
  activities: Activity[];
  onActivitiesChange: (activities: Activity[]) => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onActivitiesChange }) => {
  const feedRef = useRef<HTMLDivElement>(null);
  const lastActivityId = useRef<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    if (activities.length > 0 && activities[0].id !== lastActivityId.current) {
      // Scroll to top when new activity is added
      if (feedRef.current) {
        feedRef.current.scrollTop = 0;
      }
      lastActivityId.current = activities[0].id;
    }
  }, [activities]);

  const handleClear = () => {
    if (!showConfirmClear) {
      setShowConfirmClear(true);
      return;
    }

    clearActivities();
    onActivitiesChange([]);
    setShowConfirmClear(false);
  };

  const getActivityIcon = (type: Activity['type']): string => {
    switch (type) {
      case 'TRANSACTION':
        return '💰';
      case 'GOAL':
        return '🎯';
      case 'ACCOUNT':
        return '🏦';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
        {activities.length > 0 && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
          >
            {showConfirmClear ? 'Click again to confirm' : 'Clear'}
          </button>
        )}
      </div>
      <div 
        ref={feedRef}
        className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scroll-smooth"
      >
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                index === 0 ? 'bg-blue-50' : ''
              }`}
            >
              <span className="text-xl" role="img" aria-label={activity.type}>
                {getActivityIcon(activity.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                {activity.details && (
                  <p className="text-xs text-gray-500 truncate">
                    {Object.entries(activity.details)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ')}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed; 