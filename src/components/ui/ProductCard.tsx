import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getStorageUrl } from '@/lib/api';
import { Icons } from '@/components/Icons';

export interface ProductCardProps {
  product: any;
  promoted?: boolean;
}

export function ProductCard({ product, promoted = false }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--card)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: 'var(--shadow-sm)',
        height: '100%'
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Promo Badge Minimalist */}
      {promoted && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 2,
          display: 'inline-block',
          background: 'var(--primary)',
          color: '#ffffff', fontWeight: 600, fontSize: '0.65rem',
          padding: '4px 8px', borderRadius: '6px'
        }}>
          Rekomendasi
        </div>
      )}

      {/* Image */}
      <div style={{
        aspectRatio: '1 / 1',
        background: 'var(--background)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border)',
        position: 'relative'
      }}>
        {product.foto ? (
          <Image 
            src={getStorageUrl(product.foto) || ''} 
            alt={product.nama_barang} 
            fill 
            style={{ objectFit: 'cover' }} 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div style={{ opacity: 0.15 }}>
            <Icons.Package size={48} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{
          fontSize: '0.875rem', fontWeight: 400, color: 'var(--foreground)',
          marginBottom: '6px', overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4',
          opacity: 0.85
        }}>
          {product.nama_barang}
        </div>
        
        {/* Focus on Price */}
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Rp {Number(product.harga).toLocaleString('id-ID')}
        </div>
        
        {/* Spacer to push store info to bottom */}
        <div style={{ flex: 1 }}></div>

        {/* Small metadata */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', opacity: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>
            <Icons.Store size={12} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
              {product.user?.name || 'Penjual'}
            </span>
          </div>

          {product.distance_km != null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '0.75rem', color: 'var(--foreground)', fontWeight: 500
            }}>
              <Icons.MapPin size={10} />
              {product.distance_km} km
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
