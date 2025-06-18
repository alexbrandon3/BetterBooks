import { useState, useCallback } from 'react';
import { MessageType } from '../components/FeedbackMessage';

interface FeedbackState {
  message: string;
  type: MessageType;
}

export const useFeedback = () => {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const showFeedback = useCallback((message: string, type: MessageType) => {
    setFeedback({ message, type });
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  return {
    feedback,
    showFeedback,
    clearFeedback
  };
}; 