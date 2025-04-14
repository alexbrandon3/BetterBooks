import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from '../components/Layout';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
}));

const FinancialStatementGeneratorPage: React.FC = () => {
  const [statementType, setStatementType] = useState('balance-sheet');
  const [period, setPeriod] = useState('current-month');

  const handleGenerate = () => {
    // Generate statement logic here
    console.log('Generating statement:', { statementType, period });
  };

  return (
    <Layout initialSidebarOpen={false}>
      <Container maxWidth="lg">
        <StyledPaper elevation={3}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Financial Statement Generator
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Generate and customize your financial statements
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Statement Type</InputLabel>
                <Select
                  value={statementType}
                  onChange={(e) => setStatementType(e.target.value)}
                  label="Statement Type"
                >
                  <MenuItem value="balance-sheet">Balance Sheet</MenuItem>
                  <MenuItem value="income-statement">Income Statement</MenuItem>
                  <MenuItem value="cash-flow">Cash Flow Statement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  label="Period"
                >
                  <MenuItem value="current-month">Current Month</MenuItem>
                  <MenuItem value="last-month">Last Month</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleGenerate}
            >
              Generate Statement
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              disabled
            >
              Download
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              disabled
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              disabled
            >
              Share
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Sample Account 1</TableCell>
                  <TableCell align="right">$1,000.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sample Account 2</TableCell>
                  <TableCell align="right">$2,500.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </StyledPaper>
      </Container>
    </Layout>
  );
};

export default FinancialStatementGeneratorPage; 