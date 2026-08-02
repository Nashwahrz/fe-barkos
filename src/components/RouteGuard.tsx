'use client';

import { useAuth } from '@/components/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useHierarchicalBackButton } from '@/hooks/useHierarchicalBackButton';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useHierarchicalBackButton();

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (loading) return;

    // If there is no user and we are not on an auth page
    if (!user && !pathname.startsWith('/auth')) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      // Role-based redirection and protection
      if (user.role === 'super_admin' && !pathname.startsWith('/admin') && !pathname.startsWith('/auth')) {
        router.push('/admin/dashboard');
      } else if (user.role === 'penjual' && pathname.startsWith('/admin')) {
        router.push('/seller/products');
      } else if (user.role === 'pembeli' && (pathname.startsWith('/admin') || (pathname.startsWith('/seller') && !pathname.startsWith('/seller/register')))) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  // Show a loading state or nothing while checking authentication
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8faf9' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)' }}>Memuat...</div>
      </div>
    );
  }

  // If not authenticated and not on an auth page, render nothing while redirecting
  if (!user && !pathname.startsWith('/auth')) {
    return null;
  }

  // If authenticated but not verified, block access to everything except the actual verification processing page
  if (user && !user.email_verified_at) {
    const isVerificationProcessing = pathname.match(/^\/auth\/verify-email\/\d+\/[^\/]+/);
    if (!isVerificationProcessing) {
      const handleResend = async () => {
        setResendLoading(true);
        setResendMessage('');
        setResendError('');
        try {
          await fetchApi('/email/verification-notification', { method: 'POST' });
          setResendMessage('Link verifikasi baru telah dikirim ke email Anda.');
        } catch (err: any) {
          setResendError(err.message || 'Gagal mengirim link verifikasi.');
        } finally {
          setResendLoading(false);
        }
      };

      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--background)', padding: '2rem' }}>
          <div style={{ background: 'var(--card)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📧</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1rem' }}>Akun Anda Belum Terverifikasi</h1>
            <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '2rem' }}>
              Silakan verifikasi terlebih dahulu. Periksa kotak masuk email Anda dan klik tautan verifikasi.
            </p>

            {resendMessage && (
              <div style={{ padding: '0.75rem', background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {resendMessage}
              </div>
            )}

            {resendError && (
              <div style={{ padding: '0.75rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {resendError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="btn btn-primary"
                style={{
                  padding: '12px', cursor: resendLoading ? 'not-allowed' : 'pointer', opacity: resendLoading ? 0.7 : 1
                }}
              >
                {resendLoading ? 'Mengirim...' : 'Kirim Ulang Verifikasi'}
              </button>
              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{ padding: '12px' }}
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
