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
import { ProductCard } from "@/components/ui/ProductCard";
import Image from "next/image";
import dynamic from 'next/dynamic';

const LocationMapModal = dynamic(() => import("@/components/LocationMapModal"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [mapCoords, setMapCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data, isLoading } = useSWR('/products', swrFetcher);
  const { data: catData } = useSWR('/categories', swrFetcher);
  const { data: bannerData } = useSWR('/promotions/banners', swrFetcher);

  const allProducts: any[] = data?.data || data || [];
  const promotedProducts = allProducts.filter((p: any) => p.is_promoted);
  const products = allProducts.filter((p: any) => !p.is_promoted);

  const dbCategories: any[] = catData?.data || catData || [];
  const banners: any[] = bannerData?.data || [];

  // Banner carousel state is removed in favor of native horizontal scroll

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
        setMapCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setLocating(false);
        alert('Akses lokasi ditolak.');
      }
    );
  };

  // Determine the correct sell destination based on user role
  const sellLink = !user
    ? '/auth/login?redirect=/seller/register'
    : user.role === USER_ROLES.PENJUAL
      ? '/seller/products/create'
      : '/seller/register';

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('elektronik') || n.includes('gadget')) return <Icons.Cpu />;
    if (n.includes('furniture') || n.includes('perabotan')) return <Icons.Sofa />;
    if (n.includes('kasur') || n.includes('tidur')) return <Icons.Bed />;
    if (n.includes('mandi') || n.includes('cuci')) return <Icons.Droplets />;
    if (n.includes('masak') || n.includes('makan')) return <Icons.UtensilsCrossed />;
    if (n.includes('buku') || n.includes('tulis')) return <Icons.BookOpen />;
    if (n.includes('kendaraan') || n.includes('aksesoris')) return <Icons.Bike />;
    if (n.includes('pakaian') || n.includes('fashion')) return <Icons.Shirt />;
    return <Icons.LayoutGrid />;
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', color: 'var(--foreground)' }}>
      
      {/* ── Grand Hero Section with Search ──────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', marginTop: '-68px' }}>
        {/* Background Image full width & height */}
        <Image src="/hero-bg.png" alt="Marketplace Hero" fill style={{ objectFit: 'cover', zIndex: 0 }} priority sizes="100vw" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8))', zIndex: 1 }} />

        {/* Content Layer */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          
          {/* Search Header */}
          <div style={{ padding: '100px 0 32px 0' }}>
            <style>{`
              .search-input-transparent::placeholder {
                color: rgba(255, 255, 255, 0.7) !important;
              }
            `}</style>
            <div className="container">
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center',
                  background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)', 
                  borderRadius: '16px', padding: '0 20px',
                  minWidth: 0, transition: 'all 0.3s',
                  boxShadow: isScrolled ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                  border: isScrolled ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: isScrolled ? 'none' : 'blur(8px)',
                  WebkitBackdropFilter: isScrolled ? 'none' : 'blur(8px)',
                }}
                onFocus={(e) => {
                  if (isScrolled) e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                  else e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                }}
                onBlur={(e) => {
                  if (isScrolled) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  else e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                >
                  <span style={{ opacity: isScrolled ? 0.5 : 0.9, display: 'flex', flexShrink: 0, color: isScrolled ? '#000' : '#fff' }}>
                    <Icons.Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari barang atau kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={isScrolled ? '' : 'search-input-transparent'}
                    style={{
                      width: '100%', background: 'transparent', border: 'none',
                      color: isScrolled ? '#000' : '#fff', padding: '16px 12px', outline: 'none',
                      fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.3s'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={requestLocationAndSearch}
                  disabled={locating}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
                    background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)', 
                    color: isScrolled ? '#000' : '#fff', 
                    border: isScrolled ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '0 20px', borderRadius: '16px', cursor: 'pointer', fontWeight: 600,
                    fontSize: '0.9rem', transition: 'all 0.3s',
                    boxShadow: isScrolled ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                    backdropFilter: isScrolled ? 'none' : 'blur(8px)',
                    WebkitBackdropFilter: isScrolled ? 'none' : 'blur(8px)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    if (!isScrolled) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    if (!isScrolled) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                >
                  <Icons.MapPin size={16} />
                  <span className="hide-mobile">{locating ? 'Mencari...' : 'Terdekat'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Hero Text Content */}
          <div className="hero-section" style={{ padding: '32px 0 100px 0' }}>
            <style>{`
              @keyframes subtleFadeIn {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .hero-content-anim {
                animation: subtleFadeIn 0.8s ease-out;
              }
            `}</style>
            <div className="container">
              <div className="hero-content-anim" style={{
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '24px',
                maxWidth: '800px',
              }}>
                <h1 className="text-hero" style={{ 
                  color: 'white',
                  textShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  margin: 0,
                }}>
                  Surganya<br />
                  Barang Bekas<br />
                  Anak Kos.
                </h1>
                <p style={{
                  fontSize: '1.125rem',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.9)',
                  maxWidth: '600px',
                  fontWeight: 400,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  margin: 0
                }}>
                  Platform jual beli barang bekas terpercaya khusus mahasiswa. Temukan kipas, kasur, lemari, hingga rice cooker dengan harga miring di sekitarmu!
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <Link href="/products" style={{
                    background: 'white', color: 'black', padding: '16px 32px',
                    borderRadius: '12px', fontWeight: 700, textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                  >
                    Jelajahi Produk
                  </Link>
                  {(!user || user.role !== USER_ROLES.SUPER_ADMIN) && (
                    <Link href={sellLink} style={{
                      background: 'rgba(255,255,255,0.15)', color: 'white', padding: '16px 32px',
                      borderRadius: '12px', fontWeight: 600, textDecoration: 'none',
                      border: '1px solid rgba(255,255,255,0.4)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      Mulai Jual
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', gap: '80px' }}>
        
        {/* ── Banners / Iklan (Horizontal Scroller) ───────────────── */}
        {banners.length > 0 && (
          <section>
            <div className="container" style={{ paddingRight: 0 }}> {/* Biarkan bleed ke kanan untuk efek geser */}
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '24px', letterSpacing: '-0.02em' }}>
                Promo Spesial
              </h2>
              <div style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: '24px',
                paddingRight: '1rem', // Padding untuk batas akhir scroll
              }}>
                {banners.map((banner) => (
                  <div key={banner.id} style={{
                    flex: banners.length > 1 ? '0 0 85%' : '0 0 100%',
                    height: '300px',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    scrollSnapAlign: 'center',
                    maxWidth: '800px', // Batasi lebar maksimal di layar besar
                  }}>
                    {banner.ad_type === 'image' ? (
                      <img src={getStorageUrl(banner.ad_media_url) || undefined} alt={banner.ad_title || 'Iklan'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <video src={getStorageUrl(banner.ad_media_url) || undefined} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    
                    {/* Overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      padding: '32px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ color: 'white' }}>
                          <span style={{ 
                            background: 'var(--primary)', color: 'white', padding: '6px 12px', 
                            borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, 
                            marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                            letterSpacing: '0.05em'
                          }}>
                            <Icons.Sparkles size={14} /> IKLAN SPONSOR
                          </span>
                          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            {banner.ad_title || banner.product_name || 'Promo Spesial!'}
                          </h3>
                          {banner.product_price && (
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, opacity: 0.9 }}>
                              Rp {parseInt(banner.product_price).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>
                        
                        {banner.product_id && (
                          <Link href={`/products/${banner.product_id}`} style={{
                            background: 'white', color: 'black', padding: '12px 24px', 
                            borderRadius: '12px', fontSize: '0.95rem', fontWeight: 700, 
                            textDecoration: 'none', transition: 'transform 0.2s',
                            display: 'flex', alignItems: 'center', gap: '8px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            Lihat Detail <Icons.ArrowRight size={18} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Kategori ─────────────────────────────────────────────── */}
        <section>
          <div className="container">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '32px', letterSpacing: '-0.02em' }}>
              Jelajahi Kategori
            </h2>
            <style>{`
              .category-card {
                display: flex;
                flex-direction: column;
                gap: 16px;
                width: 110px;
                text-decoration: none;
                flex-shrink: 0;
                cursor: pointer;
                align-items: center;
              }
              .category-icon-wrapper {
                width: 100%;
                aspect-ratio: 1;
                border-radius: 28px;
                background: linear-gradient(135deg, #115e59, #0f766e); /* Dark Teal */
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: 0 8px 16px rgba(15, 118, 110, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.95);
                position: relative;
                overflow: hidden;
                border: 1px solid rgba(20, 184, 166, 0.2);
              }
              .category-icon-wrapper::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(135deg, #14b8a6, #0d9488); /* Vibrant Teal on hover */
                opacity: 0;
                transition: opacity 0.4s ease;
                z-index: 0;
              }
              .category-card:hover .category-icon-wrapper {
                transform: translateY(-8px);
                box-shadow: 0 16px 32px rgba(20, 184, 166, 0.4);
                color: white;
                border-color: rgba(255, 255, 255, 0.3);
              }
              .category-card:hover .category-icon-wrapper::before {
                opacity: 1;
              }
              .category-icon-wrapper svg {
                width: 36px;
                height: 36px;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                z-index: 1;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
              }
              .category-card:hover .category-icon-wrapper svg {
                transform: scale(1.15) rotate(5deg);
              }
              .category-text {
                font-size: 0.95rem;
                font-weight: 700;
                color: var(--foreground);
                line-height: 1.4;
                text-align: center;
                transition: all 0.3s ease;
                opacity: 0.85;
              }
              .category-card:hover .category-text {
                color: #0d9488;
                opacity: 1;
                transform: translateY(-2px);
              }

              .category-card-all .category-icon-wrapper {
                background: linear-gradient(135deg, #334155, #1e293b);
                border: 1px solid rgba(148, 163, 184, 0.2);
                box-shadow: 0 8px 16px rgba(30, 41, 59, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.1);
              }
              .category-card-all .category-icon-wrapper::before {
                background: linear-gradient(135deg, #475569, #334155);
              }
              .category-card-all:hover .category-icon-wrapper {
                box-shadow: 0 16px 32px rgba(30, 41, 59, 0.3);
                border-color: rgba(255, 255, 255, 0.2);
              }
              .category-card-all:hover .category-text {
                color: var(--foreground);
              }
            `}</style>
            <div style={{ 
              display: 'flex', gap: '24px',
              overflowX: 'auto', overflowY: 'hidden',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '24px',
              paddingTop: '12px' // to account for hover translateY
            }}>
              {dbCategories.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', gap: '16px', width: '110px', flexShrink: 0
                    }}>
                      <div style={{ width: '100%', aspectRatio: '1', borderRadius: '24px', background: 'var(--border)', opacity: 0.3 }} />
                      <div style={{ width: '60%', height: '12px', borderRadius: '4px', background: 'var(--border)', opacity: 0.3, margin: '0 auto' }} />
                    </div>
                  ))
                : [
                    ...dbCategories.slice(0, 7).map((cat: any) => ({ type: 'cat', cat })),
                    { type: 'all' }
                  ].map((item: any) => {
                    if (item.type === 'all') {
                      return (
                        <Link key="all" href="/products" className="category-card category-card-all">
                          <div className="category-icon-wrapper">
                            <Icons.LayoutGrid />
                          </div>
                          <span className="category-text">Semua</span>
                        </Link>
                      );
                    }
                    return (
                      <Link key={item.cat.id} href={`/products?category_id=${item.cat.id}`} className="category-card">
                        <div className="category-icon-wrapper">
                          {getCategoryIcon(item.cat.name)}
                        </div>
                        <span className="category-text">{item.cat.name}</span>
                      </Link>
                    );
                  })
              }
            </div>
          </div>
        </section>

        {/* ── Produk Rekomendasi ──────────────────────────────────────── */}
        <section>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                Rekomendasi
              </h2>
              <Link href="/products?promoted=true" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)', opacity: 0.6, textDecoration: 'none', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
              >
                Lihat Semua
              </Link>
            </div>
            <div className="product-grid">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : promotedProducts.length > 0 ? (
                promotedProducts.slice(0, 5).map((p: any) => <ProductCard key={p.id} product={p} promoted />)
              ) : (
                <div style={{ gridColumn: '1/-1', color: 'var(--foreground)', opacity: 0.5, fontSize: '0.9rem' }}>Belum ada produk rekomendasi saat ini.</div>
              )}
            </div>
          </div>
        </section>

        {/* ── Produk Terbaru ───────────────────────── */}
        <section>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                Produk Terbaru
              </h2>
              <Link href="/products" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)', opacity: 0.6, textDecoration: 'none', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
              >
                Lihat Semua
              </Link>
            </div>
            <div className="product-grid">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : products.length > 0 ? (
                products.slice(0, 10).map((p: any) => <ProductCard key={p.id} product={p} />)
              ) : (
                <div style={{ gridColumn: '1/-1', color: 'var(--foreground)', opacity: 0.5, fontSize: '0.9rem' }}>Belum ada produk.</div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Radar Locating Modal */}
      {mapCoords && (
        <LocationMapModal
          lat={mapCoords.lat}
          lng={mapCoords.lng}
          products={allProducts}
          onClose={() => setMapCoords(null)}
          onSearch={(lat, lng, radius) => {
            setMapCoords(null);
            router.push(`/products?lat=${lat}&lng=${lng}&radius=${radius}`);
          }}
        />
      )}

    </div>
  );
}
