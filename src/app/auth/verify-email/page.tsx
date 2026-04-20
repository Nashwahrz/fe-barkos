'use client';

import { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function VerifyEmail() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📧</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Verifikasi Email Anda</h1>
        <p style={{ opacity: 0.7, lineHeight: 1.6, marginBottom: '2rem' }}>
          Terima kasih telah mendaftar! Silakan periksa kotak masuk email Anda dan klik link verifikasi yang baru saja kami kirimkan.
        </p>

        {message && (
          <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div className="flex-col gap-3">
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Tidak menerima email?</p>
          <button 
            onClick={handleResend} 
            className="btn btn-primary" 
            style={{ width: '100%', height: '50px' }}
            disabled={loading}
          >
            {loading ? 'Mengirim...' : 'Kirim Ulang Link Verifikasi'}
          </button>
          
          <button 
            onClick={() => router.push('/')} 
            className="btn" 
            style={{ width: '100%', border: '1px solid var(--border)' }}
          >
            Nanti Saja, Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
