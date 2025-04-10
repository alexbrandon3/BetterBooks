import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  Divider,
  styled,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Computer as DeviceIcon,
} from '@mui/icons-material';
import type { LedgerEntry } from '../types/ledger';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.5),
  '&.debit': { color: theme.palette.error.main },
  '&.credit': { color: theme.palette.success.main },
}));

const DetailSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

interface LedgerEntryDetailsProps {
  entry: LedgerEntry;
}

const LedgerEntryDetails: React.FC<LedgerEntryDetailsProps> = ({ entry }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Transaction Details */}
        <Grid item xs={12} md={6}>
          <DetailSection>
            <Typography variant="h6" gutterBottom>
              Transaction Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Transaction Type
                </Typography>
                <Chip
                  label={entry.transactionType}
                  color={
                    entry.transactionType === 'INCOME'
                      ? 'success'
                      : entry.transactionType === 'EXPENSE'
                      ? 'error'
                      : 'default'
                  }
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={entry.status}
                  color={
                    entry.status === 'REVIEWED'
                      ? 'success'
                      : entry.status === 'PENDING'
                      ? 'warning'
                      : 'default'
                  }
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              {entry.metadata.aiSuggested && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    AI Confidence
                  </Typography>
                  <Chip
                    label={`${(entry.metadata.aiConfidence || 0) * 100}%`}
                    color={entry.metadata.aiConfidence && entry.metadata.aiConfidence > 0.9 ? 'success' : 'warning'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
              )}
            </Grid>
          </DetailSection>

          {/* Related Accounts */}
          <DetailSection>
            <Typography variant="h6" gutterBottom>
              Related Accounts
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Account</StyledTableCell>
                    <StyledTableCell align="right">Debit</StyledTableCell>
                    <StyledTableCell align="right">Credit</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entry.relatedAccounts.map((account) => (
                    <TableRow key={account.accountId}>
                      <StyledTableCell>{account.accountName}</StyledTableCell>
                      <StyledTableCell align="right" className="debit">
                        {account.debit > 0 ? `$${account.debit.toFixed(2)}` : ''}
                      </StyledTableCell>
                      <StyledTableCell align="right" className="credit">
                        {account.credit > 0 ? `$${account.credit.toFixed(2)}` : ''}
                      </StyledTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DetailSection>
        </Grid>

        {/* Attachments and Audit Trail */}
        <Grid item xs={12} md={6}>
          {/* Attachments */}
          {entry.attachments.length > 0 && (
            <DetailSection>
              <Typography variant="h6" gutterBottom>
                Attachments
              </Typography>
              {entry.attachments.map((attachment) => (
                <Box
                  key={attachment.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <ReceiptIcon color="action" />
                  <Link href={attachment.url} target="_blank" rel="noopener">
                    {attachment.filename}
                  </Link>
                </Box>
              ))}
            </DetailSection>
          )}

          {/* Audit Trail */}
          <DetailSection>
            <Typography variant="h6" gutterBottom>
              Audit Trail
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {entry.auditTrail.map((log) => (
                <Paper
                  key={log.id}
                  variant="outlined"
                  sx={{ p: 2, mb: 1, backgroundColor: 'background.default' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {log.timestamp.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">{log.userId}</Typography>
                  </Box>
                  <Typography variant="body1" gutterBottom>
                    {log.action} - {log.entityType}
                  </Typography>
                  {log.changes.map((change, index) => (
                    <Box key={index} sx={{ ml: 2, mt: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        {change.field}:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: 'line-through', color: 'error.main' }}
                      >
                        {JSON.stringify(change.oldValue)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'success.main' }}>
                        {JSON.stringify(change.newValue)}
                      </Typography>
                    </Box>
                  ))}
                  {log.metadata.deviceInfo && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <DeviceIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="textSecondary">
                        {log.metadata.deviceInfo}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          </DetailSection>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LedgerEntryDetails; 