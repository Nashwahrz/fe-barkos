'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChatDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  
  const productId = params.productId as string;
  const otherUserId = params.userId as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and check auth
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load initial data and start polling
  useEffect(() => {
    if (!user) return;

    loadMessages();
    markAsRead();
    loadProductInfo();

    const interval = setInterval(() => {
      loadMessages(false); // background poll
    }, 3000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, productId, otherUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function loadProductInfo() {
    try {
      const data = await fetchApi(`/products/${productId}`);
      setProduct(data.data || data);
      
      // If we are the buyer, the other user is the seller (product.user)
      if (user?.id !== data.data?.user_id && data.data?.user?.id.toString() === otherUserId) {
        setOtherUser(data.data.user);
      }
    } catch (err) {
      console.error('Failed to load product', err);
    }
  }

  async function loadMessages(initial = true) {
    if (!otherUserId || otherUserId === 'undefined') {
      if (initial) setLoading(false);
      return;
    }

    try {
      const data = await fetchApi(`/products/${productId}/chats/${otherUserId}`);
      const newMessages = data.data || [];
      
      setMessages(prev => {
        // Only scroll if new messages arrived
        if (prev.length !== newMessages.length) {
          setTimeout(scrollToBottom, 100);
        }
        return newMessages;
      });

      // Try to extract otherUser from messages if product info failed
      if (newMessages.length > 0 && !otherUser) {
        const sampleMsg = newMessages[0];
        if (sampleMsg.sender?.id?.toString() === otherUserId) setOtherUser(sampleMsg.sender);
        else if (sampleMsg.receiver?.id?.toString() === otherUserId) setOtherUser(sampleMsg.receiver);
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      if (initial) setLoading(false);
    }
  }

  async function markAsRead() {
    if (!otherUserId || otherUserId === 'undefined') return;
    try {
      await fetchApi(`/products/${productId}/chats/${otherUserId}/read`, { method: 'PATCH' });
    } catch (err) {
      // Ignore read errors
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const tempMessage = newMessage;
    setNewMessage('');
    setSending(true);

    try {
      await fetchApi(`/products/${productId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: tempMessage,
          receiver_id: otherUserId
        })
      });
      
      await loadMessages(false);
      markAsRead();
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pesan');
      setNewMessage(tempMessage); // Restore on fail
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', background: '#f0f2f1' }}>
      
      {/* Chat Header */}
      <div style={{ padding: '0.8rem 1.5rem', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <button onClick={() => router.push('/chat')} style={{ fontSize: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          ⬅️
        </button>
        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {otherUser?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', lineHeight: '1.2' }}>{otherUser?.name || 'Memuat...'}</div>
          {product && (
            <Link href={`/products/${product.id}`} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
              <span style={{ fontSize: '0.9rem' }}>📦</span> {product.nama_barang}
            </Link>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading || authLoading ? (
          <div style={{ margin: 'auto', opacity: 0.5, fontWeight: 600 }}>Memuat percakapan...</div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.6, background: 'white', padding: '2rem 3rem', borderRadius: '1.5rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
            <h3 style={{ fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Say Hello!</h3>
            <p style={{ fontSize: '0.9rem' }}>Mulai obrolan dengan {otherUser?.name || 'penjual'}</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender?.id === user?.id;
            return (
              <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  background: isMe ? 'var(--primary)' : 'white', 
                  color: isMe ? 'white' : '#111827',
                  padding: '0.7rem 1rem', 
                  borderRadius: '1.25rem',
                  borderTopRightRadius: isMe ? '4px' : '1.25rem',
                  borderTopLeftRadius: !isMe ? '4px' : '1.25rem',
                  boxShadow: isMe ? '0 4px 12px rgba(22, 163, 74, 0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
                  position: 'relative',
                  border: isMe ? 'none' : '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '0.95rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg.message}</div>
                  <div style={{ 
                    fontSize: '0.65rem', 
                    opacity: 0.8, 
                    textAlign: 'right', 
                    marginTop: '0.4rem', 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center', 
                    gap: '4px',
                    color: isMe ? 'rgba(255,255,255,0.9)' : '#9ca3af'
                  }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && <span style={{ color: msg.is_read ? '#4ade80' : 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 900 }}>✓✓</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ background: 'white', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 6px rgba(0,0,0,0.02)' }}>
        <form onSubmit={handleSendMessage} className="container flex gap-3" style={{ maxWidth: '900px', margin: '0 auto', padding: 0 }}>
          <input 
            type="text" 
            className="input-field" 
            style={{ flex: 1, borderRadius: '28px', padding: '0.8rem 1.5rem', background: '#f3f4f6', border: '1px solid transparent', outline: 'none', fontSize: '0.95rem' }} 
            placeholder="Tulis pesan Anda di sini..." 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            disabled={sending}
            autoFocus
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', transform: sending ? 'scale(0.9)' : 'scale(1)', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)' }}
            disabled={sending || !newMessage.trim()}
          >
            <span style={{ fontSize: '1.2rem' }}>✈️</span>
          </button>
        </form>
      </div>
    </div>
  );
}
