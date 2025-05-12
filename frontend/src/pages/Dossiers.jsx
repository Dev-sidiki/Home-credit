// frontend/src/pages/Dossiers.jsx
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, TextField, Button,
  Stack, Checkbox, FormControlLabel, CircularProgress,
} from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DossierTable from '../components/DossierTable';

export default function Dossiers() {
  /* état UI -------------------------------------------------------- */
  const [showAll, setShowAll] = useState(false);   // case “Afficher tous les dossiers”
  const [cid,     setCid]     = useState('');      // champ filtre client
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);

  /* requête -------------------------------------------------------- */
  const fetchData = () => {
    setLoading(true);
    const q = [];
    if (cid)     q.push(`client_id=${encodeURIComponent(cid)}`);
    if (showAll) q.push('all=true');
    axios.get(`/dossiers${q.length ? `?${q.join('&')}` : ''}`)
         .then(r => setRows(r.data))
         .finally(() => setLoading(false));
  };

  /* auto-refresh si filtres changent -------------------------------- */
  useEffect(fetchData, [cid, showAll]);

  /* suppression ---------------------------------------------------- */
  const del = async (id) => {
    if (!window.confirm('Supprimer ce dossier ?')) return;
    await axios.delete(`/dossiers/${id}`);
    fetchData();
  };

  /* ---------------------------------------------------------------- */
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Dossiers</Typography>

      {/* barre de filtres */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Filtrer par ID client"
          size="small"
          value={cid}
          onChange={e => setCid(e.target.value)}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={showAll}
              onChange={e => setShowAll(e.target.checked)}
            />
          }
          label="Afficher tous les dossiers"
        />
        <Button variant="outlined" onClick={fetchData}>
          Actualiser
        </Button>
      </Stack>

      {/* bouton Nouveau dossier avec pré-remplissage si cid fourni */}
      <Button
        component={Link}
        to={
          cid
            ? `/dossiers/new?prefill=${encodeURIComponent(cid)}`
            : '/dossiers/new'
        }
        variant="contained"
        sx={{ mb: 2 }}
      >
        + Nouveau dossier
      </Button>

      {loading
        ? <CircularProgress />
        : <DossierTable dossiers={rows} onDelete={del} />
      }
    </Container>
  );
}
