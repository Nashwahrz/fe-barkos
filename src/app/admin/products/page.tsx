'use client';

import { useState, useEffect } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminProducts() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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

  if (loading || authLoading) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 70px)' }}>
      <AdminSidebar currentPath="/admin/products" />

      <main style={{ flex: 1, padding: '2rem', background: 'rgba(0,0,0,0.02)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Manajemen Produk</h1>
              <p style={{ opacity: 0.6 }}>Lihat dan hapus produk yang melanggar aturan.</p>
            </div>
            <div className="card" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700 }}>
              Total: {products.length} Produk
            </div>
          </header>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'rgba(0,0,0,0.03)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(0,0,0,0.4)' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem' }}>PRODUK</th>
                  <th style={{ padding: '1rem' }}>PENJUAL</th>
                  <th style={{ padding: '1rem' }}>KATEGORI</th>
                  <th style={{ padding: '1rem' }}>STATUS</th>
                  <th style={{ padding: '1rem' }}>AKSI</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--input)', overflow: 'hidden' }}>
                           {p.foto ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img src={getStorageUrl(p.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           ) : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>📦</div>}
                        </div>
                        <div className="flex-col">
                          <div style={{ fontWeight: 700 }}>{p.nama_barang}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Rp {Number(p.harga).toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{p.user?.name}</td>
                    <td style={{ padding: '1rem' }}>{p.category?.name}</td>
                    <td style={{ padding: '1rem' }}>
                      {p.status_terjual ? (
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>Terjual</span>
                      ) : (
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Tersedia</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        disabled={actionLoading === p.id}
                        style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        {actionLoading === p.id ? '...' : 'Hapus'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
