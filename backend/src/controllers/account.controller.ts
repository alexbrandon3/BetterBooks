import { Response } from 'express';
import { AppDataSource } from '../data-source';
import { Account } from '../entities/Account';
import { User } from '../entities/User';
import { AuthedRequest } from '../middleware/auth'; // assuming correct path

const accountRepo = AppDataSource.getRepository(Account);
const userRepo = AppDataSource.getRepository(User);

// GET /accounts
export const getAccounts = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const accounts = await accountRepo.find({
      where: { user: { id: userId } },
      order: { number: 'ASC' },
    });
    return res.json(accounts);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    return res.status(500).json({ message: 'Error fetching accounts', details: err });
  }
};

// POST /accounts
export const createAccount = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { number, name, description, type, subtype, balance } = req.body;

    // 🚨 Basic validation
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and Type are required fields' });
    }

    const owner = await userRepo.findOneBy({ id: userId });
    if (!owner) return res.status(404).json({ message: 'User not found' });

    const duplicate = await accountRepo.findOne({
      where: { number, user: { id: userId } },
    });

    if (duplicate) {
      return res.status(409).json({ message: `Account number ${number} already exists` });
    }

    const account = accountRepo.create({
      number,
      name,
      description: description || name,
      type,
      subtype: subtype || 'GENERAL',
      balance: balance ?? 0, // Default to 0 if balance not provided
      isActive: true,
      user: owner,
    });

    await accountRepo.save(account);
    return res.status(201).json(account);
  } catch (err) {
    console.error('Error creating account:', err);
    return res.status(500).json({ message: 'Error creating account', details: err });
  }
};

// PUT /accounts/:id
export const updateAccount = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const updates = req.body;

    const account = await accountRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!account || account.user.id !== userId) {
      return res.status(404).json({ message: 'Account not found' });
    }

    accountRepo.merge(account, updates);
    await accountRepo.save(account);
    return res.json(account);
  } catch (err) {
    console.error('Error updating account:', err);
    return res.status(500).json({ message: 'Error updating account', details: err });
  }
};

// DELETE /accounts/:id
export const deleteAccount = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await accountRepo.delete({ id, user: { id: userId } });
    if (result.affected === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    return res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    return res.status(500).json({ message: 'Error deleting account', details: err });
  }
};
