import { SuggestedGoal } from '../../types/suggestion';
import { User } from '../../entities/User';
import { Account } from '../../entities/Account';
import { Transaction } from '../../entities/Transaction';
import { generateIncomeSuggestion } from './incomeSuggestion';
import { generateEmergencyFundSuggestion } from './emergencyFundSuggestion';
import { generateEquipmentFundSuggestion } from './equipmentFundSuggestion';
import { logAnalytics } from '../../utils/analytics';

export const validateSuggestion = (suggestion: SuggestedGoal): boolean => {
  if (!suggestion.id || !suggestion.title || !suggestion.targetAmount) {
    return false;
  }
  
  if (suggestion.targetAmount <= 0) {
    return false;
  }
  
  return true;
};

export const generateSuggestions = async (
  user: User,
  accounts: Account[],
  transactions: Transaction[]
): Promise<SuggestedGoal[]> => {
  const suggestions: (SuggestedGoal | null)[] = [
    generateIncomeSuggestion(transactions, user),
    generateEmergencyFundSuggestion(accounts, transactions, user),
    generateEquipmentFundSuggestion(transactions, user)
  ];

  // Filter out null suggestions and validate remaining ones
  const validSuggestions = suggestions
    .filter((s): s is SuggestedGoal => s !== null && validateSuggestion(s));

  // Log analytics
  await logAnalytics('suggestions_generated', {
    user_id: user.id,
    suggestion_count: validSuggestions.length,
    suggestion_types: validSuggestions.map(s => s.id)
  });

  return validSuggestions;
}; 