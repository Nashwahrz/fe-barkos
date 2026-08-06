'use client';

import { useState, useEffect } from 'react';
import { getStorageUrl } from '@/lib/api';
import { userApi } from '@/services/api/user.api';
import { PublicProfile } from '@/types/user';
import { Icons } from '@/components/Icons';
import { Badge } from '@/components/ui/Badge';

const ROLE_LABEL: Record<string, string> = {
  penjual: 'Penjual',
  pembeli: 'Pembeli',
  super_admin: 'Admin',
};

function formatLastSeen(lastActiveAt?: string | null): string {
  if (!lastActiveAt) return 'Belum pernah aktif';
  const diffMs = Date.now() - new Date(lastActiveAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja aktif';
  if (diffMin < 60) return `Aktif ${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `Aktif ${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `Aktif ${diffDay} hari lalu`;
}

export default function UserProfileModal({ userId, onClose }: { userId: number | string; onClose: () => void }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setProfile(null);

    (async () => {
      try {
        const res = await userApi.getPublicProfile(Number(userId));
        if (!cancelled) setProfile(res.data);
      } catch (err) {
        console.error('Gagal memuat profil pengguna:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem', overflowY: 'auto',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '380px', padding: '2rem 1.5rem', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '20px', position: 'relative', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', background: 'var(--card)' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--input)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icons.X size={16} />
        </button>

        {loading ? (
          <div style={{ padding: '3rem 0', display: 'flex', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
            <Icons.Loader size={28} />
          </div>
        ) : notFound || !profile ? (
          <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Icons.User size={40} color="var(--muted-foreground)" />
            <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>Pengguna tidak ditemukan</div>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', width: '84px', height: '84px', margin: '0 auto 1rem' }}>
              <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '2rem', overflow: 'hidden' }}>
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getStorageUrl(profile.avatar) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              {profile.is_online && (
                <span style={{ position: 'absolute', bottom: '4px', right: '4px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--success)', border: '3px solid var(--card)' }} />
              )}
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--foreground)', marginBottom: '0.4rem' }}>{profile.name}</div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <Badge tone="primary">{ROLE_LABEL[profile.role] || profile.role}</Badge>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', marginBottom: '0.3rem' }}>
              {profile.asal_kampus || 'Mahasiswa'}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: profile.is_online ? 'var(--success)' : 'var(--muted-foreground)' }}>
              {profile.is_online ? 'Online' : formatLastSeen(profile.last_active_at)}
            </div>

            {profile.created_at && (
              <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', opacity: 0.7, marginTop: '0.5rem' }}>
                Bergabung sejak {new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </div>
            )}

            {profile.role === 'penjual' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '1.75rem' }}>
                <div style={{ padding: '1rem', background: 'var(--input)', borderRadius: '14px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>{profile.activity.products_count}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Produk Aktif</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--input)', borderRadius: '14px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--success)' }}>{profile.activity.products_sold_count}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Terjual</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
