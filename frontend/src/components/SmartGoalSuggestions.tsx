import React, { useEffect, useState } from 'react';
import { useFeedback } from '../hooks/useFeedback';
import { logAnalytics } from '../utils/analytics';
import api from '../utils/axios';
import { SuggestedGoal } from '../types/suggestion';
import { RiskTolerance } from '../types/user';

interface SmartGoalSuggestionsProps {
  onGoalSelected: (goal: SuggestedGoal) => void;
  userRiskTolerance?: RiskTolerance;
  dismissedSuggestions?: Set<string>;
  onDismissSuggestion?: (suggestionId: string) => void;
}

export const SmartGoalSuggestions: React.FC<SmartGoalSuggestionsProps> = ({ 
  onGoalSelected,
  userRiskTolerance,
  dismissedSuggestions,
  onDismissSuggestion
}) => {
  const [suggestions, setSuggestions] = useState<SuggestedGoal[]>([]);
  const [dismissedSuggestionsState, setDismissedSuggestionsState] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showFeedback } = useFeedback();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const response = await api.get('/suggestions', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Suggestions response:', response.data);
        
        // Ensure response.data is an array
        const suggestionsData = Array.isArray(response.data) ? response.data : [];
        setSuggestions(suggestionsData);
        
        logAnalytics('suggestion_viewed', {
          suggestion_count: suggestionsData.length,
          suggestion_types: suggestionsData.map(s => s.id)
        });
      } catch (error) {
        console.error('Error fetching goal suggestions:', error);
        setError('Failed to load suggestions.');
        showFeedback('Failed to load goal suggestions', 'error');
        setSuggestions([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [showFeedback]);

  const handleGoalSelected = (suggestion: SuggestedGoal) => {
    logAnalytics('goal_created_from_suggestion', {
      suggestion_id: suggestion.id,
      target_amount: suggestion.targetAmount
    });
    onGoalSelected(suggestion);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    // Add to dismissed set
    setDismissedSuggestionsState(prev => new Set(prev).add(suggestionId));
    
    // Log analytics event
    logAnalytics('dismiss_goal', { 
      goalId: suggestionId 
    });

    if (onDismissSuggestion) {
      onDismissSuggestion(suggestionId);
    }
  };

  // Filter out dismissed suggestions
  const visibleSuggestions = suggestions.filter(
    suggestion => !(dismissedSuggestions || dismissedSuggestionsState).has(suggestion.id)
  );

  console.log('🎯 SmartGoalSuggestions - All suggestions:', suggestions);
  console.log('🎯 SmartGoalSuggestions - Dismissed suggestions:', dismissedSuggestions || dismissedSuggestionsState);
  console.log('🎯 SmartGoalSuggestions - Visible suggestions:', visibleSuggestions);

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="h-5 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Goal Suggestions</h3>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state - show when no suggestions or all dismissed
  if (visibleSuggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Goal Suggestions</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-base text-gray-500">No recommendations at this time.</p>
          <p className="text-sm text-gray-400 mt-1">We'll analyze your financial data and provide personalized suggestions soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Goal Suggestions</h3>
      {userRiskTolerance && (
        <p className="text-sm text-gray-600 mb-6">
          Suggestions are personalized based on your {userRiskTolerance.toLowerCase()} risk tolerance
        </p>
      )}
      <div className="space-y-4">
        {visibleSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`bg-gray-50 rounded-xl p-4 hover:bg-gray-100 hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-gray-100 hover:border-gray-200 relative ${
              (dismissedSuggestions || dismissedSuggestionsState).has(suggestion.id) 
                ? 'opacity-0 scale-95 pointer-events-none' 
                : 'opacity-100 scale-100'
            }`}
            onClick={() => handleGoalSelected(suggestion)}
          >
            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the card click
                handleDismissSuggestion(suggestion.id);
              }}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-full hover:bg-red-50"
              aria-label="Dismiss suggestion"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex justify-between items-start pr-8">
              <div className="flex-1">
                <h4 className="text-base font-medium text-gray-900 mb-2">{suggestion.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{suggestion.reason}</p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <div className="text-lg font-semibold text-indigo-600">
                  ${suggestion.targetAmount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Target Amount</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 