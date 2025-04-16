import { useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useAccounts } from '../hooks/useAccounts';

const ChartOfAccountsPage = () => {
  const { accounts, loading, error, refresh } = useAccounts();

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        📘 Chart of Accounts
      </Typography>

      {loading ? (
        <Typography>Loading accounts...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account #</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.number}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.type}</TableCell>
                  <TableCell>${account.balance?.toFixed(2) ?? '0.00'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ChartOfAccountsPage;
