// src/controllers/suggestion.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Account } from '../entities/Account';
import { getUser } from '../utils/getUser';

const accountRepo = AppDataSource.getRepository(Account);

export const suggestAccount = async (req: Request, res: Response) => {
  console.log('💡 Suggestion route hit with body:', req.body);

  try {
    const user = getUser(req);
    const { description } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing description' });
    }

    // Very basic keyword-to-type logic (can grow smarter later)
    const keywords: Record<string, string[]> = {
      'Office Supplies': ['stapler', 'paper', 'pen', 'stationery'],
      'Meals & Entertainment': ['restaurant', 'dinner', 'cafe', 'coffee'],
      'Travel': ['uber', 'lyft', 'flight', 'hotel'],
      'Software': ['subscription', 'saas', 'notion', 'figma'],
    };

    const matchedLabel = Object.entries(keywords).find(([_, terms]) =>
      terms.some((term) => description.toLowerCase().includes(term))
    )?.[0];

    if (!matchedLabel) {
      return res.status(200).json({ suggestedAccountId: null });
    }

    const account = await accountRepo.findOne({
      where: {
        user: { id: user.id },
        name: matchedLabel,
      },
    });

    return res.status(200).json({ suggestedAccountId: account?.id || null });
  } catch (err) {
    console.error('Error suggesting account:', err);
    return res.status(500).json({ message: 'Error suggesting account', details: err });
  }
};
