import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  IconButton,
  Button,
  Grid,
} from '@mui/material';
import { Search as SearchIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useLedger } from '../contexts/LedgerContext';
import { useAccounts } from '../contexts/AccountsContext';
import { LedgerEntryDialog } from './LedgerEntryDialog';

export const LedgerTable: React.FC = () => {
  const { ledger } = useLedger();
  const { accounts } = useAccounts();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [amountRange, setAmountRange] = useState<[number | '', number | '']>(['', '']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredEntries = Object.values(ledger.accounts)
    .flatMap(accountLedger => accountLedger.entries)
    .filter(entry => {
      if (selectedAccount && entry.account.id !== selectedAccount) return false;
      if (dateRange[0] && entry.date < dateRange[0]) return false;
      if (dateRange[1] && entry.date > dateRange[1]) return false;
      if (amountRange[0] !== '' && (entry.debit + entry.credit) < amountRange[0]) return false;
      if (amountRange[1] !== '' && (entry.debit + entry.credit) > amountRange[1]) return false;
      if (searchTerm && !entry.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Paper>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <MenuItem value="">All Accounts</MenuItem>
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={dateRange[0]}
              onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={dateRange[1]}
              onChange={(e) => setDateRange([dateRange[0], e.target.value])}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search Description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: <SearchIcon />
              }}
            />
          </Grid>
        </Grid>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Account</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Debit</TableCell>
              <TableCell align="right">Credit</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntries
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.account.name}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell align="right">{formatCurrency(entry.debit)}</TableCell>
                  <TableCell align="right">{formatCurrency(entry.credit)}</TableCell>
                  <TableCell align="right">{formatCurrency(entry.balanceAfter)}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => setSelectedEntry(entry)}>
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredEntries.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {selectedEntry && (
        <LedgerEntryDialog
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </Paper>
  );
}; 