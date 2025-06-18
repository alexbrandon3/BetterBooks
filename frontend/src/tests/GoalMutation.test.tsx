import { render, screen, fireEvent } from '@testing-library/react';
import GoalTrackerCard from '../components/GoalTrackerCard';
import { FinancialGoal } from '../types/goal';
import { Account, AccountType, FinancialCategory } from '../types/account';
import isEqual from 'lodash.isequal';

describe('Goal Mutations Prevention Tests', () => {
  const mockAccounts: Account[] = [
    { 
      id: '1', 
      name: 'Checking', 
      balance: 1000, 
      category: 'Banking',
      subcategory: 'Personal',
      type: AccountType.ASSET,
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: 'Cash' 
    }
  ];
  
  const mockGoals: FinancialGoal[] = [
    { 
      id: '1',
      type: 'INCREASE_ASSETS',
      targetAmount: 5000,
      targetDate: '2023-12-31',
      createdAt: '2023-01-01',
      progress: 20,
      currentAmount: 1000,
      daysRemaining: 100
    }
  ];

  test('Goal deep equality works as expected', () => {
    // Create two identical objects but with different references
    const goal1 = { 
      id: '1',
      type: 'INCREASE_ASSETS' as const,
      targetAmount: 5000,
      targetDate: '2023-12-31',
      createdAt: '2023-01-01',
      progress: 20,
      currentAmount: 1000, 
      daysRemaining: 100
    };
    
    const goal2 = { ...goal1 };
    
    // Different references
    expect(goal1).not.toBe(goal2);
    
    // But deeply equal
    expect(isEqual(goal1, goal2)).toBe(true);
    
    // If we change something, they should no longer be equal
    const goal3 = { ...goal1, progress: 21 };
    expect(isEqual(goal1, goal3)).toBe(false);
  });
  
  test('Deleting a goal creates deep copies without mutating original', () => {
    const handleGoalsChange = jest.fn();
    
    render(
      <GoalTrackerCard 
        accounts={mockAccounts}
        goals={mockGoals}
        onGoalsChange={handleGoalsChange}
      />
    );
    
    // Click delete button (× character)
    fireEvent.click(screen.getByText('×'));
    
    // Assert handler was called
    expect(handleGoalsChange).toHaveBeenCalled();
    
    // Get the first argument from the first call
    const updatedGoals = handleGoalsChange.mock.calls[0][0];
    
    // Assertions
    expect(updatedGoals).not.toBe(mockGoals); // Not same reference
    expect(updatedGoals.length).toBe(0); // Should be empty
  });
}); 