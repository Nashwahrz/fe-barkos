'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
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
    <div className="container" style={{ padding: '40px 1rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Pesan Saya</h1>

      {conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--input)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Belum ada pesan</h2>
          <p style={{ opacity: 0.6 }}>Anda belum memiliki percakapan dengan siapapun.</p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {conversations.map((conv, idx) => {
            const lastMsg = conv.last_message;
            const otherUser = conv.other_user || { id: 0, name: 'Pengguna Tidak Dikenal' };
            const unreadCount = conv.unread_count;
            const product = lastMsg.product;
            
            return (
              <Link 
                href={`/chat/${product.id}/${otherUser.id}`} 
                key={idx}
                className="card flex items-center justify-between"
                style={{ 
                  transition: 'transform 0.2s', 
                  border: unreadCount > 0 ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: unreadCount > 0 ? 'rgba(99, 102, 241, 0.05)' : 'var(--card)'
                }}
              >
                <div className="flex items-center gap-4">
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                    {otherUser?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{otherUser?.name}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                      📦 {product?.nama_barang}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: unreadCount > 0 ? 0.9 : 0.6, fontWeight: unreadCount > 0 ? 600 : 400 }}>
                      {lastMsg?.sender?.id === user?.id ? 'Anda: ' : ''}{lastMsg?.message.substring(0, 50)}{lastMsg?.message.length > 50 ? '...' : ''}
                    </div>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <div style={{ background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px' }}>
                    {unreadCount} Baru
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
