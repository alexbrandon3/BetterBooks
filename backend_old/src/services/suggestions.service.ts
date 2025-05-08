// src/services/suggestions.service.ts

import { AppDataSource } from '../data-source';
import { Account } from '../entities/Account';

const keywordMap: Record<string, string> = {
  netflix: 'Entertainment',
  spotify: 'Entertainment',
  walmart: 'Groceries',
  target: 'Groceries',
  gas: 'Transportation',
  uber: 'Transportation',
  electricity: 'Utilities',
  water: 'Utilities',
  rent: 'Rent',
};

/**
 * Matches a transaction description to a category based on keywords,
 * then finds a matching user account by type.
 */
export const getSuggestedAccount = async (
  description: string,
  userId: string
): Promise<Account | null> => {
  const lowerDesc = description.toLowerCase();

  for (const [keyword, category] of Object.entries(keywordMap)) {
    if (lowerDesc.includes(keyword)) {
      const match = await AppDataSource.getRepository(Account).findOne({
        where: { user: { id: userId }, type: category },
      });
      return match;
    }
  }

  return null;
};
