'use client';

import { useState, useEffect } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { USER_ROLES } from '@/lib/constants';
import AdminSidebar from '@/components/AdminSidebar';
import { Icons } from '@/components/Icons';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Pagination } from '@/components/Pagination';

export default function AdminPromotions() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewBanner, setPreviewBanner] = useState<any | null>(null);

  const {
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, paginatedData, totalItems
  } = useTablePagination(promotions, ['product.nama_barang', 'product.user.name', 'package.name', 'product_id'], 10);

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

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat data promosi...</div>
    </div>
  );

  const activeCount = promotions.filter(p => p.status === 'active' && new Date(p.end_at) > new Date()).length;
  const withAdCount = promotions.filter(p => p.ad_type && p.ad_type !== 'none').length;
  const totalRevenue = promotions.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);

  return (
    <div className="flex md-flex-col" style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--background)' }}>
      <AdminSidebar currentPath="/admin/promotions" />

      <main className="page-padding" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <header className="admin-header-flex" style={{ marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Monitor Promosi</h1>
            <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '1.05rem' }}>Pantau distribusi paket promosi, iklan gambar/video, dan efektivitas fitur boost.</p>
            <div style={{ marginTop: '1rem' }}>
              <Link href="/admin/promotions/packages" style={{
                background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '8px', 
                fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <Icons.Tag size={18} /> Kelola Paket Promosi
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Icons.Search size={16} color="var(--foreground)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input 
                type="text" 
                placeholder="Cari promosi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
              Total: {totalItems} Promosi
            </div>
          </div>
        </header>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {[
            { label: 'Total Transaksi', value: promotions.length, color: 'var(--primary)', icon: <Icons.Activity size={24} color="var(--primary)" />, bg: 'var(--primary-light)' },
            { label: 'Promosi Aktif', value: activeCount, color: 'var(--success)', icon: <Icons.CheckCircle size={24} color="var(--success)" />, bg: 'rgba(16, 185, 129, 0.1)' },
            { label: 'Dengan Iklan', value: withAdCount, color: 'var(--accent)', icon: <Icons.Image size={24} color="var(--accent)" />, bg: 'rgba(139, 92, 246, 0.1)' },
            { label: 'Total Pendapatan', value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, color: 'var(--foreground)', icon: <Icons.DollarSign size={24} color="var(--foreground)" />, bg: 'var(--input)' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color, lineHeight: 1.2 }}>{stat.value}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.6, marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--foreground)' }}>Daftar Pembelian Promosi</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
              <thead style={{ background: 'var(--input)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>PRODUK</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>PENJUAL</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>PAKET</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>BIAYA</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>IKLAN</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>BERAKHIR</th>
                  <th style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>STATUS</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.95rem' }}>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5 }}>
                      <Icons.Inbox size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Tidak ada promosi ditemukan.</div>
                    </td>
                  </tr>
                ) : paginatedData.map(promo => {
                  const isActive = promo.status === 'active' && new Date(promo.end_at) > new Date();
                  const hasAd = promo.ad_type && promo.ad_type !== 'none' && promo.ad_media_url;
                  return (
                    <tr key={promo.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-bg-input">
                      <td style={{ padding: '1.25rem 2rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)' }}>{promo.product?.nama_barang || '-'}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6 }}>ID: #{promo.product_id}</div>
                      </td>
                      <td style={{ padding: '1.25rem', color: 'var(--foreground)', fontWeight: 500 }}>
                        {promo.product?.user?.name || '-'}
                      </td>
                      <td style={{ padding: '1.25rem' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                          {promo.package?.name || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem', fontWeight: 800, color: 'var(--foreground)' }}>
                        Rp {Number(promo.amount_paid || 0).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '1.25rem' }}>
                        {hasAd ? (
                          <button
                            onClick={() => setPreviewBanner(promo)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '8px 12px', borderRadius: '8px', border: `1px solid ${promo.ad_type === 'video' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`, cursor: 'pointer',
                              background: promo.ad_type === 'video' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              color: promo.ad_type === 'video' ? 'var(--accent)' : '#2563eb',
                              fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s'
                            }}
                          >
                            {promo.ad_type === 'video' ? <Icons.Film size={14} /> : <Icons.Image size={14} />}
                            {promo.ad_type === 'video' ? 'Video' : 'Gambar'}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--foreground)', opacity: 0.3, fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem', color: 'var(--foreground)', opacity: 0.7, fontSize: '0.9rem', fontWeight: 500 }}>
                        {new Date(promo.end_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '1.25rem 2rem' }}>
                        {promo.payment_status === 'pending' ? (
                          <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontWeight: 700, fontSize: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'inline-flex' }}>
                            PENDING
                          </span>
                        ) : promo.payment_status === 'failed' ? (
                          <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex' }}>
                            GAGAL
                          </span>
                        ) : isActive ? (
                          <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontWeight: 700, fontSize: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Icons.CheckCircle size={12} /> AKTIF
                          </span>
                        ) : (
                          <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--input)', color: 'var(--foreground)', opacity: 0.7, fontWeight: 700, fontSize: '0.75rem', border: '1px solid var(--border)' }}>
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
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </main>

      {/* ── Modal Preview Iklan ── */}
      {previewBanner && (
        <div
          onClick={() => setPreviewBanner(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--card)', borderRadius: '24px', overflow: 'hidden', maxWidth: '600px', width: '100%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {previewBanner.ad_type === 'video' ? <Icons.Film size={20} /> : <Icons.Image size={20} />}
                  Preview Iklan {previewBanner.ad_type === 'video' ? 'Video' : 'Gambar'}
                </div>
                {previewBanner.ad_title && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.6, marginTop: '4px' }}>"{previewBanner.ad_title}"</div>
                )}
              </div>
              <button
                onClick={() => setPreviewBanner(null)}
                style={{ background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ><Icons.X size={18} /></button>
            </div>

            <div style={{ background: 'var(--input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewBanner.ad_type === 'video' ? (
                <video
                  src={getStorageUrl(previewBanner.ad_media_url) || ''}
                  controls muted
                  ref={el => {
                    if (el) {
                      const p = el.play();
                      if (p !== undefined) p.catch(() => {});
                    }
                  }}
                  style={{ width: '100%', maxHeight: '400px', display: 'block', objectFit: 'contain' }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getStorageUrl(previewBanner.ad_media_url) || ''}
                  alt={previewBanner.ad_title || 'iklan'}
                  style={{ width: '100%', maxHeight: '400px', display: 'block', objectFit: 'contain' }}
                />
              )}
            </div>

            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--card)', fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.8, display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div><strong style={{ opacity: 0.6 }}>Produk:</strong> {previewBanner.product?.nama_barang || '-'}</div>
              <div><strong style={{ opacity: 0.6 }}>Penjual:</strong> {previewBanner.product?.user?.name || '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
