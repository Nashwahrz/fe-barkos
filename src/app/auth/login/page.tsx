'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchApi('/login', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' },
      });

      login(data.access_token, data.user);
      
      // Check role and redirect
      if (data.user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (data.user.role === 'penjual') {
        router.push('/seller/products');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', padding: '3rem 1rem', background: '#f8faf9' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛍️</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem', color: '#111827' }}>Selamat Datang</h1>
          <p style={{ opacity: 0.6, fontSize: '0.95rem' }}>Silakan masuk ke akun Lapak Kos Anda</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center', border: '1px solid #fee2e2' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-5">
          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>Email</label>
            <input 
              type="email" 
              className="input-field" 
              style={{ height: '48px', borderRadius: '8px' }}
              placeholder="nama@email.com" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              style={{ height: '48px', borderRadius: '8px' }}
              placeholder="••••••••" 
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', height: '52px', fontWeight: 700, fontSize: '1rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)' }} disabled={loading}>
            {loading ? '⏳ Memproses...' : 'Masuk'}
          </button>
        </form>

        <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.3 }}>
          <div style={{ flex: 1, height: '1.5px', background: 'currentColor' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>ATAU</span>
          <div style={{ flex: 1, height: '1.5px', background: 'currentColor' }}></div>
        </div>

        <button 
          onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/google`}
          className="btn" 
          style={{ width: '100%', border: '1.5px solid #e5e7eb', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '8px', background: 'white', fontWeight: 600, color: '#374151' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#6b7280' }}>
          Belum punya akun? <Link href="/auth/register" style={{ color: 'var(--primary)', fontWeight: 800 }}>Daftar sekarang</Link>
        </div>
      </div>
    </div>
  );
}
