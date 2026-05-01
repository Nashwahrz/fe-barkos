'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function ChatRoomPage() {
  const { productId, userId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If we've waited and params are still missing, something is wrong
    const timer = setTimeout(() => {
      if (loading && (!productId || !userId)) {
        setLoading(false);
        setError("Parameter obrolan tidak ditemukan.");
      }
    }, 5000);

    if (!authLoading && productId && userId) {
      if (!user) {
        router.replace('/auth/login');
      } else if (productId !== 'undefined' && userId !== 'undefined') {
        loadInitialData();
      }
    }
    return () => clearTimeout(timer);
  }, [user, authLoading, router, productId, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Polling for new messages with focus detection
  useEffect(() => {
    if (!user || !productId || !userId || productId === 'undefined' || userId === 'undefined') return;

    let isTabFocused = true;
    const handleFocus = () => { isTabFocused = true; fetchMessages(false); };
    const handleBlur = () => { isTabFocused = false; };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    const poll = setInterval(() => {
      if (document.hasFocus()) {
        fetchMessages(false);
      }
    }, 2000); // Improved speed: 2 seconds

    return () => {
      clearInterval(poll);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user, productId, userId]);

  async function loadInitialData() {
    if (!productId || !userId || productId === 'undefined' || userId === 'undefined') {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // Fetch product and other user info
      await Promise.all([
        fetchMessages(true),
        fetchApi(`/products/${productId}`).then(res => setProduct(res.data || res)).catch(e => {
          console.error(e);
          setError("Gagal memuat info produk.");
        }),
        fetchApi(`/users/${userId}`).then(res => setOtherUser(res.data || res)).catch(e => {
          console.error(e);
          setError("Gagal memuat info lawan bicara.");
        })
      ]);
      
      // Mark as read
      await fetchApi(`/products/${productId}/chats/${userId}/read`, { method: 'PATCH' }).catch(() => {});
    } catch (err) {
      console.error('Failed to load chat data:', err);
      setError("Terjadi kesalahan saat memuat obrolan.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(showLoading: boolean) {
    if (!productId || !userId || productId === 'undefined' || userId === 'undefined') return;
    try {
      const data = await fetchApi(`/products/${productId}/chats/${userId}`);
      const newMessages = data.data || data;
      
      setMessages(prev => {
        // Only update if there are changes or new messages
        if (newMessages.length === prev.length) {
            // Check if last message read status changed
            const lastPrev = prev[prev.length - 1];
            const lastNew = newMessages[newMessages.length - 1];
            if (lastPrev?.is_read === lastNew?.is_read) return prev;
        }

        // If there are new messages from other user, mark as read
        if (newMessages.length > prev.length) {
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.sender.id !== user?.id && !lastMsg.is_read) {
                fetchApi(`/products/${productId}/chats/${userId}/read`, { method: 'PATCH' }).catch(() => {});
            }
        }

        return newMessages;
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    
    // Optimistic message
    const tempId = Date.now();
    const optimisticMsg = {
        id: tempId,
        message: messageText,
        sender: { id: user?.id },
        receiver: { id: parseInt(userId as string) },
        is_read: false,
        created_at: new Date().toISOString(),
        is_optimistic: true
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      setSending(true);
      const data = await fetchApi(`/products/${productId}/chats`, {
        method: 'POST',
        body: JSON.stringify({
          message: messageText,
          receiver_id: userId
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      // Replace optimistic message with real message
      setMessages(prev => prev.map(m => m.id === tempId ? (data.data || data) : m));
    } catch (err) {
      alert('Gagal mengirim pesan.');
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageText); // Restore text
    } finally {
      setSending(false);
    }
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5 }}>Membuka obrolan...</div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center p-8 text-center" style={{ height: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Gagal Membuka Chat</h2>
      <p style={{ opacity: 0.6, marginBottom: '2rem', maxWidth: '400px' }}>{error}</p>
      <Link href="/chat" className="btn btn-primary">Kembali ke Daftar Pesan</Link>
    </div>
  );

  return (
    <div className="container" style={{ padding: '20px 1rem', maxWidth: '800px', height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Room */}
      <div className="card flex items-center justify-between" style={{ padding: '1rem 1.5rem', marginBottom: '1rem', borderRadius: '20px' }}>
        <div className="flex items-center gap-4">
          <Link href="/chat" style={{ fontSize: '1.2rem', opacity: 0.5 }}>&larr;</Link>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            {otherUser?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800 }}>{otherUser?.name}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Aktif berdiskusi</div>
          </div>
        </div>
        
        {product && (
          <Link href={`/products/${product.id}`} className="flex items-center gap-3" style={{ textDecoration: 'none', color: 'inherit', maxWidth: '200px' }}>
            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.nama_barang}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800 }}>Rp {product.harga.toLocaleString('id-ID')}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: 'var(--input)' }}>
                {product.foto && <img src={getStorageUrl(product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
          </Link>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '24px',
          marginBottom: '1rem',
          border: '1px solid var(--border)'
        }}
      >
        {messages.map((msg) => {
          const isMe = msg.sender.id === user?.id;
          return (
            <div 
              key={msg.id} 
              style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}
            >
              <div 
                style={{ 
                  padding: '12px 18px', 
                  borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: isMe ? 'var(--primary)' : 'white',
                  color: isMe ? 'white' : 'var(--foreground)',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: isMe ? 'none' : '1px solid var(--border)'
                }}
              >
                {msg.message}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: '4px', fontWeight: 600 }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isMe && (msg.is_read ? ' • Dibaca' : ' • Terkirim')}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4, fontStyle: 'italic' }}>
                Belum ada pesan. Mulai obrolan sekarang!
            </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="flex gap-2 items-center">
        <input 
          type="text" 
          placeholder="Tulis pesan Anda..." 
          className="input-field" 
          style={{ borderRadius: '30px', padding: '12px 25px' }}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={sending || !newMessage.trim()}
          className="btn btn-primary" 
          style={{ width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          {sending ? '...' : '🚀'}
        </button>
      </form>
    </div>
  );
}
