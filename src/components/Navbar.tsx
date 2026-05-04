'use client';

import Link from 'next/link';
import { APP_NAME, USER_ROLES } from '@/lib/constants';
import { useAuth } from '@/components/AuthProvider';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/Icons';
import { getStorageUrl } from '@/lib/api';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }}>
      <div className="container flex items-center justify-between" style={{ height: '64px' }}>

        {/* Logo */}
        <Link href="/" style={{
          fontSize: '1.25rem', fontWeight: 900, color: '#16a34a',
          letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '8px',
          textDecoration: 'none'
        }}>
          <img 
            src="/icon-512x512.png" 
            alt={APP_NAME} 
            style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
          />
          {APP_NAME.toUpperCase()}
        </Link>

        {/* Center Nav Links */}
        {!pathname.startsWith('/admin') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[
              { label: 'Beranda', href: '/' },
              { label: 'Katalog', href: '/products' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                padding: '6px 14px', borderRadius: '6px', fontWeight: 600,
                fontSize: '0.875rem', color: isActive(item.href) ? '#16a34a' : '#374151',
                background: isActive(item.href) ? 'rgba(22,163,74,0.08)' : 'transparent',
                transition: 'all 0.15s', textDecoration: 'none'
              }}>
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {pathname.startsWith('/admin') && (
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', letterSpacing: '-0.02em' }}>
            Panel Administrasi
          </div>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!loading && (
            <>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {user.role === USER_ROLES.SUPER_ADMIN && !pathname.startsWith('/admin') && (
                    <Link href="/admin/dashboard" style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem',
                      fontWeight: 700, color: '#7c3aed',
                      background: 'rgba(124,58,237,0.08)', textDecoration: 'none'
                    }}>
                      <Icons.Shield size={14} color="#7c3aed" />
                      Admin
                    </Link>
                  )}
                  {user.role === USER_ROLES.PENJUAL && !pathname.startsWith('/admin') && (
                    <>
                      <Link href="/seller/products" style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem',
                        fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.08)',
                        textDecoration: 'none'
                      }}>
                        <Icons.Store size={14} color="#16a34a" />
                        Lapak Saya
                      </Link>
                      <Link href="/seller/promotions" style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem',
                        fontWeight: 700, color: '#d97706', background: 'rgba(217,119,6,0.08)',
                        textDecoration: 'none'
                      }}>
                        <Icons.Zap size={14} color="#d97706" />
                        Boost
                      </Link>
                    </>
                  )}

                  {/* Chat Icon - Only show if NOT in admin panel */}
                  {!pathname.startsWith('/admin') && (
                    <Link href="/chat" style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#f3f4f6', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, textDecoration: 'none'
                    }} title="Pesan">
                      <Icons.MessageCircle size={17} color="#374151" />
                    </Link>
                  )}

                  {/* Profile Avatar */}
                  <Link href="/profile" style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '4px 10px 4px 4px', borderRadius: '20px',
                    border: '1.5px solid #e5e7eb', background: 'white',
                    transition: 'border-color 0.15s', textDecoration: 'none'
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#16a34a', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      {user.foto ? (
                        <img src={getStorageUrl(user.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>

                  <button
                    onClick={logout}
                    title="Keluar"
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(239,68,68,0.07)', border: 'none', cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <Icons.LogOut size={16} color="#ef4444" />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link href="/auth/login" style={{
                    padding: '7px 18px', borderRadius: '7px', fontWeight: 600,
                    fontSize: '0.875rem', border: '1.5px solid #d1d5db', color: '#374151',
                    background: 'white', textDecoration: 'none'
                  }}>
                    Masuk
                  </Link>
                  <Link href="/auth/register" className="btn btn-primary" style={{
                    padding: '7px 18px', borderRadius: '7px', fontWeight: 600,
                    fontSize: '0.875rem', boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
                    textDecoration: 'none'
                  }}>
                    Daftar
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
