'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/components/Icons';
import { MathCaptcha } from '@/components/ui/MathCaptcha';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  const handleCaptchaVerify = useCallback((verified: boolean) => {
    setCaptchaVerified(verified);
  }, []);

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
      // Reset captcha on failure
      setCaptchaVerified(false);
      setCaptchaKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 65px)', padding: '3rem 1rem', background: 'var(--background)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--primary-light)', padding: '16px', borderRadius: '16px', marginBottom: '16px', color: 'var(--primary)' }}>
            <Icons.LogIn size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Selamat Datang Kembali</h1>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', color: 'var(--foreground)' }}>Silakan masuk ke akun Anda</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500, textAlign: 'center', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input 
            type="email" 
            label="Email"
            placeholder="nama@email.com" 
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input 
            type="password" 
            label="Password"
            placeholder="••••••••" 
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <MathCaptcha key={captchaKey} onVerify={handleCaptchaVerify} />

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading || !captchaVerified} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.2 }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--foreground)' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>ATAU</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--foreground)' }}></div>
        </div>

        <Button 
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/google`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Masuk dengan Google
        </Button>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.7 }}>
          Belum punya akun? <Link href="/auth/register" style={{ color: 'var(--primary)', fontWeight: 600, opacity: 1, textDecoration: 'none' }}>Daftar sekarang</Link>
        </div>
      </div>
    </div>
  );
}
