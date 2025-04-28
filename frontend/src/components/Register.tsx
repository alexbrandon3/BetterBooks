// src/components/Register.tsx
import { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from '@/utils/axios'; // adjust if your alias differs

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    try {
      await axios.post('/auth/register', {
        email: formData.email,
        password: formData.password,
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Register
        </Typography>
        {error && <Typography color="error" align="center">{error}</Typography>}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email" name="email" type="email"
            value={formData.email} onChange={handleChange}
            margin="normal" required
          />
          <TextField
            fullWidth label="Password" name="password" type="password"
            value={formData.password} onChange={handleChange}
            margin="normal" required
          />
          <TextField
            fullWidth label="Confirm Password" name="confirmPassword" type="password"
            value={formData.confirmPassword} onChange={handleChange}
            margin="normal" required
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>
            Create Account
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Register;
