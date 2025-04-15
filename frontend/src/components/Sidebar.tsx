import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Book as BookIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Transactions', icon: <ReceiptIcon />, path: '/transactions' },
  { text: 'Journal Entries', icon: <BookIcon />, path: '/journal' },
  { text: 'Chart of Accounts', icon: <AccountBalanceIcon />, path: '/chart-of-accounts' },
  { text: 'Financial Statements', icon: <AssessmentIcon />, path: '/financial-statements' },
  { text: 'Working Papers', icon: <DescriptionIcon />, path: '/working-papers' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ width: 240, bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          BetterBooks
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar; 