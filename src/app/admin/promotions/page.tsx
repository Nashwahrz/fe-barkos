'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminPromotions() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewBanner, setPreviewBanner] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
        router.push('/');
      } else {
        loadPromotions();
      }
    }
  }, [user, authLoading, router]);

  async function loadPromotions() {
    try {
      const data = await fetchApi('/admin/promotions');
      setPromotions(data.data || []);
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || authLoading) return <div className="p-8 text-center">Memuat data promosi...</div>;

  const activeCount = promotions.filter(p => p.status === 'active' && new Date(p.end_at) > new Date()).length;
  const withAdCount = promotions.filter(p => p.ad_type && p.ad_type !== 'none').length;

  return (
    <div className="flex md-flex-col" style={{ minHeight: 'calc(100vh - 70px)', background: '#f8faf9' }}>
      <AdminSidebar currentPath="/admin/promotions" />

      <main style={{ flex: 1, padding: '2.5rem' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <header style={{ marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.6rem', color: '#111827' }}>📊 Monitor Promosi</h1>
            <p style={{ opacity: 0.7, fontSize: '1rem' }}>Pantau distribusi paket promosi, iklan gambar/video, dan efektivitas fitur boost di marketplace.</p>
          </header>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {[
              { label: 'Total Transaksi', value: promotions.length, color: 'var(--primary)', icon: '📈' },
              { label: 'Promosi Aktif', value: activeCount, color: '#16a34a', icon: '🔥' },
              { label: 'Dengan Iklan', value: withAdCount, color: '#7c3aed', icon: '🎬' },
              { label: 'Total Pendapatan', value: `Rp ${promotions.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0).toLocaleString('id-ID')}`, color: '#111827', icon: '💰' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ fontSize: '2.5rem' }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.5, marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'white' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>Daftar Pembelian Promosi</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '1rem 1.5rem' }}>Produk</th>
                    <th style={{ padding: '1rem' }}>Penjual</th>
                    <th style={{ padding: '1rem' }}>Paket</th>
                    <th style={{ padding: '1rem' }}>Biaya</th>
                    <th style={{ padding: '1rem' }}>Iklan</th>
                    <th style={{ padding: '1rem' }}>Berakhir</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.9rem' }}>
                  {promotions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af', fontWeight: 500 }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Empty</div>
                        Belum ada data promosi yang tercatat.
                      </td>
                    </tr>
                  ) : promotions.map(promo => {
                    const isActive = promo.status === 'active' && new Date(promo.end_at) > new Date();
                    const hasAd = promo.ad_type && promo.ad_type !== 'none' && promo.ad_media_url;
                    return (
                      <tr key={promo.id} style={{ borderBottom: '1px solid var(--border)', background: 'white' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ fontWeight: 800, color: '#111827' }}>{promo.product?.nama_barang || '-'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: #{promo.product_id}</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#4b5563', fontWeight: 500 }}>
                          {promo.product?.user?.name || '-'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                            {promo.package?.name || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#111827' }}>
                          Rp {Number(promo.amount_paid || 0).toLocaleString('id-ID')}
                        </td>
                        {/* Iklan column */}
                        <td style={{ padding: '1rem' }}>
                          {hasAd ? (
                            <button
                              onClick={() => setPreviewBanner(promo)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: promo.ad_type === 'video' ? 'rgba(109, 40, 217, 0.08)' : 'rgba(37, 99, 235, 0.08)',
                                color: promo.ad_type === 'video' ? '#7c3aed' : '#2563eb',
                                fontWeight: 700, fontSize: '0.75rem'
                              }}
                            >
                              {promo.ad_type === 'video' ? '🎬' : '🖼️'}
                              {promo.ad_type === 'video' ? 'Video' : 'Gambar'}
                            </button>
                          ) : (
                            <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                          {new Date(promo.end_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {isActive ? (
                            <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', fontWeight: 900, fontSize: '0.7rem' }}>
                              🔥 AKTIF
                            </span>
                          ) : (
                            <span style={{ padding: '5px 12px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280', fontWeight: 800, fontSize: '0.7rem' }}>
                              EXPIRED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal Preview Iklan ── */}
      {previewBanner && (
        <div
          onClick={() => setPreviewBanner(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', maxWidth: '600px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
          >
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
                  {previewBanner.ad_type === 'video' ? '🎬 Preview Iklan Video' : '🖼️ Preview Iklan Gambar'}
                </div>
                {previewBanner.ad_title && (
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>"{previewBanner.ad_title}"</div>
                )}
              </div>
              <button
                onClick={() => setPreviewBanner(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#6b7280', lineHeight: 1 }}
              >×</button>
            </div>

            <div style={{ background: '#000' }}>
              {previewBanner.ad_type === 'video' ? (
                <video
                  src={previewBanner.ad_media_url}
                  controls autoPlay muted
                  style={{ width: '100%', maxHeight: '340px', display: 'block', objectFit: 'contain' }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewBanner.ad_media_url}
                  alt={previewBanner.ad_title || 'iklan'}
                  style={{ width: '100%', maxHeight: '340px', display: 'block', objectFit: 'contain' }}
                />
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', fontSize: '0.8rem', color: '#6b7280' }}>
              <strong>Produk:</strong> {previewBanner.product?.nama_barang || '-'} &nbsp;|&nbsp;
              <strong>Penjual:</strong> {previewBanner.product?.user?.name || '-'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
