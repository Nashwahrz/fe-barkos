'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { Icons } from '@/components/Icons';
import { useSearchParams } from 'next/navigation';

// ── Filter Panel (shared by desktop + mobile modal) ──────────
function FilterPanel({
  categories, categoryId, setCategoryId,
  kondisi, setKondisi, minPrice, setMinPrice, maxPrice, setMaxPrice,
  lat, locStatus, radius, setRadius, requestLocation, isPromoted, setIsPromoted
}: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Kategori */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Kategori</label>
        <select className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Kondisi */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Kondisi</label>
        <select className="input-field" value={kondisi} onChange={e => setKondisi(e.target.value)}>
          <option value="">Semua Kondisi</option>
          <option value="baru">Baru</option>
          <option value="sangat baik">Sangat Baik</option>
          <option value="layak pakai">Layak Pakai</option>
        </select>
      </div>

      {/* Harga */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Harga Min</label>
          <input type="number" className="input-field" placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Harga Max</label>
          <input type="number" className="input-field" placeholder="Tak terhingga" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        </div>
      </div>

      {/* Lokasi */}
      <div>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
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
            borderRadius: '8px', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, lineHeight: 1.3 }}>
              Aktifkan GPS untuk mencari barang di sekitar Anda
            </div>
            <button type="button" onClick={requestLocation} style={{
              background: 'var(--primary)', color: 'white', border: 'none',
              padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem',
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: '6px', justifyContent: 'center', width: '100%'
            }}>
              <Icons.MapPin size={14} color="white" />
              Aktifkan GPS Sekarang
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

      {/* Promosi */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--foreground)' }}>
          <input
            type="checkbox"
            checked={isPromoted}
            onChange={(e) => setIsPromoted(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
          />
          Hanya Tampilkan Promosi Unggulan
        </label>
      </div>
    </div>
  );
}

function ProductCatalogContent() {
  const searchParams = useSearchParams();

  const initSearch = searchParams.get('search') || searchParams.get('keyword') || '';
  const initLat = searchParams.get('lat');
  const initLng = searchParams.get('lng');
  const initRadius = searchParams.get('radius') || '5000';
  const initPromoted = searchParams.get('promoted') === 'true';
  const initCategoryId = searchParams.get('category_id') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(initSearch);
  const [categoryId, setCategoryId] = useState(initCategoryId);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [kondisi, setKondisi] = useState('');
  const [radius, setRadius] = useState(initRadius);
  const [isPromoted, setIsPromoted] = useState(initPromoted);

  const [lat, setLat] = useState<number | null>(initLat ? parseFloat(initLat) : null);
  const [lng, setLng] = useState<number | null>(initLng ? parseFloat(initLng) : null);
  const [locStatus, setLocStatus] = useState(initLat && initLng ? 'Lokasi aktif' : '');

  const [isReady, setIsReady] = useState(false);

  // Mobile filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Count active filters for badge
  const activeFilterCount = [categoryId, kondisi, minPrice, maxPrice, lat, isPromoted].filter(Boolean).length;

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isReady) {
      const timeoutId = setTimeout(() => { loadProducts(); }, 500);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, minPrice, maxPrice, kondisi, radius, lat, lng, isPromoted, isReady]);

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showFilterModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showFilterModal]);

  async function loadCategories() {
    try {
      const data = await fetchApi('/categories');
      setCategories(data.data || data);
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
        // Pass a larger radius to backend (buffer 1.5x) since straight-line is always shorter than driving route
        params.append('radius', (parseInt(radius) * 1.5).toString());
      }
      const data = await fetchApi('/products?' + params.toString());
      let fetched = data.data || data;
      if (isPromoted) fetched = fetched.filter((p: any) => p.is_promoted);

      // OSRM Table API integration & Filter
      if (lat && lng && fetched.length > 0) {
        try {
          const coords = [`${lng},${lat}`];
          const validProducts: any[] = [];
          
          fetched.forEach((p: any) => {
            if (p.latitude && p.longitude) {
              coords.push(`${p.longitude},${p.latitude}`);
              validProducts.push(p);
            }
            // fallback raw distance based on backend haversine
            p.raw_distance = (p.distance_km || 0) * 1000; 
          });

          if (validProducts.length > 0) {
            await Promise.all(validProducts.map(async (p) => {
              try {
                const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${p.longitude},${p.latitude}?overview=false`;
                const res = await fetch(osrmUrl);
                const data = await res.json();
                
                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                  const distMeters = data.routes[0].distance;
                  p.distance_km = (distMeters / 1000).toFixed(1);
                  p.is_driving = true;
                  p.raw_distance = distMeters;
                }
              } catch (err) {
                // Ignore individual failures, raw_distance will fallback to haversine
              }
            }));
          }
          
          // Filter out products whose actual driving route distance exceeds the requested radius
          const radNum = parseInt(radius);
          fetched = fetched.filter((p: any) => p.raw_distance <= radNum);
          
        } catch (err) {
          console.error('OSRM table error:', err);
          // If OSRM fails, fallback to strict haversine filtering
          const radNum = parseInt(radius);
          fetched = fetched.filter((p: any) => p.raw_distance <= radNum);
        }
      }

      setProducts(fetched);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocStatus('Tidak didukung.'); return; }
    setLocStatus('Mencari...');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocStatus('Lokasi aktif'); },
      () => { setLocStatus('Akses ditolak'); }
    );
  };

  const filterProps = {
    categories, categoryId, setCategoryId,
    kondisi, setKondisi, minPrice, setMinPrice, maxPrice, setMaxPrice,
    lat, locStatus, radius, setRadius, requestLocation, isPromoted, setIsPromoted
  };

  return (
    <div className="container" style={{ padding: '24px 1rem 40px' }}>
      
      {/* ── Page Title ─────────────────────────────────────────── */}
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem' }}>Katalog Barang Bekas</h1>

      {/* ── Search + Filter Button Row ────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem' }}>
        <input
          type="text"
          className="input-field"
          style={{ flex: 1 }}
          placeholder="Cari kasur, lemari, kipas angin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filter button — shows on all, more prominent on mobile */}
        <button
          onClick={() => setShowFilterModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
            background: activeFilterCount > 0 ? 'var(--primary)' : 'var(--card)',
            color: activeFilterCount > 0 ? 'white' : 'var(--foreground)',
            border: `1px solid ${activeFilterCount > 0 ? 'var(--primary)' : 'var(--border)'}`,
            padding: '0 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer', position: 'relative', height: '48px'
          }}
        >
          <Icons.LayoutGrid size={18} color={activeFilterCount > 0 ? 'white' : 'var(--foreground)'} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              background: '#ef4444', color: 'white', borderRadius: '50%',
              width: '18px', height: '18px', fontSize: '0.65rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>


      {/* ── Mobile Filter Bottom Sheet Modal ─────────────────── */}
      {showFilterModal && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowFilterModal(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 300, backdropFilter: 'blur(2px)'
            }}
          />

          {/* Bottom Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
            background: 'var(--card)', borderRadius: '20px 20px 0 0',
            padding: '0 1rem 2rem', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.25s ease-out'
          }}>
            {/* Handle bar */}
            <div style={{ textAlign: 'center', padding: '12px 0 0' }}>
              <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', display: 'inline-block' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 20px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--foreground)' }}>
                Filter Produk
              </span>
              <button
                onClick={() => setShowFilterModal(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--input)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer', color: 'var(--foreground)'
                }}
              >
                <Icons.X size={16} />
              </button>
            </div>

            {/* Filter content */}
            <FilterPanel {...filterProps} />

            {/* Apply button */}
            <button
              onClick={() => setShowFilterModal(false)}
              style={{
                marginTop: '1.5rem', width: '100%', background: 'var(--primary)', color: 'white',
                border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Tampilkan Hasil ({loading ? '...' : products.length} produk)
            </button>
          </div>
        </>
      )}

      {/* ── Products Grid ─────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Icons.Loader size={28} color="var(--primary)" />
          </div>
          <h2 style={{ fontWeight: 800 }}>Memuat katalog...</h2>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <Link href={`/products/${product.id}`} key={product.id} className="card" style={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer',
                position: 'relative', overflow: 'hidden', padding: 0
              }}>
                {product.is_promoted && (
                  <div style={{
                    position: 'absolute', top: '10px', left: '10px', zIndex: 2,
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    color: 'white', fontWeight: 800, fontSize: '0.7rem',
                    padding: '3px 8px', borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                  }}>
                    🔥 Promosi
                  </div>
                )}
                <div style={{
                  height: '160px', background: 'var(--input)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: product.is_promoted ? '2px solid #f59e0b' : 'none',
                  overflow: 'hidden'
                }}>
                  {product.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getStorageUrl(product.foto) || ''} alt={product.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ opacity: 0.3, display: 'flex' }}><Icons.Package size={40} color="var(--foreground)" /></span>
                  )}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.nama_barang}
                  </div>
                  <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1rem', marginBottom: '8px' }}>
                    Rp {Number(product.harga).toLocaleString('id-ID')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ padding: '2px 8px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600 }}>
                      {product.kondisi || 'Bekas'}
                    </span>
                    {product.distance_km != null && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }} title={product.is_driving ? "Jarak rute berkendara" : "Jarak garis lurus"}>
                        <Icons.MapPin size={11} color="var(--primary)" /> {product.distance_km} km {product.is_driving ? '(jalan)' : '(lurus)'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {products.length === 0 && (
            <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Icons.Search size={28} color="var(--foreground)" />
              </div>
              <h2 style={{ fontWeight: 800 }}>Tidak ada produk ditemukan</h2>
              <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>Coba sesuaikan filter atau gunakan kata kunci lain.</p>
            </div>
          )}
        </>
      )}

      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
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
