// frontend/src/components/ClientSearch.jsx
import React, { useState } from 'react';
import {
  TextField, Button, Stack,
} from '@mui/material';

export default function ClientSearch({ onSearch }) {
  const [clientId, setClientId] = useState('');

  return (
    <Stack
      component="form"
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      onSubmit={(e) => { e.preventDefault(); onSearch(clientId); }}
      sx={{ mb: 3 }}
    >
      <TextField
        label="ID client"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        size="small"
      />
      <Button type="submit" variant="contained">
        Rechercher / créer
      </Button>
    </Stack>
  );
}
