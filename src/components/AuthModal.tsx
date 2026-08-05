'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchApi } from '@/lib/api';

export default function AuthModal() {
  const { authModalType, openAuthModal, closeAuthModal, login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAsalKampus, setRegAsalKampus] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConf, setRegPasswordConf] = useState('');

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeAuthModal();
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetchApi('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      login(res.access_token, res.user);
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regPasswordConf) {
      setError('Konfirmasi password tidak cocok!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetchApi('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          password_confirmation: regPasswordConf,
          role: 'pembeli',
          asal_kampus: regAsalKampus
        }),
      });

      login(res.access_token, res.user);
      closeAuthModal();
    } catch (err: any) {
      let msg = err.message || 'Gagal mendaftar.';
      if (err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join(', ');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!authModalType) return null;

  return (
    <div 
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="card"
        style={{
          width: '100%', maxWidth: '420px',
          background: 'var(--card)',
          borderRadius: '24px',
          padding: '2.5rem',
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <button 
          onClick={closeAuthModal}
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'var(--input)', border: 'none',
            width: '32px', height: '32px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--foreground)'
          }}
        >
          <Icons.X size={16} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 1rem', background: 'var(--primary-light)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Icons.Store size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            {authModalType === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
          </h2>
          <p style={{ opacity: 0.6, fontSize: '0.85rem', color: 'var(--foreground)' }}>
            {authModalType === 'login' ? 'Silakan login untuk melanjutkan' : 'Daftar sekarang untuk berbelanja'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.08)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            {error}
          </div>
        )}

        {authModalType === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              type="email"
              label="Email Address"
              placeholder="nama@email.com"
              icon={<Icons.Mail size={18} />}
              required
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
            />
            
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              icon={<Icons.Lock size={18} />}
              required
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
            />
            
            <Button type="submit" disabled={loading} variant="primary" size="lg" style={{ marginTop: '0.5rem', height: '52px', fontSize: '1rem' }} fullWidth>
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>
            
            <div style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.3 }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--foreground)' }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '0.05em' }}>ATAU</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--foreground)' }}></div>
            </div>

            <Button 
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              style={{ borderRadius: '12px', fontWeight: 600, padding: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/google`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Lanjutkan dengan Google
            </Button>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.8 }}>
              Belum punya akun?{' '}
              <button 
                type="button" 
                onClick={() => { setError(''); openAuthModal('register'); }} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Daftar sekarang
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="Nama Lengkap"
              placeholder="Budi Santoso"
              icon={<Icons.User size={18} />}
              required
              value={regName}
              onChange={e => setRegName(e.target.value)}
            />
            <Input
              type="email"
              label="Email"
              placeholder="budi@kampus.ac.id"
              icon={<Icons.Mail size={18} />}
              required
              value={regEmail}
              onChange={e => setRegEmail(e.target.value)}
            />
            <Input
              type="text"
              label="Asal Kampus"
              placeholder="Contoh: Universitas Brawijaya"
              icon={<Icons.GraduationCap size={18} />}
              required
              value={regAsalKampus}
              onChange={e => setRegAsalKampus(e.target.value)}
            />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              icon={<Icons.Lock size={18} />}
              required
              value={regPassword}
              onChange={e => setRegPassword(e.target.value)}
            />
            <Input
              type="password"
              label="Konfirmasi Password"
              placeholder="••••••••"
              icon={<Icons.Lock size={18} />}
              required
              value={regPasswordConf}
              onChange={e => setRegPasswordConf(e.target.value)}
            />

            <Button type="submit" disabled={loading} variant="primary" size="lg" style={{ marginTop: '0.5rem', height: '52px', fontSize: '1rem' }} fullWidth>
              {loading ? 'Mendaftar...' : 'Daftar'}
            </Button>
            
            <div style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.3 }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--foreground)' }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '0.05em' }}>ATAU</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--foreground)' }}></div>
            </div>

            <Button 
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              style={{ borderRadius: '12px', fontWeight: 600, padding: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/google`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Daftar dengan Google
            </Button>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.8 }}>
              Sudah punya akun?{' '}
              <button 
                type="button" 
                onClick={() => { setError(''); openAuthModal('login'); }} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Masuk di sini
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
