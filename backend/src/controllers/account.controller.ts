import { Response } from 'express';
import { AppDataSource } from '../data-source';
import { Account } from '../entities/Account';
import { User } from '../entities/User';
import { AuthedRequest } from '../middleware/auth'; // adjust path as needed


// Use our global declaration of req.user from types/express.d.ts
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
    return res.status(500).json({ message: 'Error fetching accounts', err });
  }
};

// POST /accounts
export const createAccount = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { number, name, description, type, subtype, balance } = req.body;

    const owner = await userRepo.findOneBy({ id: userId });
    if (!owner) return res.status(404).json({ message: 'User not found' });

    const duplicate = await accountRepo.findOne({
      where: { number, user: { id: userId } },
    });

    if (duplicate) {
      return res.status(409).json({
        message: `Account number ${number} already exists`,
      });
    }

    const account = accountRepo.create({
      number,
      name,
      description,
      type,
      subtype,
      balance,
      isActive: true,
      user: owner,
    });

    await accountRepo.save(account);
    return res.status(201).json(account);
  } catch (err) {
    return res.status(500).json({ message: 'Error creating account', err });
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
    return res.status(500).json({ message: 'Error updating account', err });
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
    return res.status(500).json({ message: 'Error deleting account', err });
  }
};
