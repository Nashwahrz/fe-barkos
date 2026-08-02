'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Pagination } from '@/components/Pagination';
import { Skeleton } from '@/components/Skeleton';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const {
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, paginatedData, totalItems
  } = useTablePagination(reports, ['reason', 'reporter.name', 'description', 'product.nama_barang'], 10);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const data = await fetchApi('/reports');
      setReports(data.data);
    } catch (err) {
      console.error('Gagal mengambil data laporan:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    try {
      await fetchApi(`/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' },
      });
      await loadReports();
    } catch (err) {
      alert('Gagal memperbarui status laporan.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <AdminLayout currentPath="/admin/reports">
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: '1 1 auto', minWidth: '300px' }}>
            <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Pelaporan</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', margin: 0 }}>Kelola semua pelaporan produk dan pengguna yang bermasalah.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', flex: '0 0 auto' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Icons.Search size={16} color="var(--foreground)" style={{ opacity: 0.5 }} />
              </div>
              <input 
                type="text" 
                placeholder="Cari laporan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem', margin: 0 }}
              />
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
              Total: {totalItems} Laporan
            </div>
            <Button onClick={loadReports} variant="secondary" style={{ padding: '0.6rem 1rem', height: 'auto' }}>
              <Icons.RefreshCw size={16} />
            </Button>
          </div>
        </header>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '20px', padding: '2rem' }}>
              <div className="flex gap-4 items-center">
                <Skeleton width="48px" height="48px" borderRadius="12px" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="40%" height="1.2rem" style={{ marginBottom: '8px' }} />
                  <Skeleton width="60%" height="0.85rem" />
                </div>
              </div>
              <Skeleton width="100%" height="4rem" borderRadius="12px" />
            </div>
          ))}

          {!loading && paginatedData.map((report) => (
            <div key={report.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '20px', padding: '2rem' }}>
              <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="flex gap-4">
                  <div style={{ width: '48px', height: '48px', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icons.Flag size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.35rem', color: 'var(--foreground)' }}>{report.reason}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.6 }}>
                      Oleh <strong style={{ color: 'var(--foreground)', fontWeight: 700 }}>{report.reporter?.name}</strong> &bull; Pelaporan pada {new Date(report.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status:</label>
                  <select 
                    value={report.status} 
                    onChange={(e) => updateStatus(report.id, e.target.value)}
                    disabled={updating === report.id}
                    style={{ 
                      padding: '8px 32px 8px 16px', 
                      borderRadius: '10px', 
                      border: `1px solid ${
                        report.status === 'pending' ? 'rgba(220, 38, 38, 0.3)' : 
                        report.status === 'investigated' ? 'rgba(245, 158, 11, 0.3)' : 
                        report.status === 'resolved' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'
                      }`,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      background: updating === report.id ? 'var(--input)' : 'var(--card)',
                      color: report.status === 'pending' ? 'var(--danger)' : 
                             report.status === 'investigated' ? 'var(--warning)' : 
                             report.status === 'resolved' ? 'var(--success)' : 'var(--foreground)',
                      cursor: updating === report.id ? 'not-allowed' : 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="pending">PENDING</option>
                    <option value="investigated">DALAM PROSES</option>
                    <option value="resolved">SELESAI</option>
                    <option value="dismissed">DITOLAK</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--input)', padding: '1.5rem', borderRadius: '12px', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detail Laporan:</div>
                <div style={{ opacity: 0.9 }}>
                  {report.description || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Tidak ada deskripsi tambahan.</span>}
                </div>
              </div>

              {report.product && (
                <div className="flex items-center gap-4" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--card)' }}>
                  <div style={{ width: '64px', height: '64px', background: 'var(--input)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                     {report.product.foto ? (
                       // eslint-disable-next-line @next/next/no-img-element
                       <img src={getStorageUrl(report.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     ) : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><Icons.Image size={24} color="var(--border)" /></div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Produk yang dilaporkan</div>
                    <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '1.1rem' }}>{report.product.nama_barang}</div>
                  </div>
                  <Button href={`/admin/products/${report.product.id}`} variant="secondary" size="md">
                    Lihat Produk <Icons.ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {!loading && paginatedData.length === 0 && (
            <div className="card" style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5, border: '1px dashed var(--border)', borderRadius: '20px' }}>
              <Icons.CheckCircle size={40} style={{ margin: '0 auto 1.5rem', color: 'var(--success)' }} />
              <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>Semua aman!</div>
              <div style={{ fontSize: '1.05rem' }}>Tidak ada laporan yang ditemukan.</div>
            </div>
          )}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </AdminLayout>
  );
}
