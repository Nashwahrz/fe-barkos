'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  // Profile Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [asalKampus, setAsalKampus] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Status States
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setName(user.name || '');
    setPhone(user.phone || '');
    setAsalKampus(user.asal_kampus || '');
    if (user.avatar) {
      setAvatarPreview(user.avatar.startsWith('http') ? user.avatar : getStorageUrl(user.avatar));
    }
  }, [user, router]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (phone) formData.append('phone', phone);
      if (asalKampus) formData.append('asal_kampus', asalKampus);
      
      // Special trick for PUT with files in Laravel/Next API route
      // We send it as POST with _method=PUT
      formData.append('_method', 'PUT');

      if (fileInputRef.current?.files?.[0]) {
        formData.append('avatar', fileInputRef.current.files[0]);
      }

      // We have to use native fetch for FormData to set headers properly
      const token = localStorage.getItem('auth_token');
      const res = await fetch('http://localhost:8000/api/profile', {
        method: 'POST', // POST with _method=PUT
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal update profil');
      
      showMessage('Profil berhasil diperbarui', 'success');
      refreshUser();
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      return showMessage('Password konfirmasi tidak cocok', 'error');
    }
    
    setPasswordLoading(true);
    try {
      await fetchApi('/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: currentPassword, password, password_confirmation: passwordConfirmation })
      });
      showMessage('Password berhasil diubah', 'success');
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
    } catch (err: any) {
      showMessage(err.message || 'Gagal mengubah password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const updateLocation = () => {
    if (!navigator.geolocation) {
      return showMessage('Geolocation tidak didukung browser ini.', 'error');
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await fetchApi('/location', {
            method: 'PUT',
            body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          });
          showMessage('Lokasi berhasil diperbarui', 'success');
          refreshUser();
        } catch (err: any) {
          showMessage(err.message || 'Gagal menyimpan lokasi', 'error');
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        setLocLoading(false);
        showMessage('Akses lokasi ditolak. Silakan izinkan lokasi di pengaturan browser.', 'error');
      }
    );
  };

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '40px 1rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>Pengaturan Profil</h1>
      
      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius)',
          marginBottom: '2rem',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Profile Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Informasi Dasar</h2>
          
          <form onSubmit={handleProfileSubmit}>
            <div className="flex gap-6 mb-6 flex-wrap">
              <div style={{ flex: '0 0 auto' }}>
                <div style={{ 
                  width: '100px', height: '100px', borderRadius: '50%', background: 'var(--input)', 
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : <span style={{ fontSize: '2.5rem' }}>👤</span>}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }} 
                  id="avatar-upload" 
                />
                <label htmlFor="avatar-upload" style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, display: 'block', textAlign: 'center' }}>
                  Ubah Foto
                </label>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nama Lengkap</label>
                  <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nomor Handphone (WhatsApp)</label>
                  <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="081234567890" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Asal Kampus</label>
                  <input type="text" className="input-field" value={asalKampus} onChange={e => setAsalKampus(e.target.value)} placeholder="Misal: UB Malang" />
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </div>

        {/* Location Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Lokasi Pengguna</h2>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Akses lokasi dibutuhkan agar kami dapat mencarikan barang yang dekat dengan posisi kamu (terutama di area kampusmu).
          </p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={updateLocation} className="btn" style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }} disabled={locLoading}>
              {locLoading ? 'Mendeteksi...' : '📍 Perbarui Lokasi Saya Sekarang'}
            </button>
            {user.latitude && user.longitude && (
              <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>✅ Lokasi sudah tersimpan</span>
            )}
          </div>
        </div>

        {/* Password Card */}
        {!user.google_id && (
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Keamanan</h2>
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Password Saat Ini</label>
                <input type="password" className="input-field" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Password Baru</label>
                <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Konfirmasi Password Baru</label>
                <input type="password" className="input-field" value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} required minLength={8} />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? 'Memproses...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
