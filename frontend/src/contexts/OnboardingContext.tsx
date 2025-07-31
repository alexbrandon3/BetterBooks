import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/axios';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  completeStep: (stepId: string) => void;
  skipOnboarding: () => void;
  startOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  isOnboardingActive: false,
  currentStep: 0,
  steps: [],
  completeStep: () => {},
  skipOnboarding: () => {},
  startOnboarding: () => {}
});

export const useOnboarding = () => useContext(OnboardingContext);

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BetterBooks!',
    description: 'Let\'s get you started with managing your finances.',
    completed: false
  },
  {
    id: 'create-account',
    title: 'Create Your First Account',
    description: 'Add a bank account or credit card to start tracking your transactions.',
    completed: false
  },
  {
    id: 'add-transaction',
    title: 'Add Your First Transaction',
    description: 'Record a transaction to see how the system works.',
    completed: false
  },
  {
    id: 'view-dashboard',
    title: 'Explore Your Dashboard',
    description: 'Check out your financial overview and reports.',
    completed: false
  }
];

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>(ONBOARDING_STEPS);

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // Check if user has accounts
        const accountsResponse = await api.get('/accounts');
        const hasAccounts = accountsResponse.data && accountsResponse.data.length > 0;

        // Check if user has transactions
        const transactionsResponse = await api.get('/transactions');
        const hasTransactions = transactionsResponse.data && 
                              transactionsResponse.data.transactions && 
                              transactionsResponse.data.transactions.length > 0;

        // If user has no accounts or no transactions, they need onboarding
        if (!hasAccounts || !hasTransactions) {
          setIsOnboardingActive(true);
          setCurrentStep(0);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, user]);

  const completeStep = (stepId: string) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
    
    // Move to next step
    const currentIndex = steps.findIndex(step => step.id === stepId);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(currentIndex + 1);
    } else {
      // All steps completed
      setIsOnboardingActive(false);
    }
  };

  const skipOnboarding = () => {
    setIsOnboardingActive(false);
  };

  const startOnboarding = () => {
    setIsOnboardingActive(true);
    setCurrentStep(0);
    setSteps(ONBOARDING_STEPS);
  };

  return (
    <OnboardingContext.Provider value={{
      isOnboardingActive,
      currentStep,
      steps,
      completeStep,
      skipOnboarding,
      startOnboarding
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}; 