// src/services/suggestionEngine.service.ts

import { getSuggestedAccount } from '../services/suggestions.service';
import { getSmartSuggestion } from './smartSuggestions.service';
import { Account } from '../entities/Account';

/**
 * Runs both keyword and smart suggestion engines.
 * Returns the best match, and flags which strategy it came from.
 */
export const runSuggestionEngine = async (
  description: string,
  userId: string
): Promise<{ account: Account | null; strategy: 'keyword' | 'smart' | null }> => {
  const keywordMatch = await getSuggestedAccount(description, userId);
  if (keywordMatch) {
    return { account: keywordMatch, strategy: 'keyword' };
  }

  const smartMatch = await getSmartSuggestion(description, userId);
  if (smartMatch) {
    return { account: smartMatch, strategy: 'smart' };
  }

  return { account: null, strategy: null };
};
