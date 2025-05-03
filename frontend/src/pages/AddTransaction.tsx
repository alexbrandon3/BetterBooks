import React, { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string;
}

const AddTransaction = () => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [suggestedAccount, setSuggestedAccount] = useState<Account | null>(
    null
  );
  const [debouncedDescription, setDebouncedDescription] = useState(description);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedDescription(description), 500);
    return () => clearTimeout(timeout);
  }, [description]);

  useEffect(() => {
    axios
      .get("/accounts")
      .then((res) => setAccounts(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (debouncedDescription.trim().length < 3)
      return setSuggestedAccount(null);
    axios
      .post("/suggestions", { description: debouncedDescription })
      .then((res) => {
        const suggestion = res.data?.suggestedAccount;
        setSuggestedAccount(suggestion || null);
      })
      .catch(() => setSuggestedAccount(null));
  }, [debouncedDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!description || !amount || !selectedAccountId) {
      setError("All fields are required.");
      return;
    }

    try {
      await axios.post("/transactions", {
        description,
        amount: parseFloat(amount),
        type,
        accountId: selectedAccountId,
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to create transaction:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Add Transaction
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="text-red-600 font-medium">{error}</div>}

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="e.g. Coffee, Rent, Salary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {suggestedAccount && (
            <div
              className="text-sm text-blue-600 cursor-pointer mt-1"
              onClick={() => {
                setSelectedAccountId(suggestedAccount.id);
                toast.success("Suggested category applied!");
                setSuggestedAccount(null);
              }}
            >
              💡 Suggested: <strong>{suggestedAccount.name}</strong> (
              {suggestedAccount.type} - {suggestedAccount.subtype})
            </div>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Amount</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            placeholder="e.g. 100.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Type</label>
          <select
            className="w-full p-2 border rounded"
            value={type}
            onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Account</label>
          <select
            className="w-full p-2 border rounded"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            <option value="">Select Account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.type} - {acc.subtype})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Save Transaction
        </button>
      </form>
    </div>
  );
};

export default AddTransaction;
