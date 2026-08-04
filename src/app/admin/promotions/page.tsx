'use client';

import { useState, useEffect } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { USER_ROLES } from '@/lib/constants';
import AdminLayout from '@/components/AdminLayout';
import { Icons } from '@/components/Icons';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';

interface Promotion {
  id: string | number;
  product_id: number;
  status: string;
  end_at: string;
  amount_paid?: number;
  payment_method: string;
  payment_status: string;
  ad_type?: string | null;
  ad_media_url?: string | null;
  manual_proof_path?: string | null;
  product?: { nama_barang?: string };
  package?: { name?: string };
  seller?: { name?: string };
}

export default function AdminPromotions() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewBanner, setPreviewBanner] = useState<any | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number } | null>(null);
  const [previewProof, setPreviewProof] = useState<any | null>(null);
  const [reviewLoadingId, setReviewLoadingId] = useState<string | number | null>(null);

  const {
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, paginatedData, totalItems
  } = useTablePagination(promotions, ['product.nama_barang', 'seller.name', 'package.name', 'product_id'], 10);

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

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus promosi ini? Produk akan kembali ke status normal.')) return;
    try {
      await fetchApi(`/admin/promotions/${id}`, { method: 'DELETE' });
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Gagal menghapus promosi:', err);
      alert('Gagal menghapus promosi');
    }
  }

  async function handleApprovePayment(id: string | number) {
    if (!confirm('Setujui pembayaran transfer manual ini? Promosi akan langsung diaktifkan.')) return;
    setReviewLoadingId(id);
    try {
      await fetchApi(`/admin/promotions/${id}/approve-payment`, { method: 'PATCH' });
      await loadPromotions();
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui pembayaran');
    } finally {
      setReviewLoadingId(null);
    }
  }

  async function handleRejectPayment(id: string | number) {
    if (!confirm('Tolak bukti transfer ini?')) return;
    setReviewLoadingId(id);
    try {
      await fetchApi(`/admin/promotions/${id}/reject-payment`, { method: 'PATCH' });
      await loadPromotions();
    } catch (err: any) {
      alert(err.message || 'Gagal menolak pembayaran');
    } finally {
      setReviewLoadingId(null);
    }
  }

  if (authLoading) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat data promosi...</div>
    </div>
  );

  const activeCount = promotions.filter(p => p.status === 'active' && new Date(p.end_at) > new Date()).length;
  const withAdCount = promotions.filter(p => p.ad_type && p.ad_type !== 'none').length;
  const totalRevenue = promotions.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);

  const columns: DataTableColumn<Promotion>[] = [
    {
      key: 'produk', header: 'Produk', render: promo => (
        <div className="flex items-center gap-3">
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Package size={18} color="var(--muted-foreground)" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--foreground)' }}>{promo.product?.nama_barang || '-'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>ID: #{promo.product_id}</div>
          </div>
        </div>
      ),
    },
    { key: 'penjual', header: 'Penjual', render: promo => <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{promo.seller?.name || '-'}</span> },
    {
      key: 'paket', header: 'Paket', render: promo => (
        <Badge tone="primary">{promo.package?.name || '-'}</Badge>
      ),
    },
    { key: 'biaya', header: 'Biaya', render: promo => <span style={{ fontWeight: 800, color: 'var(--foreground)' }}>Rp {Number(promo.amount_paid || 0).toLocaleString('id-ID')}</span> },
    {
      key: 'metode', header: 'Metode', render: promo => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          {promo.payment_method === 'manual_transfer' ? (
            <Badge tone="warning">Transfer Manual</Badge>
          ) : (
            <Badge tone="neutral">Midtrans</Badge>
          )}
          {promo.payment_method === 'manual_transfer' && promo.manual_proof_path && (
            <button
              onClick={() => setPreviewProof(promo)}
              style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Icons.Eye size={12} /> Lihat Bukti
            </button>
          )}
          {promo.payment_method === 'manual_transfer' && promo.payment_status === 'pending' && promo.manual_proof_path && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleApprovePayment(promo.id)}
                disabled={reviewLoadingId === promo.id}
                style={{ fontSize: '0.72rem', background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)', border: '1px solid rgba(5, 150, 105, 0.2)', padding: '4px 10px', borderRadius: '7px', cursor: 'pointer', fontWeight: 700 }}
              >
                Setujui
              </button>
              <button
                onClick={() => handleRejectPayment(promo.id)}
                disabled={reviewLoadingId === promo.id}
                style={{ fontSize: '0.72rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', border: '1px solid rgba(220, 38, 38, 0.2)', padding: '4px 10px', borderRadius: '7px', cursor: 'pointer', fontWeight: 700 }}
              >
                Tolak
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'iklan', header: 'Iklan', render: promo => {
        const hasAd = promo.ad_type && promo.ad_type !== 'none' && promo.ad_media_url;
        return hasAd ? (
          <button
            onClick={() => { setPreviewDimensions(null); setPreviewBanner(promo); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 13px', borderRadius: '999px', border: `1px solid ${promo.ad_type === 'video' ? 'rgba(20, 184, 166, 0.25)' : 'rgba(37, 99, 235, 0.2)'}`, cursor: 'pointer',
              background: promo.ad_type === 'video' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(37, 99, 235, 0.08)',
              color: promo.ad_type === 'video' ? 'var(--accent)' : '#2563eb',
              fontWeight: 700, fontSize: '0.78rem', transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {promo.ad_type === 'video' ? <Icons.Film size={13} /> : <Icons.Image size={13} />}
            {promo.ad_type === 'video' ? 'Video' : 'Gambar'}
          </button>
        ) : (
          <span style={{ color: 'var(--muted-foreground)', opacity: 0.5, fontSize: '0.85rem' }}>—</span>
        );
      },
    },
    {
      key: 'berakhir', header: 'Berakhir', render: promo => (
        <span style={{ color: 'var(--foreground)', opacity: 0.75, fontSize: '0.88rem', fontWeight: 500 }}>
          {new Date(promo.end_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status', render: promo => {
        const isActive = promo.status === 'active' && new Date(promo.end_at) > new Date();
        return promo.payment_status === 'pending' ? (
          <Badge tone="warning">Pending</Badge>
        ) : promo.payment_status === 'failed' ? (
          <Badge tone="danger">Gagal</Badge>
        ) : isActive ? (
          <Badge tone="success" icon={<Icons.CheckCircle size={12} />}>Aktif</Badge>
        ) : (
          <Badge tone="neutral">Expired</Badge>
        );
      },
    },
    {
      key: 'aksi', header: 'Aksi', align: 'right', render: promo => (
        <button
          onClick={() => handleDelete(promo.id as string)}
          style={{
            background: 'rgba(220, 38, 38, 0.08)', color: 'var(--danger)', border: '1px solid rgba(220, 38, 38, 0.15)',
            padding: '8px', borderRadius: '9px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.16)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)'}
          title="Hapus Promosi"
        >
          <Icons.Trash size={16} />
        </button>
      ),
    },
  ];

  return (
    <AdminLayout currentPath="/admin/promotions">
        <header style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: '1 1 auto', minWidth: '260px' }}>
              <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Monitor Promosi</h1>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', margin: 0 }}>Pantau distribusi paket promosi, iklan gambar/video, dan efektivitas fitur boost.</p>
            </div>
            <Link href="/admin/promotions/packages" style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white', padding: '11px 22px', borderRadius: '12px',
              fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '0.9rem', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: 'var(--shadow-brand)', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Icons.Tag size={18} /> Kelola Paket Promosi
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '14px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Icons.Search size={16} color="var(--muted-foreground)" />
              </div>
              <input
                type="text"
                placeholder="Cari promosi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.65rem 1rem 0.65rem 2.6rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem', margin: 0, transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.65rem 1.1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
              <Icons.Tag size={14} color="var(--primary)" />
              {totalItems} Promosi
            </div>
          </div>
        </header>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '2.75rem' }}>
          {[
            { label: 'Total Transaksi', value: promotions.length, color: 'var(--primary)', icon: <Icons.Activity size={22} color="var(--primary)" />, bg: 'var(--primary-light)' },
            { label: 'Promosi Aktif', value: activeCount, color: 'var(--success)', icon: <Icons.CheckCircle size={22} color="var(--success)" />, bg: 'rgba(5, 150, 105, 0.1)' },
            { label: 'Dengan Iklan', value: withAdCount, color: 'var(--accent)', icon: <Icons.Image size={22} color="var(--accent)" />, bg: 'rgba(20, 184, 166, 0.1)' },
            { label: 'Total Pendapatan', value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, color: 'var(--foreground)', icon: <Icons.DollarSign size={22} color="var(--foreground)" />, bg: 'var(--input)' },
          ].map(stat => (
            <div
              key={stat.label}
              className="card promo-stat-card"
              style={{
                position: 'relative', padding: '1.4rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.1rem',
                border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '18px', overflow: 'hidden',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease', boxShadow: 'var(--shadow-sm)', minWidth: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: stat.color, opacity: 0.7 }} />
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {stat.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: stat.color, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{stat.value}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted-foreground)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <div style={{ padding: '1.4rem 1.75rem', borderBottom: '1px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icons.List size={18} color="var(--muted-foreground)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--foreground)', margin: 0 }}>Daftar Pembelian Promosi</h3>
          </div>
          <DataTable<Promotion>
            columns={columns}
            data={paginatedData}
            keyExtractor={promo => promo.id}
            loading={loading}
            emptyMessage="Tidak ada promosi ditemukan."
          />
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>

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

            <div style={{ background: 'var(--input)', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '70vh', overflow: 'auto' }}>
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
                  onLoadedMetadata={e => setPreviewDimensions({ width: e.currentTarget.videoWidth, height: e.currentTarget.videoHeight })}
                  style={{ maxWidth: '100%', display: 'block' }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getStorageUrl(previewBanner.ad_media_url) || ''}
                  alt={previewBanner.ad_title || 'iklan'}
                  onLoad={e => setPreviewDimensions({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
                  style={{ maxWidth: '100%', display: 'block' }}
                />
              )}
            </div>

            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--card)', fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.8, display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div><strong style={{ opacity: 0.6 }}>Produk:</strong> {previewBanner.product?.nama_barang || '-'}</div>
              <div><strong style={{ opacity: 0.6 }}>Penjual:</strong> {previewBanner.seller?.name || '-'}</div>
              <div>
                <strong style={{ opacity: 0.6 }}>Ukuran Asli:</strong>{' '}
                {previewDimensions ? `${previewDimensions.width} × ${previewDimensions.height} px` : 'Memuat...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Preview Bukti Transfer ── */}
      {previewProof && (
        <div
          onClick={() => setPreviewProof(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--card)', borderRadius: '24px', overflow: 'hidden', maxWidth: '480px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--foreground)' }}>Bukti Transfer Manual</div>
              <button
                onClick={() => setPreviewProof(null)}
                style={{ background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              ><Icons.X size={18} /></button>
            </div>

            <div style={{ background: 'var(--input)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', flex: '1 1 auto', minHeight: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getStorageUrl(previewProof.manual_proof_path) || ''}
                alt="Bukti transfer"
                style={{ maxWidth: '100%', display: 'block', objectFit: 'contain' }}
              />
            </div>

            <div style={{ padding: '1.1rem 1.5rem', background: 'var(--card)', fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, maxHeight: '35vh', overflowY: 'auto' }}>
              <div><strong style={{ opacity: 0.6 }}>Produk:</strong> {previewProof.product?.nama_barang || '-'}</div>
              <div><strong style={{ opacity: 0.6 }}>Penjual:</strong> {previewProof.seller?.name || '-'}</div>
              <div><strong style={{ opacity: 0.6 }}>Nominal:</strong> Rp {Number(previewProof.amount_paid || 0).toLocaleString('id-ID')}</div>
              {previewProof.ocr_note && (
                <div style={{ marginTop: '4px', padding: '0.75rem', background: 'var(--input)', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <strong style={{ opacity: 0.6 }}>Hasil OCR:</strong> {previewProof.ocr_note.startsWith('[MATCH]') ? '✅ Nominal cocok' : previewProof.ocr_note.startsWith('[GAGAL DICEK]') ? '⚠️ Gagal diperiksa otomatis' : '❌ Nominal tidak cocok otomatis'}
                  <div style={{ marginTop: '4px', opacity: 0.7, fontStyle: 'italic', maxHeight: '80px', overflowY: 'auto' }}>{previewProof.ocr_note.replace(/^\[.*?\]\s*/, '')}</div>
                </div>
              )}
              {previewProof.payment_status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <Button variant="primary" onClick={() => { handleApprovePayment(previewProof.id); setPreviewProof(null); }}>Setujui</Button>
                  <Button variant="secondary" onClick={() => { handleRejectPayment(previewProof.id); setPreviewProof(null); }}>Tolak</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
