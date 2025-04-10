import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AssetSetupPage from './pages/AssetSetupPage';
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import TransactionEntryPage from './pages/TransactionEntryPage';
import DashboardPage from './pages/DashboardPage';
import StatementGenerator from './pages/FinancialStatementGeneratorPage';
import SmartLedger from './pages/SmartLedgerPage';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div data-testid="app-container">
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/setup" element={<AssetSetupPage />} />
            <Route path="/setup/chart-of-accounts" element={<ChartOfAccountsPage />} />
            <Route path="/transactions" element={<TransactionEntryPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/statements" element={<StatementGenerator />} />
            <Route path="/ledger" element={<SmartLedger />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
};

export default App; 