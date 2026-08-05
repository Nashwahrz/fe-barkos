'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/components/Icons';
import { ReCaptchaV2 } from '@/components/ui/ReCaptchaV2';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const handleCaptchaVerify = useCallback((token: string | null) => {
    setRecaptchaToken(token);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchApi('/login', {
        method: 'POST',
        body: JSON.stringify({ ...formData, recaptcha_token: recaptchaToken }),
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
      setRecaptchaToken(null);
      setCaptchaKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)', background: 'var(--background)', overflow: 'hidden' }}>
      
      {/* Left Panel - Hidden on mobile */}
      <div className="hide-mobile" style={{
        flex: '1.2',
        background: 'linear-gradient(135deg, var(--primary) 0%, #047857 100%)',
        color: 'white',
        padding: '4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Decorative blur elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', filter: 'blur(50px)' }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '540px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            background: 'rgba(255,255,255,0.15)', padding: '6px 16px', 
            borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
            backdropFilter: 'blur(10px)', marginBottom: '1.5rem',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Icons.Compass size={16} /> Platform Anak Kos
          </div>

          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            Selamat Datang di <br/>Lapak Kos.
          </h1>
          
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '3rem' }}>
            Platform andalan mahasiswa untuk mencari perabotan kos murah atau membuka lapak secara gratis. Temukan kemudahannya sekarang!
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '20px', 
              backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Icons.ShoppingBag size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Beli Kebutuhan</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.5, margin: 0 }}>
                Temukan barang kos dari sesama mahasiswa di sekitar kampus.
              </p>
            </div>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '20px', 
              backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Icons.Store size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Buka Lapak</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.5, margin: 0 }}>
                Buka toko Anda sendiri gratis dan jangkau pembeli dengan cepat.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{ 
        flex: '0.8', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '3rem 1.5rem',
        position: 'relative'
      }}>
        {/* Soft background glow */}
        <div className="hide-mobile" style={{ position: 'absolute', top: '0', right: '0', width: '300px', height: '300px', background: 'var(--primary-light)', opacity: 0.3, borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 }} />

        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Masuk ke Akun</h2>
            <p style={{ opacity: 0.6, fontSize: '0.95rem', color: 'var(--foreground)' }}>Silakan isi detail Anda untuk melanjutkan</p>
          </div>

          {error && (
            <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input 
              type="email" 
              label="Email"
              placeholder="nama@email.com" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <div className="flex flex-col gap-2">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, color: 'var(--foreground)', opacity: 0.6 }}
                    tabIndex={-1}
                  >
                    {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                  </button>
                }
              />
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <Link href="/auth/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Lupa password?
                </Link>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
              <ReCaptchaV2 key={captchaKey} onVerify={handleCaptchaVerify} />
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading || !recaptchaToken} style={{ borderRadius: '12px', fontWeight: 700, padding: '14px' }}>
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
            </Button>
          </form>

          <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.3 }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--foreground)' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '0.05em' }}>ATAU</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--foreground)' }}></div>
          </div>

          <Button 
            variant="secondary"
            size="lg"
            fullWidth
            style={{ borderRadius: '12px', fontWeight: 600, padding: '12px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/google`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Lanjutkan dengan Google
          </Button>

          <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--foreground)' }}>
            Belum punya akun? <Link href="/auth/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', marginLeft: '4px' }}>Daftar sekarang</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
