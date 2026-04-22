'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { fetchApi } from '@/lib/api';

function CallbackContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const authError = searchParams.get('error');

    if (authError) {
      setError('Autentikasi Google gagal. Silakan coba lagi.');
      setTimeout(() => router.push('/auth/login'), 3000);
      return;
    }

    if (token) {
      handleLogin(token);
    } else {
      setError('Token tidak ditemukan.');
      setTimeout(() => router.push('/auth/login'), 3000);
    }
  }, [searchParams, router]);

  const handleLogin = async (token: string) => {
    try {
      // Temporarily store token to fetch user data
      localStorage.setItem('auth_token', token);
      
      const userData = await fetchApi('/me');
      const user = userData.data || userData;
      
      login(token, user);

      // Redirect based on role
      if (user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'penjual') {
        router.push('/seller/products');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Callback login failed:', err);
      setError('Gagal mengambil data user.');
      localStorage.removeItem('auth_token');
      setTimeout(() => router.push('/auth/login'), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center flex-col gap-4" style={{ minHeight: '80vh' }}>
      {!error ? (
        <>
          <div className="loader" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <h2 style={{ fontWeight: 700 }}>Menyelesaikan autentikasi...</h2>
          <p style={{ opacity: 0.6 }}>Harap tunggu sebentar.</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: '3rem' }}>❌</div>
          <h2 style={{ fontWeight: 700, color: '#ef4444' }}>{error}</h2>
          <p style={{ opacity: 0.6 }}>Mengarahkan kembali ke halaman login...</p>
        </>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ minHeight: '80vh' }}>
        <p>Loading...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
