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

  // Loading skeleton with improved design
  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="animate-pulse">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl mr-3"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-48"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="h-5 bg-gray-200 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="h-6 bg-gray-200 rounded-lg w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state with improved design
  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center mb-6">
          <div className="h-8 w-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl mr-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Smart Goal Suggestions</h3>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state with improved design
  if (visibleSuggestions.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center mb-6">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl mr-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Smart Goal Suggestions</h3>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-300 mb-6">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-700 mb-2">No recommendations yet</h4>
          <p className="text-gray-500 max-w-md mx-auto">We're analyzing your financial data to provide personalized suggestions. Check back soon for smart recommendations tailored to your business goals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl mr-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Smart Goal Suggestions</h3>
          {userRiskTolerance && (
            <p className="text-sm text-gray-500 mt-1">
              Personalized for {userRiskTolerance.toLowerCase()} risk tolerance
            </p>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {visibleSuggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={`group bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 hover:from-blue-50 hover:to-indigo-50 hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-gray-200 hover:border-blue-200 relative overflow-hidden ${
              (dismissedSuggestions || dismissedSuggestionsState).has(suggestion.id) 
                ? 'opacity-0 scale-95 pointer-events-none' 
                : 'opacity-100 scale-100'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleGoalSelected(suggestion)}
          >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-300"></div>
            
            {/* Dismiss button with improved design */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismissSuggestion(suggestion.id);
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-all duration-200 rounded-xl hover:bg-red-50 opacity-0 group-hover:opacity-100"
              aria-label="Dismiss suggestion"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex justify-between items-start pr-12 relative z-10">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-900 transition-colors duration-200">
                  {suggestion.title}
                </h4>
                <p className="text-gray-600 leading-relaxed text-sm group-hover:text-gray-700 transition-colors duration-200">
                  {suggestion.reason}
                </p>
              </div>
              <div className="text-right ml-6 flex-shrink-0">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ${suggestion.targetAmount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">Target Amount</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 