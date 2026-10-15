import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function getRoleDashboardPath(role) {
  switch (role) {
    case 'ADMIN':
    case 'ORGANIZER':
      return '/dashboard';
    case 'VENDOR':
      return '/vendor/dashboard';
    case 'ATTENDEE':
      return '/attendee/dashboard';
    default:
      return '/login';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check existing session on mount
  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authApi.getMe();
      if (res && res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async ({ email, password, rememberMe }) => {
    setError(null);
    try {
      const res = await authApi.login({ email, password, rememberMe });
      if (res && res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
      throw new Error((res && res.message) || 'Login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout network error:', err);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    checkSession,
    getRoleDashboardPath
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
