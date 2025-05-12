import React, { useEffect, useState } from "react";
import axios from "../utils/axios";

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string;
  account: {
    id: number;
    name: string;
  };
}

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [accountRes, transactionRes] = await Promise.all([
          axios.get<Account[]>("/accounts"),
          axios.get<Transaction[]>("/transactions"),
        ]);
        setAccounts(accountRes.data);
        setTransactions(transactionRes.data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalBalance = accounts.reduce(
    (acc, account) => acc + account.balance,
    0
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Accounts Overview</h2>
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          {accounts.map((account) => (
            <div key={account.id} className="mb-2">
              <p className="font-bold">
                {account.name} - {account.type}
              </p>
              <p>Balance: ${account.balance.toFixed(2)}</p>
            </div>
          ))}
          <div className="font-bold mt-4">
            Total Balance: ${totalBalance.toFixed(2)}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Recent Transactions</h2>
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="mb-2">
              <p>
                {transaction.description} - ${transaction.amount.toFixed(2)}
              </p>
              <p>
                Type: {transaction.type} | Account: {transaction.account.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
