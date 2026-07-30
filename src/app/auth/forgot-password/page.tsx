'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/components/Icons';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await fetchApi('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      });
      setMessage(data.message || 'Jika email terdaftar, tautan reset password telah dikirim.');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim tautan reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 65px)', padding: '3rem 1rem', background: 'var(--background)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--primary-light)', padding: '16px', borderRadius: '16px', marginBottom: '16px', color: 'var(--primary)' }}>
            <Icons.Shield size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Lupa Password</h1>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', color: 'var(--foreground)' }}>Masukkan email Anda, kami akan kirimkan tautan untuk reset password</p>
        </div>

        {message && (
          <div style={{ padding: '1rem', background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500, border: '1px solid rgba(5, 150, 105, 0.2)' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500, textAlign: 'center', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            {error}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input
              type="email"
              label="Email"
              placeholder="nama@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </Button>
          </form>
        )}

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.7 }}>
          Ingat password Anda? <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600, opacity: 1, textDecoration: 'none' }}>Masuk</Link>
        </div>
      </div>
    </div>
  );
}
