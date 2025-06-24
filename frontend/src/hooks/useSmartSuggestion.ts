import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';

interface AccountSuggestion {
  suggestedAccountId: number;
  suggestedAccountName: string;
  reason: string;
}

interface UseSmartSuggestionProps {
  debounceMs?: number;
}

// Hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

export const useSmartSuggestion = ({ debounceMs = 500 }: UseSmartSuggestionProps = {}) => {
  const [suggestion, setSuggestion] = useState<AccountSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const fetchSuggestion = useCallback(async (description: string) => {
    if (!description || description.trim().length === 0) {
      setSuggestion(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/suggestions/suggest-account', {
        description: description.trim()
      });
      
      setSuggestion(response.data);
    } catch (err) {
      console.error('Error fetching account suggestion:', err);
      setError('Failed to get suggestion');
      setSuggestion(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedFetchSuggestion = useCallback(
    debounce(fetchSuggestion, debounceMs),
    [fetchSuggestion, debounceMs]
  );

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    suggestion,
    isLoading,
    error,
    isMobile,
    fetchSuggestion: debouncedFetchSuggestion,
    clearSuggestion
  };
};

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
} 