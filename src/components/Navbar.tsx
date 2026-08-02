'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { APP_NAME, USER_ROLES, API_BASE_URL } from '@/lib/constants';
import { useAuth } from '@/components/AuthProvider';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/Icons';
import { getStorageUrl } from '@/lib/api';
import { notificationApi } from '@/services/api/notification.api';
import { AppNotification } from '@/types/notification';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { subscribeToPushNotifications } from '@/lib/api';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        // Beri tahu service worker alamat API supaya ia bisa lapor sendiri
        // kalau browser merotasi push subscription di background (lihat sw.js pushsubscriptionchange).
        navigator.serviceWorker.ready.then(readyReg => {
          readyReg.active?.postMessage({ type: 'SET_API_URL', url: API_BASE_URL });
        });

        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            setIsPushEnabled(true);
            
            // Auto-sync token push di background (sekali per sesi)
            if (user && !sessionStorage.getItem('pushSynced')) {
              subscribeToPushNotifications(sub)
                .then(() => sessionStorage.setItem('pushSynced', 'true'))
                .catch(err => console.error('Gagal sync push token:', err));
            }
          }
        });
      });
    }
  }, [user]);

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
    else if (t === 'promotion' && notif.data.product_id) router.push(`/products/${notif.data.product_id}`);
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

  const handlePushSubscribe = async () => {
    if (!VAPID_PUBLIC_KEY) {
      alert('VAPID Public Key belum diatur di .env.local!');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Izin notifikasi ditolak oleh peramban.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      // Force unsubscribe old subscription to ensure fresh VAPID keys are used
      if (subscription) {
        await subscription.unsubscribe();
      }
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      await subscribeToPushNotifications(subscription);
      setIsPushEnabled(true);
      alert('Notifikasi HP berhasil diaktifkan!');
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengaktifkan notifikasi: ' + err.message);
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

  if (pathname.match(/^\/chat\/\d+\/\d+/)) {
    return null;
  }

  return (
    <>
      {/* ── Top Navbar ──────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: navTransparent ? 'transparent' : 'var(--card)',
        borderBottom: navTransparent ? '1px solid transparent' : '1px solid var(--border)',
        boxShadow: navTransparent ? 'none' : '0 2px 20px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease'
      }}>
        <div className="container flex items-center justify-between" style={{ height: '64px', gap: '12px' }}>

          {/* ── Logo ── */}
          <Link href="/" style={{
            fontWeight: 800, color: textColor, whiteSpace: 'nowrap',
            letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px',
            textDecoration: 'none', transition: 'color 0.3s', flexShrink: 0,
          }}>
            <img
              src="/logo-lapak-kos.png"
              alt={APP_NAME}
              style={{ height: '34px', width: 'auto', objectFit: 'contain', filter: navTransparent ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.3s' }}
            />
            <span className="hide-mobile" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>{APP_NAME}</span>
          </Link>

          {/* ── Center Nav Links ── */}
          {user && !pathname.startsWith('/admin') && (
            <div className="hide-mobile" style={{ display: 'flex', gap: '2px', flex: 1, justifyContent: 'center' }}>
              {[
                { label: 'Beranda', href: '/' },
                { label: 'Katalog', href: '/products' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{
                  padding: '7px 16px', borderRadius: '8px', fontWeight: 500,
                  fontSize: '0.9rem',
                  color: (isActive(item.href) && !navTransparent) ? 'var(--primary)' : textColor,
                  background: (isActive(item.href) && !navTransparent) ? 'var(--primary-light)' : 'transparent',
                  transition: 'all 0.2s', textDecoration: 'none',
                  opacity: isActive(item.href) ? 1 : 0.75,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = (isActive(item.href) && !navTransparent) ? 'var(--primary-light)' : 'transparent'; e.currentTarget.style.opacity = isActive(item.href) ? '1' : '0.75'; }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {pathname.startsWith('/admin') && (
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: textColor, opacity: 0.6, flex: 1 }}>
              Panel Administrasi
            </div>
          )}

          {/* ── Right Actions ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>

            {/* Push Subscribe Button - Mobile/Desktop */}
            {user && !isPushEnabled && (
              <button
                onClick={handlePushSubscribe}
                title="Aktifkan Notif HP"
                className="hide-mobile"
                style={{
                  padding: '6px 12px', borderRadius: '8px', border: `1px solid ${navTransparent ? 'rgba(255,255,255,0.35)' : 'var(--primary)'}`,
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  color: navTransparent ? '#fff' : 'var(--primary)', background: navTransparent ? 'rgba(255,255,255,0.1)' : 'var(--primary-light)',
                  fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', marginRight: '4px'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.2)' : 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.1)' : 'var(--primary-light)'; e.currentTarget.style.color = navTransparent ? '#fff' : 'var(--primary)'; }}
              >
                <Icons.Bell size={15} /> Aktifkan Notif
              </button>
            )}

            {/* PWA Install Button */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="hide-mobile"
                title="Install Aplikasi"
                style={{
                  padding: '6px 12px', borderRadius: '8px', border: `1px solid ${navTransparent ? 'rgba(255,255,255,0.35)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  color: textColor, background: navTransparent ? 'rgba(255,255,255,0.1)' : 'transparent',
                  fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', marginRight: '4px'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.2)' : 'var(--input)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
              >
                <Icons.Download size={15} /> Install
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
              style={{
                width: '36px', height: '36px', borderRadius: '8px', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: textColor, opacity: 0.65, background: 'transparent', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'; e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.65'; }}
            >
              {theme === 'light' ? <Icons.Moon size={18} /> : <Icons.Sun size={18} />}
            </button>

            {/* Notification Bell */}
            {user && !pathname.startsWith('/admin') && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  title="Notifikasi"
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    color: textColor, opacity: 0.65, background: 'transparent', transition: 'all 0.2s', position: 'relative'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'; e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.65'; }}
                >
                  <Icons.Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '6px', right: '6px',
                      background: 'var(--primary)', width: '8px', height: '8px', borderRadius: '50%',
                      border: '2px solid var(--card)',
                    }} />
                  )}
                </button>

                {showNotif && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowNotif(false)} />
                    <div className="nav-dropdown-notif">
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 2, borderRadius: '14px 14px 0 0' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Notifikasi {unreadCount > 0 && <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '20px', padding: '1px 8px', fontSize: '0.72rem', marginLeft: '6px' }}>{unreadCount}</span>}</h3>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                            Tandai semua dibaca
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {notifications.filter(n => !n.read_at).length === 0 ? (
                          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.4, fontSize: '0.85rem' }}>
                            Belum ada notifikasi baru.
                          </div>
                        ) : (
                          notifications.filter(n => !n.read_at).map(notif => (
                            <button
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              style={{
                                display: 'flex', gap: '12px', padding: '12px 16px', border: 'none',
                                borderBottom: '1px solid var(--border)', background: notif.read_at ? 'transparent' : 'var(--primary-light)',
                                textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = notif.read_at ? 'rgba(0,0,0,0.02)' : 'var(--primary-light)'}
                              onMouseLeave={e => e.currentTarget.style.background = notif.read_at ? 'transparent' : 'var(--primary-light)'}
                            >
                              <div style={{
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: notif.read_at ? 'transparent' : 'var(--primary)',
                                marginTop: '5px', flexShrink: 0
                              }} />
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', lineHeight: 1.45, margin: 0, fontWeight: notif.read_at ? 400 : 600 }}>
                                  {notif.data.message}
                                </p>
                                <span style={{ fontSize: '0.73rem', opacity: 0.45, marginTop: '3px', display: 'block' }}>
                                  {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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

            {/* Seller Quick Links — Desktop Only */}
            {user && user.role === USER_ROLES.PENJUAL && !pathname.startsWith('/admin') && (
              <div className="hide-mobile" style={{ display: 'flex', gap: '2px', marginLeft: '4px', paddingLeft: '8px', borderLeft: `1px solid ${navTransparent ? 'rgba(255,255,255,0.2)' : 'var(--border)'}` }}>
                {[
                  { href: '/seller/dashboard', icon: <Icons.BarChart2 size={17} />, title: 'Dashboard' },
                  { href: '/seller/products', icon: <Icons.Package size={17} />, title: 'Lapak Saya' },
                  { href: '/seller/orders', icon: <Icons.ShoppingBag size={17} />, title: 'Pesanan' },
                  { href: '/seller/offers', icon: <Icons.Zap size={17} />, title: 'Tawaran' },
                  { href: '/seller/promotions', icon: <Icons.Megaphone size={17} />, title: 'Promosi' },
                ].map(item => (
                  <Link key={item.href} href={item.href} title={item.title} style={{
                    width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: pathname === item.href ? 'var(--primary)' : textColor,
                    opacity: pathname === item.href ? 1 : 0.6, textDecoration: 'none', transition: 'all 0.2s',
                    background: pathname === item.href ? 'var(--primary-light)' : 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.12)' : 'var(--primary-light)'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = pathname === item.href ? 'var(--primary-light)' : 'transparent'; e.currentTarget.style.opacity = pathname === item.href ? '1' : '0.6'; e.currentTarget.style.color = pathname === item.href ? 'var(--primary)' : textColor; }}
                  >
                    {item.icon}
                  </Link>
                ))}
              </div>
            )}

            {/* Chat icon */}
            {user && !pathname.startsWith('/admin') && (
              <Link href="/chat" title="Pesan" className="hide-mobile" style={{
                width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: pathname === '/chat' ? 'var(--primary)' : textColor,
                opacity: pathname === '/chat' ? 1 : 0.6, textDecoration: 'none', transition: 'all 0.2s',
                background: pathname === '/chat' ? 'var(--primary-light)' : 'transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.12)' : 'var(--primary-light)'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = pathname === '/chat' ? 'var(--primary-light)' : 'transparent'; e.currentTarget.style.opacity = pathname === '/chat' ? '1' : '0.6'; e.currentTarget.style.color = pathname === '/chat' ? 'var(--primary)' : textColor; }}
              >
                <Icons.MessageCircle size={17} />
              </Link>
            )}

            {/* Separator before user section */}
            {user && <div style={{ width: '1px', height: '22px', background: navTransparent ? 'rgba(255,255,255,0.2)' : 'var(--border)', margin: '0 4px' }} />}

            {!loading && (
              <>
                {user ? (
                  <>
                    {/* Admin shortcut */}
                    {user.role === USER_ROLES.SUPER_ADMIN && !pathname.startsWith('/admin') && (
                      <Link href="/admin/dashboard" title="Panel Admin" className="hide-mobile" style={{
                        padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                        color: textColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                        opacity: 0.75, transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.75'; }}
                      >
                        <Icons.Shield size={16} /> Admin
                      </Link>
                    )}

                    {/* Mulai Jual for buyers */}
                    {user.role !== USER_ROLES.PENJUAL && user.role !== USER_ROLES.SUPER_ADMIN && (
                      <Link href="/seller/register" className="hide-mobile" style={{
                        padding: '7px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                        color: navTransparent ? '#fff' : 'var(--primary)',
                        border: `1px solid ${navTransparent ? 'rgba(255,255,255,0.35)' : 'var(--primary)'}`,
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'all 0.2s', background: navTransparent ? 'rgba(255,255,255,0.1)' : 'var(--primary-light)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.2)' : 'var(--primary)'; e.currentTarget.style.color = navTransparent ? '#fff' : '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.1)' : 'var(--primary-light)'; e.currentTarget.style.color = navTransparent ? '#fff' : 'var(--primary)'; }}
                      >
                        <Icons.Store size={15} /> Mulai Jual
                      </Link>
                    )}

                    {/* Profile Dropdown */}
                    {user.role !== USER_ROLES.SUPER_ADMIN && (
                      <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '5px 10px 5px 5px', borderRadius: '24px', border: `1px solid ${navTransparent ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                          background: navTransparent ? 'rgba(255,255,255,0.08)' : 'transparent', transition: 'all 0.2s', cursor: 'pointer'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.15)' : 'var(--input)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = navTransparent ? 'rgba(255,255,255,0.08)' : 'transparent'; }}
                        >
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: navTransparent ? 'rgba(255,255,255,0.25)' : 'var(--primary-light)',
                            color: navTransparent ? '#fff' : 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, overflow: 'hidden'
                          }}>
                            {user.avatar ? (
                              <img src={getStorageUrl(user.avatar) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="hide-mobile" style={{ fontWeight: 600, fontSize: '0.85rem', color: textColor }}>
                            {user.name.split(' ')[0]}
                          </span>
                          <Icons.ChevronDown size={13} style={{ opacity: 0.5, color: textColor, transition: 'transform 0.2s', transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </button>

                        {showProfileDropdown && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowProfileDropdown(false)} />
                            <div className="nav-dropdown-profile">

                              {/* User info header */}
                              <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>{user.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '1px' }}>{user.email}</div>
                              </div>

                              {/* Seller menu — mobile only */}
                              {user.role === USER_ROLES.PENJUAL && (
                                <div className="mobile-only-menu">
                                  <div style={{ padding: '6px 12px 2px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Toko Saya</div>
                                  {[
                                    { href: '/seller/dashboard', icon: <Icons.BarChart2 size={15} />, label: 'Dashboard' },
                                    { href: '/seller/products', icon: <Icons.Package size={15} />, label: 'Lapak Saya' },
                                    { href: '/seller/orders', icon: <Icons.ShoppingBag size={15} />, label: 'Pesanan Masuk' },
                                    { href: '/seller/offers', icon: <Icons.Zap size={15} />, label: 'Tawaran Masuk' },
                                    { href: '/seller/promotions', icon: <Icons.Megaphone size={15} />, label: 'Promosi' },
                                  ].map(item => (
                                    <Link key={item.href} href={item.href} onClick={() => setShowProfileDropdown(false)} style={dropdownItemStyle}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--input)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                      {item.icon} {item.label}
                                    </Link>
                                  ))}
                                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                                </div>
                              )}

                              <Link href="/profile" onClick={() => setShowProfileDropdown(false)} style={dropdownItemStyle}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--input)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <Icons.User size={15} /> Profil Saya
                              </Link>
                              <Link href="/orders" onClick={() => setShowProfileDropdown(false)} style={dropdownItemStyle}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--input)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <Icons.ShoppingBag size={15} /> Pesanan Saya
                              </Link>

                              {/* Install & Push — in dropdown */}
                              {deferredPrompt && (
                                <button onClick={() => { setShowProfileDropdown(false); handleInstallClick(); }} style={{
                                  ...dropdownItemStyle, cursor: 'pointer', textAlign: 'left', background: 'transparent', border: 'none', width: '100%'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--input)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <Icons.Download size={15} /> Install Aplikasi
                                </button>
                              )}
                              {!isPushEnabled && (
                                <button onClick={() => { setShowProfileDropdown(false); handlePushSubscribe(); }} style={{
                                  ...dropdownItemStyle, cursor: 'pointer', textAlign: 'left', background: 'transparent', border: 'none', width: '100%', color: 'var(--primary)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--input)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <Icons.Bell size={15} /> Aktifkan Notif HP
                                </button>
                              )}

                              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                              <button onClick={() => { setShowProfileDropdown(false); logout(); }} style={{
                                ...dropdownItemStyle, color: '#ef4444', cursor: 'pointer', textAlign: 'left', background: 'transparent', border: 'none'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <Icons.LogOut size={15} /> Keluar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Link href="/auth/login" style={{ color: textColor, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, padding: '7px 14px', borderRadius: '8px', opacity: 0.8, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                    >Masuk</Link>
                    <Link href="/auth/register" style={{
                      padding: '7px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700,
                      background: navTransparent ? 'rgba(255,255,255,0.92)' : 'var(--gradient-brand)',
                      color: navTransparent ? 'var(--primary)' : '#fff', textDecoration: 'none',
                      transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(13,148,136,0.35)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(13,148,136,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(13,148,136,0.35)'; }}
                    >Daftar</Link>
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
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '6px 14px', textDecoration: 'none', minWidth: '56px', borderRadius: '10px',
              color: isActive(item.href) ? 'var(--primary)' : 'var(--foreground)',
              background: isActive(item.href) ? 'var(--primary-light)' : 'transparent',
              opacity: isActive(item.href) ? 1 : 0.5,
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


