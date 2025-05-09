import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/Account";
import { getUser } from "../utils/getUser"; // <-- Changed path

const accountRepo = AppDataSource.getRepository(Account);

// Create Account
export const createAccount = async (req: Request, res: Response) => {
  try {
    console.log("Request Body:", req.body);

    const user = await getUser(req); // Fetch user from token
    if (!user) {
      console.error("User not authorized");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, type, balance } = req.body;

    if (!name || !type || typeof balance !== "number") {
      console.error("Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const newAccount = accountRepo.create({
      name,
      type,
      balance,
      user,
    });

    console.log("New Account Payload:", newAccount);

    await accountRepo.save(newAccount);

    // 🛡️ Send back a clean response
    const responsePayload = {
      id: newAccount.id,
      name: newAccount.name,
      type: newAccount.type,
      balance: newAccount.balance,
      user: {
        id: user.id,
        email: user.email,
      },
    };

    res.status(201).json(responsePayload);
  } catch (error) {
    console.error("Error in createAccount:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Account by ID
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await accountRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["user"],
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const cleanAccount = {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      user: {
        id: account.user.id,
        email: account.user.email,
      },
    };

    res.status(200).json(cleanAccount);
  } catch (error) {
    console.error("Error in getAccountById:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Account
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, balance } = req.body;

    const account = await accountRepo.findOneBy({ id: parseInt(id) });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Update fields
    account.name = name ?? account.name;
    account.type = type ?? account.type;
    account.balance = balance ?? account.balance;

    await accountRepo.save(account);

    const responsePayload = {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error in updateAccount:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get All Accounts
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const user = await getUser(req); // Fetch user from token
    if (!user) {
      console.error("User not authorized");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const accounts = await accountRepo.find({
      where: { user: { id: user.id } },
      relations: ["user"],
    });

    // Map the results to remove the password
    const cleanAccounts = accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      user: {
        id: account.user.id,
        email: account.user.email,
      },
    }));

    res.status(200).json(cleanAccounts);
  } catch (error) {
    console.error("Error in getAccounts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete Account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await accountRepo.findOneBy({ id: parseInt(id) });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    await accountRepo.remove(account);

    res.status(204).send(); // No Content, delete was successful
  } catch (error) {
    console.error("Error in deleteAccount:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
