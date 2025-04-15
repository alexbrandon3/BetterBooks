import { Box, Typography, Grid, Paper } from '@mui/material'
import { AccountBalance as AccountBalanceIcon, TrendingUp as TrendingUpIcon, Receipt as ReceiptIcon } from '@mui/icons-material'

const Dashboard = () => {
  const stats = [
    { title: 'Total Balance', value: '$25,000', icon: <AccountBalanceIcon /> },
    { title: 'Monthly Income', value: '$8,500', icon: <TrendingUpIcon /> },
    { title: 'Recent Transactions', value: '24', icon: <ReceiptIcon /> },
  ]

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  mb: 2,
                }}
              >
                {stat.icon}
              </Box>
              <Typography variant="h6" component="h2" gutterBottom>
                {stat.title}
              </Typography>
              <Typography variant="h4" component="p" color="primary">
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default Dashboard 