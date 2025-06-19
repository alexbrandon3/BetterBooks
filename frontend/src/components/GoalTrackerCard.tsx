import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import isEqual from 'lodash.isequal';
import { formatCurrency } from '../utils/formatters';
import { calculateGoalProgress, formatGoalTitle } from '../utils/finance';
import { FinancialGoal, GoalFormData, GoalType } from '../types/goal';
import { Account } from '../types/account';
import { useFeedback } from '../hooks/useFeedback';
import { CheckIcon } from '@heroicons/react/24/solid';
import { logAnalytics } from '../utils/analytics';
import { SuggestedGoal } from '../types/suggestion';

interface GoalTrackerCardProps {
  accounts: Account[];
  goals: FinancialGoal[];
  onGoalsChange: (goals: FinancialGoal[]) => void;
}

const isDuplicateSuggestedGoal = (suggestion: SuggestedGoal, existingGoals: FinancialGoal[]): boolean => {
  return existingGoals.some(goal => 
    Math.abs(goal.targetAmount - suggestion.targetAmount) < 0.01
  );
};

const isDuplicateFinancialGoal = (newGoal: FinancialGoal, existingGoals: FinancialGoal[]): boolean => {
  return existingGoals.some(goal => 
    goal.type === newGoal.type && 
    Math.abs(goal.targetAmount - newGoal.targetAmount) < 0.01
  );
};

const GoalTrackerCard: React.FC<GoalTrackerCardProps> = ({ accounts, goals, onGoalsChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>({
    type: 'INCREASE_ASSETS',
    targetAmount: '',
    targetDate: ''
  });
  const [suggestedGoals, setSuggestedGoals] = useState<SuggestedGoal[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const { showFeedback } = useFeedback();

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);
      setSuggestionsError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await fetch('/api/suggestions/goals', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          mode: 'cors'
        });
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required');
          }
          throw new Error('Failed to fetch suggestions');
        }
        const data = await response.json();
        setSuggestedGoals(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestionsError(error instanceof Error ? error.message : 'Unable to load suggestions');
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newGoal: FinancialGoal = {
      id: uuidv4(),
      type: formData.type,
      targetAmount: parseFloat(formData.targetAmount),
      targetDate: formData.targetDate,
      createdAt: new Date().toISOString(),
      progress: 0
    };

    if (isDuplicateFinancialGoal(newGoal, goals)) {
      showFeedback('A goal with this type and amount already exists', 'error');
      return;
    }

    const updatedGoal = calculateGoalProgress(newGoal, accounts);
    const updatedGoals = [...goals.map(g => ({ ...g })), updatedGoal];
    
    // Only call onGoalsChange if there's an actual difference
    if (!isEqual(goals, updatedGoals)) {
      onGoalsChange(updatedGoals.map(g => ({ ...g })));
      showFeedback('Goal created successfully', 'success');
    }
    
    setIsModalOpen(false);
    setFormData({ type: 'INCREASE_ASSETS', targetAmount: '', targetDate: '' });
  }, [formData, goals, accounts, onGoalsChange, showFeedback]);

  const deleteGoal = useCallback((id: string) => {
    const filteredGoals = goals.filter((goal: FinancialGoal) => goal.id !== id);
    const updatedGoals = filteredGoals.map((g: FinancialGoal) => ({ ...g }));
    
    // Only call onGoalsChange if there's an actual difference
    if (!isEqual(goals, updatedGoals)) {
      onGoalsChange(updatedGoals.map((g: FinancialGoal) => ({ ...g })));
      showFeedback('Goal deleted successfully', 'success');
    }
  }, [goals, onGoalsChange, showFeedback]);

  const handleAddSuggestedGoal = useCallback((suggestedGoal: SuggestedGoal) => {
    if (isDuplicateSuggestedGoal(suggestedGoal, goals)) {
      return;
    }

    const newGoal: FinancialGoal = {
      id: crypto.randomUUID(),
      type: 'INCREASE_ASSETS',
      targetAmount: suggestedGoal.targetAmount,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      progress: 0
    };

    const newGoals = [...goals, newGoal];
    onGoalsChange(newGoals);
    logAnalytics('suggested_goal_added', { 
      target: suggestedGoal.targetAmount 
    });
    showFeedback(`Added "${suggestedGoal.title}" goal`, 'success');
  }, [goals, onGoalsChange, showFeedback]);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  const handleFormDataChange = useCallback((field: keyof GoalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="bg-white shadow rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Financial Goals</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm"
        >
          + New Goal
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Goals</h3>
        {isLoadingSuggestions ? (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : suggestionsError ? (
          <div className="text-center py-4 text-gray-500">
            <p>{suggestionsError}</p>
          </div>
        ) : suggestedGoals.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>No personalized goals yet — keep exploring BetterBooks!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestedGoals.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:border-blue-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{suggestion.reason}</p>
                    <p className="text-lg font-semibold text-blue-600 mt-2">
                      ${suggestion.targetAmount.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddSuggestedGoal(suggestion)}
                    disabled={isDuplicateSuggestedGoal(suggestion, goals)}
                    className={`px-2 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                      isDuplicateSuggestedGoal(suggestion, goals)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : ''
                    }`}
                    aria-label={
                      isDuplicateSuggestedGoal(suggestion, goals)
                        ? 'Goal already added'
                        : `Add ${suggestion.title} goal`
                    }
                  >
                    {isDuplicateSuggestedGoal(suggestion, goals) ? (
                      <span className="flex items-center">
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Already Added
                      </span>
                    ) : (
                      'Add This Goal'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {goals.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No goals set yet. Create your first financial goal!</p>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-800">{formatGoalTitle(goal)}</h3>
                  {goal.progress >= 100 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Completed
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      goal.progress >= 100 ? 'bg-green-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(goal.currentAmount || 0)} / {formatCurrency(goal.targetAmount)}
                  </span>
                  <span className="text-gray-600">
                    {goal.daysRemaining} days remaining
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Create New Goal</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleFormDataChange('type', e.target.value as GoalType)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="INCREASE_ASSETS">Increase Assets</option>
                  <option value="DECREASE_LIABILITIES">Decrease Liabilities</option>
                  <option value="INCREASE_NET_INCOME">Increase Net Worth</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount
                </label>
                <input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => handleFormDataChange('targetAmount', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => handleFormDataChange('targetDate', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalTrackerCard; 