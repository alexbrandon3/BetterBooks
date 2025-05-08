import { useEffect, useState } from "react";
import {
  getTransactions,
  deleteTransaction,
} from "@/services/TransactionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TransactionDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await getTransactions();
        setTransactions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting transaction:", err.message);
    }
  };

  return (
    <Card className="p-4">
      <CardContent>
        {loading ? (
          <p>Loading transactions...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b">
                  <td>{transaction.description}</td>
                  <td>{transaction.type}</td>
                  <td>${transaction.amount}</td>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td>
                    <Button
                      onClick={() => handleDelete(transaction.id)}
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionDashboard;
