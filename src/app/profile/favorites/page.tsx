'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchApi, getStorageUrl, toggleFavorite } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/Icons';
import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/favorites');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch favorites', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleFavorite(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Failed to remove favorite', err);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
        <Link href="/profile" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'var(--card)', border: '1px solid var(--border)',
          color: 'var(--foreground)', textDecoration: 'none',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.color = 'var(--foreground)'; }}>
          <Icons.ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
            Favorit Saya
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Daftar barang kos yang Anda simpan.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: '100px', background: 'var(--border)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Icons.Heart size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 10px' }}>Belum Ada Favorit</h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 0 24px', lineHeight: 1.6 }}>
            Anda belum menambahkan barang apapun ke daftar favorit. Temukan barang kos yang Anda butuhkan dan tekan tombol hati untuk menyimpannya di sini.
          </p>
          <Link href="/products" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--primary)', color: 'white', padding: '12px 24px',
            borderRadius: '12px', fontWeight: 600, textDecoration: 'none',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Icons.Search size={18} />
            Mulai Cari Barang
          </Link>
        </div>
      ) : (
        <div className="product-grid" style={{ width: '100%' }}>
          {products.map(product => (
            <div key={product.id} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Desktop Card View */}
              <div className="fav-desktop" style={{ width: '100%', height: '100%' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <ProductCard product={product} />
                  {/* Overlay a custom remove button that actually removes from the page state */}
                  <button
                    onClick={(e) => handleRemoveFavorite(e, product.id)}
                    aria-label="Hapus dari favorit"
                    style={{
                      position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                      background: 'var(--card)', border: 'none', borderRadius: '50%',
                      width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--danger)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Icons.Heart size={16} fill="currentColor" />
                  </button>
                </div>
              </div>

              {/* Mobile List View */}
              <Link
                href={`/products/${product.id}`}
                className="fav-mobile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'var(--card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  padding: '12px',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: '84px', height: '84px', flexShrink: 0,
                  borderRadius: '10px', overflow: 'hidden',
                  background: 'var(--background)', border: '1px solid var(--border)',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {product.status_terjual && (
                    <div style={{
                      position: 'absolute', inset: 0, zIndex: 1,
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{
                        background: 'var(--danger)', color: 'white',
                        padding: '2px 8px', borderRadius: '6px',
                        fontWeight: 800, fontSize: '0.6rem', letterSpacing: '0.5px'
                      }}>
                        TERJUAL
                      </span>
                    </div>
                  )}
                  {product.foto ? (
                    <Image
                      src={getStorageUrl(product.foto) || ''}
                      alt={product.nama_barang}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="84px"
                    />
                  ) : (
                    <Icons.Package size={28} style={{ opacity: 0.15 }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{
                    fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {product.nama_barang}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                    Rp {Number(product.harga).toLocaleString('id-ID')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>
                      <Icons.Store size={12} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {product.user?.name || 'Penjual'}
                      </span>
                    </div>
                    {product.distance_km != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>
                        <Icons.MapPin size={10} />
                        {product.distance_km} km
                      </div>
                    )}
                  </div>
                </div>

                {/* Remove Favorite Button */}
                <button
                  onClick={(e) => handleRemoveFavorite(e, product.id)}
                  aria-label="Hapus dari favorit"
                  style={{
                    flexShrink: 0,
                    background: 'var(--background)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--danger)'
                  }}
                >
                  <Icons.Heart size={16} fill="currentColor" />
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
