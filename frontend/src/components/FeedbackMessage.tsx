import React, { useEffect } from 'react';

export type MessageType = 'success' | 'error' | 'info';

interface FeedbackMessageProps {
  message: string;
  type: MessageType;
  onClose: () => void;
  duration?: number;
}

const FeedbackMessage: React.FC<FeedbackMessageProps> = ({
  message,
  type,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 animate-slide-in`}>
      <div className={`rounded-lg border px-4 py-3 shadow-sm ${getTypeStyles()}`}>
        <div className="flex items-center">
          <p className="text-sm font-medium">{message}</p>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackMessage; 