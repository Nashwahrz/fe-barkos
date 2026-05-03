'use client';

import Link from 'next/link';
import { APP_NAME, USER_ROLES } from '@/lib/constants';
import { useAuth } from '@/components/AuthProvider';
import { usePathname } from 'next/navigation';

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
          fontSize: '1.35rem', fontWeight: 900, color: '#16a34a',
          letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          🛍️ {APP_NAME.toUpperCase()}
        </Link>

        {/* Center Nav Links */}
        <div className="flex items-center gap-2" style={{ display: 'flex' }}>
          {[
            { label: 'Beranda', href: '/' },
            { label: 'Katalog', href: '/products' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              padding: '6px 14px', borderRadius: '6px', fontWeight: 600,
              fontSize: '0.9rem', color: isActive(item.href) ? '#16a34a' : '#374151',
              background: isActive(item.href) ? 'rgba(22,163,74,0.08)' : 'transparent',
              transition: 'all 0.15s'
            }}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  {user.role === USER_ROLES.SUPER_ADMIN && (
                    <Link href="/admin/dashboard" style={{
                      padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem',
                      fontWeight: 700, color: '#7c3aed',
                      background: 'rgba(124,58,237,0.08)'
                    }}>
                      🛡️ Admin
                    </Link>
                  )}
                  {user.role === USER_ROLES.PENJUAL && (
                    <>
                      <Link href="/seller/products" style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem',
                        fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.08)'
                      }}>
                        🏪 Lapak Saya
                      </Link>
                      <Link href="/seller/promotions" style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem',
                        fontWeight: 700, color: '#d97706', background: 'rgba(217,119,6,0.08)'
                      }}>
                        🔥 Boost
                      </Link>
                    </>
                  )}

                  {/* Chat Icon */}
                  <Link href="/chat" style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: '#f3f4f6', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1rem'
                  }}>
                    💬
                  </Link>

                  {/* Profile Avatar */}
                  <Link href="/profile" style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '4px 10px 4px 4px', borderRadius: '20px',
                    border: '1.5px solid #e5e7eb', background: 'white',
                    transition: 'border-color 0.15s'
                  }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: '#16a34a', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.8rem'
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>

                  <button
                    onClick={logout}
                    style={{
                      padding: '6px 14px', borderRadius: '6px', fontWeight: 600,
                      fontSize: '0.85rem', color: '#ef4444', background: 'rgba(239,68,68,0.07)',
                      border: 'none', cursor: 'pointer'
                    }}
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" style={{
                    padding: '7px 18px', borderRadius: '7px', fontWeight: 600,
                    fontSize: '0.9rem', border: '1.5px solid #d1d5db', color: '#374151',
                    background: 'white'
                  }}>
                    Masuk
                  </Link>
                  <Link href="/auth/register" className="btn btn-primary" style={{
                    padding: '7px 18px', borderRadius: '7px', fontWeight: 600,
                    fontSize: '0.9rem', boxShadow: '0 2px 8px rgba(22,163,74,0.25)'
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


