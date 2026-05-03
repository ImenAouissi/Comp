import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../utils/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.me()
      .then(r => setUser(r.user))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.login(email, password);
    localStorage.setItem('token', r.token);
    setUser(r.user);
    return r.user;
  };

  // ✅ Pour Google OAuth — reçoit token + user directement
  const loginWithToken = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, loginWithToken, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() { return useContext(Ctx); }