// frontend/src/pages/Dashboard.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Alert, CircularProgress, Button, Stack,
} from '@mui/material';

import ClientSearch  from '../components/ClientSearch';
import DossierTable  from '../components/DossierTable';

export default function Dashboard() {
  /* ------------------------- état local --------------------------- */
  const [dossiers, setDossiers] = useState([]);   // liste affichée
  const [loading , setLoading ] = useState(false);
  const [error   , setError   ] = useState('');

  const nav = useNavigate();

  /* ----------------------- recherche SK_ID ------------------------ */
  const handleSearch = async (id) => {
    const cid = Number(id);
    if (Number.isNaN(cid)) { setError('ID invalide'); return; }

    setError('');
    setLoading(true);
    setDossiers([]);

    try {
      const r = await axios.get(`/dossiers?client_id=${cid}&all=true`);
      if (r.data.length) {
        setDossiers(r.data);
      } else {
        const ok = window.confirm(
          'Aucun dossier pour ce client. Créer un premier dossier (ID auto-généré) ?',
        );
        if (ok) nav('/dossiers/new?auto=1');
      }
    } catch {
      setError('Erreur réseau ou serveur.');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------- suppression -------------------------- */
  const del = async (id) => {
    if (!window.confirm('Supprimer ce dossier ?')) return;
    await axios.delete(`/dossiers/${id}`);
    /* on retire localement le dossier supprimé */
    setDossiers(ds => ds.filter(d => d.id !== id));
  };

  /* --------------------------- rendu ------------------------------ */
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Dashboard Home-Credit</Typography>

      <ClientSearch onSearch={handleSearch} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && <CircularProgress sx={{ mt: 2 }} />}

      {!!dossiers.length && (
        <>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
            {/* on récupère le SK_ID_CURR depuis le 1er dossier de la liste */}
            <Button
              variant="contained"
              onClick={() =>
                nav(`/dossiers/new?prefill=${dossiers[0].SK_ID_CURR}`)}
            >
              + Nouveau dossier
            </Button>
          </Stack>

          <DossierTable dossiers={dossiers} onDelete={del} />
        </>
      )}

      {!loading && !dossiers.length && !error && (
        <Typography variant="body2" sx={{ mt: 4 }}>
          Saisissez un <strong>ID client (SK_ID_CURR)</strong> pour afficher
          ses dossiers ou créer un nouveau client s’il n’en possède pas encore.
        </Typography>
      )}
    </Container>
  );
}
