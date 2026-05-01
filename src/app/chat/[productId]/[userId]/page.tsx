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
    <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', background: '#efeae2' }}>
      
      {/* Chat Header */}
      <div style={{ padding: '0.75rem 1rem', background: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 10 }}>
        <button onClick={() => router.push('/chat')} style={{ fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ⬅️
        </button>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
          {otherUser?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: '1.2' }}>{otherUser?.name || 'Memuat pengguna...'}</div>
          {product && (
            <Link href={`/products/${product.id}`} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', display: 'block', marginTop: '2px' }}>
              📦 {product.nama_barang}
            </Link>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading || authLoading ? (
          <div style={{ margin: 'auto', opacity: 0.5 }}>Memuat pesan...</div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.5, background: 'rgba(255,255,255,0.8)', padding: '1rem 2rem', borderRadius: '1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👋</div>
            <p>Mulai percakapan dengan {otherUser?.name || 'pengguna ini'}</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender?.id === user?.id;
            return (
              <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  background: isMe ? '#dcf8c6' : '#ffffff', 
                  color: '#000000',
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '0.75rem',
                  borderTopRightRadius: isMe ? '0' : '0.75rem',
                  borderTopLeftRadius: !isMe ? '0' : '0.75rem',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '0.95rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.6, textAlign: 'right', marginTop: '0.2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && <span style={{ color: msg.is_read ? '#53bdeb' : '#999' }}>✓✓</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ background: 'var(--card)', padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <form onSubmit={handleSendMessage} className="container flex gap-2" style={{ maxWidth: '800px', margin: '0 auto', padding: 0 }}>
          <input 
            type="text" 
            className="input-field" 
            style={{ flex: 1, borderRadius: '24px', padding: '0.75rem 1.25rem', background: 'var(--input)', border: 'none', outline: 'none' }} 
            placeholder="Ketik pesan..." 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            disabled={sending}
            autoFocus
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', transform: sending ? 'scale(0.9)' : 'scale(1)' }}
            disabled={sending || !newMessage.trim()}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
