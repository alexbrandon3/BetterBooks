// Updated Dashboard.tsx with reimagined layout and fixes
import { useEffect, useState } from "react";
import { fetchAccounts } from "../services/AccountService";
import { fetchTransactions } from "../services/TransactionService";
import { formatCurrency } from "../utils/formatters";
import { formatDate } from "../utils/financial";

interface Account {
  id: string;
  name: string;
  balance: number;
  category: string;
  type: string;
}

interface TransactionEntry {
  amount: string | number;
  accountId: string;
}

interface Transaction {
  id: number;
  description: string;
  startDate?: string;
  entries: TransactionEntry[];
}

const CASH_ACCOUNT_CATEGORIES = ["Checking", "Savings", "Petty Cash", "Undeposited Funds"];

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchAccounts().then(setAccounts);
    fetchTransactions().then(setTransactions);
  }, []);

  const cashAccounts = accounts.filter(account => 
    CASH_ACCOUNT_CATEGORIES.includes(account.category)
  );

  const availableCash = cashAccounts.reduce((sum, acct) => {
    const validBalance = typeof acct.balance === "number" && !isNaN(acct.balance) ? acct.balance : 0;
    return sum + validBalance;
  }, 0);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-500">Available Cash</h2>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(availableCash)}</p>
        </div>

        <div className="bg-white shadow rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-500">Quick Actions</h2>
          <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">
            + New Transaction
          </button>
        </div>

        <div className="bg-white shadow rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-500">Accounts</h2>
          <ul className="text-sm text-gray-700 space-y-1 max-h-32 overflow-y-auto">
            {accounts.map(account => (
              <li key={account.id}>
                {account.name}: {formatCurrency(account.balance)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Recent Transactions</h2>
        <ul className="divide-y divide-gray-200">
          {recentTransactions.map(tx => (
            <li key={tx.id} className="py-2">
              <p className="text-sm font-medium text-gray-800">{tx.description}</p>
              <p className="text-xs text-gray-500">{tx.startDate ? formatDate(tx.startDate) : 'No date'}</p>
            </li>
          ))}
          {recentTransactions.length === 0 && (
            <p className="text-gray-500 text-sm">No recent transactions available.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
