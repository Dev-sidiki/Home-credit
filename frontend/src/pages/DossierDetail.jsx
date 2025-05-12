// frontend/src/pages/DossierDetail.jsx
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, CircularProgress,
  Alert, Grid, Paper, Box, Button
} from '@mui/material';
import { useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

import ScoreGauge     from '../components/ScoreGauge';
import WhereYouStand  from '../components/WhereYouStand';
import ScoreHistory   from '../components/ScoreHistory';
import StatsDashboard from '../components/StatsDashboard';

/* Libellés */
const LABELS = {
  first_name:           'Prénom',
  last_name:            'Nom',
  email:                'Email',
  score:                'Score',
  /* TARGET:               'Défaut (0 = non, 1 = oui)', */
  CODE_GENDER:          'Sexe',
  DAYS_BIRTH:           'Jours depuis naissance',
  DAYS_EMPLOYED:        'Jours depuis embauche',
  NAME_FAMILY_STATUS:   'Statut familial',
  CNT_CHILDREN:         'Nombre d’enfants',
  CNT_FAM_MEMBERS:      'Personnes au foyer',
  NAME_EDUCATION_TYPE:  'Niveau d’études',
  NAME_INCOME_TYPE:     'Source de revenus',
  OCCUPATION_TYPE:      'Profession',
  ORGANIZATION_TYPE:    'Type d’employeur',
  NAME_HOUSING_TYPE:    'Type de logement',
  FLAG_OWN_CAR:         'Possède une voiture',
  OWN_CAR_AGE:          'Âge du véhicule (ans)',
  FLAG_OWN_REALTY:      'Propriétaire immobilier',
  AMT_INCOME_TOTAL:     'Revenu annuel',
  AMT_CREDIT:           'Montant du crédit',
  AMT_ANNUITY:          'Annuité',
  AMT_GOODS_PRICE:      'Prix du bien',
  DAYS_LAST_PHONE_CHANGE:'Jours depuis dernier changement de tél.'
};

/* Champs techniques */
const TECH_FIELDS = [
  /* 'TARGET', */ 'CODE_GENDER', 'DAYS_BIRTH', 'DAYS_EMPLOYED', 'NAME_FAMILY_STATUS',
  'CNT_CHILDREN', 'CNT_FAM_MEMBERS', 'NAME_EDUCATION_TYPE', 'NAME_INCOME_TYPE',
  'OCCUPATION_TYPE', 'ORGANIZATION_TYPE', 'NAME_HOUSING_TYPE',
  'FLAG_OWN_CAR', 'OWN_CAR_AGE', 'FLAG_OWN_REALTY',
  'AMT_INCOME_TOTAL', 'AMT_CREDIT', 'AMT_ANNUITY', 'AMT_GOODS_PRICE',
  'DAYS_LAST_PHONE_CHANGE',
];

export default function DossierDetail() {
  const { id } = useParams();
  const [dossier, setDos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState('');

  useEffect(() => {
    let mounted = true;
    axios.get(`/dossiers/${id}`)
      .then(r => {
        if (!mounted) return;
        setDos(r.data);
        setErr('');
      })
      .catch(e => {
        if (!mounted) return;
        setErr(e.response?.data?.msg || 'Erreur de chargement');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <Box textAlign="center" mt={4}><CircularProgress/></Box>;
  if (err)     return (
    <Container sx={{ mt:4 }}>
      <Alert severity="error" sx={{ mb:2 }}>{err}</Alert>
      <Button component={RouterLink} to="/dossiers">&larr; Retour</Button>
    </Container>
  );
  if (!dossier) return (
    <Container sx={{ mt:4 }}>
      <Typography>Dossier introuvable.</Typography>
      <Button component={RouterLink} to="/dossiers">&larr; Retour</Button>
    </Container>
  );

  const clientId = dossier.SK_ID_CURR;

  return (
    <Container sx={{ mt:4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5">Dossier client #{clientId}</Typography>
        <Button component={RouterLink} to="/dossiers">← Retour</Button>
      </Box>

      <Paper variant="outlined" sx={{ p:2, mb:3 }}>
        <Typography variant="h6" gutterBottom>Informations client</Typography>
        <Grid container spacing={2}>
          {['first_name','last_name','email'].map(key => (
            <Grid item xs={12} sm={4} key={key}>
              <Typography variant="subtitle2">{LABELS[key]}</Typography>
              <Typography>{dossier[key] || <em>Non renseigné</em>}</Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p:2, mb:3 }}>
        <Typography variant="h6" gutterBottom>Données techniques</Typography>
        <Grid container spacing={2}>
          {TECH_FIELDS.map(key => (
            <Grid item xs={12} sm={6} key={key}>
              <Typography variant="subtitle2">{LABELS[key] || key}</Typography>
              <Typography>
                {dossier[key] != null ? String(dossier[key]) : <em>–</em>}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>Score actuel</Typography>
      <Box display="flex" flexDirection={{ xs:'column', sm:'row' }} alignItems="center" gap={4} mb={3}>
        <ScoreGauge     score={dossier.score} />
        <WhereYouStand  score={dossier.score} />
      </Box>

      <Typography variant="h6" gutterBottom>Historique du score</Typography>
      <ScoreHistory clientId={clientId} />

      <Typography variant="h6" gutterBottom sx={{ mt:3 }}>Analyse statistique</Typography>
      <StatsDashboard clientId={clientId} />
    </Container>
  );
}
