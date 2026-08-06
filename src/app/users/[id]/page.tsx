'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await userApi.getPublicProfile(Number(userId));
        setProfile(res.data);
      } catch (err) {
        console.error('Gagal memuat profil pengguna:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 65px)', color: 'var(--muted-foreground)' }}>
        <Icons.Loader size={28} />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 65px)', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
        <Icons.User size={48} color="var(--muted-foreground)" />
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--foreground)' }}>Pengguna tidak ditemukan</div>
        <button onClick={() => router.back()} className="btn btn-secondary">Kembali</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
      <button
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0 }}
      >
        <Icons.ArrowLeft size={18} /> Kembali
      </button>

      <div className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '20px' }}>
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
      </div>
    </div>
  );
}
