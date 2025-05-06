import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "@/utils/axios";
import toast from "react-hot-toast";

interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string;
}

interface Entry {
  amount: string;
  accountId: string;
}

const EditTransaction = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">(
    "EXPENSE"
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/accounts")
      .then((res) => setAccounts(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`/transactions`)
      .then((res) => {
        const tx = res.data.find((t: any) => t.id === id);
        if (!tx) return navigate("/transactions");
        setDescription(tx.description);
        setType(tx.type);
        if (tx.entries?.length > 0) {
          const loaded = tx.entries.map((e: any) => ({
            amount: e.amount.toString(),
            accountId: e.account.id,
          }));
          setEntries(loaded);
        } else {
          setEntries([
            { amount: tx.amount.toString(), accountId: tx.account.id },
          ]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load transaction", err);
        navigate("/transactions");
      });
  }, [id, navigate]);

  const handleEntryChange = (
    index: number,
    field: keyof Entry,
    value: string
  ) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!description || entries.some((e) => !e.amount || !e.accountId)) {
      setError("All fields are required.");
      return;
    }

    try {
      await axios.put(`/transactions/${id}`, {
        description,
        amount: parseFloat(entries[0].amount),
        type,
        reference: "edited", // Optional
      });
      toast.success("Transaction updated");
      navigate("/transactions");
    } catch (err) {
      console.error("Failed to update transaction:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Edit Transaction
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="text-red-600 font-medium">{error}</div>}

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {entries.map((entry, index) => (
          <div key={index} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">
                Amount {index + 1}
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={entry.amount}
                onChange={(e) =>
                  handleEntryChange(index, "amount", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">
                Account {index + 1}
              </label>
              <select
                className="w-full p-2 border rounded"
                value={entry.accountId}
                onChange={(e) =>
                  handleEntryChange(index, "accountId", e.target.value)
                }
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type} - {acc.subtype})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        <div>
          <label className="block mb-1 font-medium">Type</label>
          <select
            className="w-full p-2 border rounded"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Update Transaction
        </button>
      </form>
    </div>
  );
};

export default EditTransaction;
