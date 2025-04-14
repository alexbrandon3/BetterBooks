import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  NavigateNext as NavigateNextIcon,
  Dashboard as DashboardIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { Link as RouterLink } from 'react-router-dom';
import type { DateRange } from '@mui/x-date-pickers-pro/models';
import type { LedgerEntry, LedgerFilters, TransactionType, EntryStatus } from '../types/ledger';
import LedgerEntryDetails from '../components/LedgerEntryDetails';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(2),
  '&.debit': { color: theme.palette.error.main },
  '&.credit': { color: theme.palette.success.main },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    cursor: 'pointer',
  },
  '&.flagged': {
    backgroundColor: theme.palette.warning.light,
  },
  '&.ai-suggested': {
    backgroundColor: theme.palette.info.light,
  },
}));

const AuditReadinessMeter = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 5,
  },
}));

const SmartLedger: React.FC = () => {
  const [filters, setFilters] = useState<LedgerFilters>({
    dateRange: [null, null],
    hasAttachment: false,
  });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [auditReadiness, setAuditReadiness] = useState(85); // Example value

  const handleFilterChange = (field: keyof LedgerFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRowClick = (entryId: string) => {
    setExpandedRow(expandedRow === entryId ? null : entryId);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Mock data for demonstration
  const mockLedgerEntries: LedgerEntry[] = [
    {
      id: '1',
      date: new Date().toISOString(),
      account: {
        id: 'exp-001',
        name: 'Office Expenses',
        type: 'expense',
        balance: 0,
        currency: 'USD',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      description: 'Office Supplies Purchase',
      debit: 150.00,
      credit: 0,
      balanceAfter: -150.00,
      isFlagged: true,
      hasNegativeBalance: true,
      attachments: [{
        type: 'receipt',
        name: 'receipt.pdf',
        url: '#'
      }],
    },
    // Add more mock entries as needed
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <Link
          component={RouterLink}
          to="/dashboard"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <DashboardIcon sx={{ mr: 0.5, fontSize: 20 }} />
          Dashboard
        </Link>
        <Link
          component={RouterLink}
          to="/transactions"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ReceiptIcon sx={{ mr: 0.5, fontSize: 20 }} />
          Transactions
        </Link>
        <Typography
          color="text.primary"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <BookIcon sx={{ mr: 0.5, fontSize: 20 }} />
          Ledger
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom sx={{ color: '#1a237e', fontWeight: 600 }}>
        Ledger & Audit Trail
      </Typography>

      {/* Audit Readiness Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Audit Readiness Score
          </Typography>
          <AuditReadinessMeter
            variant="determinate"
            value={auditReadiness}
            color={auditReadiness > 80 ? 'success' : auditReadiness > 60 ? 'warning' : 'error'}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              {auditReadiness}% Complete
            </Typography>
            <Chip
              label={`${mockLedgerEntries.filter(e => e.isFlagged).length} Flagged Entries`}
              color="warning"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Filters */}
      <StyledPaper>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Account</InputLabel>
              <Select
                value={filters.accountId || ''}
                onChange={(e) => handleFilterChange('accountId', e.target.value)}
                label="Account"
              >
                <MenuItem value="">All Accounts</MenuItem>
                {/* Add account options */}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateRangePicker
                value={filters.dateRange}
                onChange={(newValue) => handleFilterChange('dateRange', newValue)}
                slotProps={{
                  textField: ({ position }) => ({
                    label: position === 'start' ? 'Start Date' : 'End Date',
                  }),
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Transaction Type</InputLabel>
              <Select
                multiple
                value={filters.transactionType || []}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                label="Transaction Type"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as TransactionType[]).map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="EXPENSE">Expense</MenuItem>
                <MenuItem value="INCOME">Income</MenuItem>
                <MenuItem value="TRANSFER">Transfer</MenuItem>
                <MenuItem value="JOURNAL">Journal Entry</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Min Amount"
                type="number"
                value={filters.amountRange?.min || ''}
                onChange={(e) => handleFilterChange('amountRange', {
                  ...filters.amountRange,
                  min: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
              <TextField
                label="Max Amount"
                type="number"
                value={filters.amountRange?.max || ''}
                onChange={(e) => handleFilterChange('amountRange', {
                  ...filters.amountRange,
                  max: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.hasAttachment || false}
                  onChange={(e) => handleFilterChange('hasAttachment', e.target.checked)}
                />
              }
              label="Has Attachment"
            />
          </Grid>
        </Grid>
      </StyledPaper>

      {/* Ledger Table */}
      <StyledPaper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Date</StyledTableCell>
                <StyledTableCell>Description</StyledTableCell>
                <StyledTableCell>Account</StyledTableCell>
                <StyledTableCell align="right">Debit</StyledTableCell>
                <StyledTableCell align="right">Credit</StyledTableCell>
                <StyledTableCell align="right">Balance</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockLedgerEntries
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((entry) => (
                  <React.Fragment key={entry.id}>
                    <StyledTableRow
                      onClick={() => handleRowClick(entry.id)}
                      className={entry.isFlagged ? 'flagged' : ''}
                    >
                      <StyledTableCell>{new Date(entry.date).toLocaleDateString()}</StyledTableCell>
                      <StyledTableCell>{entry.description}</StyledTableCell>
                      <StyledTableCell>{entry.account.name}</StyledTableCell>
                      <StyledTableCell align="right" className="debit">
                        {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : ''}
                      </StyledTableCell>
                      <StyledTableCell align="right" className="credit">
                        {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : ''}
                      </StyledTableCell>
                      <StyledTableCell align="right">${entry.balanceAfter.toFixed(2)}</StyledTableCell>
                      <StyledTableCell>
                        <Chip
                          label={entry.isFlagged ? 'Flagged' : 'Normal'}
                          color={entry.isFlagged ? 'warning' : 'default'}
                          size="small"
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {entry.attachments && entry.attachments.length > 0 && (
                            <Tooltip title="View Attachments">
                              <IconButton size="small">
                                <ReceiptIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="View Audit Trail">
                            <IconButton size="small">
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Entry">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </StyledTableCell>
                    </StyledTableRow>
                    <TableRow>
                      <TableCell colSpan={8} style={{ paddingBottom: 0, paddingTop: 0 }}>
                        <Collapse in={expandedRow === entry.id} timeout="auto" unmountOnExit>
                          <LedgerEntryDetails entry={entry} />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={mockLedgerEntries.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </StyledPaper>
    </Box>
  );
};

export default SmartLedger; 