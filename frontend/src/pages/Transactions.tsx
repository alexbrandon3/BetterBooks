// src/pages/Transactions.tsx

import { useEffect, useState } from "react";
import axios from "@/utils/axios";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  description: string;
  amount: number | null;
  type: string;
  createdAt: string;
  entries?: {
    amount: number;
    account: { name: string };
  }[];
  account?: { name: string };
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const navigate = useNavigate();

  const formatAmount = (value: any) => (Number(value) || 0).toFixed(2);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get("/transactions");
        setTransactions(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/transactions/${deleteId}`);
      setTransactions((prev) => prev.filter((tx) => tx.id !== deleteId));
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  if (loading) {
    return (
      <Box mt={10} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={8}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={4} sx={{ backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ color: "#1a2b4c", fontWeight: 600 }}
      >
        All Transactions
      </Typography>

      {transactions.length === 0 ? (
        <Typography color="text.secondary">
          No transactions recorded.
        </Typography>
      ) : (
        <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
          <List>
            {transactions.map((tx) => (
              <div key={tx.id}>
                <ListItem
                  secondaryAction={
                    <>
                      <IconButton
                        onClick={() => navigate(`/edit-transaction/${tx.id}`)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => openDeleteDialog(tx.id)}>
                        <Delete />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemText
                    primary={
                      tx.type === "TRANSFER" && tx.entries?.length === 2
                        ? `Transfer: ${tx.entries[0].account.name} → ${tx.entries[1].account.name}`
                        : `${tx.description} (${tx.type})`
                    }
                    secondary={`$${formatAmount(
                      tx.amount ?? tx.entries?.[0]?.amount
                    )} – ${new Date(tx.createdAt).toLocaleDateString()}`}
                  />
                </ListItem>
                <Divider />
              </div>
            ))}
          </List>
        </Paper>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Transaction</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this transaction? This action cannot
          be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions;
