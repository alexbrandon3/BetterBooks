
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { SplitTransaction } from "../entities/SplitTransaction";
import { Account } from "../entities/Account";
import { getUser } from "../utils/getUser";
import { AuthenticationError, NotFoundError, AuthorizationError } from "../utils/errors";

const splitRepo = AppDataSource.getRepository(SplitTransaction);
const accountRepo = AppDataSource.getRepository(Account);

export const createSplitTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const { description, type, entries } = req.body;

    const splitTransaction = new SplitTransaction();
    splitTransaction.description = description;
    splitTransaction.type = type;
    splitTransaction.user = user;
    splitTransaction.entries = [];

    for (const entry of entries) {
      const account = await accountRepo.findOne({ where: { id: entry.accountId, user: { id: user.id } } });
      if (!account) throw new NotFoundError(`Account not found: ID ${entry.accountId}`);

      const split = new SplitTransaction();
      split.description = description;
      split.type = type;
      split.amount = entry.amount;
      split.account = account;
      split.user = user;

      splitTransaction.entries.push(split);
    }

    await splitRepo.save(splitTransaction.entries);
    res.status(201).json({ message: "Split transaction recorded", entries: splitTransaction.entries });
  } catch (error) {
    next(error);
  }
};

export const getSplitTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const splits = await splitRepo.find({
      where: { user: { id: user.id } },
      relations: ["account"],
    });

    res.status(200).json(splits);
  } catch (error) {
    next(error);
  }
};

export const deleteSplitTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUser(req);
    if (!user) throw new AuthenticationError();

    const split = await splitRepo.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ["user"],
    });

    if (!split) throw new NotFoundError("Split transaction not found");
    if (split.user.id !== user.id) throw new AuthorizationError();

    await splitRepo.delete(split.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
