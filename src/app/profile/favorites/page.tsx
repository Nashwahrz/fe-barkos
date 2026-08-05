'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/ui/ProductCard';
import { Icons } from '@/components/Icons';
import Link from 'next/link';

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

  if (authLoading || (!user && loading)) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ aspectRatio: '1/1', background: 'var(--border)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {products.map(product => (
            <ProductCard key={product.id} product={{ ...product, is_favorited: true }} promoted={product.is_promoted} />
          ))}
        </div>
      )}
    </div>
  );
}
