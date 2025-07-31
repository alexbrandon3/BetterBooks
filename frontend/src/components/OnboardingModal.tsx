import React from 'react';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';

const OnboardingModal: React.FC = () => {
  const { 
    isOnboardingActive, 
    currentStep, 
    steps, 
    completeStep, 
    skipOnboarding 
  } = useOnboarding();
  const navigate = useNavigate();

  if (!isOnboardingActive) return null;

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    completeStep(currentStepData.id);
    
    // Navigate to appropriate page based on step
    switch (currentStepData.id) {
      case 'create-account':
        navigate('/accounts');
        break;
      case 'add-transaction':
        navigate('/transactions');
        break;
      case 'view-dashboard':
        navigate('/');
        break;
      default:
        break;
    }
  };

  const handleSkip = () => {
    skipOnboarding();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Progress indicator */}
        <div className="flex justify-between mb-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600">
            {currentStepData.description}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>

        {/* Step-specific hints */}
        {currentStepData.id === 'create-account' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Tip: Start with your main checking account to track daily expenses
            </p>
          </div>
        )}

        {currentStepData.id === 'add-transaction' && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              💡 Tip: Try adding a recent transaction to see how the system works
            </p>
          </div>
        )}

        {currentStepData.id === 'view-dashboard' && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800">
              💡 Tip: Your dashboard shows your financial overview and recent activity
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal; 