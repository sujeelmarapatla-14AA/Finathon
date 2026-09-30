import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import {
  login as apiLogin,
  signup as apiSignup,
  getCurrentUser,
  logout as apiLogout,
  getAuthToken,
  setOnUnauthorized,
} from '../services/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    apiLogout();
    setToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const existingToken = getAuthToken();
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setToken(existingToken);
    } catch {
      // Invalid/expired token
      apiLogout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Intercept 401s from any API request
    setOnUnauthorized(() => {
      logout();
    });

    // Check existing session
    refreshSession();
  }, [logout, refreshSession]);

  const signIn = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    setToken(response.access_token);
    setUser(response.user);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const response = await apiSignup(name, email, password);
    return response;
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
