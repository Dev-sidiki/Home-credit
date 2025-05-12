// frontend/src/components/StatsDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

const FEATURES = [
  'CNT_CHILDREN',
  'CNT_FAM_MEMBERS',
  'DAYS_BIRTH',
  'DAYS_EMPLOYED',
  'AMT_INCOME_TOTAL',
  'AMT_CREDIT',
  'AMT_ANNUITY',
  'AMT_GOODS_PRICE',
  'DAYS_LAST_PHONE_CHANGE',
  'CODE_GENDER',
  'NAME_FAMILY_STATUS',
  'NAME_EDUCATION_TYPE',
  'NAME_INCOME_TYPE',
  'OCCUPATION_TYPE',
  'NAME_HOUSING_TYPE',
];

export default function StatsDashboard({ clientId }) {
  const [selected, setSelected] = useState(FEATURES[0]);
  const [stat, setStat]         = useState(null);
  const [loading, setLoading]   = useState(false);

  // Charger le stat pour la feature sélectionnée
  useEffect(() => {
    if (!clientId || !selected) return;
    setLoading(true);
    axios
      .get(`/stats/${selected}/${clientId}`)
      .then(r => setStat(r.data.stat))
      .catch(() => setStat(null))
      .finally(() => setLoading(false));
  }, [clientId, selected]);

  const handleChange = e => setSelected(e.target.value);

  // Préparer les données pour le graphique
  let data = [];
  let refX;
  if (stat) {
    if (stat.type === 'numeric') {
      const { bins, counts } = stat.histogram;
      data = counts['1'].map((cnt, i) => ({
        label: ((bins[i] + bins[i + 1]) / 2).toFixed(0),
        count: cnt,
      }));
      if (stat.client_bucket != null) {
        const idx = stat.client_bucket - 1;
        refX = ((bins[idx] + bins[idx + 1]) / 2).toFixed(0);
      }
    } else {
      data = Object.entries(stat.categories).map(([cat, cts]) => ({
        label: cat,
        count: cts['1'],
      }));
      refX = stat.client_value;
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="feat-select-label">Feature</InputLabel>
        <Select
          labelId="feat-select-label"
          value={selected}
          label="Feature"
          onChange={handleChange}
        >
          {FEATURES.map(f => (
            <MenuItem key={f} value={f}>{f}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : stat ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              angle={-35}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" name="Défaillants" fill="#8884d8" />
            {refX != null && (
              <ReferenceLine
                x={refX}
                stroke="red"
                label={{ position: 'top', value: 'Vous', fill: 'red' }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Typography align="center" sx={{ mt: 4 }}>
          Aucune donnée disponible.
        </Typography>
      )}
    </Box>
  );
}
