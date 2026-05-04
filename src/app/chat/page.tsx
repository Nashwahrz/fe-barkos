'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

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
      <div className="flex items-center justify-center min-h-screen">
        <div style={{ fontSize: '1.2rem', opacity: 0.5 }}>Memuat obrolan...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 1rem', maxWidth: '850px' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem', color: '#111827' }}>📬 Pesan Saya</h1>
        <p style={{ opacity: 0.7, fontSize: '1rem' }}>Kelola komunikasi dengan penjual atau calon pembeli barang Anda.</p>
      </header>

      {conversations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 1rem', background: 'white', border: '1px dashed var(--border)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>💬</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111827' }}>Belum Ada Percakapan</h2>
          <p style={{ opacity: 0.6, maxWidth: '400px', margin: '0 auto' }}>Anda belum memulai chat dengan penjual manapun. Cari barang menarik dan mulai tawar!</p>
          <Link href="/products" className="btn btn-primary" style={{ marginTop: '2rem', padding: '12px 30px', fontWeight: 700 }}>Jelajahi Katalog</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  transition: 'all 0.2s ease', 
                  border: unreadCount > 0 ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: unreadCount > 0 ? 'var(--primary-light)' : 'white',
                  padding: '1.5rem',
                  boxShadow: unreadCount > 0 ? '0 10px 15px -3px rgba(22, 163, 74, 0.08)' : 'var(--shadow)'
                }}
              >
                <div className="flex items-center gap-5">
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {otherUser?.foto ? (
                      <img src={getStorageUrl(otherUser.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      otherUser?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111827', marginBottom: '0.2rem' }}>{otherUser?.name}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1rem' }}>📦</span> {product?.nama_barang}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: unreadCount > 0 ? '#111827' : '#6b7280', fontWeight: unreadCount > 0 ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }}>
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
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>
                    {new Date(lastMsg?.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                  {unreadCount > 0 && (
                    <div style={{ background: '#ef4444', color: 'white', fontWeight: 900, fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)' }}>
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
