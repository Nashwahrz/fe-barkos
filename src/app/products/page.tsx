'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';

export default function ProductCatalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [kondisi, setKondisi] = useState('');
  const [radius, setRadius] = useState('5000'); // Default 5km if loc enabled
  
  // Geolocation state
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locStatus, setLocStatus] = useState('');

  useEffect(() => {
    loadCategories();
    // Try to load products immediately (no geo)
    loadProducts();
  }, []);

  // When filters change (except search typing), we want to reload
  useEffect(() => {
    // Only reload if we've finished initial mount
    if (!loading) {
      const timeoutId = setTimeout(() => {
        loadProducts();
      }, 500); // Debounce
      return () => clearTimeout(timeoutId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, minPrice, maxPrice, kondisi, radius, lat, lng]);

  async function loadCategories() {
    try {
      const data = await fetchApi('/categories');
      setCategories(data.data || data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }

  async function loadProducts() {
    setLoading(true);
    try {
      let endpoint = '/products?';
      const params = new URLSearchParams();
      
      if (search) params.append('keyword', search);
      if (categoryId) params.append('category_id', categoryId);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (kondisi) params.append('kondisi', kondisi);
      if (lat && lng) {
        params.append('lat', lat.toString());
        params.append('lng', lng.toString());
        params.append('radius', radius);
      }
      
      const data = await fetchApi('/products?' + params.toString());
      setProducts(data.data || data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('Geolokasi tidak didukung.');
      return;
    }
    setLocStatus('Mencari...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocStatus('Lokasi aktif 📍');
      },
      (err) => {
        console.error(err);
        setLocStatus('Akses ditolak');
      }
    );
  };

  return (
    <div className="container" style={{ padding: '40px 1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Katalog Barang Bekas</h1>
        
        {/* Search Bar */}
        <div className="flex gap-4" style={{ maxWidth: '100%', marginBottom: '1.5rem' }}>
          <input 
            type="text" 
            className="input-field" 
            style={{ flex: 1 }}
            placeholder="Cari kasur, lemari, kipas angin..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Kategori</label>
            <select className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Kondisi</label>
            <select className="input-field" value={kondisi} onChange={e => setKondisi(e.target.value)}>
              <option value="">Semua Kondisi</option>
              <option value="baru">Baru</option>
              <option value="sangat baik">Sangat Baik</option>
              <option value="layak pakai">Layak Pakai</option>
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Harga Min</label>
            <input type="number" className="input-field" placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Harga Max</label>
            <input type="number" className="input-field" placeholder="Tak terhingga" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
          </div>

          <div style={{ flex: '1 1 250px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              <span>Lokasi & Jarak</span>
              <span style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }} onClick={requestLocation}>
                {locStatus || '📍 Izinkan Lokasi'}
              </span>
            </label>
            <select className="input-field" value={radius} onChange={e => setRadius(e.target.value)} disabled={!lat}>
              <option value="1000">Radius 1 KM</option>
              <option value="2000">Radius 2 KM</option>
              <option value="5000">Radius 5 KM</option>
              <option value="10000">Radius 10 KM</option>
            </select>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⌛</div>
          <h2 style={{ fontWeight: 800 }}>Memuat katalog produk...</h2>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '2rem' 
          }}>
            {products.map((product) => (
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
                  {product.foto ? (
                     // eslint-disable-next-line @next/next/no-img-element
                    <img src={getStorageUrl(product.foto) || ''} alt={product.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : '📦'}
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

          {products.length === 0 && (
            <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔍</div>
              <h2 style={{ fontWeight: 800 }}>Tidak ada produk ditemukan</h2>
              <p>Coba sesuaikan filter atau gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
