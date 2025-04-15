import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Account } from '../entities/Account.js';

const accountRepository = AppDataSource.getRepository(Account);

export const getAccounts = async (_req: Request, res: Response) => {
  try {
    const accounts = await accountRepository.find();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts', error });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const account = accountRepository.create(req.body);
    const result = await accountRepository.save(account);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: 'Error creating account', error });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await accountRepository.update(id, req.body);
    if (result.affected === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    const updated = await accountRepository.findOne({ where: { id } });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error updating account', error });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await accountRepository.delete(id);
    if (result.affected === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Error deleting account', error });
  }
}; 