import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Menu,
  MenuItem,
  Chip,
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
  Check as CheckIcon,
  Delete as DeleteIcon,
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
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import Layout from '../components/Layout';
import { useNotifications } from '../contexts/NotificationsContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
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
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isLoading, setIsLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <WarningIcon color="error" />;
      case 'success':
        return <CheckIcon color="success" />;
      default:
        return <NotificationsIcon color="info" />;
    }
  };

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
    { icon: <DashboardIcon />, text: 'Dashboard', path: '/dashboard' },
    { icon: <ReceiptIcon />, text: 'Transactions', path: '/transactions' },
    { icon: <AccountBalanceIcon />, text: 'Chart of Accounts', path: '/setup/chart-of-accounts' },
    { icon: <AssessmentIcon />, text: 'Financial Statements', path: '/financial-statements' },
    { icon: <DescriptionIcon />, text: 'Working Papers', path: '/working-papers' },
    { icon: <HistoryIcon />, text: 'Audit Trail', path: '/audit-trail' },
    { icon: <SettingsIcon />, text: 'Settings', path: '/settings' },
    { icon: <HelpIcon />, text: 'Support', path: '/support' },
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

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Layout initialSidebarOpen={true}>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout initialSidebarOpen={true}>
      <Box
        sx={{
          flexGrow: 1,
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
          <Box>
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={handleNotificationsClick}
                sx={{ position: 'relative' }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleNotificationsClose}
              PaperProps={{
                sx: {
                  width: 360,
                  maxHeight: 400,
                },
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Notifications</Typography>
                <Box>
                  <Button
                    size="small"
                    onClick={() => {
                      markAllAsRead();
                      handleNotificationsClose();
                    }}
                    disabled={unreadCount === 0}
                  >
                    Mark all as read
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      clearAll();
                      handleNotificationsClose();
                    }}
                    disabled={notifications.length === 0}
                  >
                    Clear all
                  </Button>
                </Box>
              </Box>
              <Divider />
              {notifications.length === 0 ? (
                <MenuItem disabled>
                  <Typography color="textSecondary">No notifications</Typography>
                </MenuItem>
              ) : (
                notifications.map((notification) => (
                  <MenuItem
                    key={notification.id}
                    onClick={() => {
                      handleMarkAsRead(notification.id);
                      handleNotificationsClose();
                    }}
                    sx={{
                      opacity: notification.read ? 0.7 : 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="textPrimary">
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    {!notification.read && (
                      <Chip
                        size="small"
                        label="New"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </MenuItem>
                ))
              )}
            </Menu>
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
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Recent Transactions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {transaction.description}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
    </Layout>
  );
};

export default DashboardPage; 