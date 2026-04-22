'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function VerifyEmailProcess() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Sedang memverifikasi email Anda...');

  useEffect(() => {
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
        // Laravel's verification route expects a GET request to the signed URL
        // In SPA, we proxy this call to the API
        await fetchApi(`/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`);
        
        setStatus('success');
        setMessage('Email Anda berhasil diverifikasi! Mengalihkan ke beranda...');
        
        // Redirect based on login status and role
        if (user && user.role === 'penjual') {
          router.replace('/seller/products');
        } else if (user && user.role === 'super_admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Gagal memverifikasi email. Link mungkin sudah kedaluwarsa.');
      }
    }

    verify();
  }, [params, searchParams, router]);

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
          {status === 'loading' && '⏳'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
          {status === 'loading' && 'Memproses Verifikasi'}
          {status === 'success' && 'Email Terverifikasi!'}
          {status === 'error' && 'Verifikasi Gagal'}
        </h1>
        
        <p style={{ opacity: 0.7, lineHeight: 1.6, marginBottom: '2.5rem' }}>
          {message}
        </p>

        <div className="flex-col gap-3">
          {status === 'success' ? (
            <Link href={user ? (user.role === 'penjual' ? '/seller/products' : (user.role === 'super_admin' ? '/admin/dashboard' : '/')) : '/'} className="btn btn-primary" style={{ width: '100%' }}>
              Pergi ke Dashboard
            </Link>
          ) : (
            <Link href="/auth/verify-email" className="btn" style={{ width: '100%', border: '1px solid var(--border)' }}>
              Kembali ke Halaman Verifikasi
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
