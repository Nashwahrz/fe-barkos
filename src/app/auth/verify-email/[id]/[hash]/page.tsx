'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { fetchApi, ApiError } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function VerifyEmailProcess() {
  const { user, refreshUser } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasCalled = useRef(false);
  
  const [status, setStatus] = useState<'loading' | 'success' | 'already_verified' | 'error'>('loading');
  const [message, setMessage] = useState('Sedang memverifikasi email Anda...');

  useEffect(() => {
    // Guard: only run once even in React StrictMode
    if (hasCalled.current) return;
    hasCalled.current = true;

    async function verify() {
      const { id, hash } = params;
      const expires = searchParams.get('expires');
      const signature = searchParams.get('signature');

      if (!id || !hash || !expires || !signature) {
        setStatus('error');
        setMessage('Link verifikasi tidak valid atau sudah kedaluwarsa.');
        return;
      }

      try {
        const data = await fetchApi(
          `/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`
        );

        // Refresh user state so the app knows it's now verified
        await refreshUser();

        if (data.status === 'already_verified') {
          setStatus('already_verified');
          setMessage('Email Anda sudah terverifikasi sebelumnya.');
        } else {
          setStatus('success');
          setMessage('Email Anda berhasil diverifikasi!');
        }
      } catch (err: any) {
        const isExpired =
          err instanceof ApiError && (err.status === 403 || err.status === 401);
        setStatus('error');
        setMessage(
          isExpired
            ? 'Link verifikasi tidak valid atau sudah kedaluwarsa. Silakan minta link baru.'
            : err.message || 'Gagal memverifikasi email. Silakan coba lagi.'
        );
      }
    }

    verify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getRedirectPath = () => {
    if (!user) return '/';
    if (user.role === 'penjual') return '/seller/products';
    if (user.role === 'super_admin') return '/admin/dashboard';
    return '/';
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
          {status === 'loading' && '⏳'}
          {(status === 'success' || status === 'already_verified') && '✅'}
          {status === 'error' && '❌'}
        </div>
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
          {status === 'loading' && 'Memproses Verifikasi'}
          {status === 'success' && 'Email Terverifikasi!'}
          {status === 'already_verified' && 'Sudah Terverifikasi'}
          {status === 'error' && 'Verifikasi Gagal'}
        </h1>
        
        <p style={{ opacity: 0.7, lineHeight: 1.6, marginBottom: '2.5rem' }}>
          {message}
        </p>

        <div className="flex-col gap-3">
          {(status === 'success' || status === 'already_verified') ? (
            <Link
              href={getRedirectPath()}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Pergi ke Beranda
            </Link>
          ) : status === 'error' ? (
            <Link
              href="/auth/verify-email"
              className="btn"
              style={{ width: '100%', border: '1px solid var(--border)' }}
            >
              Kirim Ulang Link Verifikasi
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
