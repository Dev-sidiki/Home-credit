// frontend/src/App.js
import React from 'react';
import {
  BrowserRouter, Routes, Route, Navigate,
} from 'react-router-dom';

import AuthProvider, { useAuth } from './contexts/AuthContext';

import Navbar        from './components/Navbar';
import Login         from './pages/Login';
import Signup        from './pages/Signup';
import Dashboard     from './pages/Dashboard';
import Dossiers      from './pages/Dossiers';
import DossierForm   from './pages/DossierForm';
import DossierDetail from './pages/DossierDetail';
import Profile       from './pages/Profile';

function Protected({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* routes publiques */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* routes protégées */}
          <Route path="/" element={<Protected><Dashboard /></Protected>} />

          <Route path="/dossiers"      element={<Protected><Dossiers /></Protected>} />
          <Route path="/dossiers/new"  element={<Protected><DossierForm /></Protected>} />
          <Route path="/dossier/:id"         element={<Protected><DossierDetail /></Protected>} />
          <Route path="/dossier/:id/edit"    element={<Protected><DossierForm /></Protected>} />

          <Route path="/profile" element={<Protected><Profile /></Protected>} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
