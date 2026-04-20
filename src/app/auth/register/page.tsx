'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';

export default function Register() {
  const { login } = useAuth();
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

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', padding: '2rem 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>Buat Akun Baru</h1>
        <p style={{ textAlign: 'center', opacity: 0.6, marginBottom: '2rem' }}>Bergabung dengan komunitas Lapak Kos sekarang.</p>

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

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.6 }}>
          Sudah punya akun? <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
}
