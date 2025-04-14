import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
} from '@mui/material';
import { Layout } from '../components/Layout';
import { LedgerTable } from '../components/LedgerTable';
import { FlaggedTransactions } from '../components/FlaggedTransactions';
import { useLedger } from '../contexts/LedgerContext';

export const LedgerViewerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { getFlaggedTransactions } = useLedger();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          General Ledger
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="All Transactions" />
            <Tab 
              label={`Flagged Transactions (${getFlaggedTransactions().length})`}
              sx={{
                '&.MuiTab-root': {
                  color: 'error.main',
                },
              }}
            />
          </Tabs>
        </Paper>

        {activeTab === 0 ? (
          <LedgerTable />
        ) : (
          <FlaggedTransactions />
        )}
      </Box>
    </Layout>
  );
}; 