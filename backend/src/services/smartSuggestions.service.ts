// src/services/smartSuggestions.service.ts
import { AppDataSource } from '../data-source';
import { Account } from '../entities/Account';

export const getSmartSuggestion = async (
  description: string,
  userId: string
): Promise<Account | null> => {
  try {
    const accountRepo = AppDataSource.getRepository(Account);

    const allAccounts = await accountRepo.find({
      where: { user: { id: userId } },
    });

    console.log(`🔍 Matching against description: "${description}"`);
    console.log(`📚 Total accounts: ${allAccounts.length}`);

    for (const acc of allAccounts) {
      const fields = [acc.name, acc.description, acc.subtype].filter(Boolean).map((f) => f.toLowerCase());
      const target = description.toLowerCase();

      if (fields.some((field) => field.includes(target))) {
        console.log(`✅ Matched with account: ${acc.name} (ID: ${acc.id})`);
        return acc;
      }
    }

    console.log('⚠️ No matching account found for suggestion.');
    return null;
  } catch (err) {
    console.error('❌ Error in getSmartSuggestion:', err);
    return null;
  }
};
