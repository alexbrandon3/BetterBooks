import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { Account } from "../entities/Account";
import { getUser } from "../utils/getUser";
import { NotFoundError, AuthenticationError, AuthorizationError } from "../utils/errors";

const recurringRepo = AppDataSource.getRepository(RecurringTransaction);
const accountRepo = AppDataSource.getRepository(Account);

export const createRecurringTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const { amount, description, type, accountId, interval, startDate, endDate } = req.body;

    // Ensure the account belongs to the user
    const account = await accountRepo.findOne({
      where: {
        id: accountId,
        user: { id: user.id },
      },
    });

    if (!account) throw new NotFoundError("Account not found");

    const recurring = recurringRepo.create({
      amount,
      description,
      type,
      account,
      interval,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      user,
    });

    await recurringRepo.save(recurring);
    res.status(201).json(recurring);
  } catch (error) {
    next(error);
  }
};

export const getRecurringTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const records = await recurringRepo.find({
      where: { user: { id: user.id } },
      relations: ["account"],
    });
    res.status(200).json(records);
  } catch (error) {
    next(error);
  }
};

export const deleteRecurringTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const recurring = await recurringRepo.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ["account", "user"],
    });

    if (!recurring) throw new NotFoundError("Recurring transaction not found");
    if (recurring.user.id !== user.id) throw new AuthorizationError();

    await recurringRepo.delete(recurring.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
