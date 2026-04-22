'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { USER_ROLES } from '@/lib/constants';

export default function SellerProductsDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Protected route logic
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.PENJUAL) {
        router.replace('/auth/login');
      } else {
        loadMyProducts();
      }
    }
  }, [user, authLoading, router]);

  async function loadMyProducts() {
    try {
      setLoading(true);
      const data = await fetchApi('/my-products');
      setProducts(data.data || data);
    } catch (err) {
      console.error('Failed to load my products:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus kos ini? Data tidak bisa dikembalikan.')) return;
    
    try {
      await fetchApi(`/products/${id}`, { method: 'DELETE' });
      alert('Barang jualan berhasil dihapus.');
      loadMyProducts(); // Refresh list
    } catch (err) {
      alert('Gagal menghapus lapak barang.');
    }
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5 }}>Memuat Lapak Anda...</div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '60px 1rem' }}>
      <header className="flex flex-col md-flex-row justify-between items-start md-items-center gap-4" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Dashboard Penjual</h1>
          <p style={{ opacity: 0.6 }}>Kelola lapak barang bekas Anda, tambahkan produk baru, atau perbarui informasi.</p>
        </div>
        <Link href="/seller/products/create" className="btn btn-primary" style={{ padding: '12px 24px', fontWeight: 700 }}>
          + Jual Barang Anda
        </Link>
      </header>

      {products.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', opacity: 0.7 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Anda belum memiliki lapak barang bekas.</h2>
          <p style={{ marginBottom: '2rem' }}>Dapatkan uang tambahan dengan menjual barang bekas di kos Anda yang tak terpakai!</p>
          <Link href="/seller/products/create" className="btn btn-primary">Mulai Jual Barang</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {products.map((p: any) => (
            <div key={p.id} className="card flex-col" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: '200px', background: 'var(--input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                {p.foto ? (
                   // eslint-disable-next-line @next/next/no-img-element
                  <img src={getStorageUrl(p.foto) || ''} alt={p.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : '📦'}
              </div>
              <div style={{ padding: '1.5rem' }} className="flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', background: 'var(--primary)', color: 'white', borderRadius: '12px' }}>
                    {p.category?.name || 'Barang Bekas'}
                  </span>
                  {p.status_terjual ? (
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>Terjual</span>
                  ) : (
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e' }}>Tersedia</span>
                  )}
                </div>
                
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{p.nama_barang}</h3>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  Rp {p.harga.toLocaleString('id-ID')}
                </div>
                
                <p style={{ fontSize: '0.9rem', opacity: 0.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.deskripsi}
                </p>

                <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                  <Link href={`/seller/products/${p.id}/edit`} className="btn flex-1" style={{ border: '1px solid var(--border)' }}>
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(p.id)} className="btn" style={{ background: '#fef2f2', color: '#ef4444', fontWeight: 600 }}>
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
