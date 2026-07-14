'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/Icons';

export default function ChatListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadConversations();
    }
  }, [user, authLoading, router]);

  async function loadConversations() {
    try {
      const data = await fetchApi('/conversations');
      setConversations(data.data || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: 'var(--foreground)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.5 }}>
          <Icons.Loader size={32} />
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat obrolan...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 1rem', maxWidth: '850px' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icons.MessageSquare size={32} color="var(--primary)" /> Pesan Saya
        </h1>
        <p style={{ opacity: 0.6, fontSize: '1rem', color: 'var(--foreground)' }}>Kelola komunikasi dengan penjual atau calon pembeli Anda.</p>
      </header>

      {conversations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--card)', border: '1px dashed var(--border)', boxShadow: 'none' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--foreground)', opacity: 0.5 }}>
            <Icons.MessageCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--foreground)' }}>Belum Ada Percakapan</h2>
          <p style={{ opacity: 0.6, maxWidth: '400px', margin: '0 auto 2rem', color: 'var(--foreground)', fontSize: '0.95rem', lineHeight: 1.6 }}>Anda belum memulai chat dengan pengguna manapun. Cari barang menarik dan mulai tawar!</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button href="/products" variant="primary" size="lg">Jelajahi Katalog</Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {conversations.map((conv, idx) => {
            const lastMsg = conv.last_message;
            const otherUser = conv.other_user || { id: 0, name: 'Pengguna' };
            const unreadCount = conv.unread_count;
            const product = lastMsg.product;
            
            return (
              <Link 
                href={`/chat/${product.id}/${otherUser.id}`} 
                key={idx}
                className="card flex items-center justify-between"
                style={{ 
                  transition: 'all 0.2s', 
                  border: `1px solid ${unreadCount > 0 ? 'var(--primary)' : 'var(--border)'}`,
                  background: unreadCount > 0 ? 'var(--primary-light)' : 'var(--card)',
                  padding: '1.25rem 1.5rem',
                  boxShadow: unreadCount > 0 ? 'var(--shadow-sm)' : 'none',
                  textDecoration: 'none'
                }}
                onMouseEnter={e => {
                  if (unreadCount === 0) e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  if (unreadCount === 0) e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-center gap-4">
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--input)', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.25rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {otherUser?.foto ? (
                      <img src={getStorageUrl(otherUser.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      otherUser?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)', marginBottom: '4px' }}>{otherUser?.name}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icons.Package size={14} /> {product?.nama_barang}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: unreadCount > 0 ? 'var(--foreground)' : 'var(--foreground)', opacity: unreadCount > 0 ? 1 : 0.6, fontWeight: unreadCount > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }}>
                      {lastMsg?.sender?.id === user?.id ? 'Anda: ' : ''}
                      {(() => {
                        const m = lastMsg?.message;
                        if (!m) return '';
                        if (m.startsWith('[LOCATION:')) return '📍 Mengirim lokasi';
                        if (m === '[REQUEST_PHONE]') return '📞 Meminta Nomor WA';
                        if (m.startsWith('[PHONE:')) return '📞 Membagikan Nomor WA';
                        if (m.startsWith('[ORDER_INFO:')) return '📦 Info Pesanan: #' + m.split(':')[1].split(',')[0];
                        return m;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.5, fontWeight: 500 }}>
                    {new Date(lastMsg?.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                  {unreadCount > 0 && (
                    <div style={{ background: 'var(--danger)', color: 'white', fontWeight: 700, fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px' }}>
                      {unreadCount} Pesan Baru
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
