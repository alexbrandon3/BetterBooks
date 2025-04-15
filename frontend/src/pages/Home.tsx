import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
      }}
    >
      <Typography variant="h2" component="h1" gutterBottom>
        Welcome to BetterBooks
      </Typography>
      <Typography variant="h5" color="text.secondary" paragraph>
        Your all-in-one bookkeeping solution for small businesses
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/login')}
          sx={{ mr: 2 }}
        >
          Get Started
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/dashboard')}
        >
          View Demo
        </Button>
      </Box>
    </Box>
  )
}

export default Home 