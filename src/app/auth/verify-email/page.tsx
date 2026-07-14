'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthProvider';

export default function VerifyEmail() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.email_verified_at) {
      // User is already verified, redirect them away from this page
      if (user.role === 'penjual') {
        router.replace('/seller/products');
      } else if (user.role === 'super_admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  const handleResend = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await fetchApi('/email/verification-notification', {
        method: 'POST',
      });
      setMessage('Link verifikasi baru telah dikirim ke email Anda.');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim link verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 65px)', padding: '2rem 1rem', background: 'var(--background)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', opacity: 0.9 }}>📧</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Verifikasi Email Anda</h1>
        <p style={{ opacity: 0.7, lineHeight: 1.6, marginBottom: '2rem', color: 'var(--foreground)', fontSize: '0.95rem' }}>
          Terima kasih telah mendaftar! Silakan periksa kotak masuk email Anda dan klik link verifikasi yang baru saja kami kirimkan.
        </p>

        {message && (
          <div style={{ padding: '1rem', background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500, border: '1px solid rgba(5, 150, 105, 0.2)' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500, border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            {error}
          </div>
        )}

        <div className="flex-col gap-4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.8 }}>Tidak menerima email?</p>
            <Button 
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleResend} 
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Kirim Ulang Link Verifikasi'}
            </Button>
          </div>

          <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.2 }}>
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
            Verifikasi dengan Google
          </Button>
          
          <Button 
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => router.push('/')} 
          >
            Nanti Saja, Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
