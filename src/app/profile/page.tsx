'use client';

import { useState, useEffect } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';
import BankAccountsTab from './BankAccountsTab';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'location' | 'rekening'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Form Profile
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [asalKampus, setAsalKampus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Form Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Location
  const [locData, setLocData] = useState({ lat: '', lng: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAsalKampus(user.asal_kampus || '');
      setAvatarUrl(user.avatar || '');
      setLocData({ lat: user.latitude?.toString() || '', lng: user.longitude?.toString() || '' });
    }
  }, [user, authLoading, router]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('_method', 'PUT'); // For Laravel form spoofing
      formData.append('name', name);
      if (phone) formData.append('phone', phone);
      if (asalKampus) formData.append('asal_kampus', asalKampus);
      if (avatarFile) formData.append('avatar', avatarFile);

      await fetchApi('/profile', {
        method: 'POST', // Sent as POST with _method PUT because of FormData
        body: formData,
      });
      
      await refreshUser(); // Refresh user state
      showMessage('Profil berhasil diperbarui', 'success');
      setAvatarFile(null);
    } catch (err: any) {
      showMessage(err.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return showMessage('Password baru tidak cocok', 'error');
    }
    setLoading(true);
    try {
      await fetchApi('/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword })
      });
      showMessage('Password berhasil diubah', 'success');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      showMessage(err.message || 'Gagal mengubah password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      return showMessage('Geolocation tidak didukung oleh browser ini', 'error');
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const payload = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          await fetchApi('/location', { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) 
          });
          setLocData({ lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() });
          await refreshUser();
          showMessage('Lokasi berhasil disinkronkan', 'success');
        } catch (err) {
          showMessage('Gagal menyimpan lokasi ke server', 'error');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        showMessage('Gagal mendapatkan lokasi: ' + err.message, 'error');
        setLoading(false);
      }
    );
  };

  if (authLoading) return (
    <div style={{ padding: '80px 0', textAlign: 'center', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--foreground)' }}>
      <Icons.Loader size={32} />
      Memuat profil...
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '140px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Pengaturan Profil</h1>

      {message && (
        <div style={{
          padding: '1rem', borderRadius: '12px', marginBottom: '2rem',
          background: message.type === 'success' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${message.type === 'success' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
          fontWeight: 500, fontSize: '0.95rem'
        }}>
          {message.text}
        </div>
      )}

      {/* Quick Links */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '2.5rem' }}>
        <button onClick={() => router.push('/orders')} className="card" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)', background: 'var(--card)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.ShoppingBag size={24} />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>Pesanan Saya</span>
        </button>
        <button onClick={() => router.push('/offers')} className="card" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)', background: 'var(--card)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Zap size={24} />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>Penawaran Saya</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'profile', label: 'Profil' },
          { id: 'password', label: 'Password' },
          { id: 'location', label: 'Lokasi' },
          ...(user?.role === USER_ROLES.PENJUAL ? [{ id: 'rekening', label: 'Rekening' }] : [])
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)}
            style={{ 
              padding: '0.75rem 0', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--foreground)',
              opacity: activeTab === tab.id ? 1 : 0.6,
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--input)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '1px solid var(--border)' }}>
                {avatarFile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={URL.createObjectURL(avatarFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getStorageUrl(avatarUrl) || ''} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : <Icons.User size={32} color="var(--foreground)" opacity={0.3} />}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Foto Profil</label>
                <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} style={{ fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.8, maxWidth: '100%' }} />
              </div>
            </div>

            <Input type="text" label="Nama Lengkap" value={name} onChange={e => setName(e.target.value)} required />
            <Input type="text" label="No. WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} placeholder="081234567890" />
            <Input type="text" label="Asal Kampus" value={asalKampus} onChange={e => setAsalKampus(e.target.value)} placeholder="Contoh: UB, UM, Polinema" />

            <div style={{ marginTop: '1rem' }}>
              <Button type="submit" variant="primary" size="lg" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Profil'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Input type="password" label="Password Saat Ini" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            <Input type="password" label="Password Baru" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <Input type="password" label="Konfirmasi Password Baru" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            <div style={{ marginTop: '1rem' }}>
              <Button type="submit" variant="primary" size="lg" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Ubah Password'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'location' && (
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ color: 'var(--foreground)', opacity: 0.7, marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Sinkronkan lokasi Anda saat ini agar pembeli/penjual di sekitar bisa lebih mudah menemukan barang Anda melalui fitur pencarian jarak terdekat.
          </p>

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ padding: '1rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--foreground)', opacity: 0.6, fontSize: '0.9rem' }}>Latitude</span>
              <span style={{ fontWeight: 700, color: 'var(--foreground)', fontFamily: 'monospace', fontSize: '1rem' }}>{locData.lat || 'Belum diatur'}</span>
            </div>
            <div style={{ padding: '1rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--foreground)', opacity: 0.6, fontSize: '0.9rem' }}>Longitude</span>
              <span style={{ fontWeight: 700, color: 'var(--foreground)', fontFamily: 'monospace', fontSize: '1rem' }}>{locData.lng || 'Belum diatur'}</span>
            </div>
          </div>

          <Button onClick={handleUpdateLocation} variant="primary" size="lg" disabled={loading}>
            <Icons.Compass size={18} /> {loading ? 'Menyinkronkan...' : 'Sinkronkan Lokasi Saat Ini'}
          </Button>
        </div>
      )}

      {activeTab === 'rekening' && (
        <BankAccountsTab />
      )}
    </div>
  );
}
