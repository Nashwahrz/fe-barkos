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
  product?: { nama_barang?: string; user?: { name?: string } };
  package?: { name?: string };
}

export default function AdminPromotions() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewBanner, setPreviewBanner] = useState<any | null>(null);
  const [previewProof, setPreviewProof] = useState<any | null>(null);
  const [reviewLoadingId, setReviewLoadingId] = useState<string | number | null>(null);

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
        <>
          <div style={{ fontWeight: 800, color: 'var(--foreground)' }}>{promo.product?.nama_barang || '-'}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6 }}>ID: #{promo.product_id}</div>
        </>
      ),
    },
    { key: 'penjual', header: 'Penjual', render: promo => <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{promo.product?.user?.name || '-'}</span> },
    {
      key: 'paket', header: 'Paket', render: promo => (
        <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
          {promo.package?.name || '-'}
        </span>
      ),
    },
    { key: 'biaya', header: 'Biaya', render: promo => <span style={{ fontWeight: 800, color: 'var(--foreground)' }}>Rp {Number(promo.amount_paid || 0).toLocaleString('id-ID')}</span> },
    {
      key: 'metode', header: 'Metode', render: promo => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
          <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, background: promo.payment_method === 'manual_transfer' ? 'rgba(217, 119, 6, 0.1)' : 'var(--input)', color: promo.payment_method === 'manual_transfer' ? '#d97706' : 'var(--foreground)' }}>
            {promo.payment_method === 'manual_transfer' ? 'Transfer Manual' : 'Midtrans'}
          </span>
          {promo.payment_method === 'manual_transfer' && promo.manual_proof_path && (
            <button
              onClick={() => setPreviewProof(promo)}
              style={{ fontSize: '0.7rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}
            >
              Lihat Bukti
            </button>
          )}
          {promo.payment_method === 'manual_transfer' && promo.payment_status === 'pending' && promo.manual_proof_path && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleApprovePayment(promo.id)}
                disabled={reviewLoadingId === promo.id}
                style={{ fontSize: '0.68rem', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
              >
                Setujui
              </button>
              <button
                onClick={() => handleRejectPayment(promo.id)}
                disabled={reviewLoadingId === promo.id}
                style={{ fontSize: '0.68rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
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
        );
      },
    },
    {
      key: 'berakhir', header: 'Berakhir', render: promo => (
        <span style={{ color: 'var(--foreground)', opacity: 0.7, fontSize: '0.9rem', fontWeight: 500 }}>
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
            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none',
            padding: '8px', borderRadius: '8px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          title="Hapus Promosi"
        >
          <Icons.Trash size={16} />
        </button>
      ),
    },
  ];

  return (
    <AdminLayout currentPath="/admin/promotions">
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: '1 1 auto', minWidth: '300px' }}>
            <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Monitor Promosi</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', margin: 0 }}>Pantau distribusi paket promosi, iklan gambar/video, dan efektivitas fitur boost.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-end', flex: '0 0 auto' }}>
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

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <Icons.Search size={16} color="var(--foreground)" style={{ opacity: 0.5 }} />
                </div>
                <input 
                  type="text" 
                  placeholder="Cari promosi..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem', margin: 0 }}
                />
              </div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
                Total: {totalItems} Promosi
              </div>
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
            style={{ background: 'var(--card)', borderRadius: '24px', overflow: 'hidden', maxWidth: '600px', width: '100%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--foreground)' }}>Bukti Transfer Manual</div>
              <button
                onClick={() => setPreviewProof(null)}
                style={{ background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ><Icons.X size={18} /></button>
            </div>

            <div style={{ background: 'var(--input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getStorageUrl(previewProof.manual_proof_path) || ''}
                alt="Bukti transfer"
                style={{ width: '100%', maxHeight: '450px', display: 'block', objectFit: 'contain' }}
              />
            </div>

            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--card)', fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong style={{ opacity: 0.6 }}>Produk:</strong> {previewProof.product?.nama_barang || '-'}</div>
              <div><strong style={{ opacity: 0.6 }}>Penjual:</strong> {previewProof.product?.user?.name || '-'}</div>
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
