import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { CurrentUser, UserRole } from '../types/index.js';
import { useToast } from './ToastContext.js';

interface AuthContextType {
  user: CurrentUser | null;
  role: UserRole | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const fetchMe = useCallback(async () => {
    try {
      const storedToken = api.getToken();
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await api.get<{ success: boolean; user: CurrentUser }>('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
        api.clearToken();
      }
    } catch (error: any) {
      console.error('Session verification status:', error);
      // Only invalidate local authentication if the server rejected the session (401/expired/revoked)
      if (
        error?.code === 'UNAUTHORIZED' ||
        error?.code === 'SESSION_EXPIRED' ||
        error?.code === 'DEVICE_MISMATCH' ||
        error?.code === 'SESSION_REVOKED' ||
        error?.code === 'TOKEN_EXPIRED_OR_INVALID'
      ) {
        setUser(null);
        api.clearToken();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string): Promise<CurrentUser> => {
    try {
      const res = await api.post<{
        success: boolean;
        token: string;
        expiresAt?: string;
        user: CurrentUser;
      }>('/auth/login', {
        email,
        password,
        deviceId: api.getDeviceId(),
      });

      api.setToken(res.token, res.expiresAt);
      setToken(res.token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      return res.user;
    } catch (error: any) {
      showToast(error.message || 'Login failed. Please check credentials.', 'error');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout to allow clean client teardown
    } finally {
      api.clearToken();
      setToken(null);
      setUser(null);
      showToast('Logged out successfully', 'info');
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
