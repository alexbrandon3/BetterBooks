import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
  },
}));

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: theme.palette.success.main,
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: [8000, 12000, 10000, 15000, 18000, 20000],
        borderColor: theme.palette.error.main,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const menuItems = [
    { icon: <DashboardIcon />, text: 'Dashboard' },
    { icon: <ReceiptIcon />, text: 'Transactions' },
    { icon: <AccountBalanceIcon />, text: 'Chart of Accounts' },
    { icon: <AssessmentIcon />, text: 'Financial Statements' },
    { icon: <DescriptionIcon />, text: 'Working Papers' },
    { icon: <HistoryIcon />, text: 'Audit Trail' },
    { icon: <SettingsIcon />, text: 'Settings' },
    { icon: <HelpIcon />, text: 'Support' },
  ];

  const recentTransactions = [
    { id: 1, type: 'income', description: 'Payment from Client A', amount: 2500, date: '2023-06-15' },
    { id: 2, type: 'expense', description: 'Office Supplies', amount: -150, date: '2023-06-14' },
    { id: 3, type: 'expense', description: 'Monthly Rent', amount: -2000, date: '2023-06-10' },
    { id: 4, type: 'income', description: 'Consulting Fee', amount: 1800, date: '2023-06-08' },
    { id: 5, type: 'expense', description: 'Software Subscription', amount: -50, date: '2023-06-05' },
  ];

  const accountsNeedingReview = [
    { id: 1, account: 'Accounts Receivable', issue: 'Overdue invoices' },
    { id: 2, account: 'Prepaid Expenses', issue: 'Needs reconciliation' },
  ];

  const upcomingReminders = [
    { id: 1, type: 'payment', description: 'Quarterly Tax Payment', date: '2023-06-30' },
    { id: 2, type: 'filing', description: 'Monthly Sales Tax Return', date: '2023-07-15' },
    { id: 3, type: 'suggestion', description: 'Consider increasing marketing budget', date: '2023-07-01' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Paper
        sx={{
          width: sidebarOpen ? 240 : 64,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000,
          background: 'linear-gradient(135deg, #1E2D3D 0%, #0F1C2B 100%)',
          color: '#FFFFFF',
          transition: 'width 0.3s ease-in-out',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {sidebarOpen && (
            <img
              src="/logo.png"
              alt="BetterBooks"
              style={{ height: 40, marginRight: 8 }}
            />
          )}
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ color: '#FFFFFF' }}
          >
            {sidebarOpen ? '<' : '>'}
          </IconButton>
        </Box>
        <List>
          {menuItems.map((item, index) => (
            <ListItem
              key={index}
              button
              sx={{
                mb: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary={item.text} />}
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          ml: sidebarOpen ? '240px' : '64px',
          transition: 'margin-left 0.3s ease-in-out',
          p: 3,
        }}
      >
        {/* Top Bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1">
            Welcome back, Acme Corp
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Notifications">
              <IconButton>
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Profile">
              <IconButton>
                <Avatar>AC</Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Dashboard Cards */}
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12} md={6} lg={3}>
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WalletIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">Cash Balance</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  $45,678
                </Typography>
                <Line data={chartData} options={chartOptions} height={100} />
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                  <Typography variant="h6">Revenue YTD</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  $123,456
                </Typography>
                <Typography variant="body2" color="success.main">
                  +12.5% vs last year
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingDownIcon sx={{ mr: 1, color: theme.palette.error.main }} />
                  <Typography variant="h6">Expenses YTD</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  $78,901
                </Typography>
                <Typography variant="body2" color="error.main">
                  +8.2% vs last year
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssessmentIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                  <Typography variant="h6">Net Profit</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  $44,555
                </Typography>
                <Typography variant="body2" color="success.main">
                  +15.3% vs last year
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Recent Transactions */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader
                title="Recent Transactions"
                action={
                  <Button color="primary" startIcon={<ReceiptIcon />}>
                    View All
                  </Button>
                }
              />
              <CardContent>
                <List>
                  {recentTransactions.map((transaction) => (
                    <React.Fragment key={transaction.id}>
                      <ListItem>
                        <ListItemIcon>
                          {transaction.type === 'income' ? (
                            <TrendingUpIcon color="success" />
                          ) : (
                            <TrendingDownIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={transaction.description}
                          secondary={transaction.date}
                        />
                        <Typography
                          variant="body1"
                          color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                        >
                          ${Math.abs(transaction.amount).toLocaleString()}
                        </Typography>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Accounts Needing Review */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader
                title="Accounts Needing Review"
                action={
                  <Button color="primary" startIcon={<WarningIcon />}>
                    Review All
                  </Button>
                }
              />
              <CardContent>
                <List>
                  {accountsNeedingReview.map((account) => (
                    <React.Fragment key={account.id}>
                      <ListItem>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={account.account}
                          secondary={account.issue}
                        />
                        <Button size="small" variant="outlined">
                          Review
                        </Button>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Balance Sheet Snapshot */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader title="Balance Sheet Snapshot" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Total Assets</Typography>
                      <Typography variant="h6">$150,000</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Total Liabilities</Typography>
                      <Typography variant="h6">$75,000</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Total Equity</Typography>
                      <Typography variant="h6">$75,000</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Reminders & Upcoming */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader title="Reminders & Upcoming" />
              <CardContent>
                <List>
                  {upcomingReminders.map((reminder) => (
                    <React.Fragment key={reminder.id}>
                      <ListItem>
                        <ListItemIcon>
                          {reminder.type === 'payment' ? (
                            <AccountBalanceIcon color="primary" />
                          ) : reminder.type === 'filing' ? (
                            <DescriptionIcon color="secondary" />
                          ) : (
                            <LightbulbIcon color="info" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={reminder.description}
                          secondary={reminder.date}
                        />
                        <Button size="small" variant="outlined">
                          View
                        </Button>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardPage; 