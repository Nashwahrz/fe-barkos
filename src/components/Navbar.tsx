'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { APP_NAME, USER_ROLES } from '@/lib/constants';
import { useAuth } from '@/components/AuthProvider';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/Icons';
import { getStorageUrl } from '@/lib/api';
import { notificationApi } from '@/services/api/notification.api';
import { AppNotification } from '@/types/notification';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [theme, setTheme] = useState('light');
  
  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user && !pathname.startsWith('/admin')) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 3000); // refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [user, pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const handleNotifClick = async (notif: AppNotification) => {
    setShowNotif(false);
    if (!notif.read_at) {
      try {
        await notificationApi.markAsRead(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
      } catch (err) {
        console.error(err);
      }
    }
    
    // Routing based on type
    const t = notif.data.type;
    if (t === 'new_offer') router.push('/seller/offers');
    else if (t === 'offer_accepted' || t === 'offer_rejected') router.push('/offers');
    else if (t === 'new_order' || t === 'payment_uploaded' || t === 'order_cancelled') router.push(`/seller/orders`);
    else if (t === 'order_confirmed' || t === 'order_rejected' || t === 'order_completed') router.push(`/orders`);
    else router.push('/');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  const isActive = (path: string) => pathname === path;

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <>
      {/* ── Top Navbar ──────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow)'
      }}>
        <div className="container flex items-center justify-between" style={{ height: '56px' }}>

          {/* Logo */}
          <Link href="/" style={{
            fontSize: '1.15rem', fontWeight: 900, color: '#16a34a',
            letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '8px',
            textDecoration: 'none'
          }}>
            <img
              src="/icon-512x512.png"
              alt={APP_NAME}
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            />
            <span className="hide-mobile">{APP_NAME.toUpperCase()}</span>
          </Link>

          {/* Center Nav Links — hidden on mobile (handled by bottom nav) */}
          {user && !pathname.startsWith('/admin') && (
            <div className="nav-links">
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
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
              Panel Administrasi
            </div>
          )}

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--input)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, cursor: 'pointer', border: 'none',
                color: 'var(--foreground)'
              }}
            >
              {theme === 'light' ? <Icons.Moon size={17} /> : <Icons.Sun size={17} />}
            </button>
            
            {/* Notification Bell */}
            {user && !pathname.startsWith('/admin') && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--input)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, cursor: 'pointer', border: 'none',
                    color: 'var(--foreground)'
                  }}
                >
                  <Icons.Bell size={17} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '-2px', right: '-2px',
                      background: '#ef4444', color: 'white', fontSize: '0.65rem',
                      fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid var(--card)'
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Notifikasi */}
                {showNotif && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                      onClick={() => setShowNotif(false)}
                    />
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                      width: '320px', maxHeight: '400px', overflowY: 'auto',
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      zIndex: 100, display: 'flex', flexDirection: 'column'
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 2 }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Notifikasi</h3>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                            Tandai semua dibaca
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                            Belum ada notifikasi.
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <button
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              style={{
                                display: 'flex', gap: '12px', padding: '12px 16px',
                                borderBottom: '1px solid var(--border)', background: notif.read_at ? 'transparent' : 'rgba(22,163,74,0.05)',
                                textAlign: 'left', borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                                cursor: 'pointer', transition: 'background 0.15s'
                              }}
                            >
                              <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: notif.read_at ? 'transparent' : 'var(--primary)',
                                marginTop: '6px', flexShrink: 0
                              }} />
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', lineHeight: 1.4, margin: 0, fontWeight: notif.read_at ? 400 : 600 }}>
                                  {notif.data.message}
                                </p>
                                <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                                  {new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PWA Install — hide on mobile to save space */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                title="Install Aplikasi"
                className="hide-mobile"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem',
                  fontWeight: 700, color: '#16a34a',
                  background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                <Icons.Download size={14} color="#16a34a" />
                Install
              </button>
            )}

            {!loading && (
              <>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {user.role === USER_ROLES.SUPER_ADMIN && !pathname.startsWith('/admin') && (
                      <Link href="/admin/dashboard" className="hide-mobile" style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0, textDecoration: 'none'
                      }} title="Admin">
                        <Icons.Shield size={17} color="#7c3aed" />
                      </Link>
                    )}
                    {user.role === USER_ROLES.PENJUAL ? (
                      <div className="hide-mobile" style={{ display: 'flex', gap: '6px' }}>
                        <Link href="/seller/products" style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0, textDecoration: 'none'
                        }} title="Lapak Saya">
                          <Icons.Store size={17} color="#16a34a" />
                        </Link>
                        <Link href="/seller/offers" style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'rgba(236,72,153,0.08)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0, textDecoration: 'none'
                        }} title="Penawaran">
                          <Icons.Zap size={17} color="#ec4899" />
                        </Link>
                        <Link href="/seller/promotions" style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'rgba(217,119,6,0.08)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0, textDecoration: 'none'
                        }} title="Boost">
                          <Icons.Zap size={17} color="#d97706" />
                        </Link>
                        <Link href="/seller/bank-accounts" style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0, textDecoration: 'none'
                        }} title="Rekening">
                          <Icons.CreditCard size={17} color="#2563eb" />
                        </Link>
                      </div>
                    ) : (
                      <Link href="/seller/register" className="hide-mobile" style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem',
                        fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.08)',
                        border: '1px solid rgba(22,163,74,0.2)',
                        textDecoration: 'none'
                      }}>
                        <Icons.Store size={14} color="#16a34a" />
                        Mulai Jual
                      </Link>
                    )}

                    {/* Chat — visible on desktop only (mobile has bottom nav) */}
                    {!pathname.startsWith('/admin') && (
                      <Link href="/chat" className="hide-mobile" style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--input)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0, textDecoration: 'none',
                        color: 'var(--foreground)'
                      }} title="Pesan">
                        <Icons.MessageCircle size={17} />
                      </Link>
                    )}

                    {/* Profile Avatar */}
                    <Link href="/profile" style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '4px 10px 4px 4px', borderRadius: '20px',
                      border: '1.5px solid var(--border)', background: 'var(--card)',
                      transition: 'border-color 0.15s', textDecoration: 'none'
                    }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
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
                      <span className="hide-mobile" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>
                        {user.name.split(' ')[0]}
                      </span>
                    </Link>

                    <button
                      onClick={logout}
                      title="Keluar"
                      className="hide-mobile"
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
                      padding: '7px 14px', borderRadius: '7px', fontWeight: 600,
                      fontSize: '0.875rem', border: '1.5px solid var(--border)', color: 'var(--foreground)',
                      background: 'var(--card)', textDecoration: 'none'
                    }}>
                      Masuk
                    </Link>
                    <Link href="/auth/register" className="btn btn-primary" style={{
                      padding: '7px 14px', borderRadius: '7px', fontWeight: 600,
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

      {/* ── Mobile Bottom Navigation ─────────────────────────────── */}
      {user && !pathname.startsWith('/admin') && (
        <nav className="mobile-bottom-nav">
          {[
            { href: '/', icon: <Icons.Store size={22} />, label: 'Beranda' },
            { href: '/products', icon: <Icons.Search size={22} />, label: 'Katalog' },
            { href: '/chat', icon: <Icons.MessageCircle size={22} />, label: 'Pesan' },
            { href: '/profile', icon: <Icons.User size={22} />, label: 'Profil' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '4px 12px', textDecoration: 'none', minWidth: '56px',
              color: isActive(item.href) ? 'var(--primary)' : 'var(--foreground)',
              opacity: isActive(item.href) ? 1 : 0.55,
              transition: 'all 0.15s'
            }}>
              {item.icon}
              <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
