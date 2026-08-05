'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi, swrFetcher } from '@/lib/api';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import dynamic from 'next/dynamic';

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
  bank_accounts?: any[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  unreadCount: number;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  authModalType: 'login' | 'register' | null;
  openAuthModal: (type: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authModalType, setAuthModalType] = useState<'login' | 'register' | null>(null);
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

  function openAuthModal(type: 'login' | 'register') {
    setAuthModalType(type);
  }

  function closeAuthModal() {
    setAuthModalType(null);
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: isInitializing || (token ? isLoading : false),
      unreadCount: 0,
      login, 
      logout, 
      refreshUser,
      authModalType,
      openAuthModal,
      closeAuthModal
    }}>
      {children}
      {/* 
        We use a dynamic import for AuthModal so we don't cause circular dependencies 
        or increase initial bundle size unnecessarily.
      */}
      {authModalType && <AuthModal />}
    </AuthContext.Provider>
  );
}

// Dynamically imported AuthModal
const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

