'use client';

import { Suspense, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/components/Icons';
import { MathCaptcha } from '@/components/ui/MathCaptcha';

function RegisterForm() {
  const { user, login, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') || 'pembeli';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    asal_kampus: '',
    role: initialRole,
    identity_document: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameWarning, setNameWarning] = useState('');
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
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          form.append(key, value as string | Blob);
        }
      });

      const data = await fetchApi('/register', {
        method: 'POST',
        body: form,
      });

      login(data.access_token, data.user);

      // Redirect to verification notice or dashboard
      router.push('/auth/verify-email');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
      // Reset captcha on failure
      setCaptchaVerified(false);
      setCaptchaKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.identity_document) {
      setError('KTM / KTP wajib diunggah untuk menjadi penjual.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('identity_document', formData.identity_document);

      await fetchApi('/upgrade-role', { method: 'POST', body: form });
      await refreshUser();
      alert('Berhasil upgrade akun menjadi Penjual!');
      router.push('/seller/products');
    } catch (err: any) {
      setError(err.message || 'Gagal upgrade akun.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  if (user) {
    if (user.role === 'penjual') {
      return (
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 65px)', padding: '2rem 1rem', background: 'var(--background)' }}>
          <div className="card text-center" style={{ width: '100%', maxWidth: '450px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>Anda Sudah Terdaftar</h1>
            <p style={{ opacity: 0.7, marginBottom: '2rem', color: 'var(--foreground)' }}>Akun Anda sudah memiliki hak akses sebagai Penjual Lapak.</p>
            <Button href="/seller/products" variant="primary" size="lg" fullWidth>Kelola Kos Saya</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 65px)', padding: '2rem 1rem', background: 'var(--background)' }}>
        <div className="card" style={{ width: '100%', maxWidth: '450px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center', color: 'var(--foreground)' }}>Upgrade Akun Penjual</h1>
          <p style={{ textAlign: 'center', opacity: 0.7, marginBottom: '2rem', color: 'var(--foreground)', fontSize: '0.95rem' }}>
            Masuk satu langkah lagi untuk mulai menawarkan barang bekas Anda kepada ribuan mahasiswa!
          </p>

          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleUpgrade} className="flex flex-col gap-4" style={{ marginBottom: '2rem' }}>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.7 }}>Identitas Terhubung</label>
              <div style={{ padding: '1rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}>
                <div style={{ fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontWeight: 400, opacity: 0.7, fontSize: '0.875rem', marginTop: '4px' }}>{user.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>Upload KTP / KTM (Wajib)</label>
              <input
                type="file"
                accept="image/jpeg, image/png, image/jpg"
                onChange={(e) => setFormData({ ...formData, identity_document: e.target.files ? e.target.files[0] : null })}
                required
                style={{
                  padding: '10px',
                  border: '1px dashed var(--input-border)',
                  borderRadius: '8px',
                  background: 'var(--input)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--foreground)', opacity: 0.6 }}>Maksimal 5MB. AI kami akan memverifikasi dokumen Anda secara otomatis.</span>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px', padding: '10px', background: 'rgba(22, 163, 74, 0.08)', borderRadius: '8px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                <Icons.Shield size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.75rem', color: '#16a34a', lineHeight: 1.4, fontWeight: 500 }}>
                  Data KTP/KTM Anda dijamin aman. Dokumen ini hanya digunakan untuk verifikasi dan tidak akan disebarluaskan.
                </span>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? 'Memproses Upgrade...' : 'Upgrade Menjadi Penjual'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 65px)', padding: '3rem 1rem', background: 'var(--background)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--primary-light)', padding: '16px', borderRadius: '16px', marginBottom: '16px', color: 'var(--primary)' }}>
            <Icons.UserPlus size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Buat Akun Baru</h1>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', color: 'var(--foreground)' }}>Bergabung dengan komunitas Lapak Mahasiswa</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500, textAlign: 'center', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <Input
              type="text"
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              required
              value={formData.name}
              onChange={(e) => {
                const val = e.target.value;
                if (/^[a-zA-Z\s]*$/.test(val)) {
                  setFormData({ ...formData, name: val });
                  setNameWarning('');
                } else {
                  setNameWarning('Nama hanya boleh berupa huruf dan spasi.');
                }
              }}
            />
            {nameWarning && (
              <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px', fontWeight: 500 }}>
                {nameWarning}
              </span>
            )}
          </div>

          <Input
            type="email"
            label="Email"
            placeholder="nama@email.com"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            type="text"
            label="Asal Kampus"
            placeholder="Contoh: Universitas Brawijaya"
            required
            value={formData.asal_kampus}
            onChange={(e) => setFormData({ ...formData, asal_kampus: e.target.value })}
          />

          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>Daftar Sebagai</label>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1"
                style={{
                  height: '44px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: formData.role === 'pembeli' ? 'var(--primary)' : 'var(--input-border)',
                  background: formData.role === 'pembeli' ? 'var(--primary-light)' : 'var(--input)',
                  color: formData.role === 'pembeli' ? 'var(--primary)' : 'var(--foreground)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: formData.role === 'pembeli' ? '0 0 0 1px var(--primary)' : 'none'
                }}
                onClick={() => setFormData({ ...formData, role: 'pembeli' })}
              >
                Pembeli
              </button>
              <button
                type="button"
                className="flex-1"
                style={{
                  height: '44px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: formData.role === 'penjual' ? 'var(--primary)' : 'var(--input-border)',
                  background: formData.role === 'penjual' ? 'var(--primary-light)' : 'var(--input)',
                  color: formData.role === 'penjual' ? 'var(--primary)' : 'var(--foreground)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: formData.role === 'penjual' ? '0 0 0 1px var(--primary)' : 'none'
                }}
                onClick={() => setFormData({ ...formData, role: 'penjual' })}
              >
                Penjual
              </button>
            </div>
          </div>

          {formData.role === 'penjual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>Upload KTP / KTM (Wajib)</label>
              <input
                type="file"
                accept="image/jpeg, image/png, image/jpg"
                onChange={(e) => setFormData({ ...formData, identity_document: e.target.files ? e.target.files[0] : null })}
                required={formData.role === 'penjual'}
                style={{
                  padding: '10px',
                  border: '1px dashed var(--input-border)',
                  borderRadius: '8px',
                  background: 'var(--input)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--foreground)', opacity: 0.6 }}>Maksimal 5MB. AI kami akan memverifikasi dokumen Anda secara otomatis.</span>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px', padding: '10px', background: 'rgba(22, 163, 74, 0.08)', borderRadius: '8px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                <Icons.Shield size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.75rem', color: '#16a34a', lineHeight: 1.4, fontWeight: 500 }}>
                  Data KTP/KTM Anda dijamin aman. Dokumen ini hanya digunakan untuk verifikasi dan tidak akan disebarluaskan.
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '4px' }}>
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Input
              type="password"
              label="Konfirmasi"
              placeholder="••••••••"
              required
              value={formData.password_confirmation}
              onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
            />
          </div>

          <MathCaptcha key={captchaKey} onVerify={handleCaptchaVerify} />

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading || !captchaVerified} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Memverifikasi Dokumen (AI)...' : 'Daftar Sekarang'}
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
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Daftar dengan Google
        </Button>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.7 }}>
          Sudah punya akun? <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600, opacity: 1, textDecoration: 'none' }}>Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
