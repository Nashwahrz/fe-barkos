'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { USER_ROLES } from "@/lib/constants";
import { fetchApi, getStorageUrl } from "@/lib/api";
import { Icons } from "@/components/Icons";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [promotedProducts, setPromotedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  const fetchProducts = async (lat?: number, lng?: number) => {
    try {
      setLoading(true);
      let endpoint = '/products';
      if (lat && lng) {
        endpoint += `?lat=${lat}&lng=${lng}&radius=5000`;
      }
      const data = await fetchApi(endpoint);
      const all: any[] = data.data || data;
      setPromotedProducts(all.filter((p: any) => p.is_promoted));
      setProducts(all.filter((p: any) => !p.is_promoted));
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation tidak didukung di browser ini.');
      return;
    }
    setLocating(true);
    setLocationStatus('Mencari lokasi Anda...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus('Lokasi ditemukan. Menampilkan produk terdekat.');
        setLocating(false);
        fetchProducts(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocationStatus('Akses lokasi ditolak. Menampilkan produk terbaru.');
        setLocating(false);
        fetchProducts();
      }
    );
  };

  if (!mounted) return null;



  return (
    <div style={{ background: '#f8faf9' }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{
        padding: '100px 0 100px',
        background: 'linear-gradient(165deg, #ffffff 0%, #f0fdf4 50%, #dcfce7 100%)',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(22,163,74,0.05)'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(22,163,74,0.03)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(22,163,74,0.03)', zIndex: 0 }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            color: '#15803d', fontWeight: 800, fontSize: '0.75rem',
            padding: '8px 16px', borderRadius: '24px', marginBottom: '2rem',
            letterSpacing: '0.05em', border: '1px solid rgba(22,163,74,0.1)'
          }}>
            <Icons.GraduationCap size={16} color="#16a34a" />
            MARKETPLACE KHUSUS MAHASISWA
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900,
            color: '#111827', lineHeight: 1.1, marginBottom: '1.5rem',
            letterSpacing: '-0.04em'
          }}>
            Jual Beli Kebutuhan Kos<br />
            <span style={{ 
              background: 'linear-gradient(90deg, #16a34a, #15803d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Makin Mudah & Aman</span>
          </h1>

          <p style={{
            fontSize: '1.15rem', color: '#4b5563',
            maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.8,
            fontWeight: 500
          }}>
            Platform terpercaya untuk mahasiswa mencari dan menjual barang bekas berkualitas di sekitar kampus.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={requestLocation}
              disabled={locating}
              className="btn btn-primary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '1rem 2rem', fontSize: '1rem', fontWeight: 700,
                borderRadius: '12px', boxShadow: '0 10px 25px rgba(22,163,74,0.25)',
                transition: 'all 0.3s ease'
              }}
            >
              <Icons.MapPin size={18} color="white" />
              {locating ? 'Mencari Lokasi...' : 'Cari Barang Terdekat'}
            </button>
            <Link
              href="/products"
              className="btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '1rem 2rem', fontSize: '1rem',
                border: '1.5px solid #e5e7eb', background: 'white',
                fontWeight: 700, borderRadius: '12px', color: '#374151',
                textDecoration: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
              }}
            >
              <Icons.LayoutGrid size={18} color="#374151" />
              Jelajahi Katalog
            </Link>
          </div>

          {locationStatus && (
            <div style={{ 
              marginTop: '1.5rem', fontSize: '0.9rem', color: '#16a34a', 
              fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' 
            }}>
              <Icons.CheckCircle size={16} color="#16a34a" /> {locationStatus}
            </div>
          )}
        </div>
      </section>



      {/* ── Featured Promoted Products ─────────────────────────── */}
      {!loading && promotedProducts.length > 0 && (
        <section style={{ padding: '60px 0', position: 'relative', zIndex: 5 }}>
          <div className="container">
            <div style={{ 
              background: 'white', 
              borderRadius: '24px', 
              padding: '2.5rem', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
              border: '1px solid rgba(22,163,74,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)', 
                    color: 'white', padding: '8px 16px', borderRadius: '12px',
                    fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}>
                    <Icons.Zap size={16} color="white" />
                    PILIHAN TERBAIK MINGGU INI
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', margin: 0 }}>Rekomendasi Unggulan</h2>
                </div>
                <Link href="/products?promoted=true" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a', textDecoration: 'none' }}>
                  Lihat Semua Unggulan →
                </Link>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '1.5rem' 
              }}>
                {promotedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} promoted />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Latest Products ─────────────────────────────────── */}
      <section style={{ padding: promotedProducts.length > 0 ? '20px 0 72px' : '48px 0 72px' }}>
        <div className="container">
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '1.25rem',
            flexWrap: 'wrap', gap: '1rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>
                {locationStatus.includes('ditemukan') ? 'Produk Terdekat' : 'Produk Terbaru'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
                Temukan barang yang kamu butuhkan
              </p>
            </div>
            <Link href="/products" style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              color: '#16a34a', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none'
            }}>
              Lihat Semua
              <Icons.ArrowRight size={15} color="#16a34a" />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ borderRadius: '10px', background: '#f3f4f6', height: '300px', animation: 'pulse 2s infinite' }} />
              ))}
            </div>
          ) : products.length === 0 && promotedProducts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem 1rem', background: 'white',
              borderRadius: '12px', border: '1px solid #e5e7eb'
            }}>
              <div style={{
                width: '56px', height: '56px', background: '#f3f4f6',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1rem'
              }}>
                <Icons.Search size={24} color="#9ca3af" />
              </div>
              <p style={{ color: '#6b7280', fontWeight: 500 }}>Belum ada produk tersedia.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {products.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #15803d, #16a34a)',
        padding: '64px 0', color: 'white', textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Punya Barang Tak Terpakai?
          </h2>
          <p style={{ fontSize: '1rem', opacity: 0.9, maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Daftarkan barangmu dan temukan pembeli dari mahasiswa sekampus dalam hitungan menit.
          </p>
          <Link
            href={user && user.role === USER_ROLES.PENJUAL ? "/seller/products/create" : "/auth/register?role=penjual"}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'white', color: '#16a34a',
              padding: '0.875rem 2rem', borderRadius: '8px',
              fontWeight: 700, fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)', textDecoration: 'none'
            }}
          >
            <Icons.Store size={18} color="#16a34a" />
            {user && user.role === USER_ROLES.PENJUAL ? "Pasang Barang Baru" : "Mulai Jual Sekarang"}
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── Reusable Product Card Component ─────────────────────────
function ProductCard({ product, promoted = false }: { product: any; promoted?: boolean }) {
  return (
    <Link
      href={`/products/${product.id}`}
      style={{
        display: 'block',
        background: 'white',
        borderRadius: '10px',
        border: promoted ? '1.5px solid #f59e0b' : '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit'
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 25px rgba(0,0,0,0.11)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)';
      }}
    >
      {/* Promo Badge */}
      {promoted && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: 'white', fontWeight: 700, fontSize: '0.65rem',
          padding: '3px 9px', borderRadius: '20px'
        }}>
          <Icons.Zap size={10} color="white" />
          Promosi
        </div>
      )}

      {/* Image */}
      <div style={{
        height: '190px', background: '#f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {product.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getStorageUrl(product.foto) || ''} alt={product.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <Icons.Package size={48} color="#d1d5db" />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.875rem 1rem' }}>
        <div style={{
          fontSize: '0.9rem', fontWeight: 700, color: '#111827',
          marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {product.nama_barang}
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16a34a', marginBottom: '8px' }}>
          Rp {Number(product.harga).toLocaleString('id-ID')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600,
            background: 'rgba(22,163,74,0.08)', color: '#15803d',
            padding: '3px 9px', borderRadius: '20px'
          }}>
            {product.kondisi || 'Bekas'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
            {product.user?.asal_kampus?.split(' ').slice(-1)[0] || 'Kampus'}
          </span>
        </div>
        {product.distance_km != null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.72rem', color: '#16a34a', marginTop: '6px', fontWeight: 500
          }}>
            <Icons.MapPin size={11} color="#16a34a" />
            {product.distance_km} km dari sini
          </div>
        )}
      </div>
    </Link>
  );
}
