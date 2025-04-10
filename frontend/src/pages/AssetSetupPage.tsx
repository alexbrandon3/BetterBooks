import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormControlLabel,
  Switch,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  Inventory as InventoryIcon,
  DirectionsCar as VehicleIcon,
  Computer as EquipmentIcon,
  Receipt as PrepaidIcon,
  Payments as ReceivableIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '12px',
}));

const AssetCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '8px',
  border: '1px solid rgba(0, 0, 0, 0.1)',
}));

const AssetSetupPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);

  const steps = [
    'Business Information',
    'Assets',
    'Liabilities',
    'Review',
  ];

  const [cashAccounts, setCashAccounts] = useState([{
    accountName: '',
    bankName: '',
    balance: '',
    statement: null,
  }]);

  const addCashAccount = () => {
    setCashAccounts([...cashAccounts, {
      accountName: '',
      bankName: '',
      balance: '',
      statement: null,
    }]);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A2A6C 0%, #0A1A5C 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Grid container spacing={4}>
          {/* Left Panel - Guidance */}
          <Grid item xs={12} md={4}>
            <StyledPaper elevation={3}>
              <Typography variant="h4" gutterBottom>
                Set Up Your Business Assets
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Let's enter everything your business owns so we can start off on solid ground.
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Total Assets: ${totalAssets.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This will be your starting balance sheet total.
              </Typography>
            </StyledPaper>
          </Grid>

          {/* Right Panel - Forms */}
          <Grid item xs={12} md={8}>
            <StyledPaper elevation={3}>
              <Typography variant="h5" gutterBottom>
                Cash & Bank Accounts
              </Typography>
              
              {cashAccounts.map((account, index) => (
                <AssetCard key={index}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Account Name"
                        value={account.accountName}
                        onChange={(e) => {
                          const newAccounts = [...cashAccounts];
                          newAccounts[index].accountName = e.target.value;
                          setCashAccounts(newAccounts);
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BankIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={account.bankName}
                        onChange={(e) => {
                          const newAccounts = [...cashAccounts];
                          newAccounts[index].bankName = e.target.value;
                          setCashAccounts(newAccounts);
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Balance"
                        type="number"
                        value={account.balance}
                        onChange={(e) => {
                          const newAccounts = [...cashAccounts];
                          newAccounts[index].balance = e.target.value;
                          setCashAccounts(newAccounts);
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        component="label"
                      >
                        Upload Statement
                        <input
                          type="file"
                          hidden
                          onChange={(e) => {
                            const newAccounts = [...cashAccounts];
                            newAccounts[index].statement = e.target.files?.[0] || null;
                            setCashAccounts(newAccounts);
                          }}
                        />
                      </Button>
                    </Grid>
                  </Grid>
                </AssetCard>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addCashAccount}
                sx={{ mt: 2 }}
              >
                Add Another Account
              </Button>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(activeStep - 1)}
                  disabled={activeStep === 0}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(activeStep + 1)}
                >
                  {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </Box>
            </StyledPaper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AssetSetupPage; 