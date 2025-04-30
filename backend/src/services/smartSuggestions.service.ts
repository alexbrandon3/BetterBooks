// src/services/smartSuggestions.service.ts

import { AppDataSource } from '../data-source';
import { Account } from '../entities/Account';
import { Like } from 'typeorm';

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

export const getSmartSuggestion = async (
  description: string,
  userId: string
): Promise<Account | null> => {
  if (!description || !userId) return null;

  const lowerDesc = description.toLowerCase();

  // 1. Check keyword-based mapping
  for (const [keyword, category] of Object.entries(keywordMap)) {
    if (lowerDesc.includes(keyword)) {
      const match = await AppDataSource.getRepository(Account).findOne({
        where: { user: { id: userId }, type: category },
      });
      if (match) return match;
    }
  }

  // 2. Fallback: fuzzy match based on account names
  const keywords = lowerDesc.split(/\s+/);

  for (const word of keywords) {
    const match = await AppDataSource.getRepository(Account).findOne({
      where: {
        user: { id: userId },
        name: Like(`%${word}%`),
      },
    });
    if (match) return match;
  }

  return null;
};
