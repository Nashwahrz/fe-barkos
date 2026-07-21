'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icons } from '@/components/Icons';

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
  const [activeOrder, setActiveOrder] = useState<any>(null);
  
  // Upload Proof State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [createdTransaction, setCreatedTransaction] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const searchParams = useSearchParams();
  const templateParam = searchParams.get('template');
  const [templateSent, setTemplateSent] = useState(false);

  const templates = {
    buyer: [
      "Halo, apakah barang ini masih ada?",
      "Bisa kurang tidak harganya?",
      "Boleh lihat foto aslinya?",
      "Kapan bisa ketemuan untuk cek barang?",
      "Bisa COD di depan gerbang kos?"
    ],
    seller: [
      "Halo, barang masih tersedia kak.",
      "Maaf, barang sudah terjual.",
      "Harga sudah pas/nett ya kak.",
      "Boleh, mau ketemuan jam berapa?",
      "Saya tunggu di lokasi ya."
    ]
  };

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

  useEffect(() => {
    if (templateParam === 'transfer_check' && !templateSent && !loading) {
      setTemplateSent(true);
      router.replace(`/chat/${productId}/${otherUserId}`);
      sendTemplate('[TRANSFER_CHECK]');
    }
  }, [templateParam, loading, templateSent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function loadProductInfo() {
    try {
      const data = await fetchApi(`/products/${productId}`);
      const productData = data.data || data;
      setProduct(productData);
      
      // Check if current user is the owner (seller)
      const currentUserId = Number(user?.id);
      const sellerId = Number(productData?.user_id || productData?.user?.id);
      setIsSeller(currentUserId === sellerId);

      // If we are the buyer, the other user is the seller
      if (currentUserId !== sellerId) {
        setOtherUser(productData.user);
      }
      
      // Try to find if there is an active order for this product between these users
      const transData = await fetchApi('/transactions');
      const allTrans = Array.isArray(transData) ? transData : (transData.data || []);
      
      const order = allTrans.find((t: any) => {
        const tProdId = t.product_id || (t.product && t.product.id);
        return Number(tProdId) === Number(productId);
      });
      
      if (order) setActiveOrder(order);
    } catch (err) {
      console.error('Failed to load product or order info', err);
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

      // Try to extract otherUser from messages if product info failed or we are the seller
      setOtherUser((prev: any) => {
        if (!prev && newMessages.length > 0) {
          const sampleMsg = newMessages[0];
          if (sampleMsg.sender?.id?.toString() === otherUserId) return sampleMsg.sender;
          if (sampleMsg.receiver?.id?.toString() === otherUserId) return sampleMsg.receiver;
        }
        return prev;
      });
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
    if (!newMessage.trim()) return;

    const tempMessage = newMessage;
    setNewMessage('');

    // Optimistic Update
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      message: tempMessage,
      sender: user,
      created_at: new Date().toISOString(),
      is_read: false,
      is_optimistic: true
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

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
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pesan');
      setNewMessage(tempMessage); // Restore on fail
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  }

  async function sendTemplate(text: string) {
    // Optimistic Update
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      message: text,
      sender: user,
      created_at: new Date().toISOString(),
      is_read: false,
      is_optimistic: true
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      await fetchApi(`/products/${productId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          receiver_id: otherUserId
        })
      });
      await loadMessages(false);
      markAsRead();
    } catch (err: any) {
      alert('Gagal mengirim template');
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  }

  async function handleSendLocation() {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung fitur lokasi.');
      return;
    }
    
    setSending(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await fetchApi(`/products/${productId}/chats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `[LOCATION:${position.coords.latitude},${position.coords.longitude}]`,
            receiver_id: otherUserId
          })
        });
        await loadMessages(false);
        setTimeout(scrollToBottom, 100);
      } catch (err: any) {
        alert('Gagal mengirim lokasi');
      } finally {
        setSending(false);
      }
    }, () => {
      alert('Akses lokasi ditolak. Harap izinkan akses lokasi di browser Anda.');
      setSending(false);
    });
  }

  async function handleRequestPhone() {
    setSending(true);
    try {
      await fetchApi(`/products/${productId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '[REQUEST_PHONE]', receiver_id: otherUserId })
      });
      await loadMessages(false);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      alert('Gagal meminta nomor telepon');
    } finally {
      setSending(false);
    }
  }

  async function handleSharePhone() {
    let phoneToShare = user?.phone;

    if (!phoneToShare) {
      const input = window.prompt('Anda belum mengatur nomor WA. Silakan masukkan nomor WA Anda (contoh: 0812...):');
      if (!input || !input.trim()) return;
      
      phoneToShare = input.trim();
      
      try {
        if (!user) return;
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', user.name);
        formData.append('phone', phoneToShare);
        if (user.asal_kampus) formData.append('asal_kampus', user.asal_kampus);

        await fetchApi('/profile', {
          method: 'POST',
          body: formData,
        });
      } catch(err) {
        console.error('Gagal menyimpan profil', err);
      }
    }

    setSending(true);
    try {
      await fetchApi(`/products/${productId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `[PHONE:${phoneToShare}]`, receiver_id: otherUserId })
      });
      await loadMessages(false);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      alert('Gagal membagikan nomor telepon');
    } finally {
      setSending(false);
    }
  }

  async function handleShareOrder() {
    if (!activeOrder) return;
    setSending(true);
    try {
      await fetchApi(`/products/${productId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `[ORDER_INFO:${activeOrder.id},${activeOrder.status},${activeOrder.agreed_price}]`, 
          receiver_id: otherUserId 
        })
      });
      await loadMessages(false);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      alert('Gagal membagikan info pesanan');
    } finally {
      setSending(false);
    }
  }

  async function handleCreateTransferOrder() {
    if (!product || !user) return;
    setSending(true);
    try {
      const res = await fetchApi('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          payment_method: 'bank_transfer',
          agreed_price: product.harga, 
        }),
      });
      setCreatedTransaction(res.data);
      setShowUploadModal(true);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat pesanan');
    } finally {
      setSending(false);
    }
  }

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile || !createdTransaction) return;
    
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('_method', 'PATCH');
      formData.append('payment_proof', proofFile);

      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/transactions/${createdTransaction.id}/payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload gagal');
      
      alert('Bukti pembayaran berhasil diunggah! Penjual akan segera memverifikasi.');
      setShowUploadModal(false);
      loadProductInfo(); // Refresh active order
      
      // Optionally notify via chat
      await fetchApi(`/products/${productId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Halo, saya sudah melakukan pembayaran dan mengunggah buktinya. Mohon segera dicek ya.',
          receiver_id: otherUserId
        })
      });
      loadMessages(false);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah bukti bayar');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', background: '#f0f2f1' }}>
      
      {/* Chat Header */}
      <div style={{ padding: '0.8rem 1.5rem', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <button onClick={() => router.push('/chat')} style={{ fontSize: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          <Icons.ArrowLeft size={24} />
        </button>
        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {otherUser?.foto ? (
            <img src={getStorageUrl(otherUser.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            otherUser?.name?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', lineHeight: '1.2' }}>{otherUser?.name || 'Memuat...'}</div>
          {product && (
            <Link href={`/products/${product.id}`} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}><Icons.Package size={14} /></span> {product.nama_barang}
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Icons.MessageCircle size={48} color="var(--primary)" /></div>
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
                  {(() => {
                    const content = msg.message;
                    if (content.startsWith('[LOCATION:')) {
                      const coords = content.replace('[LOCATION:', '').replace(']', '').split(',');
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.MapPin size={14} /> Lokasi Dibagikan</div>
                          <iframe 
                            width="250" height="150" 
                            style={{ border: 0, borderRadius: '8px', background: 'var(--border)' }} 
                            loading="lazy" allowFullScreen 
                            src={`https://maps.google.com/maps?q=${coords[0]},${coords[1]}&hl=id&z=14&output=embed`}
                          />
                        </div>
                      );
                    } else if (content === '[REQUEST_PHONE]') {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center', padding: '0.5rem' }}>
                          <Icons.PhoneCall size={32} color={isMe ? "white" : "var(--primary)"} />
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Meminta Nomor WA</div>
                          {!isMe && (
                            <button onClick={handleSharePhone} style={{ marginTop: '4px', padding: '6px 12px', background: 'var(--primary)', color: 'white', border: '1px solid white', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                              Bagikan Nomor Saya
                            </button>
                          )}
                        </div>
                      );
                    } else if (content.startsWith('[PHONE:')) {
                      const phone = content.replace('[PHONE:', '').replace(']', '');
                      const waLink = `https://wa.me/${phone.replace(/^0/, '62').replace(/\D/g, '')}`;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Phone size={14} /> Nomor WA Dibagikan</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{phone}</div>
                          <a href={waLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#25D366', color: 'white', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                            <Icons.MessageCircle size={14} /> Chat via WA
                          </a>
                        </div>
                      );
                    } else if (content.startsWith('[ORDER_INFO:')) {
                      const parts = content.replace('[ORDER_INFO:', '').replace(']', '').split(',');
                      const orderId = parts[0];
                      const status = parts[1];
                      const price = parts[2];
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: isMe ? 'white' : 'var(--primary)' }}>
                            <Icons.Package size={16} /> Detail Pesanan #{orderId}
                          </div>
                          <div style={{ background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--background)', padding: '10px', borderRadius: '8px', border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '2px' }}>Status:</div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', color: status === 'completed' ? '#10b981' : (status === 'cancelled' ? '#ef4444' : (isMe ? 'white' : 'var(--primary)')) }}>
                              {status.toUpperCase()}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '2px' }}>Total Harga:</div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Rp {Number(price).toLocaleString('id-ID')}</div>
                          </div>
                          <Link href={user?.role === 'penjual' ? `/seller/orders/${orderId}` : `/orders/${orderId}`} style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', 
                            background: isMe ? 'white' : 'var(--primary)', 
                            color: isMe ? 'var(--primary)' : 'white', 
                            padding: '8px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' 
                          }}>
                            Lihat Pesanan →
                          </Link>
                        </div>
                      );
                    } else if (content === '[TRANSFER_CHECK]') {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0.2rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Saya ingin membeli ini dengan metode transfer bank, apakah stok barang masih ada?</div>
                          {!isMe && (
                             <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button onClick={() => sendTemplate("[TRANSFER_AVAILABLE]")} className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px' }}>Ada</button>
                                <button onClick={() => sendTemplate("Maaf, stok barang sedang kosong.")} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px' }}>Tidak Ada</button>
                             </div>
                          )}
                        </div>
                      );
                    } else if (content === '[TRANSFER_AVAILABLE]') {
                      const bankAccounts = isMe ? user?.bank_accounts : otherUser?.bank_accounts;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0.2rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Barang masih ada! Silakan lakukan pemesanan dan transfer ke rekening berikut:</div>
                          
                          {bankAccounts && bankAccounts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                              {bankAccounts.map((acc: any) => (
                                <div key={acc.id} style={{ background: isMe ? 'rgba(255,255,255,0.1)' : '#f9fafb', padding: '8px', borderRadius: '6px', border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb' }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{acc.bank_name}</div>
                                  <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700 }}>{acc.account_number}</div>
                                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>a.n. {acc.account_name}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.8 }}>[Penjual belum mendaftarkan rekening]</div>
                          )}

                          {!isMe && !activeOrder && (
                             <button onClick={handleCreateTransferOrder} disabled={sending} className="btn btn-primary" style={{ marginTop: '8px', width: '100%', fontSize: '0.8rem', padding: '8px 12px', display: 'flex', justifyContent: 'center' }}>
                                Buat Pesanan Sekarang
                             </button>
                          )}
                        </div>
                      );
                    }
                    return <div style={{ fontSize: '0.95rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{content}</div>;
                  })()}
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
                    {isMe && !msg.is_optimistic && <span style={{ color: msg.is_read ? '#4ade80' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}><Icons.CheckCheck size={14} /></span>}
                    {isMe && msg.is_optimistic && <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}><Icons.Clock size={12} /></span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ background: 'white', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 6px rgba(0,0,0,0.02)' }}>
        
        {/* Chat Templates */}
        <div style={{ 
          padding: '0.75rem 1.5rem 0', 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {(isSeller ? templates.seller : templates.buyer).map((text, i) => (
            <button
              key={i}
              onClick={() => sendTemplate(text)}
              disabled={sending}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 14px',
                borderRadius: '16px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
            >
              {text}
            </button>
          ))}
        </div>

        {/* Action Toolbar */}
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0.75rem 1.5rem 0', display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleSendLocation} disabled={sending} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', cursor: 'pointer' }}>
            <Icons.MapPin size={14} color="var(--primary)" /> Kirim Lokasi
          </button>
          <button onClick={handleRequestPhone} disabled={sending} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', cursor: 'pointer' }}>
            <Icons.PhoneCall size={14} color="#f59e0b" /> Minta No WA
          </button>
          {activeOrder && (
            <button onClick={handleShareOrder} disabled={sending} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', cursor: 'pointer' }}>
              <Icons.Package size={14} color="var(--primary)" /> Bagikan Pesanan
            </button>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="container flex gap-3" style={{ maxWidth: '900px', margin: '0 auto', padding: '0.75rem 1.5rem 1rem' }}>
          <input 
            type="text" 
            className="input-field" 
            style={{ flex: 1, borderRadius: '28px', padding: '0.8rem 1.5rem', background: '#f3f4f6', border: '1px solid transparent', outline: 'none', fontSize: '0.95rem' }} 
            placeholder="Tulis pesan Anda di sini..." 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            autoFocus
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)' }}
            disabled={!newMessage.trim()}
          >
            <Icons.Send size={20} color="white" />
          </button>
        </form>
      </div>

      {/* Upload Proof Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Upload Bukti Pembayaran</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <Icons.X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                Pesanan berhasil dibuat! Silakan upload foto atau *screenshot* bukti transfer Anda untuk memverifikasi pembayaran.
              </p>

              <form onSubmit={handleUploadProof} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <label style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                  cursor: 'pointer', padding: '2rem 1.5rem', border: '2px dashed var(--primary)', borderRadius: '12px', 
                  background: '#f0fdf4', color: 'var(--primary)', textAlign: 'center', transition: 'all 0.2s'
                }}>
                  <Icons.Upload size={32} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {proofFile ? proofFile.name : 'Pilih Gambar Bukti Transfer'}
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Format: JPG, PNG (Maks. 10MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setProofFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                <button 
                  type="submit" 
                  disabled={uploadLoading || !proofFile} 
                  className="btn btn-primary" 
                  style={{ width: '100%', height: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '12px' }}
                >
                  {uploadLoading ? <><Icons.Loader size={18} /> Mengunggah...</> : 'Kirim Bukti Pembayaran'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
