'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ChatListPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else {
        loadConversations();
      }
    }
  }, [user, authLoading, router]);

  async function loadConversations() {
    try {
      setLoading(true);
      const data = await fetchApi('/conversations');
      setConversations(data.data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5 }}>Memuat percakapan...</div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '60px 1rem', maxWidth: '900px' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>💬 Pesan Anda</h1>
        <p style={{ opacity: 0.6 }}>Berdiskusi dengan penjual atau pembeli terkait barang bekas kos.</p>
      </header>

      {conversations.length === 0 ? (
        <div className="card" style={{ padding: '5rem', textAlign: 'center', opacity: 0.7 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📭</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Belum ada pesan.</h2>
          <p style={{ marginBottom: '2rem' }}>Pesan yang Anda kirim ke penjual atau pesan masuk dari pembeli akan muncul di sini.</p>
          <Link href="/products" className="btn btn-primary">Cari Barang Sekarang</Link>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {conversations.map((conv: any, index) => {
            const product = conv.last_message.product;
            const otherUser = conv.other_user;
            const lastMsg = conv.last_message;

            if (!product?.id || !otherUser?.id) return null;

            return (
              <Link 
                key={`${product.id}-${otherUser.id}`} 
                href={`/chat/${product.id}/${otherUser.id}`}
                className="card flex items-center gap-4 hover-scale"
                style={{ 
                  padding: '1.5rem', 
                  textDecoration: 'none', 
                  color: 'inherit',
                  border: conv.unread_count > 0 ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: conv.unread_count > 0 ? 'rgba(99, 102, 241, 0.03)' : 'var(--card-bg)'
                }}
              >
                {/* Product Thumbnail */}
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'var(--input)' }}>
                  {product.foto ? (
                    <img src={getStorageUrl(product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{otherUser.name}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                      {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
                    {product.nama_barang}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    opacity: conv.unread_count > 0 ? 1 : 0.6, 
                    fontWeight: conv.unread_count > 0 ? 700 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {lastMsg.sender.id === user.id ? 'Anda: ' : ''}{lastMsg.message}
                  </div>
                </div>

                {/* Unread Badge */}
                {conv.unread_count > 0 && (
                  <div style={{ 
                    background: 'var(--primary)', 
                    color: 'white', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.75rem', 
                    fontWeight: 800 
                  }}>
                    {conv.unread_count}
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
