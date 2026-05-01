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

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div style={{ fontSize: '1.2rem', opacity: 0.5 }}>Memuat obrolan...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px 1rem', maxWidth: '800px', height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Chat Header */}
      <div className="card flex items-center justify-between" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: 'var(--radius)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/chat')} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}>
            ⬅️
          </button>
          <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
            {otherUser?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{otherUser?.name || 'Pengguna'}</div>
            {product && (
              <Link href={`/products/${product.id}`} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                📦 {product.nama_barang}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--input)', borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.5 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
            <p>Mulai percakapan dengan {otherUser?.name || 'pengguna ini'}!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender?.id === user?.id;
            return (
              <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{ 
                  background: isMe ? 'var(--primary)' : 'var(--card)', 
                  color: isMe ? 'white' : 'var(--foreground)',
                  padding: '0.75rem 1rem', 
                  borderRadius: '1.25rem',
                  borderBottomRightRadius: isMe ? '0.25rem' : '1.25rem',
                  borderBottomLeftRadius: !isMe ? '0.25rem' : '1.25rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: isMe ? 'none' : '1px solid var(--border)'
                }}>
                  {msg.message}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="flex gap-2" style={{ padding: '0.5rem 0' }}>
        <input 
          type="text" 
          className="input-field" 
          style={{ flex: 1, borderRadius: '30px', paddingLeft: '1.5rem' }} 
          placeholder="Ketik pesan..." 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          disabled={sending || !newMessage.trim()}
        >
          ➤
        </button>
      </form>
    </div>
  );
}
