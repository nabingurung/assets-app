import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { TOKEN_KEY, USER_KEY } from '../api/client';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    // Confirm the stored token is still valid; the 401 interceptor clears it otherwise.
    apiClient
      .get<User>('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { username, password });
    const { token, user: userData } = response.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, isLoading, isAdmin: user?.role === 'Admin' }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
