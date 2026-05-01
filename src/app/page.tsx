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
        endpoint += `?lat=${lat}&lng=${lng}&radius=5000`; // 5km default
      }
      const data = await fetchApi(endpoint);
      setProducts(data.data || data);
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
        setLocationStatus('Lokasi ditemukan. Menampilkan produk terdekat.');
        fetchProducts(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationStatus('Akses lokasi ditolak. Menampilkan produk terbaru.');
        fetchProducts(); // fallback to latest
      }
    );
  };

  if (!mounted) return null;

  return (
    <div className="flex-col">
      {/* Hero Section */}
      <section style={{ 
        padding: '100px 0', 
        background: 'linear-gradient(135deg, var(--background) 0%, rgba(99, 102, 241, 0.05) 100%)',
        textAlign: 'center' 
      }}>
        <div className="container">
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.05em', lineHeight: 1.1 }}>
            Marketplace <span style={{ color: 'var(--primary)' }}>Barang Bekas Kos</span> Terdekat
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--card-foreground)', opacity: 0.8, maxWidth: '700px', margin: '0 auto 2.5rem' }}>
            Satu platform untuk jual beli barang bekas keperluan kos mahasiswa. Transaksi aman, COD mudah sesuai jarak terdekat kampusmu.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button onClick={requestLocation} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              📍 Cari Sekitar Saya
            </button>
            <Link href="/products" className="btn" style={{ padding: '1rem 2rem', fontSize: '1.1rem', border: '1px solid var(--border)' }}>
              Semua Katalog
            </Link>
          </div>
          {locationStatus && (
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--primary)' }}>{locationStatus}</p>
          )}
        </div>
      </section>

      {/* Featured Statistics */}
      <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
        <div className="container flex justify-between flex-wrap gap-8">
          {[
            { label: 'Total Produk', value: '1.2k+' },
            { label: 'Penjual Aktif', value: '500+' },
            { label: 'Kampus Terdaftar', value: '50+' },
            { label: 'Transaksi Sukses', value: '10k+' }
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', flex: '1 1 200px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>{stat.value}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories / Highlights */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: '3rem' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Barang Terbaru & Terdekat</h2>
              <p style={{ opacity: 0.6 }}>Temukan produk yang kamu butuhkan dengan cepat.</p>
            </div>
            <Link href="/products" style={{ color: 'var(--primary)', fontWeight: 600 }}>Lihat Semua &rarr;</Link>
          </div>

          {loading ? (
             <div className="flex justify-center" style={{ padding: '3rem' }}>Memuat produk...</div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '2rem' 
            }}>
              {products.slice(0, 6).map((product) => (
                <Link href={`/products/${product.id}`} key={product.id} className="card" style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} 
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }} 
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}>
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
                    overflow: 'hidden'
                  }}>
                    {product.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getStorageUrl(product.foto) || ''} alt={product.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '📦'}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>{product.nama_barang}</div>
                  <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem' }}>Rp {Number(product.harga).toLocaleString('id-ID')}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      <span style={{ padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '20px' }}>{product.kondisi || 'Bekas'}</span>
                      <span style={{ opacity: 0.5 }}>{product.user?.asal_kampus || 'Kampus'}</span>
                    </div>
                    {product.distance_km !== undefined && product.distance_km !== null && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                        📍 {product.distance_km} km
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ padding: '100px 0', background: 'var(--primary)', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Menjual Barang Tak Terpakai?</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Gabung dengan mahasiswa lainnya yang sudah mendapatkan uang tambahan dari barang kos yang tidak dibutuhkan lagi.
          </p>
          <Link href={user && user.role === USER_ROLES.PENJUAL ? "/seller/products/create" : "/auth/register?role=penjual"} className="btn" style={{ background: 'white', color: 'var(--primary)', padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
            {user && user.role === USER_ROLES.PENJUAL ? "Pasang Lapak Baru Sekarang" : "Daftar Sebagai Penjual Sekarang"}
          </Link>
        </div>
      </section>
    </div>
  );
}
