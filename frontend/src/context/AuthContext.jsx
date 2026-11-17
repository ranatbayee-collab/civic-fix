import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, setStoredToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      const token = getStoredToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn('Session expired, clearing stored token.');
          setStoredToken(null);
          // Default to demo citizen if expired
          try {
            const demoRes = await api.demoLogin('CITIZEN');
            setStoredToken(demoRes.token);
            setUser(demoRes.user);
          } catch (e) {}
        }
      } else {
        // Auto sign-in to demo citizen for instantaneous demo availability
        try {
          const demoRes = await api.demoLogin('CITIZEN');
          setStoredToken(demoRes.token);
          setUser(demoRes.user);
        } catch (e) {}
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const switchDemoRole = async (role) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(role);
      setStoredToken(res.token);
      setUser(res.user);
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'ADMIN',
        isWorker: user?.role === 'WORKER',
        isCitizen: user?.role === 'CITIZEN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
