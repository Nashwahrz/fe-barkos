'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/components/Icons';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await fetchApi('/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      setMessage(data.message || 'Password berhasil direset.');
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal mereset password. Tautan mungkin sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, textAlign: 'center', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
        Tautan reset password tidak valid. Silakan minta tautan baru.
      </div>
    );
  }

  return (
    <>
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
            value={email}
            disabled
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            label="Password Baru"
            placeholder="••••••••"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                tabIndex={-1}
              >
                {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
              </button>
            }
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            label="Konfirmasi Password Baru"
            placeholder="••••••••"
            required
            minLength={8}
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Memproses...' : 'Reset Password'}
          </Button>
        </form>
      )}
    </>
  );
}

export default function ResetPassword() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 65px)', padding: '3rem 1rem', background: 'var(--background)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--primary-light)', padding: '16px', borderRadius: '16px', marginBottom: '16px', color: 'var(--primary)' }}>
            <Icons.Shield size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Reset Password</h1>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', color: 'var(--foreground)' }}>Masukkan password baru untuk akun Anda</p>
        </div>

        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.7 }}>
          <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600, opacity: 1, textDecoration: 'none' }}>Kembali ke halaman masuk</Link>
        </div>
      </div>
    </div>
  );
}
