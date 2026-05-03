'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { USER_ROLES } from "@/lib/constants";
import { fetchApi, getStorageUrl } from "@/lib/api";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [promotedProducts, setPromotedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<string>('');

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
      // Separate promoted from regular
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
    setLocationStatus('Mencari lokasi Anda...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus('✅ Lokasi ditemukan! Menampilkan produk terdekat.');
        fetchProducts(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocationStatus('Akses lokasi ditolak. Menampilkan produk terbaru.');
        fetchProducts();
      }
    );
  };

  if (!mounted) return null;

  // All products to show: promoted first, then regular
  const displayProducts = [...promotedProducts, ...products].slice(0, 8);

  return (
    <div style={{ background: '#f8faf9' }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{
        padding: '80px 0 60px',
        background: 'linear-gradient(160deg, #ffffff 0%, #f0fdf4 60%, #dcfce7 100%)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(22,163,74,0.1)',
            color: '#15803d', fontWeight: 700, fontSize: '0.85rem',
            padding: '6px 16px', borderRadius: '20px', marginBottom: '1.5rem',
            letterSpacing: '0.03em'
          }}>
            🎓 Marketplace Barang Kos Mahasiswa
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 900,
            color: '#111827', lineHeight: 1.15, marginBottom: '1.25rem',
            letterSpacing: '-0.03em'
          }}>
            Jual Beli Barang Bekas Kos<br />
            <span style={{ color: '#16a34a' }}>Terdekat & Terpercaya</span>
          </h1>

          <p style={{
            fontSize: '1.1rem', color: '#4b5563',
            maxWidth: '580px', margin: '0 auto 2.5rem', lineHeight: 1.7
          }}>
            Temukan barang kebutuhan kos dari mahasiswa sekampus. COD mudah, harga bersahabat.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={requestLocation}
              className="btn btn-primary"
              style={{ padding: '0.875rem 2rem', fontSize: '1rem', fontWeight: 600, borderRadius: '8px', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}
            >
              📍 Cari Sekitar Saya
            </button>
            <Link
              href="/products"
              className="btn"
              style={{ padding: '0.875rem 2rem', fontSize: '1rem', border: '1.5px solid #d1d5db', background: 'white', fontWeight: 600, borderRadius: '8px', color: '#374151' }}
            >
              Semua Katalog
            </Link>
          </div>

          {locationStatus && (
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#16a34a', fontWeight: 500 }}>
              {locationStatus}
            </p>
          )}
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────── */}
      <section style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '24px 0' }}>
        <div className="container flex justify-between flex-wrap" style={{ gap: '1rem' }}>
          {[
            { label: 'Produk Aktif', value: '1.2k+', icon: '📦' },
            { label: 'Penjual Aktif', value: '500+', icon: '🏪' },
            { label: 'Kampus', value: '50+', icon: '🎓' },
            { label: 'Transaksi', value: '10k+', icon: '✅' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', flex: '1 1 140px', padding: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Promoted Products ───────────────────────────────── */}
      {!loading && promotedProducts.length > 0 && (
        <section style={{ padding: '56px 0 20px' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: 'white', padding: '6px 14px', borderRadius: '20px',
                fontSize: '0.85rem', fontWeight: 800
              }}>🔥 PRODUK UNGGULAN</div>
              <div style={{ height: '1px', flex: 1, background: '#e5e7eb' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {promotedProducts.map((p) => (
                <ProductCard key={p.id} product={p} promoted />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Latest Products ─────────────────────────────────── */}
      <section style={{ padding: promotedProducts.length > 0 ? '24px 0 72px' : '56px 0 72px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
                {locationStatus.includes('Lokasi ditemukan') ? '📍 Produk Terdekat' : '🆕 Produk Terbaru'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' }}>Temukan barang yang kamu butuhkan</p>
            </div>
            <Link href="/products" style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
              Lihat Semua →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ borderRadius: '10px', background: '#f3f4f6', height: '320px', animation: 'pulse 2s infinite' }} />
              ))}
            </div>
          ) : products.length === 0 && promotedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <p style={{ color: '#6b7280' }}>Belum ada produk tersedia.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {products.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', padding: '72px 0', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Punya Barang Tak Terpakai?
          </h2>
          <p style={{ fontSize: '1.05rem', opacity: 0.9, maxWidth: '520px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Daftarkan barangmu dan temukan pembeli dari mahasiswa sekampus dalam hitungan menit.
          </p>
          <Link
            href={user && user.role === USER_ROLES.PENJUAL ? "/seller/products/create" : "/auth/register?role=penjual"}
            style={{
              display: 'inline-block',
              background: 'white', color: '#16a34a',
              padding: '0.875rem 2.5rem', borderRadius: '8px',
              fontWeight: 700, fontSize: '1rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
            }}
          >
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
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)';
      }}
    >
      {/* Badge */}
      {promoted && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 2,
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: 'white', fontWeight: 700, fontSize: '0.7rem',
          padding: '3px 10px', borderRadius: '20px'
        }}>
          🔥 Promosi
        </div>
      )}

      {/* Image */}
      <div style={{
        height: '200px', background: '#f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem', overflow: 'hidden'
      }}>
        {product.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getStorageUrl(product.foto) || ''} alt={product.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : '📦'}
      </div>

      {/* Info */}
      <div style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.nama_barang}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', marginBottom: '8px' }}>
          Rp {Number(product.harga).toLocaleString('id-ID')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 600,
            background: 'rgba(22,163,74,0.08)', color: '#15803d',
            padding: '3px 10px', borderRadius: '20px'
          }}>
            {product.kondisi || 'Bekas'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            {product.user?.asal_kampus?.split(' ').slice(-1)[0] || 'Kampus'}
          </span>
        </div>
        {product.distance_km != null && (
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '6px', fontWeight: 500 }}>
            📍 {product.distance_km} km dari sini
          </div>
        )}
      </div>
    </Link>
  );
}
