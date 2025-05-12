// frontend/src/pages/DossierForm.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container, Typography, TextField, MenuItem,
  Alert, Button, Checkbox, FormControlLabel, CircularProgress, Box,
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/*  Constantes                                                       */
/* ------------------------------------------------------------------ */
const TECH_FIELDS = [
  /* 'TARGET', */ 'CODE_GENDER', 'DAYS_BIRTH', 'DAYS_EMPLOYED', 'NAME_FAMILY_STATUS',
  'CNT_CHILDREN', 'CNT_FAM_MEMBERS', 'NAME_EDUCATION_TYPE', 'NAME_INCOME_TYPE',
  'OCCUPATION_TYPE', 'ORGANIZATION_TYPE', 'NAME_HOUSING_TYPE',
  'FLAG_OWN_CAR', 'OWN_CAR_AGE', 'FLAG_OWN_REALTY',
  'AMT_INCOME_TOTAL', 'AMT_CREDIT', 'AMT_ANNUITY', 'AMT_GOODS_PRICE',
  'DAYS_LAST_PHONE_CHANGE',
];

/* Libellés lisibles */
const LABELS = {
  /* TARGET:                 'Défaut (0 = non, 1 = oui)', */
  CODE_GENDER:            'Sexe',
  DAYS_BIRTH:             'Jours depuis naissance',
  DAYS_EMPLOYED:          'Jours depuis embauche',
  NAME_FAMILY_STATUS:     'Statut familial',
  CNT_CHILDREN:           'Nombre d’enfants',
  CNT_FAM_MEMBERS:        'Personnes au foyer',
  NAME_EDUCATION_TYPE:    'Niveau d’études',
  NAME_INCOME_TYPE:       'Source de revenus',
  OCCUPATION_TYPE:        'Profession',
  ORGANIZATION_TYPE:      'Type d’employeur',
  NAME_HOUSING_TYPE:      'Type de logement',
  FLAG_OWN_CAR:           'Possède une voiture',
  OWN_CAR_AGE:            'Âge du véhicule (ans)',
  FLAG_OWN_REALTY:        'Propriétaire immobilier',
  AMT_INCOME_TOTAL:       'Revenu annuel',
  AMT_CREDIT:             'Montant du crédit',
  AMT_ANNUITY:            'Annuité',
  AMT_GOODS_PRICE:        'Prix du bien',
  DAYS_LAST_PHONE_CHANGE: 'Jours depuis dernier changement de tél.',
};

/* Champs larges */
const WIDE = new Set([
  'NAME_FAMILY_STATUS', 'NAME_EDUCATION_TYPE', 'NAME_INCOME_TYPE',
  'OCCUPATION_TYPE', 'ORGANIZATION_TYPE', 'NAME_HOUSING_TYPE',
  'AMT_INCOME_TOTAL', 'AMT_CREDIT', 'AMT_GOODS_PRICE',
]);

/* Numériques (à forcer en nombre) */
const NUMERIC = new Set([
  'DAYS_BIRTH', 'DAYS_EMPLOYED', 'CNT_CHILDREN', 'CNT_FAM_MEMBERS',
  'OWN_CAR_AGE', 'AMT_INCOME_TOTAL', 'AMT_CREDIT', 'AMT_ANNUITY',
  'AMT_GOODS_PRICE', 'DAYS_LAST_PHONE_CHANGE',
]);

const BOOL_SELECT = new Set(['FLAG_OWN_CAR', 'FLAG_OWN_REALTY']);

/* helpers bool ↔︎ Y|N|'' */
const toYN   = v => v === true  ? 'Y' : v === false ? 'N' : v;
const fromYN = (v, current) => (v === 'Y' ? true : v === 'N' ? false : current);

export default function DossierForm() {
  const nav        = useNavigate();
  const params     = useParams();          // pour /dossier/:id/edit
  const [search]   = useSearchParams();

  const editing    = !!params.id;
  const autoCreate = !editing && search.get('auto') !== null;

  const [meta,    setMeta]    = useState({});
  const [loadM,   setLoadM]   = useState(true);
  const [data,    setData]    = useState({});
  const [newClient, setNC]    = useState(autoCreate);
  const [err,     setErr]     = useState('');

  /* Options catégorielles */
  useEffect(() => {
    axios.get('/meta/options')
         .then(r => setMeta(r.data))
         .finally(() => setLoadM(false));
  }, []);

  /* Chargement en mode édition */
  useEffect(() => {
    if (!editing) return;
    let mounted = true;
    axios.get(`/dossiers/${params.id}`)
         .then(r => {
           if (!mounted) return;
           const d = { ...r.data };
           BOOL_SELECT.forEach(f => { d[f] = toYN(d[f]); });
           setData(d);
         })
         .catch(() => setErr('Dossier introuvable'))
         .finally(() => { mounted = false; });
  }, [editing, params.id]);

  /* Pré-remplissage création (?prefill=) – ignoré si auto */
  useEffect(() => {
    if (editing || autoCreate) return;
    const pre = search.get('prefill');
    if (pre) fetchLastDossier(Number(pre));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Récupérer dernier dossier existant pour préremplissage */
  const fetchLastDossier = async cid => {
    try {
      const { data: list } =
        await axios.get(`/dossiers?client_id=${cid}&all=true`);
      if (list.length) {
        const last = list.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0];
        BOOL_SELECT.forEach(f => { last[f] = toYN(last[f]); });
        setData(last);
        setErr('');
      } else {
        setErr('Aucun dossier trouvé pour ce client');
      }
    } catch {
      setErr('Erreur de pré-remplissage');
    }
  };

  /* Mise à jour locale du formulaire */
  const upd = (k, v) => setData(d => ({
    ...d,
    [k]: NUMERIC.has(k)     ? (v === '' ? '' : Number(v))
        : BOOL_SELECT.has(k) ? v
        : v,
  }));

  /* Envoi */
  const submit = async e => {
    e.preventDefault();
    try {
      const payload = { ...data };
      BOOL_SELECT.forEach(f => { payload[f] = fromYN(payload[f], false); });

      if (editing) {
        await axios.put(`/dossiers/${params.id}`, payload);
      } else {
        if (newClient) payload.new_client = true;
        await axios.post('/dossiers', payload);
      }
      nav('/dossiers');
    } catch (e) {
      setErr(e.response?.data?.msg || 'Erreur réseau');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        {editing ? 'Modifier un dossier' : 'Créer / mettre à jour un dossier'}
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {loadM && <CircularProgress />}

      {!loadM && (
        <form onSubmit={submit}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            }}
          >
            {!editing && (
              <>
                <TextField
                  label="SK_ID_CURR"
                  fullWidth
                  required={!newClient}
                  type="number"
                  value={data.SK_ID_CURR ?? ''}
                  onChange={e => upd('SK_ID_CURR', e.target.value)}
                  onBlur={e => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v)) fetchLastDossier(v);
                  }}
                  disabled={newClient}
                />
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs:'flex-start', md:'flex-end' }
                  }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newClient}
                        onChange={e => {
                          setNC(e.target.checked);
                          if (e.target.checked) upd('SK_ID_CURR', '');
                        }}
                      />
                    }
                    label="Nouveau client (ID auto)"
                  />
                </Box>
              </>
            )}

            {/* Prénom / Nom / Email */}
            {[
              { name:'first_name', label:'Prénom' },
              { name:'last_name',  label:'Nom'    },
              { name:'email',      label:'Email', full:true },
            ].map(({name,label,full}) => (
              <TextField
                key={name}
                label={label}
                fullWidth
                sx={{ gridColumn: full ? 'span 2' : undefined }}
                value={data[name] ?? ''}
                onChange={e => upd(name, e.target.value)}
              />
            ))}

            {/* Champs techniques */}
            {TECH_FIELDS.map(f => {
              const opts = meta[f];
              const val  = BOOL_SELECT.has(f) ? toYN(data[f]) : (data[f] ?? '');
              const span = WIDE.has(f) ? 2 : 1;
              return opts ? (
                <TextField
                  select
                  key={f}
                  label={LABELS[f] || f}
                  fullWidth
                  sx={{ gridColumn: `span ${span}` }}
                  value={val}
                  onChange={e => upd(f, e.target.value)}
                >
                  <MenuItem value="">—</MenuItem>
                  {opts.map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  key={f}
                  label={LABELS[f] || f}
                  fullWidth
                  sx={{ gridColumn: `span ${span}` }}
                  value={val}
                  onChange={e => upd(f, e.target.value)}
                />
              );
            })}
          </Box>

          <Button type="submit" variant="contained" sx={{ mt: 3 }}>
            {editing ? 'Enregistrer les modifications' : 'Enregistrer'}
          </Button>
        </form>
      )}
    </Container>
  );
}
