'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'location'>('profile');
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
      router.push('/login');
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
          await fetchApi('/location', { method: 'PUT', body: JSON.stringify(payload) });
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

  if (authLoading) return <div className="p-8 text-center">Memuat profil...</div>;

  return (
    <div className="container" style={{ padding: '40px 1rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>Pengaturan Profil</h1>

      {message && (
        <div style={{
          padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          fontWeight: 600
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {['profile', 'password', 'location'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)}
            style={{ 
              padding: '1rem', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: 700, textTransform: 'capitalize',
              color: activeTab === tab ? 'var(--primary)' : 'inherit',
              borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--input)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                {avatarFile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={URL.createObjectURL(avatarFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:8000/storage/${avatarUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : '👤'}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Foto Profil</label>
                <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nama Lengkap</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>No. WhatsApp</label>
              <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="081234567890" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Asal Kampus</label>
              <input type="text" className="input-field" value={asalKampus} onChange={e => setAsalKampus(e.target.value)} placeholder="Contoh: UB, UM, Polinema" />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}>
              {loading ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Password Saat Ini</label>
              <input type="password" className="input-field" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Password Baru</label>
              <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Konfirmasi Password Baru</label>
              <input type="password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}>
              {loading ? 'Menyimpan...' : 'Ubah Password'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'location' && (
        <div className="card" style={{ padding: '2rem' }}>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Sinkronkan lokasi Anda saat ini agar pembeli/penjual di sekitar bisa lebih mudah menemukan barang Anda melalui fitur pencarian jarak terdekat (Geolocation Haversine).
          </p>

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', background: 'var(--input)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, opacity: 0.7 }}>Latitude</span>
              <span style={{ fontWeight: 800 }}>{locData.lat || 'Belum diatur'}</span>
            </div>
            <div style={{ padding: '1rem', background: 'var(--input)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, opacity: 0.7 }}>Longitude</span>
              <span style={{ fontWeight: 800 }}>{locData.lng || 'Belum diatur'}</span>
            </div>
          </div>

          <button onClick={handleUpdateLocation} className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📍 {loading ? 'Menyinkronkan...' : 'Sinkronkan Lokasi Saat Ini'}
          </button>
        </div>
      )}
    </div>
  );
}
