import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { setTokens, clearTokens, getAccessToken } from '../api/tokens';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { username, role, role_display, is_superuser }
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    try {
      const { data } = await api.get('me/');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (getAccessToken()) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username, password) {
    const { data } = await api.post('token/', { username, password });
    setTokens({ access: data.access, refresh: data.refresh });
    await loadUser();
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  }
  return context;
}
