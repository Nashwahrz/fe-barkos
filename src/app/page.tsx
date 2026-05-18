'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { USER_ROLES } from "@/lib/constants";
import { getStorageUrl, swrFetcher } from "@/lib/api";
import { Icons } from "@/components/Icons";
import useSWR from "swr";
import { ProductCardSkeleton } from "@/components/Skeleton";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);

  const { data, isLoading } = useSWR('/products', swrFetcher);
  const { data: catData } = useSWR('/categories', swrFetcher);
  const { data: bannerData } = useSWR('/promotions/banners', swrFetcher);

  const allProducts: any[] = data?.data || data || [];
  const promotedProducts = allProducts.filter((p: any) => p.is_promoted);
  const products = allProducts.filter((p: any) => !p.is_promoted);
  const banners: any[] = bannerData?.data || [];

  const dbCategories: any[] = catData?.data || catData || [];

  // Banner carousel state
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (banners.length > 1) {
      bannerTimer.current = setInterval(() => {
        setBannerIdx(i => (i + 1) % banners.length);
      }, 5000);
    }
    return () => { if (bannerTimer.current) clearInterval(bannerTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/products`);
    }
  };

  const requestLocationAndSearch = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung di browser ini.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        router.push(`/products?lat=${position.coords.latitude}&lng=${position.coords.longitude}&radius=5000`);
      },
      () => {
        setLocating(false);
        alert('Akses lokasi ditolak.');
      }
    );
  };

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('elektronik') || n.includes('gadget')) return <Icons.Cpu size={24} color="var(--primary)" />;
    if (n.includes('furniture') || n.includes('perabotan')) return <Icons.Sofa size={24} color="var(--primary)" />;
    if (n.includes('kasur') || n.includes('tidur')) return <Icons.Bed size={24} color="var(--primary)" />;
    if (n.includes('mandi') || n.includes('cuci')) return <Icons.Droplets size={24} color="var(--primary)" />;
    if (n.includes('masak') || n.includes('makan')) return <Icons.UtensilsCrossed size={24} color="var(--primary)" />;
    if (n.includes('buku') || n.includes('tulis')) return <Icons.BookOpen size={24} color="var(--primary)" />;
    if (n.includes('kendaraan') || n.includes('aksesoris')) return <Icons.Bike size={24} color="var(--primary)" />;
    if (n.includes('pakaian') || n.includes('fashion')) return <Icons.Shirt size={24} color="var(--primary)" />;
    return <Icons.LayoutGrid size={24} color="var(--primary)" />;
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', color: 'var(--foreground)' }}>
      
      {/* ── Search Header (Carousell Style) ──────────────────────── */}
      <section style={{ background: 'var(--card)', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ 
              flex: '1 1 300px', display: 'flex', alignItems: 'center', 
              background: 'var(--input)', borderRadius: '8px', padding: '0 12px' 
            }}>
              <span style={{ opacity: 0.5, display: 'flex' }}><Icons.Search size={18} color="var(--foreground)" /></span>
              <input 
                type="text" 
                placeholder="Cari produk..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', background: 'transparent', border: 'none', color: 'var(--foreground)', 
                  padding: '12px', outline: 'none' 
                }} 
              />
            </div>
            
            <button
              type="button"
              onClick={requestLocationAndSearch}
              disabled={locating}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--input)', color: 'var(--foreground)', border: 'none',
                padding: '0 16px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, minWidth: '160px', justifyContent: 'center'
              }}
            >
              <Icons.MapPin size={18} color="#16a34a" />
              {locating ? 'Mencari...' : 'Cari Terdekat'}
            </button>

            <button type="submit" style={{
              background: '#16a34a', color: 'white', border: 'none',
              padding: '0 24px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 700
            }}>
              Cari
            </button>
          </form>
        </div>
      </section>

      {/* ── Iklan / Banner Section ────────────────────────────────── */}
      <section style={{ padding: '24px 0', background: 'var(--banner-bg)' }}>
        <div className="container">
          {banners.length > 0 ? (
            /* ── Dynamic Iklan Carousel ─────────────────────────── */
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '14px', overflow: 'hidden', position: 'relative', background: '#000', minHeight: '200px' }}>
                {banners.map((banner, idx) => (
                  <Link
                    key={banner.id}
                    href={`/products/${banner.product_id}`}
                    style={{
                      display: idx === bannerIdx ? 'block' : 'none',
                      position: 'relative', textDecoration: 'none',
                    }}
                  >
                    {banner.ad_type === 'video' ? (
                      <video
                        src={banner.ad_media_url}
                        autoPlay muted loop playsInline
                        style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.ad_media_url}
                        alt={banner.ad_title || banner.product_name || 'Iklan'}
                        style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
                      />
                    )}
                    {/* Overlay info */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
                      padding: '32px 24px 20px',
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px'
                    }}>
                      <div>
                        {banner.ad_title && (
                          <div style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                            {banner.ad_title}
                          </div>
                        )}
                        {banner.product_name && (
                          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600 }}>
                            {banner.product_name}{banner.product_price ? ` · Rp ${Number(banner.product_price).toLocaleString('id-ID')}` : ''}
                          </div>
                        )}
                      </div>
                      <div style={{
                        background: 'white', color: '#111827', padding: '8px 18px',
                        borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0
                      }}>
                        Lihat Produk →
                      </div>
                    </div>
                    {/* Ad badge */}
                    <div style={{
                      position: 'absolute', top: '12px', left: '12px',
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                      color: 'white', fontSize: '0.65rem', fontWeight: 700,
                      padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.06em'
                    }}>
                      {banner.ad_type === 'video' ? '🎬 IKLAN VIDEO' : '🖼️ IKLAN'}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Dots */}
              {banners.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBannerIdx(idx)}
                      style={{
                        width: idx === bannerIdx ? '24px' : '8px',
                        height: '8px', borderRadius: '999px', border: 'none',
                        background: idx === bannerIdx ? '#16a34a' : 'var(--border)',
                        cursor: 'pointer', transition: 'all 0.25s', padding: 0
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Arrows */}
              {banners.length > 1 && (
                <>
                  <button onClick={() => setBannerIdx(i => (i - 1 + banners.length) % banners.length)}
                    style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >‹</button>
                  <button onClick={() => setBannerIdx(i => (i + 1) % banners.length)}
                    style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >›</button>
                </>
              )}
            </div>
          ) : (
            /* ── Static fallback banners ────────────────────────── */
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div style={{ flex: '1 0 50%', minWidth: '320px', background: 'linear-gradient(135deg, #b91c1c, #991b1b)', borderRadius: '12px', padding: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', maxWidth: '70%' }}>Saatnya barang kamu lebih kelihatan</h2>
                <p style={{ opacity: 0.9, marginBottom: '16px', maxWidth: '70%' }}>Naikin exposure dan buka peluang laku lebih cepat.</p>
                <Link href="/seller/promotions" style={{ background: 'var(--card)', color: 'var(--foreground)', padding: '10px 20px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', border: '1px solid var(--border)' }}>Pelajari lebih lanjut</Link>
              </div>
              <div style={{ flex: '1 0 50%', minWidth: '320px', background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: '12px', padding: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', maxWidth: '70%' }}>Bukan cuma HP, di sini jual semuanya!</h2>
                <p style={{ opacity: 0.9, marginBottom: '16px', maxWidth: '70%' }}>Buku, kipas angin, meja, semuanya bisa diuangkan.</p>
                <Link href="/seller/products/create" style={{ background: 'white', color: '#15803d', padding: '10px 20px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>Mulai Jual</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────────── */}
      <section style={{ padding: '24px 0', borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
        <div className="container">
          <div style={{ 
            display: 'flex', gap: '8px', justifyContent: 'center', 
            flexWrap: 'wrap', padding: '0 8px'
          }}>
            {dbCategories.length === 0
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                    width: '96px', padding: '8px'
                  }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '16px',
                      background: 'var(--input)'
                    }} />
                    <div style={{ width: '56px', height: '12px', borderRadius: '4px', background: 'var(--input)' }} />
                  </div>
                ))
              : [
                  ...dbCategories.slice(0, 6).map((cat: any) => ({ type: 'cat', cat })),
                  { type: 'all' }
                ].map((item: any, i) => {
                  if (item.type === 'all') {
                    return (
                      <Link key="all" href="/products" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                        width: '96px', padding: '8px', textDecoration: 'none', flexShrink: 0
                      }}>
                        <div style={{
                          width: '64px', height: '64px', borderRadius: '16px',
                          background: 'var(--primary-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1.5px dashed var(--primary)', boxShadow: 'var(--shadow)',
                          transition: 'transform 0.15s, box-shadow 0.15s'
                        }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
                          }}
                        >
                          <Icons.LayoutGrid size={26} color="var(--primary)" />
                        </div>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)',
                          textAlign: 'center', lineHeight: 1.3
                        }}>Lihat Semua</span>
                      </Link>
                    );
                  }
                  return (
                    <Link key={item.cat.id} href={`/products?category_id=${item.cat.id}`} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                      width: '96px', padding: '8px', textDecoration: 'none', flexShrink: 0
                    }}>
                      <div style={{
                        width: '64px', height: '64px', borderRadius: '16px', background: 'var(--card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)',
                        transition: 'transform 0.15s, box-shadow 0.15s'
                      }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
                        }}
                      >
                        {getCategoryIcon(item.cat.name)}
                      </div>
                      <span style={{
                        fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)',
                        textAlign: 'center', lineHeight: 1.3, maxWidth: '88px'
                      }}>{item.cat.name}</span>
                    </Link>
                  );
                })
            }
          </div>
        </div>
      </section>

      <div style={{ background: 'var(--banner-bg)', minHeight: '50vh', padding: '32px 0' }}>
        {/* ── Promoted Products ──────────────────────────────────────── */}
        <section style={{ marginBottom: '40px' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--foreground)' }}>Rekomendasi Unggulan</h3>
              <Link href="/products?promoted=true" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
                Lihat Semua &gt;
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : promotedProducts.length > 0 ? (
                promotedProducts.map((p) => <ProductCard key={p.id} product={p} promoted />)
              ) : (
                <div style={{ gridColumn: '1/-1', color: 'var(--foreground)', opacity: 0.7, fontSize: '0.9rem' }}>Belum ada produk unggulan.</div>
              )}
            </div>
          </div>
        </section>

        {/* ── Sepertinya Kamu Bakal Suka Ini (Latest Products) ───────── */}
        <section style={{ paddingBottom: '40px' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--foreground)' }}>Sepertinya kamu bakal suka ini</h3>
              <Link href="/products" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
                Lihat Semua &gt;
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : products.length > 0 ? (
                products.slice(0, 15).map((p) => <ProductCard key={p.id} product={p} />)
              ) : (
                <div style={{ gridColumn: '1/-1', color: 'var(--foreground)', opacity: 0.7, fontSize: '0.9rem' }}>Belum ada produk.</div>
              )}
            </div>
          </div>
        </section>
      </div>

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
        background: 'var(--card)',
        borderRadius: '8px',
        border: promoted ? '1px solid #f59e0b' : '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: 'var(--shadow)'
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
      }}
    >
      {/* Promo Badge */}
      {promoted && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: '4px',
          background: '#b91c1c',
          color: 'white', fontWeight: 700, fontSize: '0.65rem',
          padding: '3px 8px', borderRadius: '4px'
        }}>
          <Icons.Zap size={10} color="white" />
          Promosi
        </div>
      )}

      {/* Image */}
      <div style={{
        height: '200px', background: 'var(--input)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {product.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getStorageUrl(product.foto) || ''} alt={product.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <Icons.Package size={48} color="var(--border)" />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px' }}>
        <div style={{
          fontSize: '0.95rem', fontWeight: 400, color: 'var(--foreground)', opacity: 0.9,
          marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {product.nama_barang}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>
          Rp {Number(product.harga).toLocaleString('id-ID')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 500,
            background: 'var(--input)', color: 'var(--foreground)',
            padding: '2px 6px', borderRadius: '4px'
          }}>
            {product.kondisi || 'Bekas'}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--foreground)', opacity: 0.7 }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%', background: 'var(--input)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            {product.user?.foto ? (
              <img src={getStorageUrl(product.user.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Icons.User size={12} color="var(--foreground)" />
            )}
          </div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
            {product.user?.name || 'Penjual'}
          </span>
          <span style={{ marginLeft: 'auto' }}>
            {product.user?.asal_kampus?.split(' ').slice(-1)[0] || 'Kampus'}
          </span>
        </div>

        {product.distance_km != null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.75rem', color: '#16a34a', marginTop: '8px', fontWeight: 500
          }}>
            <Icons.MapPin size={11} color="#16a34a" />
            {product.distance_km} km dari sini
          </div>
        )}
      </div>
    </Link>
  );
}
