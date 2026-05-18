'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi, swrFetcher } from '@/lib/api';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  asal_kampus: string | null;
  phone: string | null;
  avatar: string | null;
  foto: string | null;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  email_verified_at: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  // Load token on mount
  useEffect(() => {
    setToken(localStorage.getItem('auth_token'));
    setIsInitializing(false);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service Worker registration failed:', err);
      });
    }
  }, []);

  const { data, error, isLoading, mutate: refresh } = useSWR(
    token ? '/me' : null,
    swrFetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const user = data?.data || data || null;

  async function refreshUser() {
    await refresh();
  }

  function login(newToken: string, userData: User) {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    mutate('/me', { data: userData }, false);
  }

  function logout() {
    localStorage.removeItem('auth_token');
    setToken(null);
    mutate('/me', null, false);
    router.push('/auth/login');
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: isInitializing || (token ? isLoading : false), 
      login, 
      logout, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

