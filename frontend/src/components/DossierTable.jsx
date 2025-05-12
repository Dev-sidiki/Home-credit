// frontend/src/components/DossierTable.jsx
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Stack, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function DossierTable({ dossiers, onDelete }) {
  if (!dossiers.length) return <Typography>Aucun dossier</Typography>;

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {[
              'ID client',
              'Nom',
              'Score',
              'Créé le',
              'Modifié le',
              'Créé par',  // nouvelle colonne
              '',
            ].map((h) => (
              <TableCell key={h}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {dossiers.map((d) => (
            <TableRow key={d.id} hover>
              <TableCell>{d.SK_ID_CURR}</TableCell>

              <TableCell>
                {d.first_name
                  ? `${d.first_name} ${d.last_name}`
                  : <em>N/A</em>}
              </TableCell>

              <TableCell>{d.score}</TableCell>

              <TableCell>
                {d.created_at
                  ? new Date(d.created_at).toLocaleDateString()
                  : <em>—</em>}
              </TableCell>

              <TableCell>
                {d.updated_at
                  ? new Date(d.updated_at).toLocaleDateString()
                  : <em>—</em>}
              </TableCell>

              {/* Affiche l’email de l’utilisateur qui a créé le dossier */}
              <TableCell>
                {d.created_by_email ?? <em>—</em>}
              </TableCell>

              <TableCell>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    component={RouterLink}
                    to={`/dossier/${d.id}`}
                    variant="outlined"
                    size="small"
                  >
                    Consulter
                  </Button>

                  <Button
                    component={RouterLink}
                    to={`/dossier/${d.id}/edit`}
                    variant="outlined"
                    size="small"
                  >
                    Modifier
                  </Button>

                  <Button
                    color="error"
                    size="small"
                    onClick={() => onDelete(d.id)}
                  >
                    Supprimer
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
