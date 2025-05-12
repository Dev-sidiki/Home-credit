// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

axios.defaults.baseURL = "http://127.0.0.1:5000";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user , setUser ] = useState(null);
  const isAuth = !!token;

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      axios.get("/auth/me").then(r => setUser(r.data)).catch(()=>logout());
    } else {
      delete axios.defaults.headers.common.Authorization;
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [token]);

  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, setToken, user, isAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
