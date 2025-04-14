import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AssetSetupPage from './pages/AssetSetupPage';
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import TransactionEntryPage from './pages/TransactionEntryPage';
import DashboardPage from './pages/DashboardPage';
import StatementGenerator from './pages/FinancialStatementGeneratorPage';
import SmartLedger from './pages/SmartLedgerPage';
import { AccountsProvider } from './contexts/AccountsContext';
import { AuthProvider } from './contexts/AuthContext';
import { LedgerProvider } from './contexts/LedgerContext';

// Placeholder components for new routes
const WorkingPapersPage: React.FC = () => <div>Working Papers Page</div>;
const AuditTrailPage: React.FC = () => <div>Audit Trail Page</div>;
const SettingsPage: React.FC = () => <div>Settings Page</div>;
const SupportPage: React.FC = () => <div>Support Page</div>;

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AccountsProvider>
          <LedgerProvider>
            <ToastProvider>
              <NotificationsProvider>
                <div data-testid="app-container">
                  <Router>
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/setup" element={<AssetSetupPage />} />
                      <Route path="/setup/chart-of-accounts" element={<ChartOfAccountsPage />} />
                      <Route path="/transactions" element={<TransactionEntryPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/financial-statements" element={<StatementGenerator />} />
                      <Route path="/working-papers" element={<WorkingPapersPage />} />
                      <Route path="/audit-trail" element={<AuditTrailPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/support" element={<SupportPage />} />
                      <Route path="/ledger" element={<SmartLedger />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Router>
                </div>
              </NotificationsProvider>
            </ToastProvider>
          </LedgerProvider>
        </AccountsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 