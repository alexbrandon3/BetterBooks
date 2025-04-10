import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import transparentLogo from '../assets/transparent-logo.png';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
}));

const Logo = styled('img')({
  width: '200px',
  marginBottom: '2rem',
});

const GoogleIcon = () => (
  <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log('Login attempt:', formData);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A2A6C 0%, #0A1A5C 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Left side - Branding */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                color: '#F6F6F6',
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 4,
                }}
              >
                <Box
                  sx={{
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    mb: 4,
                  }}
                >
                  <Box
                    component="img"
                    src={transparentLogo}
                    alt="BetterBooks Logo"
                    sx={{
                      width: '95%',
                      height: 'auto',
                      transform: 'scale(1.1)',
                    }}
                  />
                </Box>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    mb: 4, 
                    color: '#F6F6F6',
                    textAlign: 'center',
                  }}
                >
                  Smart Bookkeeping for Small Business
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    maxWidth: '80%', 
                    color: '#F6F6F6',
                    textAlign: 'center',
                  }}
                >
                  Streamline your finances with AI-powered bookkeeping. Designed for U.S. small business owners.
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right side - Login Form */}
          <Grid item xs={12} md={6}>
            <StyledPaper elevation={3}>
              <Typography variant="h2" gutterBottom>
                Welcome Back
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                Sign in to continue to your dashboard
              </Typography>

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="Remember me"
                  />
                  <Link href="#" variant="body2">
                    Forgot password?
                  </Link>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                  >
                    Sign In
                  </Button>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link href="#" variant="body2">
                    Forgot password?
                  </Link>
                  <Link href="/register" variant="body2">
                    Create an account
                  </Link>
                </Box>

                <Divider sx={{ my: 3 }}>or</Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={() => navigate('/google-signin')}
                >
                  Sign in with Google
                </Button>
              </Box>
            </StyledPaper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginPage; 