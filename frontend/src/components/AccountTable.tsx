import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import { Account } from '../hooks/useAccounts';

interface Props {
  accounts: Account[];
  onArchiveToggle?: (accountId: string, isActive: boolean) => void;
  onDelete?: (accountId: string) => void;
}

const AccountTable: React.FC<Props> = ({ accounts, onArchiveToggle, onDelete }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Account #</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Balance</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell>{account.number}</TableCell>
              <TableCell>{account.name}</TableCell>
              <TableCell>{account.type}</TableCell>
              <TableCell>${account.balance?.toFixed(2) ?? '0.00'}</TableCell>
              <TableCell align="right">
                {onArchiveToggle && (
                  <Tooltip title={account.isArchived ? 'Unarchive' : 'Archive'}>
                    <IconButton onClick={() => onArchiveToggle(account.id, !account.isArchived)}>
                      <ArchiveIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip title="Delete">
                    <IconButton onClick={() => onDelete(account.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AccountTable;