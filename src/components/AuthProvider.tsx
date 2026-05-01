'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  asal_kampus: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  unreadCount: number;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    refreshUser();
  }, []);

  // Polling for notifications
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const data = await fetchApi('/notifications/unread-count');
        setUnreadCount(data.count || 0);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchUnread(); // Initial fetch
    const interval = setInterval(fetchUnread, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [user]);

  async function refreshUser() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchApi('/me');
      setUser(data.data || data); // Handle both resource wrapper or flat object
    } catch (err) {
      console.error('Failed to fetch user:', err);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function login(token: string, userData: User) {
    localStorage.setItem('auth_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('auth_token');
    setUser(null);
    setUnreadCount(0);
    router.push('/auth/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, unreadCount, login, logout, refreshUser }}>
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
