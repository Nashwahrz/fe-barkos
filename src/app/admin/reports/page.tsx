'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Pagination } from '@/components/Pagination';
import { Skeleton } from '@/components/Skeleton';

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');
  const [reports, setReports] = useState<any[]>([]);
  const [violators, setViolators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const {
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, paginatedData, totalItems
  } = useTablePagination(activeTab === 'reports' ? reports : violators, 
    activeTab === 'reports' ? ['reason', 'reporter.name', 'description', 'product.nama_barang'] : ['name', 'email'], 
    10
  );

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    } else {
      loadViolators();
    }
  }, [activeTab]);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await fetchApi('/reports');
      setReports(data.data);
    } catch (err) {
      console.error('Gagal mengambil data laporan:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadViolators() {
    setLoading(true);
    try {
      const data = await fetchApi('/admin/frequent-violators');
      setViolators(data.data);
    } catch (err) {
      console.error('Gagal mengambil data pelanggar:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(user: any) {
    if (!confirm(`Yakin ingin ${user.is_active ? 'menonaktifkan' : 'mengaktifkan'} akun ${user.name}?`)) return;
    setUpdating(user.id);
    try {
      await fetchApi(`/users/${user.id}/status`, { method: 'PATCH' });
      await loadViolators();
    } catch (err) {
      alert('Gagal mengubah status pengguna.');
    } finally {
      setUpdating(null);
    }
  }

  async function handleDeleteUser(user: any) {
    if (!confirm(`Hapus permanen akun ${user.name}? Semua data produk & transaksi terkait mungkin akan terpengaruh. Tindakan ini tidak bisa dibatalkan!`)) return;
    setUpdating(user.id);
    try {
      await fetchApi(`/users/${user.id}`, { method: 'DELETE' });
      await loadViolators();
    } catch (err) {
      alert('Gagal menghapus pengguna.');
    } finally {
      setUpdating(null);
    }
  }

  async function handleRejectReport(id: number) {
    if (!confirm('Tolak laporan ini? Produk tidak akan dihapus.')) return;
    setUpdating(id);
    try {
      await fetchApi(`/reports/${id}/reject`, { method: 'PATCH' });
      await loadReports();
    } catch (err) {
      alert('Gagal menolak laporan.');
    } finally {
      setUpdating(null);
    }
  }

  async function handleDeleteReportedProduct(report: any) {
    if (!confirm(`Hapus produk "${report.product?.nama_barang}"? Laporan akan ditandai selesai dan tindakan ini tidak bisa dibatalkan.`)) return;
    setUpdating(report.id);
    try {
      await fetchApi(`/reports/${report.id}/product`, { method: 'DELETE' });
      await loadReports();
    } catch (err) {
      alert('Gagal menghapus produk.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <AdminLayout currentPath="/admin/reports">
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
                placeholder={activeTab === 'reports' ? "Cari laporan..." : "Cari pengguna..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem', margin: 0 }}
              />
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
              Total: {totalItems} {activeTab === 'reports' ? 'Laporan' : 'Pengguna'}
            </div>
            <Button onClick={activeTab === 'reports' ? loadReports : loadViolators} variant="secondary" style={{ padding: '0.6rem 1rem', height: 'auto' }}>
              <Icons.RefreshCw size={16} />
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => { setActiveTab('reports'); setSearchQuery(''); setCurrentPage(1); }}
            style={{
              padding: '0.5rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer',
              fontWeight: activeTab === 'reports' ? 700 : 500,
              color: activeTab === 'reports' ? 'var(--primary)' : 'var(--foreground)',
              borderBottom: activeTab === 'reports' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-0.5rem', opacity: activeTab === 'reports' ? 1 : 0.6,
              fontSize: '1.05rem', transition: 'all 0.2s ease'
            }}
          >
            Laporan Produk
          </button>
          <button
            onClick={() => { setActiveTab('users'); setSearchQuery(''); setCurrentPage(1); }}
            style={{
              padding: '0.5rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer',
              fontWeight: activeTab === 'users' ? 700 : 500,
              color: activeTab === 'users' ? 'var(--primary)' : 'var(--foreground)',
              borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-0.5rem', opacity: activeTab === 'users' ? 1 : 0.6,
              fontSize: '1.05rem', transition: 'all 0.2s ease'
            }}
          >
            Pemantauan Pengguna
          </button>
        </div>

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

          {!loading && activeTab === 'reports' && paginatedData.map((report) => (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {report.status === 'resolved' && !report.product ? (
                    <Badge tone="success" icon={<Icons.Trash2 size={12} />}>Produk Dihapus</Badge>
                  ) : report.status === 'dismissed' ? (
                    <Badge tone="neutral" icon={<Icons.X size={12} />}>Ditolak</Badge>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDeleteReportedProduct(report)}
                        disabled={updating === report.id || !report.product}
                        title={!report.product ? 'Produk sudah tidak tersedia' : undefined}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          color: 'white', fontWeight: 700, fontSize: '0.85rem',
                          padding: '8px 14px', borderRadius: '10px', border: 'none',
                          background: 'var(--danger)', cursor: (updating === report.id || !report.product) ? 'not-allowed' : 'pointer',
                          opacity: (updating === report.id || !report.product) ? 0.5 : 1,
                        }}
                      >
                        {updating === report.id ? <Icons.Loader size={14} /> : <Icons.Trash2 size={14} />} Hapus Produk
                      </button>
                      <button
                        onClick={() => handleRejectReport(report.id)}
                        disabled={updating === report.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          color: 'var(--foreground)', fontWeight: 700, fontSize: '0.85rem',
                          padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border)',
                          background: 'var(--card)', cursor: updating === report.id ? 'not-allowed' : 'pointer',
                          opacity: updating === report.id ? 0.5 : 1,
                        }}
                      >
                        <Icons.X size={14} /> Tolak
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ background: 'var(--input)', padding: '1.5rem', borderRadius: '12px', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detail Laporan:</div>
                <div style={{ opacity: 0.9 }}>
                  {report.description || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Tidak ada deskripsi tambahan.</span>}
                </div>
              </div>

              {report.product ? (
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
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    {report.product.user && (
                      <Button href={`/chat/${report.product.id}/${report.product.user.id}`} variant="secondary" size="md">
                        <Icons.MessageCircle size={16} /> Chat Penjual
                      </Button>
                    )}
                    <Button href={`/admin/products/${report.product.id}`} variant="secondary" size="md">
                      Lihat Produk <Icons.ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              ) : report.status === 'resolved' && (
                <div className="flex items-center gap-3" style={{ padding: '1.25rem', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--foreground)', opacity: 0.6 }}>
                  <Icons.Trash2 size={20} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Produk yang dilaporkan sudah dihapus.</span>
                </div>
              )}
            </div>
          ))}

          {!loading && activeTab === 'users' && (
            <div style={{ overflowX: 'auto', background: 'var(--card)', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: 'var(--input)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Pengguna</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Total Laporan</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((user: any) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: 'var(--card)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--input)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', overflow: 'hidden' }}>
                            {user.avatar ? (
                              <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.95rem' }}>{user.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <Badge tone="danger" icon={<Icons.AlertTriangle size={12} />}>
                          {user.received_reports_count} Pelanggaran
                        </Badge>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <Badge tone={user.is_active ? 'success' : 'neutral'} icon={user.is_active ? <Icons.CheckCircle size={12} /> : <Icons.XCircle size={12} />}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={updating === user.id}
                            style={{
                              padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)',
                              fontSize: '0.8rem', fontWeight: 600, cursor: updating === user.id ? 'not-allowed' : 'pointer', opacity: updating === user.id ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            {user.is_active ? <><Icons.Ban size={14} /> Nonaktifkan</> : <><Icons.CheckCircle size={14} /> Aktifkan</>}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={updating === user.id}
                            style={{
                              padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)',
                              fontSize: '0.8rem', fontWeight: 600, cursor: updating === user.id ? 'not-allowed' : 'pointer', opacity: updating === user.id ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            <Icons.Trash2 size={14} /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
