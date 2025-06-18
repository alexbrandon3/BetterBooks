import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { logAnalytics } from '../utils/analytics';

interface ScrollTargets {
  accountsRef: React.RefObject<HTMLDivElement | null>;
  transactionsRef: React.RefObject<HTMLDivElement | null>;
  goalsRef: React.RefObject<HTMLDivElement | null>;
  reportsRef: React.RefObject<HTMLDivElement | null>;
}

interface OnboardingChecklistProps {
  accounts: any[];
  transactions: any[];
  goals: any[];
  scrollTargets: ScrollTargets;
}

const OnboardingChecklist = ({ accounts, transactions, goals, scrollTargets }: OnboardingChecklistProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasViewedReports, setHasViewedReports] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage for dismissal state
    const isDismissed = localStorage.getItem('onboardingDismissed') === 'true';
    setIsVisible(!isDismissed);

    // Check if user has viewed reports by looking at navigation history
    const checkReportView = () => {
      const hasViewed = window.location.pathname.includes('/reports');
      setHasViewedReports(hasViewed);
    };

    checkReportView();
    window.addEventListener('popstate', checkReportView);
    return () => window.removeEventListener('popstate', checkReportView);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('onboardingDismissed', 'true');
    logAnalytics('onboarding_dismissed');
  };

  const handleItemClick = (item: {
    id: string;
    text: string;
    completed: boolean;
    action: () => void;
    scrollRef: React.RefObject<HTMLDivElement | null>;
  }) => {
    if (item.completed) return;
    
    logAnalytics('onboarding_item_clicked', { item: item.id });
    
    if (item.scrollRef?.current) {
      item.scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    item.action();
  };

  const checklistItems = [
    {
      id: 'accounts',
      text: 'Add your first account',
      completed: accounts.length > 0,
      action: () => navigate('/accounts'),
      scrollRef: scrollTargets.accountsRef
    },
    {
      id: 'transactions',
      text: 'Record a transaction',
      completed: transactions.length > 0,
      action: () => navigate('/transactions'),
      scrollRef: scrollTargets.transactionsRef
    },
    {
      id: 'goals',
      text: 'Set a financial goal',
      completed: goals.length > 0,
      action: () => navigate('/goals'),
      scrollRef: scrollTargets.goalsRef
    },
    {
      id: 'suggested-goals',
      text: 'Try a suggested goal',
      completed: goals.some(goal => goal.isSuggested),
      action: () => navigate('/goals'),
      scrollRef: scrollTargets.goalsRef
    },
    {
      id: 'reports',
      text: 'View your reports',
      completed: hasViewedReports,
      action: () => navigate('/reports'),
      scrollRef: scrollTargets.reportsRef
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome to BetterBooks 👋</h2>
          <p className="text-gray-600 mt-1">Let's help you get started step-by-step.</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss checklist"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-3">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center p-3 rounded-lg transition-colors ${
              item.completed ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'
            }`}
            onClick={() => handleItemClick(item)}
            role="button"
            tabIndex={0}
            aria-label={`${item.text} - ${item.completed ? 'Completed' : 'Click to get started'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
              item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {item.completed ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-400" />
              )}
            </div>
            <span className={`flex-1 ${item.completed ? 'text-gray-600' : 'text-gray-900'}`}>
              {item.text}
            </span>
            {!item.completed && (
              <span className="text-sm text-blue-600 hover:text-blue-700">
                Get started →
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleDismiss}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default OnboardingChecklist; 