'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { fetchApi } from '@/lib/api';
import { USER_ROLES } from '@/lib/constants';
import Link from 'next/link';
import { Icons } from '@/components/Icons';

export default function SellerRegisterPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);

  // Handle redirects inside useEffect — never during render
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/seller/register');
    } else if (user.role === USER_ROLES.PENJUAL) {
      router.replace('/seller/products');
    }
  }, [loading, user, router]);

  const handleUpgrade = async () => {
    if (!agreed) { setError('Harap setujui syarat & ketentuan penjual terlebih dahulu.'); return; }
    if (!identityDocument) { setError('Harap unggah KTM / KTP Anda untuk verifikasi penjual.'); return; }
    
    setSubmitting(true);
    setError('');
    try {
      const form = new FormData();
      form.append('identity_document', identityDocument);

      await fetchApi('/upgrade-role', { method: 'POST', body: form });
      await refreshUser?.();
      router.push('/seller/products/create');
    } catch (err: any) {
      setError(err?.message || 'Gagal mendaftar sebagai penjual. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Show spinner while loading OR while redirecting
  if (loading || !user || user.role === USER_ROLES.PENJUAL) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <Icons.Loader size={36} color="var(--primary)" />
          <p style={{ marginTop: '1rem', fontWeight: 600 }}>Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '560px' }}>

        {/* Back button */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--foreground)', opacity: 0.6, fontSize: '0.9rem', marginBottom: '1.5rem', textDecoration: 'none' }}>
          <Icons.ArrowLeft size={16} />
          Kembali ke Beranda
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', boxShadow: '0 8px 24px rgba(22,163,74,0.3)'
          }}>
            <Icons.Store size={36} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--foreground)', marginBottom: '8px' }}>
            Daftar Jadi Penjual
          </h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '0.95rem', lineHeight: 1.5 }}>
            Buka lapak Anda di <strong>Lapak Kos</strong> dan mulai jual barang ke sesama mahasiswa secara mudah & cepat.
          </p>
        </div>

        {/* Benefits */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>
            ✨ Keuntungan jadi penjual
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: <Icons.Package size={18} color="var(--primary)" />, text: 'Upload produk tanpa batas, gratis!' },
              { icon: <Icons.MessageCircle size={18} color="var(--primary)" />, text: 'Chat langsung dengan pembeli yang tertarik' },
              { icon: <Icons.MapPin size={18} color="var(--primary)" />, text: 'Jangkau pembeli di sekitar kampus Anda' },
              { icon: <Icons.Zap size={18} color="var(--primary)" />, text: 'Tingkatkan visibilitas dengan fitur Promosi' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'var(--primary-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User info card */}
        <div style={{
          background: 'var(--primary-light)', border: '1px solid var(--primary)',
          borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.9rem' }}>{user?.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--foreground)', opacity: 0.6 }}>{user?.email}</div>
          </div>
          <div style={{
            marginLeft: 'auto', background: 'var(--primary)', color: 'white',
            fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px'
          }}>
            Akun Aktif
          </div>
        </div>

        {/* Upload KTM/KTP */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--foreground)' }}>
            Upload KTP / KTM (Wajib)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/jpg"
              onChange={(e) => { setIdentityDocument(e.target.files ? e.target.files[0] : null); setError(''); }}
              style={{
                padding: '10px',
                border: '1px dashed var(--input-border)',
                borderRadius: '8px',
                background: 'var(--input)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
                width: '100%',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--foreground)', opacity: 0.6 }}>Maksimal 5MB. AI kami akan memverifikasi dokumen Anda secara otomatis.</span>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px', padding: '10px', background: 'rgba(22, 163, 74, 0.08)', borderRadius: '8px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
              <Icons.Shield size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.75rem', color: '#16a34a', lineHeight: 1.4, fontWeight: 500 }}>
                Data KTP/KTM Anda dijamin aman. Dokumen ini hanya digunakan untuk keperluan verifikasi keamanan platform dan tidak akan disebarluaskan.
              </span>
            </div>
          </div>
        </div>

        {/* Agreement */}
        <div style={{
          background: 'var(--card)', border: `1px solid ${error && !agreed ? '#ef4444' : 'var(--border)'}`,
          borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem'
        }}>
          <label style={{ display: 'flex', gap: '12px', cursor: 'pointer', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => { setAgreed(e.target.checked); setError(''); }}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', marginTop: '2px', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--foreground)', lineHeight: 1.5 }}>
              Saya menyetujui <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Syarat & Ketentuan Penjual</span> Lapak Kos, termasuk kewajiban untuk menjaga kejujuran produk yang dijual dan mematuhi aturan transaksi yang berlaku.
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid #ef4444',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem',
            color: '#ef4444', fontSize: '0.875rem', fontWeight: 600
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleUpgrade}
          disabled={submitting}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            background: submitting ? 'var(--border)' : 'var(--primary)',
            color: 'white', border: 'none', fontWeight: 800, fontSize: '1rem',
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: submitting ? 'none' : '0 4px 16px rgba(22,163,74,0.35)',
            transition: 'all 0.2s'
          }}
        >
          {submitting ? (
            <><Icons.Loader size={20} color="white" /> Mendaftar...</>
          ) : (
            <><Icons.Store size={20} color="white" /> Daftar & Mulai Berjualan</>
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.5, marginTop: '1rem' }}>
          Gratis selamanya. Tanpa biaya pendaftaran.
        </p>
      </div>
    </div>
  );
}
