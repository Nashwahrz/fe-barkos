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
import { Button } from '@/components/ui/Button';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [theme, setTheme] = useState('light');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user && !pathname.startsWith('/admin')) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 3000);
      return () => clearInterval(interval);
    }
  }, [user, pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err: any) {
      if (err?.status !== 401) {
        console.error('Failed to fetch notifications', err);
      }
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
    else if (t === 'new_order' || t === 'payment_uploaded' || t === 'order_cancelled') {
      if (notif.data.transaction_id) router.push(`/seller/orders/${notif.data.transaction_id}`);
      else router.push(`/seller/orders`);
    }
    else if (t === 'order_confirmed' || t === 'order_rejected' || t === 'order_completed') {
      if (notif.data.transaction_id) router.push(`/orders/${notif.data.transaction_id}`);
      else router.push(`/orders`);
    }
    else if (t === 'chat') router.push(`/chat`);
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

  const isHome = pathname === '/';
  const navTransparent = isHome && !isScrolled;
  const textColor = navTransparent ? '#ffffff' : 'var(--foreground)';

  const dropdownItemStyle = {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
    textDecoration: 'none', color: 'var(--foreground)', fontSize: '0.9rem',
    borderRadius: '8px', transition: 'background 0.2s'
  };

  return (
    <>
      {/* ── Top Navbar ──────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: navTransparent ? 'transparent' : 'var(--card)',
        borderBottom: navTransparent ? '1px solid transparent' : '1px solid var(--border)',
        boxShadow: navTransparent ? 'none' : '0 4px 20px rgba(0, 170, 91, 0.05)',
        transition: 'all 0.3s ease'
      }}>
        <div className="container flex items-center justify-between" style={{ height: '64px', gap: '16px' }}>

          {/* Logo */}
          <Link href="/" style={{
            fontSize: '1.25rem', fontWeight: 800, color: textColor,
            letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px',
            textDecoration: 'none', transition: 'color 0.3s'
          }}>
            <img
              src="/logo-lapak-kos.png"
              alt={APP_NAME}
              style={{ height: '32px', width: 'auto', objectFit: 'contain', filter: navTransparent ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.3s' }}
            />
            <span className="hide-mobile" style={{ marginLeft: '4px' }}>{APP_NAME.toUpperCase()}</span>
          </Link>

          {/* Center Nav Links — hidden on mobile */}
          {user && !pathname.startsWith('/admin') && (
            <div className="nav-links hide-mobile" style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: 'Beranda', href: '/' },
                { label: 'Katalog', href: '/products' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{
                  padding: '8px 16px', borderRadius: '8px', fontWeight: 500,
                  fontSize: '0.9rem', color: (isActive(item.href) && !navTransparent) ? 'var(--primary)' : textColor,
                  background: (isActive(item.href) && !navTransparent) ? 'var(--primary-light)' : 'transparent',
                  transition: 'all 0.2s', textDecoration: 'none',
                  opacity: isActive(item.href) ? 1 : 0.7
                }}
                onMouseEnter={e => {
                  if (!isActive(item.href) || navTransparent) e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={e => {
                  if (!isActive(item.href) || navTransparent) e.currentTarget.style.background = 'transparent';
                }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {pathname.startsWith('/admin') && (
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: textColor }}>
              Panel Administrasi
            </div>
          )}

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
              style={{
                width: '36px', height: '36px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
                color: textColor, opacity: 0.7, transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
            >
              {theme === 'light' ? <Icons.Moon size={18} /> : <Icons.Sun size={18} />}
            </button>
            
            {/* Notification Bell */}
            {user && !pathname.startsWith('/admin') && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
                    color: textColor, opacity: 0.7, transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
                >
                  <Icons.Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '4px', right: '4px',
                      background: 'var(--primary)', width: '8px', height: '8px', borderRadius: '50%',
                    }} />
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
                      borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
                      zIndex: 100, display: 'flex', flexDirection: 'column'
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 2 }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Notifikasi</h3>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
                            Tandai semua dibaca
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5, fontSize: '0.85rem' }}>
                            Belum ada notifikasi.
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <button
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              style={{
                                display: 'flex', gap: '12px', padding: '12px 16px',
                                borderBottom: '1px solid var(--border)', background: notif.read_at ? 'transparent' : 'var(--primary-light)',
                                textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s'
                              }}
                            >
                              <div style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: notif.read_at ? 'transparent' : 'var(--primary)',
                                marginTop: '6px', flexShrink: 0
                              }} />
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', lineHeight: 1.4, margin: 0, fontWeight: notif.read_at ? 400 : 500 }}>
                                  {notif.data.message}
                                </p>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '4px', display: 'block' }}>
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

            {/* PWA Install */}
            {deferredPrompt && (
              <Button size="sm" variant="secondary" onClick={handleInstallClick} className="hide-mobile">
                <Icons.Download size={14} /> Install
              </Button>
            )}

            {!loading && (
              <>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {user.role === USER_ROLES.SUPER_ADMIN && !pathname.startsWith('/admin') && (
                      <Link href="/admin/dashboard" className="hide-mobile nav-icon-btn" style={{
                        color: textColor, opacity: 0.7
                      }} title="Admin"
                      onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
                      >
                        <div style={{ flexShrink: 0, display: 'flex' }}>
                          <Icons.Shield size={18} />
                        </div>
                        <span className="nav-icon-text hide-tablet">
                          Admin
                        </span>
                      </Link>
                    )}
                    {user.role === USER_ROLES.PENJUAL ? (
                      <div className="hide-mobile" style={{ display: 'flex', gap: '4px' }}>
                        {[
                          { href: '/seller/dashboard', icon: <Icons.BarChart2 size={18} />, title: 'Dashboard' },
                          { href: '/seller/products', icon: <Icons.Package size={18} />, title: 'Lapak Saya' },
                          { href: '/seller/orders', icon: <Icons.ShoppingBag size={18} />, title: 'Pesanan Masuk' },
                          { href: '/seller/offers', icon: <Icons.Zap size={18} />, title: 'Tawaran Masuk' },
                          { href: '/seller/promotions', icon: <Icons.Megaphone size={18} />, title: 'Promosi' }
                        ].map(item => (
                          <Link key={item.href} href={item.href} className="nav-icon-btn" style={{
                            color: textColor, opacity: 0.7
                          }} title={item.title}
                          onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.opacity = '1'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
                          >
                            <div style={{ flexShrink: 0, display: 'flex' }}>
                              {item.icon}
                            </div>
                            <span className="nav-icon-text hide-tablet">
                              {item.title}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : user.role !== USER_ROLES.SUPER_ADMIN ? (
                      <Button href="/seller/register" size="sm" variant="ghost" className="hide-mobile" style={{ color: textColor }}>
                        <Icons.Store size={16} /> Mulai Jual
                      </Button>
                    ) : null}

                    {/* Chat */}
                    {!pathname.startsWith('/admin') && (
                      <Link href="/chat" className="hide-mobile nav-icon-btn" style={{
                        color: textColor, opacity: 0.7
                      }} title="Pesan"
                      onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
                      >
                        <div style={{ flexShrink: 0, display: 'flex' }}>
                          <Icons.MessageCircle size={18} />
                        </div>
                        <span className="nav-icon-text hide-tablet">
                          Pesan
                        </span>
                      </Link>
                    )}

                    {/* Profile & Logout Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px', position: 'relative' }}>
                      {user.role !== USER_ROLES.SUPER_ADMIN && (
                        <>
                          <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '4px 12px 4px 4px', borderRadius: '24px', border: 'none',
                            background: 'transparent', transition: 'background 0.2s', cursor: 'pointer'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '50%',
                              background: navTransparent ? 'rgba(255,255,255,0.2)' : 'var(--border)', color: textColor,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 500, fontSize: '0.85rem', flexShrink: 0, overflow: 'hidden'
                            }}>
                              {user.avatar ? (
                                <img src={getStorageUrl(user.avatar) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                user.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="hide-mobile" style={{ fontWeight: 500, fontSize: '0.85rem', color: textColor }}>
                              {user.name.split(' ')[0]}
                            </span>
                            <Icons.ChevronDown size={14} style={{ opacity: 0.5, color: textColor }} />
                          </button>

                          {showProfileDropdown && (
                            <>
                              <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowProfileDropdown(false)} />
                              <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                width: '220px', background: 'var(--card)', border: '1px solid var(--border)',
                                borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
                                zIndex: 100, display: 'flex', flexDirection: 'column', padding: '8px'
                              }}>
                                {user.role === USER_ROLES.PENJUAL && (
                                  <>
                                    <div style={{ padding: '8px 12px 4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Toko Saya</div>
                                    <Link href="/seller/dashboard" onClick={() => setShowProfileDropdown(false)} style={dropdownItemStyle}>
                                      <Icons.BarChart2 size={16} /> Dashboard
                                    </Link>
                                    <Link href="/seller/products" onClick={() => setShowProfileDropdown(false)} style={dropdownItemStyle}>
                                      <Icons.Package size={16} /> Lapak Saya
                                    </Link>
                                    <Link href="/seller/orders" onClick={() => setShowProfileDropdown(false)} style={dropdownItemStyle}>
                                      <Icons.ShoppingBag size={16} /> Pesanan Masuk
                                    </Link>
                                    <Link href="/seller/offers" onClick={() => setShowProfileDropdown(false)} style={dropdownItemStyle}>
                                      <Icons.Zap size={16} /> Tawaran Masuk
                                    </Link>
                                    <Link href="/seller/promotions" onClick={() => setShowProfileDropdown(false)} style={dropdownItemStyle}>
                                      <Icons.Megaphone size={16} /> Promosi
                                    </Link>
                                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                                    <div style={{ padding: '8px 12px 4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Akun</div>
                                  </>
                                )}
                                <Link href="/profile" onClick={() => setShowProfileDropdown(false)} style={dropdownItemStyle}>
                                  <Icons.User size={16} /> Profil Saya
                                </Link>
                                <Link href="/orders" onClick={() => setShowProfileDropdown(false)} style={dropdownItemStyle}>
                                  <Icons.ShoppingBag size={16} /> Pesanan Saya
                                </Link>
                                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                                <button onClick={() => { setShowProfileDropdown(false); logout(); }} style={{
                                  ...dropdownItemStyle, color: 'var(--danger)', cursor: 'pointer', textAlign: 'left', background: 'transparent', border: 'none'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <Icons.LogOut size={16} /> Keluar
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link href="/auth/login" style={{ color: textColor, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, padding: '8px 16px' }}>Masuk</Link>
                    <Button href="/auth/register" variant={navTransparent ? 'secondary' : 'primary'} size="sm">Daftar</Button>
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
            { href: '/', icon: <Icons.Compass size={22} />, label: 'Beranda' },
            { href: '/products', icon: <Icons.Search size={22} />, label: 'Katalog' },
            { href: '/chat', icon: <Icons.MessageCircle size={22} />, label: 'Pesan' },
            { href: '/profile', icon: <Icons.User size={22} />, label: 'Profil' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              padding: '6px 12px', textDecoration: 'none', minWidth: '56px',
              color: isActive(item.href) ? 'var(--primary)' : 'var(--foreground)',
              opacity: isActive(item.href) ? 1 : 0.5,
              transition: 'all 0.15s'
            }}>
              {item.icon}
              <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
