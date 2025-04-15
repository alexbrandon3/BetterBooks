import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  Box
} from '@mui/material';
import { Edit as EditIcon, Archive as ArchiveIcon } from '@mui/icons-material';
import { Account, AccountType } from '../types/account';
import { ACCOUNT_TYPES } from '../utils/accountUtils';

interface AccountTableProps {
  accounts: Account[];
  sortBy: keyof Account;
  sortOrder: 'asc' | 'desc';
  onSort: (property: keyof Account) => void;
  onEdit: (account: Account) => void;
  onArchiveToggle: (accountId: string, isActive: boolean) => void;
}

const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onArchiveToggle
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'name'}
                direction={sortBy === 'name' ? sortOrder : 'asc'}
                onClick={() => onSort('name')}
              >
                Account Name
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'type'}
                direction={sortBy === 'type' ? sortOrder : 'asc'}
                onClick={() => onSort('type')}
              >
                Type
              </TableSortLabel>
            </TableCell>
            <TableCell>Subtype</TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={sortBy === 'balance'}
                direction={sortBy === 'balance' ? sortOrder : 'asc'}
                onClick={() => onSort('balance')}
              >
                Balance
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {account.name}
                  {!account.isActive && (
                    <Chip
                      label="Archived"
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Tooltip title={ACCOUNT_TYPES[account.type].description}>
                  <Chip
                    label={ACCOUNT_TYPES[account.type].label}
                    size="small"
                    sx={{
                      backgroundColor: ACCOUNT_TYPES[account.type].color,
                      color: 'white'
                    }}
                  />
                </Tooltip>
              </TableCell>
              <TableCell>{account.subtype}</TableCell>
              <TableCell align="right">
                {formatCurrency(account.balance)}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => onEdit(account)}
                  title="Edit Account"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onArchiveToggle(account.id, !account.isActive)}
                  title={account.isActive ? 'Archive Account' : 'Restore Account'}
                >
                  <ArchiveIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AccountTable; 