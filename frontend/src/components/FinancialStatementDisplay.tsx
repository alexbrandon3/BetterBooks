import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
} from '@mui/material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
}));

const HeaderCell = styled(StyledTableCell)(({ theme }) => ({
  backgroundColor: '#f5f5f5',
  fontWeight: 600,
  color: '#1a237e',
}));

const TotalCell = styled(StyledTableCell)(({ theme }) => ({
  fontWeight: 600,
  color: '#1a237e',
  borderTop: '2px solid #1a237e',
}));

interface FinancialStatementDisplayProps {
  statementType: 'balance-sheet' | 'income-statement' | 'cash-flow';
  data: any; // TODO: Define proper type for financial data
  includeDescriptions: boolean;
  comparative: boolean;
}

const FinancialStatementDisplay: React.FC<FinancialStatementDisplayProps> = ({
  statementType,
  data,
  includeDescriptions,
  comparative,
}) => {
  const renderBalanceSheet = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <HeaderCell>Account</HeaderCell>
            {includeDescriptions && <HeaderCell>Description</HeaderCell>}
            <HeaderCell align="right">Current Period</HeaderCell>
            {comparative && <HeaderCell align="right">Prior Period</HeaderCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Assets */}
          <TableRow>
            <StyledTableCell colSpan={comparative ? 4 : 3} sx={{ fontWeight: 600, color: '#1a237e' }}>
              Assets
            </StyledTableCell>
          </TableRow>
          {/* Current Assets */}
          <TableRow>
            <StyledTableCell sx={{ pl: 2 }}>Current Assets</StyledTableCell>
            {includeDescriptions && <StyledTableCell />}
            <StyledTableCell align="right">$0.00</StyledTableCell>
            {comparative && <StyledTableCell align="right">$0.00</StyledTableCell>}
          </TableRow>
          {/* Non-Current Assets */}
          <TableRow>
            <StyledTableCell sx={{ pl: 2 }}>Non-Current Assets</StyledTableCell>
            {includeDescriptions && <StyledTableCell />}
            <StyledTableCell align="right">$0.00</StyledTableCell>
            {comparative && <StyledTableCell align="right">$0.00</StyledTableCell>}
          </TableRow>
          <TableRow>
            <TotalCell>Total Assets</TotalCell>
            {includeDescriptions && <TotalCell />}
            <TotalCell align="right">$0.00</TotalCell>
            {comparative && <TotalCell align="right">$0.00</TotalCell>}
          </TableRow>

          {/* Liabilities and Equity */}
          <TableRow>
            <StyledTableCell colSpan={comparative ? 4 : 3} sx={{ fontWeight: 600, color: '#1a237e' }}>
              Liabilities and Equity
            </StyledTableCell>
          </TableRow>
          {/* Current Liabilities */}
          <TableRow>
            <StyledTableCell sx={{ pl: 2 }}>Current Liabilities</StyledTableCell>
            {includeDescriptions && <StyledTableCell />}
            <StyledTableCell align="right">$0.00</StyledTableCell>
            {comparative && <StyledTableCell align="right">$0.00</StyledTableCell>}
          </TableRow>
          {/* Non-Current Liabilities */}
          <TableRow>
            <StyledTableCell sx={{ pl: 2 }}>Non-Current Liabilities</StyledTableCell>
            {includeDescriptions && <StyledTableCell />}
            <StyledTableCell align="right">$0.00</StyledTableCell>
            {comparative && <StyledTableCell align="right">$0.00</StyledTableCell>}
          </TableRow>
          {/* Equity */}
          <TableRow>
            <StyledTableCell sx={{ pl: 2 }}>Equity</StyledTableCell>
            {includeDescriptions && <StyledTableCell />}
            <StyledTableCell align="right">$0.00</StyledTableCell>
            {comparative && <StyledTableCell align="right">$0.00</StyledTableCell>}
          </TableRow>
          <TableRow>
            <TotalCell>Total Liabilities and Equity</TotalCell>
            {includeDescriptions && <TotalCell />}
            <TotalCell align="right">$0.00</TotalCell>
            {comparative && <TotalCell align="right">$0.00</TotalCell>}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderIncomeStatement = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <HeaderCell>Account</HeaderCell>
            {includeDescriptions && <HeaderCell>Description</HeaderCell>}
            <HeaderCell align="right">Current Period</HeaderCell>
            {comparative && <HeaderCell align="right">Prior Period</HeaderCell>}
            {comparative && <HeaderCell align="right">% Change</HeaderCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Revenue */}
          <TableRow>
            <StyledTableCell colSpan={comparative ? 5 : 3} sx={{ fontWeight: 600, color: '#1a237e' }}>
              Revenue
            </StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell sx={{ pl: 2 }}>Total Revenue</StyledTableCell>
            {includeDescriptions && <StyledTableCell />}
            <StyledTableCell align="right">$0.00</StyledTableCell>
            {comparative && <StyledTableCell align="right">$0.00</StyledTableCell>}
            {comparative && <StyledTableCell align="right">0%</StyledTableCell>}
          </TableRow>

          {/* Expenses */}
          <TableRow>
            <StyledTableCell colSpan={comparative ? 5 : 3} sx={{ fontWeight: 600, color: '#1a237e' }}>
              Expenses
            </StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell sx={{ pl: 2 }}>Total Expenses</StyledTableCell>
            {includeDescriptions && <StyledTableCell />}
            <StyledTableCell align="right">$0.00</StyledTableCell>
            {comparative && <StyledTableCell align="right">$0.00</StyledTableCell>}
            {comparative && <StyledTableCell align="right">0%</StyledTableCell>}
          </TableRow>

          {/* Net Income */}
          <TableRow>
            <TotalCell>Net Income</TotalCell>
            {includeDescriptions && <TotalCell />}
            <TotalCell align="right">$0.00</TotalCell>
            {comparative && <TotalCell align="right">$0.00</TotalCell>}
            {comparative && <TotalCell align="right">0%</TotalCell>}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCashFlowStatement = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <HeaderCell>Category</HeaderCell>
            {includeDescriptions && <HeaderCell>Description</HeaderCell>}
            <HeaderCell align="right">Current Period</HeaderCell>
            {comparative && <HeaderCell align="right">Prior Period</HeaderCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Operating Activities */}
          <TableRow>
            <StyledTableCell colSpan={comparative ? 4 : 3} sx={{ fontWeight: 600, color: '#1a237e' }}>
              Operating Activities
            </StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell sx={{ pl: 2 }}>Net Cash from Operations</StyledTableCell>
            {includeDescriptions && <StyledTableCell />}
            <StyledTableCell align="right">$0.00</StyledTableCell>
            {comparative && <StyledTableCell align="right">$0.00</StyledTableCell>}
          </TableRow>

          {/* Investing Activities */}
          <TableRow>
            <StyledTableCell colSpan={comparative ? 4 : 3} sx={{ fontWeight: 600, color: '#1a237e' }}>
              Investing Activities
            </StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell sx={{ pl: 2 }}>Net Cash from Investing</StyledTableCell>
            {includeDescriptions && <StyledTableCell />}
            <StyledTableCell align="right">$0.00</StyledTableCell>
            {comparative && <StyledTableCell align="right">$0.00</StyledTableCell>}
          </TableRow>

          {/* Financing Activities */}
          <TableRow>
            <StyledTableCell colSpan={comparative ? 4 : 3} sx={{ fontWeight: 600, color: '#1a237e' }}>
              Financing Activities
            </StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell sx={{ pl: 2 }}>Net Cash from Financing</StyledTableCell>
            {includeDescriptions && <StyledTableCell />}
            <StyledTableCell align="right">$0.00</StyledTableCell>
            {comparative && <StyledTableCell align="right">$0.00</StyledTableCell>}
          </TableRow>

          {/* Net Change in Cash */}
          <TableRow>
            <TotalCell>Net Change in Cash</TotalCell>
            {includeDescriptions && <TotalCell />}
            <TotalCell align="right">$0.00</TotalCell>
            {comparative && <TotalCell align="right">$0.00</TotalCell>}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <StyledPaper>
      <Typography variant="h5" gutterBottom sx={{ color: '#1a237e', fontWeight: 600 }}>
        {statementType === 'balance-sheet' && 'Balance Sheet'}
        {statementType === 'income-statement' && 'Income Statement'}
        {statementType === 'cash-flow' && 'Statement of Cash Flows'}
      </Typography>
      {statementType === 'balance-sheet' && renderBalanceSheet()}
      {statementType === 'income-statement' && renderIncomeStatement()}
      {statementType === 'cash-flow' && renderCashFlowStatement()}
    </StyledPaper>
  );
};

export default FinancialStatementDisplay; 