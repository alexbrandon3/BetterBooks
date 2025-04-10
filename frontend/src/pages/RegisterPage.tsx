import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  SelectChangeEvent,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Business, CalendarMonth, Description, Person } from '@mui/icons-material';

const steps = ['Account Info', 'Business Setup', 'Entity Type', 'Fiscal Calendar', 'Optional Uploads'];

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
}));

const RegisterPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    
    // Step 2: Business Setup
    businessName: '',
    dba: '',
    ein: '',
    state: '',
    industry: '',
    
    // Step 3: Entity Type
    entityType: '',
    isSingleMemberLLC: false,
    
    // Step 4: Fiscal Calendar
    fiscalYearEnd: '',
    startDate: '',
    
    // Step 5: Optional Uploads
    documents: [] as File[],
    accountantEmail: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    if ('type' in e.target) {
      const { name, value, checked } = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: e.target.type === 'checkbox' ? checked : value,
      }));
    } else {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        documents: Array.from(e.target.files as FileList),
      }));
    }
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
    console.log('Registration data:', formData);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    required
                  />
                }
                label="I accept the terms and conditions"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Business Name"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="DBA (Optional)"
                name="dba"
                value={formData.dba}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="EIN (Optional)"
                name="ein"
                value={formData.ein}
                onChange={handleChange}
                placeholder="XX-XXXXXXX"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>State of Operation</InputLabel>
                <Select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                >
                  {/* Add all US states */}
                  <MenuItem value="CA">California</MenuItem>
                  <MenuItem value="NY">New York</MenuItem>
                  {/* Add more states */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  name="entityType"
                  value={formData.entityType}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="sole">Sole Proprietor</MenuItem>
                  <MenuItem value="llc">LLC</MenuItem>
                  <MenuItem value="scorp">S Corp</MenuItem>
                  <MenuItem value="ccorp">C Corp</MenuItem>
                  <MenuItem value="partnership">Partnership</MenuItem>
                  <MenuItem value="nonprofit">Nonprofit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.entityType === 'llc' && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isSingleMemberLLC"
                      checked={formData.isSingleMemberLLC}
                      onChange={handleChange}
                    />
                  }
                  label="Single-member LLC"
                />
              </Grid>
            )}
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Fiscal Year End</InputLabel>
                <Select
                  name="fiscalYearEnd"
                  value={formData.fiscalYearEnd}
                  onChange={handleChange}
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date of Operations (Optional)"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                Upload Business Documents
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.jpg,.jpeg"
                  onChange={handleFileUpload}
                />
              </Button>
              {formData.documents.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {formData.documents.length} file(s) selected
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Accountant Email (Optional)"
                name="accountantEmail"
                type="email"
                value={formData.accountantEmail}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A2A6C 0%, #0A1A5C 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <StyledPaper elevation={3}>
          <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1A2A6C' }}>
            Create Your Account
          </Typography>
          <Stepper activeStep={activeStep} sx={{ mt: 4, mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <form onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              >
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </Box>
          </form>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default RegisterPage; 