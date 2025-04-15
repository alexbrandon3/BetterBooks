import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Collapse,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Paper
} from '@mui/material';
import { Info as InfoIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { Account, AccountType } from '../types/account';
import { ACCOUNT_TYPES, ACCOUNT_SUBTYPES } from '../utils/accountUtils';
import { predictAccountType, validateAccountNumber, getAccountNumberPrefix } from '../utils/accountPrediction';
import { analyzeAccountName, getAccountNameSuggestions } from '../utils/accountNameAnalysis';

interface AccountFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (account: Partial<Account>) => void;
  account?: Account;
  formError?: string;
}

const AccountFormDialog: React.FC<AccountFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  account,
  formError
}) => {
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    type: 'asset',
    subType: '',
    balance: undefined,
    currency: 'USD',
    isActive: true
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [prediction, setPrediction] = useState<ReturnType<typeof predictAccountType> | null>(null);
  const [showPrediction, setShowPrediction] = useState(true);
  const [manualOverride, setManualOverride] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<ReturnType<typeof getAccountNameSuggestions>>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setFormData(account);
      setManualOverride(true);
    } else {
      setFormData({
        name: '',
        type: 'asset',
        subType: '',
        balance: undefined,
        currency: 'USD',
        isActive: true
      });
      setManualOverride(false);
    }
  }, [account]);

  useEffect(() => {
    if (formData.name && !manualOverride) {
      const result = predictAccountType(formData.name, formData.description);
      setPrediction(result);
      
      if (result.primary.confidence > 0.6) {
        setFormData(prev => ({
          ...prev,
          type: result.primary.type,
          subType: result.primary.subType
        }));
      }
    }
  }, [formData.name, formData.description, manualOverride]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setFormData(prev => ({ ...prev, name }));
    setManualOverride(false);

    // Analyze account name and get suggestions
    const bestMatch = analyzeAccountName(name);
    const suggestions = getAccountNameSuggestions(formData.type || 'asset', name);

    // Update suggestions
    setNameSuggestions(suggestions);
    setShowNameSuggestions(name.length > 0 && suggestions.length > 0);

    // If we have a confident match, update type and subtype
    if (bestMatch && bestMatch.score >= 1) {
      const predictedType = bestMatch.type;
      const predictedSubtypes = ACCOUNT_SUBTYPES[predictedType] || [];

      setFormData(prev => ({
        ...prev,
        type: predictedType,
        subType: predictedSubtypes[0] || ''
      }));

      setManualOverride(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, name: suggestion }));
    setShowNameSuggestions(false);
  };

  const handleChange = (field: keyof Account) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'balance' 
      ? (event.target.value === '' ? undefined : parseFloat(event.target.value))
      : event.target.value;

    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'name' || field === 'description') {
        setManualOverride(false);
      }
      
      return updated;
    });
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const type = event.target.value as AccountType;
    setFormData(prev => ({
      ...prev,
      type,
      subType: ACCOUNT_SUBTYPES[type][0]
    }));
    setManualOverride(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (submitError) {
      setSubmitError(submitError instanceof Error ? submitError.message : 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {account ? 'Edit Account' : 'Add New Account'}
      </DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        {prediction && showPrediction && !manualOverride && (
          <Alert 
            severity={prediction.primary.confidence > 0.6 ? "info" : "warning"}
            sx={{ mb: 2 }}
            onClose={() => setShowPrediction(false)}
          >
            <Typography variant="body2" gutterBottom>
              {prediction.message}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={ACCOUNT_TYPES[prediction.primary.type].label}
                size="small"
                sx={{
                  backgroundColor: ACCOUNT_TYPES[prediction.primary.type].color,
                  color: 'white',
                  mr: 1
                }}
              />
              <Typography variant="caption" color="textSecondary">
                Confidence: {Math.round(prediction.primary.confidence * 100)}%
              </Typography>
            </Box>
            {prediction.alternatives.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Alternatives:
                </Typography>
                {prediction.alternatives.map((alt, index) => (
                  <Chip
                    key={index}
                    label={ACCOUNT_TYPES[alt.type].label}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        type: alt.type,
                        subType: alt.subType
                      }));
                      setManualOverride(true);
                    }}
                  />
                ))}
              </Box>
            )}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Account Name"
              value={formData.name}
              onChange={handleNameChange}
              required
            />
            {showNameSuggestions && (
              <Paper elevation={3} sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                  {nameSuggestions.map((suggestion, index) => (
                    <ListItemButton
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.name)}
                    >
                      <ListItemText
                        primary={suggestion.name}
                        secondary={suggestion.explanation}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description || ''}
              onChange={handleChange('description')}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Account Type"
              value={formData.type}
              onChange={handleTypeChange}
              required
            >
              {Object.entries(ACCOUNT_TYPES).map(([type, { label }]) => (
                <MenuItem key={type} value={type}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Subtype"
              value={formData.subType}
              onChange={handleChange('subType')}
              required
            >
              {formData.type && ACCOUNT_SUBTYPES[formData.type].map(subtype => (
                <MenuItem key={subtype} value={subtype}>
                  {subtype.replace('_', ' ')}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button
              startIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              size="small"
            >
              Advanced Options
            </Button>
          </Grid>
          <Collapse in={showAdvanced} sx={{ width: '100%' }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Initial Balance"
                  type="number"
                  value={formData.balance ?? ''}
                  onChange={handleChange('balance')}
                  required
                  InputProps={{
                    startAdornment: '$'
                  }}
                  placeholder="0.00"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  value={formData.currency}
                  onChange={handleChange('currency')}
                  required
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Collapse>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (account ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountFormDialog; 