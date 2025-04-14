import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { LedgerEntry } from '../types/ledger';
import { formatCurrency } from '../utils/formatting';

interface LedgerEntryDialogProps {
  entry: LedgerEntry;
  onClose: () => void;
}

export const LedgerEntryDialog: React.FC<LedgerEntryDialogProps> = ({ entry, onClose }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Transaction Details</Typography>
          <Box>
            {entry.isFlagged && (
              <Chip
                label="Flagged"
                color="warning"
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            {entry.hasNegativeBalance && (
              <Chip
                label="Negative Balance"
                color="error"
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            {entry.hasUnusualActivity && (
              <Chip
                label="Unusual Activity"
                color="warning"
                size="small"
              />
            )}
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Date</Typography>
          <Typography>{formatDate(entry.date)}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Account</Typography>
          <Typography>{entry.account.name}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Description</Typography>
          <Typography>{entry.description}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
          <Typography>
            {entry.debit > 0 ? 'Debit: ' + formatCurrency(entry.debit) : 'Credit: ' + formatCurrency(entry.credit)}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Balance After</Typography>
          <Typography>{formatCurrency(entry.balanceAfter)}</Typography>
        </Box>

        {entry.attachments && entry.attachments.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Attachments</Typography>
              {entry.attachments.map((attachment, index) => (
                <Typography key={index} sx={{ mt: 1 }}>
                  {attachment.type === 'receipt' ? '📄' : '📝'} {attachment.name}
                </Typography>
              ))}
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Transaction ID</Typography>
          <Typography variant="body2" color="text.secondary">{entry.id}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 