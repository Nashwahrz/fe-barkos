'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { Icons } from '@/components/Icons';
import { useSearchParams } from 'next/navigation';

function ProductCatalogContent() {
  const searchParams = useSearchParams();
  
  // Read initial params from URL
  const initSearch = searchParams.get('search') || searchParams.get('keyword') || '';
  const initLat = searchParams.get('lat');
  const initLng = searchParams.get('lng');
  const initRadius = searchParams.get('radius') || '5000';
  const initPromoted = searchParams.get('promoted') === 'true';
  const initCategoryId = searchParams.get('category_id') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [search, setSearch] = useState(initSearch);
  const [categoryId, setCategoryId] = useState(initCategoryId);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [kondisi, setKondisi] = useState('');
  const [radius, setRadius] = useState(initRadius);
  const [isPromoted, setIsPromoted] = useState(initPromoted);
  
  // Geolocation state
  const [lat, setLat] = useState<number | null>(initLat ? parseFloat(initLat) : null);
  const [lng, setLng] = useState<number | null>(initLng ? parseFloat(initLng) : null);
  const [locStatus, setLocStatus] = useState(initLat && initLng ? 'Lokasi aktif dari URL' : '');

  // Flag to prevent loading products before categories are mapped (not strictly needed anymore but good for sync)
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isReady) {
      const timeoutId = setTimeout(() => {
        loadProducts();
      }, 500); // Debounce
      return () => clearTimeout(timeoutId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, minPrice, maxPrice, kondisi, radius, lat, lng, isPromoted, isReady]);

  async function loadCategories() {
    try {
      const data = await fetchApi('/categories');
      const cats = data.data || data;
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setIsReady(true);
    }
  }

  async function loadProducts() {
    setLoading(true);
    try {
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
      let fetchedProducts = data.data || data;

      // Client-side filter for promoted if the API doesn't support it directly
      if (isPromoted) {
        fetchedProducts = fetchedProducts.filter((p: any) => p.is_promoted);
      }

      setProducts(fetchedProducts);
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
        setLocStatus('Lokasi aktif');
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
        <div style={{ 
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px',
          padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
        }}>
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' 
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Kategori</label>
              <select className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Kondisi</label>
              <select className="input-field" value={kondisi} onChange={e => setKondisi(e.target.value)}>
                <option value="">Semua Kondisi</option>
                <option value="baru">Baru</option>
                <option value="sangat baik">Sangat Baik</option>
                <option value="layak pakai">Layak Pakai</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Harga Min</label>
              <input type="number" className="input-field" placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Harga Max</label>
              <input type="number" className="input-field" placeholder="Tak terhingga" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>
                <span>Lokasi & Jarak</span>
                {lat && (
                  <span style={{ color: 'var(--primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <Icons.Check size={14} color="var(--primary)" />
                    {locStatus || 'Lokasi Aktif'}
                  </span>
                )}
              </label>

              {!lat ? (
                <div style={{ 
                  background: 'var(--primary-light)', border: '1px dashed var(--primary)', 
                  borderRadius: '8px', padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px',
                  justifyContent: 'center', flex: 1
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, lineHeight: 1.2 }}>
                    Aktifkan GPS untuk mencari barang di sekitar Anda
                  </div>
                  <button 
                    type="button"
                    onClick={requestLocation}
                    style={{
                      background: 'var(--primary)', color: 'white', border: 'none',
                      padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem',
                      fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)', justifyContent: 'center', width: '100%'
                    }}
                  >
                    <Icons.MapPin size={14} color="white" />
                    {locStatus || 'Aktifkan GPS Sekarang'}
                  </button>
                </div>
              ) : (
                <select className="input-field" value={radius} onChange={e => setRadius(e.target.value)}>
                  <option value="1000">Radius 1 KM</option>
                  <option value="2000">Radius 2 KM</option>
                  <option value="5000">Radius 5 KM</option>
                  <option value="10000">Radius 10 KM</option>
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--foreground)' }}>
              <input 
                type="checkbox" 
                checked={isPromoted} 
                onChange={(e) => setIsPromoted(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }} 
              />
              Hanya Tampilkan Promosi Unggulan
            </label>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><Icons.Loader size={28} color="var(--primary)" /></div>
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
                {/* Promotion Badge */}
                {product.is_promoted && (
                  <div style={{ 
                    position: 'absolute', top: '12px', left: '12px', zIndex: 2,
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    color: 'white', fontWeight: 800, fontSize: '0.75rem',
                    padding: '4px 10px', borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                  }}>
                    🔥 Promosi
                  </div>
                )}
                <div style={{ 
                  height: '240px', 
                  background: 'var(--input)', 
                  borderRadius: 'calc(var(--radius) - 4px)', 
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--border)',
                  fontSize: '3rem',
                  border: product.is_promoted ? '2px solid #f59e0b' : 'none',
                  overflow: 'hidden'
                }}>
                  {product.foto ? (
                     // eslint-disable-next-line @next/next/no-img-element
                    <img src={getStorageUrl(product.foto) || ''} alt={product.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ opacity: 0.3, display: 'flex' }}><Icons.Package size={48} color="var(--foreground)" /></span></div>}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.nama_barang}</div>
                <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.75rem' }}>Rp {Number(product.harga).toLocaleString('id-ID')}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    <span style={{ padding: '3px 10px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px' }}>{product.kondisi || 'Bekas'}</span>
                    <span style={{ opacity: 0.5 }}>{product.user?.asal_kampus?.split(' ').slice(-1)[0] || 'Kampus'}</span>
                  </div>
                  {product.distance_km != null && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                      <Icons.MapPin size={12} color="var(--primary)" /> {product.distance_km} km
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {products.length === 0 && (
            <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><span style={{ opacity: 0.5, display: 'flex' }}><Icons.Search size={28} color="var(--foreground)" /></span></div>
              <h2 style={{ fontWeight: 800 }}>Tidak ada produk ditemukan</h2>
              <p>Coba sesuaikan filter atau gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductCatalog() {
  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>Memuat halaman...</div>}>
      <ProductCatalogContent />
    </Suspense>
  );
}
