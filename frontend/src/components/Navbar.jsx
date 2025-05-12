// frontend/src/components/Navbar.jsx

import React from 'react';
import {
  AppBar, Toolbar, Typography, Button, Stack,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { isAuth, user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
        >
          Home-Credit Dashboard
        </Typography>

        {isAuth && (
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/dossiers"
              disabled={loc.pathname === '/dossiers' && !loc.search}
            >
              Mes dossiers
            </Button>

            {user?.role === 'admin' && (
              <Button
                color="inherit"
                component={RouterLink}
                to="/dossiers?all=true"
                disabled={loc.search.includes('all=true')}
              >
                Tous les dossiers
              </Button>
            )}

            <Button
              color="inherit"
              component={RouterLink}
              to="/profile"
              disabled={loc.pathname === '/profile'}
            >
              Profil
            </Button>
          </Stack>
        )}

        {isAuth ? (
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => { logout(); nav('/login'); }}
            sx={{ ml: 2 }}
          >
            Déconnexion
          </Button>
        ) : (
          <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
            <Button color="inherit" component={RouterLink} to="/login">
              Connexion
            </Button>
            <Button
              variant="contained"
              color="secondary"
              component={RouterLink}
              to="/signup"
            >
              Inscription
            </Button>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}
