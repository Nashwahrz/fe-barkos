'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

export default function ProductCatalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await fetchApi('/products');
      setProducts(data.data || data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => 
    p.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
    p.deskripsi.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5 }}>Memuat produk...</div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 1rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Katalog Produk</h1>
        <div className="flex gap-4" style={{ maxWidth: '600px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Cari kos, meja, kulkas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '2rem' 
      }}>
        {filteredProducts.map((product) => (
          <Link href={`/products/${product.id}`} key={product.id} className="card" style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ 
              height: '240px', 
              background: 'var(--input)', 
              borderRadius: 'calc(var(--radius) - 4px)', 
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--border)',
              fontSize: '3rem'
            }}>
              📦
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>{product.nama_barang}</div>
            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem' }}>Rp {product.harga.toLocaleString('id-ID')}</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                <span style={{ padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '20px' }}>{product.kondisi || 'Bekas'}</span>
                <span style={{ opacity: 0.5 }}>{product.user?.asal_kampus || 'UB - Malang'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔍</div>
          <h2 style={{ fontWeight: 800 }}>Tidak ada produk ditemukan</h2>
          <p>Coba gunakan kata kunci pencarian yang lain.</p>
        </div>
      )}
    </div>
  );
}
