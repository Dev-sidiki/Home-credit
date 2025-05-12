// frontend/src/pages/Profile.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Typography, Alert, Stack } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, setToken } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '' });
  const [msg , setMsg ]   = useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    const payload = { name: form.name, email: form.email };
    if (form.password) payload.password = form.password;
    const r = await axios.put('/auth/me', payload);
    setMsg(r.data.msg || 'Profil mis à jour – reconnectez-vous pour voir les changements');
    if (form.password) setToken(null);   // force reconnexion
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h5" gutterBottom>Mon profil</Typography>
      {msg && <Alert severity="success" sx={{ mb:2 }}>{msg}</Alert>}

      <Stack spacing={2}>
        <TextField label="Nom complet" name="name"  value={form.name}  onChange={handle}/>
        <TextField label="Email"        name="email" value={form.email} onChange={handle}/>
        <TextField label="Nouveau mot de passe" type="password" name="password"
                   value={form.password} onChange={handle}/>
        <Button variant="contained" onClick={save}>Sauvegarder</Button>
      </Stack>
    </Container>
  );
}
