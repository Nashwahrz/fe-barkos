'use client';

import { useState, useEffect } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminSidebar from '@/components/AdminSidebar';
import { Icons } from '@/components/Icons';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Pagination } from '@/components/Pagination';

export default function AdminProducts() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const {
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, paginatedData, totalItems
  } = useTablePagination(products, ['nama_barang', 'user.name', 'category.name', 'deskripsi'], 10);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
        router.push('/');
      } else {
        loadProducts();
      }
    }
  }, [user, authLoading, router]);

  async function loadProducts() {
    try {
      const data = await fetchApi('/admin/products');
      setProducts(data.data || data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini? Transaksi terkait mungkin terpengaruh.')) return;
    
    setActionLoading(id);
    try {
      await fetchApi(`/admin/products/${id}`, { method: 'DELETE' });
      await loadProducts();
    } catch (err) {
      alert('Gagal menghapus produk.');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat data...</div>
    </div>
  );

  return (
    <div className="flex md-flex-col" style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--background)' }}>
      <AdminSidebar currentPath="/admin/products" />

      <main className="page-padding" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <header className="admin-header-flex" style={{ marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Manajemen Produk</h1>
            <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '1.05rem' }}>Lihat dan hapus produk yang melanggar aturan.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Icons.Search size={16} color="var(--foreground)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input 
                type="text" 
                placeholder="Cari produk..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
              Total: {totalItems} Produk
            </div>
          </div>
        </header>

        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
              <thead style={{ background: 'var(--input)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>PRODUK</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>PENJUAL</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>KATEGORI</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '1.25rem 2rem', fontWeight: 700, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.95rem' }}>
                {paginatedData.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-bg-input">
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div className="flex items-center gap-4">
                        <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--input)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                           {p.foto ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img src={getStorageUrl(p.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           ) : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><Icons.Package size={24} color="var(--border)" /></div>}
                        </div>
                        <div className="flex-col">
                          <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{p.nama_barang}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.7, fontWeight: 600 }}>Rp {Number(p.harga).toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem', color: 'var(--foreground)', fontWeight: 500 }}>{p.user?.name}</td>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{ background: 'var(--input)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8, border: '1px solid var(--border)' }}>
                        {p.category?.name || 'Umum'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      {p.status_terjual ? (
                        <span style={{ 
                          padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                          background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', border: '1px solid rgba(220, 38, 38, 0.2)'
                        }}>Terjual</span>
                      ) : (
                        <span style={{ 
                          padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                          background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(13, 148, 136, 0.2)'
                        }}>Tersedia</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        disabled={actionLoading === p.id}
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '6px', 
                          color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem',
                          padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.2)', background: 'rgba(220, 38, 38, 0.05)', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        {actionLoading === p.id ? <Icons.Loader size={14} /> : <Icons.Trash2 size={14} />}
                        {actionLoading === p.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5 }}>
                      <Icons.Inbox size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Tidak ada produk ditemukan.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </main>
    </div>
  );
}
