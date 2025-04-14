import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
  Divider,
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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { useToast } from '../contexts/ToastContext';

const menuItems = [
  { icon: <DashboardIcon />, text: 'Dashboard', path: '/dashboard' },
  { icon: <ReceiptIcon />, text: 'Transactions', path: '/transactions' },
  { icon: <BookIcon />, text: 'Ledger', path: '/ledger' },
  { icon: <AccountBalanceIcon />, text: 'Chart of Accounts', path: '/setup/chart-of-accounts' },
  { icon: <AssessmentIcon />, text: 'Financial Statements', path: '/financial-statements' },
  { icon: <DescriptionIcon />, text: 'Working Papers', path: '/working-papers' },
  { icon: <HistoryIcon />, text: 'Audit Trail', path: '/audit-trail' },
  { icon: <SettingsIcon />, text: 'Settings', path: '/settings' },
  { icon: <HelpIcon />, text: 'Support', path: '/support', isComingSoon: true },
];

interface LayoutProps {
  children: React.ReactNode;
  initialSidebarOpen?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, initialSidebarOpen = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const { showToast } = useToast();

  const handleMenuItemClick = (item: typeof menuItems[0]) => {
    if (item.isComingSoon) {
      showToast('This feature is coming soon!', 'info');
      return;
    }
    navigate(item.path);
  };

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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Section with Logo */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/favicon.ico"
            alt="BetterBooks"
            style={{ height: 48, width: 48, objectFit: 'contain' }}
          />
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Menu Items */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <List>
            {menuItems.map((item, index) => (
              <Tooltip
                key={index}
                title={item.text}
                placement="right"
                arrow
                disableHoverListener={sidebarOpen}
              >
                <ListItem
                  button
                  onClick={() => handleMenuItemClick(item)}
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
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
              </Tooltip>
            ))}
          </List>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Bottom Section with Expand/Collapse Button */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} placement="right" arrow>
            <IconButton
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ color: '#FFFFFF' }}
            >
              {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Tooltip>
        </Box>
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
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 