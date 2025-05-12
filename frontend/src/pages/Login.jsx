// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';

export default function Login() {
  const { setToken } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', form);
      setToken(res.data.access_token);
      nav('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Erreur réseau');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8} textAlign="center">
        <Typography variant="h5" gutterBottom>
          Connexion
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} mt={2} display="grid" gap={2}>
          <TextField
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Mot de passe"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
          />
          <Button type="submit" variant="contained" fullWidth>
            Se connecter
          </Button>
        </Box>
        <Typography variant="body2" mt={2}>
          Pas encore inscrit ?{' '}
          <RouterLink to="/signup">Créer un compte</RouterLink>
        </Typography>
      </Box>
    </Container>
  );
}
