import React from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRecommendations, Recommendation } from '../utils/recommendationEngine';
import { logAnalytics } from '../utils/analytics';

interface SmartSuggestionsProps {
  scrollTargets: {
    accountsRef: React.RefObject<HTMLDivElement | null>;
    transactionsRef: React.RefObject<HTMLDivElement | null>;
    goalsRef: React.RefObject<HTMLDivElement | null>;
  };
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ scrollTargets }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);

  React.useEffect(() => {
    const loadRecommendations = () => {
      const newRecommendations = generateRecommendations();
      setRecommendations(newRecommendations);
    };

    loadRecommendations();
    const interval = setInterval(loadRecommendations, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleAction = (recommendation: Recommendation) => {
    // Log the action
    logAnalytics('suggestion_action_taken', {
      suggestion_id: recommendation.id,
      action: recommendation.action
    });

    // Handle navigation
    if (recommendation.action === 'goals' && scrollTargets.goalsRef.current) {
      scrollTargets.goalsRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (recommendation.action === 'onboarding') {
      navigate('/onboarding');
    }
  };

  const getStatusBadge = (status: Recommendation['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </span>
        );
      case 'ignored':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Remind Me
          </span>
        );
      case 'new':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            New
          </span>
        );
    }
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Suggestions</h3>
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900">{recommendation.message}</p>
                {getStatusBadge(recommendation.status)}
              </div>
              {recommendation.lastShown && (
                <p className="text-xs text-gray-500">
                  Last shown: {new Date(recommendation.lastShown).toLocaleDateString()}
                </p>
              )}
            </div>
            {recommendation.action && recommendation.status !== 'completed' && (
              <button
                onClick={() => handleAction(recommendation)}
                className="ml-4 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label={`Take action for ${recommendation.message}`}
              >
                {recommendation.action === 'goals' ? 'Set Goal' : 'Get Started'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartSuggestions; 