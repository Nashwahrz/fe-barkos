'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { Icons } from '@/components/Icons';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductCard } from '@/components/ui/ProductCard';

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
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Kategori</label>
        <select className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ width: '100%' }}>
          <option value="">Semua Kategori</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Kondisi */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Kondisi</label>
        <select className="input-field" value={kondisi} onChange={e => setKondisi(e.target.value)} style={{ width: '100%' }}>
          <option value="">Semua Kondisi</option>
          <option value="baru">Baru</option>
          <option value="sangat baik">Sangat Baik</option>
          <option value="layak pakai">Layak Pakai</option>
        </select>
      </div>

      {/* Harga */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Input 
          type="number" 
          label="Harga Min"
          placeholder="0" 
          value={minPrice} 
          onChange={e => setMinPrice(e.target.value)} 
        />
        <Input 
          type="number" 
          label="Harga Max"
          placeholder="Tak terhingga" 
          value={maxPrice} 
          onChange={e => setMaxPrice(e.target.value)} 
        />
      </div>

      {/* Lokasi */}
      <div>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
          <span>Lokasi & Jarak</span>
          {lat && (
            <span style={{ color: 'var(--primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <Icons.Check size={14} />
              {locStatus || 'Lokasi Aktif'}
            </span>
          )}
        </label>
        {!lat ? (
          <div style={{
            background: 'var(--primary-light)', border: '1px dashed var(--primary)',
            borderRadius: '12px', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500, lineHeight: 1.4 }}>
              Aktifkan GPS untuk mencari barang di sekitar Anda
            </div>
            <Button variant="primary" size="sm" onClick={requestLocation} fullWidth>
              <Icons.MapPin size={14} />
              Aktifkan GPS Sekarang
            </Button>
          </div>
        ) : (
          <select className="input-field" value={radius} onChange={e => setRadius(e.target.value)} style={{ width: '100%' }}>
            <option value="1000">Radius 1 KM</option>
            <option value="2000">Radius 2 KM</option>
            <option value="5000">Radius 5 KM</option>
            <option value="10000">Radius 10 KM</option>
          </select>
        )}
      </div>

      {/* Promosi */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', color: 'var(--foreground)' }}>
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
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '140px' }}>
      
      {/* ── Page Title ─────────────────────────────────────────── */}
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Katalog Barang Bekas</h1>

      {/* ── Search + Filter Button Row ────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem' }}>
        <div style={{ flex: 1 }}>
          <Input
            type="text"
            placeholder="Cari kasur, lemari, kipas angin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter button — shows on all, more prominent on mobile */}
        <button
          onClick={() => setShowFilterModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
            background: activeFilterCount > 0 ? 'var(--primary)' : 'var(--card)',
            color: activeFilterCount > 0 ? 'white' : 'var(--foreground)',
            border: `1px solid ${activeFilterCount > 0 ? 'var(--primary)' : 'var(--border)'}`,
            padding: '0 20px', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem',
            cursor: 'pointer', position: 'relative', height: '48px',
            transition: 'all 0.2s',
            boxShadow: activeFilterCount > 0 ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Icons.LayoutGrid size={18} color={activeFilterCount > 0 ? 'white' : 'currentColor'} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              background: 'var(--danger)', color: 'white', borderRadius: '50%',
              width: '20px', height: '20px', fontSize: '0.7rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 2px var(--background)'
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
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 300, backdropFilter: 'blur(4px)'
            }}
          />

          {/* Bottom Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
            background: 'var(--card)', borderRadius: '24px 24px 0 0',
            padding: '0 1.5rem 2rem', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Handle bar */}
            <div style={{ textAlign: 'center', padding: '12px 0 0' }}>
              <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', display: 'inline-block' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 24px' }}>
              <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--foreground)' }}>
                Filter Produk
              </span>
              <button
                onClick={() => setShowFilterModal(false)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', background: 'var(--input)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer', color: 'var(--foreground)',
                  transition: 'background 0.2s'
                }}
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Filter content */}
            <FilterPanel {...filterProps} />

            {/* Apply button */}
            <div style={{ marginTop: '2rem' }}>
              <Button onClick={() => setShowFilterModal(false)} variant="primary" size="lg" fullWidth>
                Tampilkan Hasil ({loading ? '...' : products.length} produk)
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── Products Grid ─────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '6rem 0', textAlign: 'center', opacity: 0.5 }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--foreground)' }}>
            <Icons.Loader size={32} />
          </div>
          <h2 style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--foreground)' }}>Memuat katalog...</h2>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} promoted={product.is_promoted} />
            ))}
          </div>

          {products.length === 0 && (
            <div style={{ padding: '6rem 0', textAlign: 'center', opacity: 0.5 }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--foreground)' }}>
                <Icons.Search size={32} />
              </div>
              <h2 style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--foreground)' }}>Tidak ada produk ditemukan</h2>
              <p style={{ marginTop: '8px', fontSize: '0.95rem', color: 'var(--foreground)' }}>Coba sesuaikan filter atau gunakan kata kunci lain.</p>
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
