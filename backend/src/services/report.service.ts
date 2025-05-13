// report.service.ts

import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";
import { In } from "typeorm";

export const generateIncomeStatement = async (
  startDate: string,
  endDate: string
) => {
  const income = await AppDataSource.getRepository(Transaction).find({
    where: { type: "INCOME" },
  });
  const expenses = await AppDataSource.getRepository(Transaction).find({
    where: { type: "EXPENSE" },
  });

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  return {
    revenue: totalIncome,
    expenses: totalExpenses,
    netIncome,
  };
};

export const generateBalanceSheet = async (date: string) => {
  const accounts = await AppDataSource.getRepository(Account).find();

  const assets = accounts
    .filter((acc) => acc.type === "ASSET")
    .reduce((sum, acc) => sum + acc.balance, 0);
  const liabilities = accounts
    .filter((acc) => acc.type === "LIABILITY")
    .reduce((sum, acc) => sum + acc.balance, 0);
  const equity = assets - liabilities;

  return {
    assets,
    liabilities,
    equity,
  };
};

export const generateCashFlowStatement = async (
  startDate: string,
  endDate: string
) => {
  console.log(`🌟 Generating Cash Flow for period: ${startDate} to ${endDate}`);

  const transactions = await AppDataSource.getRepository(Transaction)
    .createQueryBuilder("transaction")
    .leftJoinAndSelect("transaction.account", "account")
    .where("transaction.date BETWEEN :startDate AND :endDate", {
      startDate,
      endDate,
    })
    .getMany();

  console.log(`✅ Found ${transactions.length} transactions`);

  let operatingActivities = 0;
  let investingActivities = 0;
  let financingActivities = 0;

  transactions.forEach((transaction) => {
    console.log(
      `📝 Processing: ${transaction.description} (${transaction.amount})`
    );
    if (transaction.account.type === "ASSET") {
      console.log("🔄 Investing Activity");
      investingActivities += transaction.amount;
    } else if (transaction.account.type === "LIABILITY") {
      console.log("💸 Financing Activity");
      financingActivities += transaction.amount;
    } else {
      console.log("💼 Operating Activity");
      operatingActivities += transaction.amount;
    }
  });

  console.log(`📊 Summary:`);
  console.log(`- Operating Activities: ${operatingActivities}`);
  console.log(`- Investing Activities: ${investingActivities}`);
  console.log(`- Financing Activities: ${financingActivities}`);

  return {
    operatingActivities,
    investingActivities,
    financingActivities,
    netCashFlow:
      operatingActivities + investingActivities + financingActivities,
  };
};
