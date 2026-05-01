'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

function RegisterForm() {
  const { user, login, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') || 'pembeli';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    asal_kampus: '',
    role: initialRole,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchApi('/register', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' },
      });

      login(data.access_token, data.user);
      
      // Redirect to verification notice or dashboard
      router.push('/auth/verify-email');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      await fetchApi('/upgrade-role', { method: 'POST' });
      await refreshUser();
      alert('Berhasil upgrade akun menjadi Penjual!');
      router.push('/seller/products');
    } catch (err: any) {
      setError(err.message || 'Gagal upgrade akun.');
      setLoading(false);
    }
  };

  if (authLoading) return null;

  if (user) {
    if (user.role === 'penjual') {
      return (
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
          <div className="card text-center" style={{ width: '100%', maxWidth: '450px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Anda Sudah Terdaftar</h1>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Akun Anda sudah memiliki hak akses sebagai Penjual Lapak.</p>
            <Link href="/seller/products" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Kelola Kos Saya</Link>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
        <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>Upgrade Akun Penjual</h1>
          <p style={{ textAlign: 'center', opacity: 0.6, marginBottom: '2rem' }}>
            Masuk satu langkah lagi untuk mulai menawarkan barang bekas Anda kepada ribuan mahasiswa!
          </p>

          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div className="flex-col gap-4" style={{ marginBottom: '2rem' }}>
            <div className="flex-col gap-1">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6 }}>Identitas Terhubung</label>
              <div style={{ padding: '0.75rem', background: 'var(--input)', borderRadius: 'var(--radius)', fontWeight: 600 }}>
                {user.name} <br/>
                <span style={{ fontWeight: 400, opacity: 0.7, fontSize: '0.9rem' }}>{user.email}</span>
              </div>
            </div>
          </div>

          <button onClick={handleUpgrade} className="btn btn-primary" style={{ width: '100%', height: '50px' }} disabled={loading}>
            {loading ? 'Memproses Upgrade...' : 'Upgrade Menjadi Penjual Sekarang 🚀'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>Buat Akun Baru</h1>
        <p style={{ textAlign: 'center', opacity: 0.6, marginBottom: '2rem' }}>Bergabung dengan komunitas Lapak Mahasiswa sekarang.</p>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Nama Lengkap</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Masukkan nama lengkap" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Email Kampus</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="nama@student.univ.ac.id" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Asal Kampus</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Contoh: Universitas Brawijaya" 
              required
              value={formData.asal_kampus}
              onChange={(e) => setFormData({ ...formData, asal_kampus: e.target.value })}
            />
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Daftar Sebagai</label>
            <div className="flex gap-2">
              <button 
                type="button" 
                className={`btn flex-1`} 
                style={{ 
                  border: '1px solid var(--border)', 
                  background: formData.role === 'pembeli' ? 'var(--primary)' : 'transparent',
                  color: formData.role === 'pembeli' ? 'white' : 'inherit'
                }}
                onClick={() => setFormData({ ...formData, role: 'pembeli' })}
              >
                Pembeli
              </button>
              <button 
                type="button" 
                className={`btn flex-1`}
                style={{ 
                  border: '1px solid var(--border)', 
                  background: formData.role === 'penjual' ? 'var(--primary)' : 'transparent',
                  color: formData.role === 'penjual' ? 'white' : 'inherit'
                }}
                onClick={() => setFormData({ ...formData, role: 'penjual' })}
              >
                Penjual
              </button>
            </div>
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Konfirmasi Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              required
              value={formData.password_confirmation}
              onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', height: '50px' }} disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.4 }}>
          <div style={{ flex: 1, height: '1px', background: 'currentColor' }}></div>
          <span style={{ fontSize: '0.8rem' }}>ATAU</span>
          <div style={{ flex: 1, height: '1px', background: 'currentColor' }}></div>
        </div>

        <button 
          onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/google`}
          className="btn" 
          style={{ width: '100%', border: '1px solid var(--border)', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Daftar dengan Google
        </button>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.6 }}>
          Sudah punya akun? <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
