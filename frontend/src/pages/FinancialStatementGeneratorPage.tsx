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
  Button,
  FormControlLabel,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  DateRange as DateRangeIcon,
  Description as DescriptionIcon,
  CompareArrows as CompareArrowsIcon,
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  TableChart as CsvIcon,
  Preview as PreviewIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import type { DateRange } from '@mui/x-date-pickers-pro/models';
import FinancialStatementDisplay from '../components/FinancialStatementDisplay';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2),
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 500,
}));

const StatementGenerator: React.FC = () => {
  const [statementType, setStatementType] = useState<string>('balance-sheet');
  const [dateRange, setDateRange] = useState<DateRange<Date>>([null, null]);
  const [basis, setBasis] = useState<string>('accrual');
  const [comparative, setComparative] = useState<boolean>(false);
  const [includeDescriptions, setIncludeDescriptions] = useState<boolean>(true);
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  const handleStatementTypeChange = (event: SelectChangeEvent) => {
    setStatementType(event.target.value);
  };

  const handleBasisChange = (event: SelectChangeEvent) => {
    setBasis(event.target.value);
  };

  const handleExportFormatChange = (event: React.MouseEvent<HTMLElement>, newFormat: string) => {
    setExportFormat(newFormat);
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting report in format:', exportFormat);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1a237e', fontWeight: 600 }}>
        Generate Financial Statements
      </Typography>

      <StyledPaper>
        <Grid container spacing={3}>
          {/* Statement Type Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Statement Type</InputLabel>
              <Select
                value={statementType}
                onChange={handleStatementTypeChange}
                label="Statement Type"
              >
                <MenuItem value="balance-sheet">Balance Sheet</MenuItem>
                <MenuItem value="income-statement">Income Statement</MenuItem>
                <MenuItem value="cash-flow">Statement of Cash Flows</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Date Range Picker */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateRangePicker
                value={dateRange}
                onChange={(newValue) => setDateRange(newValue)}
                slotProps={{
                  textField: ({ position }) => ({
                    label: position === 'start' ? 'Start Date' : 'End Date',
                  }),
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Basis Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Basis</InputLabel>
              <Select
                value={basis}
                onChange={handleBasisChange}
                label="Basis"
              >
                <MenuItem value="accrual">Accrual</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Comparative Period Toggle */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={comparative}
                  onChange={(e) => setComparative(e.target.checked)}
                  icon={<CompareArrowsIcon />}
                  checkedIcon={<CompareArrowsIcon />}
                />
              }
              label="Include Comparative Period"
            />
          </Grid>

          {/* Account Descriptions Toggle */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeDescriptions}
                  onChange={(e) => setIncludeDescriptions(e.target.checked)}
                  icon={<DescriptionIcon />}
                  checkedIcon={<DescriptionIcon />}
                />
              }
              label="Include Account Descriptions"
            />
          </Grid>

          {/* Export Format Selection */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">Export Format:</Typography>
              <ToggleButtonGroup
                value={exportFormat}
                exclusive
                onChange={handleExportFormatChange}
                aria-label="export format"
              >
                <ToggleButton value="pdf" aria-label="pdf">
                  <Tooltip title="PDF">
                    <PdfIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="excel" aria-label="excel">
                  <Tooltip title="Excel">
                    <ExcelIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="csv" aria-label="csv">
                  <Tooltip title="CSV">
                    <CsvIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <StyledButton
                variant="contained"
                color="primary"
                startIcon={<PreviewIcon />}
                onClick={handlePreview}
              >
                Preview Report
              </StyledButton>
              <StyledButton
                variant="contained"
                color="primary"
                startIcon={<EmailIcon />}
                onClick={handleExport}
              >
                Email to Accountant
              </StyledButton>
              <StyledButton
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleExport}
              >
                Save as Template
              </StyledButton>
            </Box>
          </Grid>
        </Grid>
      </StyledPaper>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" sx={{ color: '#1a237e', fontWeight: 600 }}>
            Preview Financial Statement
          </Typography>
        </DialogTitle>
        <DialogContent>
          <FinancialStatementDisplay
            statementType={statementType as 'balance-sheet' | 'income-statement' | 'cash-flow'}
            data={{}}
            includeDescriptions={includeDescriptions}
            comparative={comparative}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExport}
            startIcon={exportFormat === 'pdf' ? <PdfIcon /> : exportFormat === 'excel' ? <ExcelIcon /> : <CsvIcon />}
          >
            Export as {exportFormat.toUpperCase()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StatementGenerator; 