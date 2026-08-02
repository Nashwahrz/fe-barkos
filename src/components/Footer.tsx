'use client';

import Link from 'next/link';
import { Icons } from '@/components/Icons';
import { APP_NAME } from '@/lib/constants';
import { usePathname } from 'next/navigation';

const linkStyle: React.CSSProperties = {
  color: 'inherit',
  textDecoration: 'none',
  transition: 'color 0.2s',
  fontSize: '0.95rem',
};

const hoverIn = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = 'var(--primary)'; };
const hoverOut = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = 'inherit'; };

export default function Footer() {
  const pathname = usePathname();

  if (pathname.match(/^\/chat\/\d+\/\d+/)) {
    return null;
  }

  return (
    <footer className="footer-container" style={{
      background: 'var(--card)',
      borderTop: '1px solid var(--border)',
      marginTop: 'auto',
      color: 'var(--muted-foreground)'
    }}>
      {/* CTA band */}
      <div style={{
        background: 'var(--gradient-brand)',
        padding: '2.5rem 2rem',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
        }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
              Punya barang bekas nganggur di kos?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontSize: '0.95rem' }}>
              Jual dalam hitungan menit, langsung ke mahasiswa terdekat.
            </p>
          </div>
          <Link href="/auth/login?redirect=/seller/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#fff', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem',
            padding: '11px 22px', borderRadius: '10px', textDecoration: 'none',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)', transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Icons.Store size={16} /> Mulai Jual Sekarang
          </Link>
        </div>
      </div>

      <div style={{ padding: '4rem 2rem 2rem' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Brand Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--primary)' }}>
              <Icons.ShoppingBag size={24} />
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>{APP_NAME}</span>
            </div>
            <p style={{ lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: '300px' }}>
              Platform marketplace barang bekas mahasiswa terlengkap dan terpercaya. Jual beli barang bekas kos terdekat dengan mudah dan aman.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[Icons.Instagram, Icons.Twitter, Icons.Facebook].map((Icon, i) => (
                <a key={i} href="#" style={{
                  color: 'var(--muted-foreground)', transition: 'all 0.2s',
                  width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--primary-light)',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                ><Icon size={17} /></a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1.25rem' }}>Tautan Cepat</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <li><Link href="/" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Beranda</Link></li>
              <li><Link href="/products" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Katalog Produk</Link></li>
              <li><Link href="/auth/login?redirect=/seller/register" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Mulai Jual</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1.25rem' }}>Hubungi Kami</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icons.Mail size={16} />
                </div>
                <a href="mailto:kostmart@gmail.com" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>kostmart@gmail.com</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icons.Phone size={16} />
                </div>
                <a href="https://wa.me/6282171648974" target="_blank" rel="noopener noreferrer" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>0821-7164-8974</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '2rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem'
        }}>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} {APP_NAME}. Hak Cipta Dilindungi.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Syarat & Ketentuan</a>
            <a href="#" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Kebijakan Privasi</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
