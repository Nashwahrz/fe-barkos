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
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>Selamat Datang</h1>
        <p style={{ textAlign: 'center', opacity: 0.6, marginBottom: '2rem' }}>Masuk untuk melanjutkan ke Lapak Kos.</p>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="nama@email.com" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
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

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', height: '50px' }} disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.6 }}>
          Belum punya akun? <Link href="/auth/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Daftar sekarang</Link>
        </div>
      </div>
    </div>
  );
}
