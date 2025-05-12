// frontend/src/components/ClientInfo.jsx
import React from 'react';
import { Typography, List, ListItem, ListItemText } from '@mui/material';

export default function ClientInfo({ data }) {
  if (!data) return null;

  return (
    <div>
      <Typography variant="h6" gutterBottom>Données client</Typography>
      <List dense>
        {Object.entries(data).map(([k, v]) => (
          <ListItem key={k}>
            <ListItemText primary={k} secondary={String(v)} />
          </ListItem>
        ))}
      </List>
    </div>
  );
}
