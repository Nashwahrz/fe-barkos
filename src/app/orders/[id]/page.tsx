'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function BuyerOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user === null) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, resolvedParams.id]);

  async function loadOrder() {
    try {
      const data = await fetchApi(`/transactions/${resolvedParams.id}`);
      setOrder(data.data || data);
    } catch (err) {
      console.error('Failed to load order', err);
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCancel = async () => {
    if (!confirm('Yakin ingin membatalkan pesanan ini?')) return;
    setActionLoading(true);
    try {
      await fetchApi(`/transactions/${resolvedParams.id}/cancel`, { method: 'DELETE' });
      showMessage('Pesanan dibatalkan', 'success');
      loadOrder();
    } catch (err: any) {
      showMessage(err.message || 'Gagal membatalkan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return;

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('_method', 'PATCH');
      formData.append('payment_proof', fileInputRef.current.files[0]);

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`http://localhost:8000/api/transactions/${resolvedParams.id}/payment`, {
        method: 'POST', // POST with _method=PATCH
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload gagal');
      
      showMessage('Bukti pembayaran berhasil diunggah', 'success');
      loadOrder();
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '40px 1rem' }}>Memuat pesanan...</div>;
  if (!order) return null;

  return (
    <div className="container" style={{ padding: '40px 1rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/orders" style={{ color: 'var(--primary)', fontWeight: 600 }}>&larr; Kembali ke Riwayat Belanja</Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Detail Pesanan #{order.id}</h1>
        <div style={{ 
          padding: '6px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.9rem',
          background: order.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' :
                      order.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' :
                      order.status === 'confirmed' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          color:      order.status === 'completed' ? '#10b981' :
                      order.status === 'cancelled' ? '#ef4444' :
                      order.status === 'confirmed' ? '#3b82f6' : '#f59e0b',
        }}>
          STATUS: {order.status.toUpperCase()}
        </div>
      </div>

      {message && (
        <div style={{
          padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
        }}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Produk</h2>
        <div className="flex gap-4 items-start">
          <div style={{ width: '120px', height: '120px', borderRadius: 'var(--radius)', background: 'var(--input)', overflow: 'hidden' }}>
            {order.product?.foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getStorageUrl(order.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>{order.product?.nama_barang}</h3>
            <p style={{ opacity: 0.7, marginBottom: '1rem' }}>Metode Pembayaran: {order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Transfer Bank'}</p>
            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.5rem' }}>Rp {Number(order.agreed_price).toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Informasi Penjual</h2>
        <p><strong>Nama:</strong> {order.seller?.name}</p>
        <p><strong>No. HP / WhatsApp:</strong> {order.seller?.phone || '-'}</p>
        {order.status === 'confirmed' && (
          <div style={{ marginTop: '1rem' }}>
            <a href={`https://wa.me/${order.seller?.phone?.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-block' }}>
              Chat via WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Upload Bukti Pembayaran (Bank Transfer) */}
      {order.payment_method === 'bank_transfer' && order.status === 'confirmed' && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '2px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Upload Bukti Pembayaran</h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>Silakan upload bukti transfer agar penjual dapat memproses pesananmu.</p>
          
          {order.has_payment_proof && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Bukti sudah diunggah. Menunggu penjual konfirmasi.</span>
              <div style={{ marginTop: '0.5rem' }}>
                <a href={order.payment_proof_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Lihat Bukti</a>
              </div>
            </div>
          )}

          <form onSubmit={handleUploadPayment} className="flex gap-4 items-end">
            <div style={{ flex: 1 }}>
              <input type="file" className="input-field" ref={fileInputRef} accept="image/*" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Mengunggah...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

      {/* Actions */}
      {order.status === 'pending' && (
        <div style={{ textAlign: 'right' }}>
          <button onClick={handleCancel} className="btn" style={{ background: '#ef4444', color: 'white' }} disabled={actionLoading}>
            Batalkan Pesanan
          </button>
        </div>
      )}

    </div>
  );
}
