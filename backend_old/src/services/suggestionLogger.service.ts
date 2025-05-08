// src/services/suggestionLogger.service.ts

import { AppDataSource } from '../data-source';
import { SuggestionLog } from '../entities/SuggestionLog';

interface LogParams {
  userId: string;
  description: string;
  suggestedAccountId: string | null;
  selectedAccountId: string;
}

export const logSuggestion = async ({
  userId,
  description,
  suggestedAccountId,
  selectedAccountId,
}: LogParams): Promise<void> => {
  const matched = suggestedAccountId === selectedAccountId;

  const log = AppDataSource.getRepository(SuggestionLog).create({
    userId,
    description,
    suggestedAccountId,
    selectedAccountId,
    matched,
  });

  await AppDataSource.getRepository(SuggestionLog).save(log);
};
