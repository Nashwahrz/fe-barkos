'use client';

import { useAuth } from '@/components/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

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
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#16a34a' }}>Memuat...</div>
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8faf9', padding: '2rem' }}>
          <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📧</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>Akun Anda Belum Terverifikasi</h1>
            <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: '2rem' }}>
              Silakan verifikasi terlebih dahulu. Periksa kotak masuk email Anda dan klik tautan verifikasi.
            </p>

            {resendMessage && (
              <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {resendMessage}
              </div>
            )}

            {resendError && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {resendError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handleResend}
                disabled={resendLoading}
                style={{
                  background: '#16a34a', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: resendLoading ? 'not-allowed' : 'pointer', opacity: resendLoading ? 0.7 : 1
                }}
              >
                {resendLoading ? 'Mengirim...' : 'Kirim Ulang Verifikasi'}
              </button>
              <button 
                onClick={logout}
                style={{
                  background: 'transparent', color: '#6b7280', padding: '12px', borderRadius: '8px', fontWeight: 600, border: '1px solid #d1d5db', cursor: 'pointer'
                }}
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
