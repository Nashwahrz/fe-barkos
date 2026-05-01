'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';

export default function SellerOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user === null) return;
    if (!user || user.role !== USER_ROLES.PENJUAL) {
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
      router.push('/seller/orders');
    } finally {
      setLoading(false);
    }
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAction = async (endpointAction: string, method: string = 'PATCH', body?: object) => {
    if (!confirm('Apakah kamu yakin dengan tindakan ini?')) return;
    setActionLoading(true);
    try {
      await fetchApi(`/transactions/${resolvedParams.id}/${endpointAction}`, { 
        method,
        body: body ? JSON.stringify(body) : undefined
      });
      showMessage('Tindakan berhasil dilakukan', 'success');
      loadOrder();
    } catch (err: any) {
      showMessage(err.message || 'Gagal memproses', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '40px 1rem' }}>Memuat detail pesanan...</div>;
  if (!order) return null;

  return (
    <div className="container" style={{ padding: '40px 1rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/seller/orders" style={{ color: 'var(--primary)', fontWeight: 600 }}>&larr; Kembali ke Pesanan Masuk</Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Manajemen Pesanan #{order.id}</h1>
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

      {/* Info Pembeli */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Informasi Pembeli</h2>
        <p><strong>Nama:</strong> {order.buyer?.name}</p>
        <p><strong>No. HP / WhatsApp:</strong> {order.buyer?.phone || '-'}</p>
        <p><strong>Catatan Pembeli:</strong> {order.notes || '-'}</p>
        
        {order.status !== 'cancelled' && (
          <div style={{ marginTop: '1rem' }}>
            <a href={`https://wa.me/${order.buyer?.phone?.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-block' }}>
              Hubungi Pembeli (WhatsApp)
            </a>
          </div>
        )}
      </div>

      {/* Info Produk */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Produk yang Dipesan</h2>
        <div className="flex gap-4 items-start">
          <div style={{ width: '120px', height: '120px', borderRadius: 'var(--radius)', background: 'var(--input)', overflow: 'hidden' }}>
            {order.product?.foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getStorageUrl(order.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>{order.product?.nama_barang}</h3>
            <p style={{ opacity: 0.7, marginBottom: '1rem' }}>Metode: {order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Transfer Bank'}</p>
            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.5rem' }}>Rp {Number(order.agreed_price).toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      {/* Bukti Bayar (jika Bank Transfer) */}
      {order.payment_method === 'bank_transfer' && order.status !== 'pending' && order.status !== 'cancelled' && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Bukti Pembayaran</h2>
          {order.has_payment_proof ? (
            <div>
              <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '1rem' }}>✅ Pembeli sudah mengunggah bukti pembayaran.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.payment_proof_url} alt="Bukti Transfer" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 'var(--radius)' }} />
            </div>
          ) : (
             <p style={{ opacity: 0.7 }}>⏳ Menunggu pembeli mengunggah bukti transfer...</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-end mt-8">
        
        {/* State 1: Pending */}
        {order.status === 'pending' && (
          <>
            <button onClick={() => handleAction('confirm', 'PATCH', { action: 'reject' })} className="btn" style={{ border: '1px solid #ef4444', color: '#ef4444' }} disabled={actionLoading}>
              Tolak Pesanan
            </button>
            <button onClick={() => handleAction('confirm', 'PATCH', { action: 'confirm' })} className="btn btn-primary" disabled={actionLoading}>
              Konfirmasi (Terima) Pesanan
            </button>
          </>
        )}

        {/* State 2: Confirmed */}
        {order.status === 'confirmed' && (
          <>
            {order.payment_method === 'bank_transfer' && !order.has_payment_proof ? (
              <p style={{ opacity: 0.7, fontStyle: 'italic' }}>Menunggu pembeli upload bukti transfer sebelum bisa menyelesaikan pesanan.</p>
            ) : (
              <button onClick={() => handleAction('complete', 'PATCH')} className="btn" style={{ background: '#10b981', color: 'white' }} disabled={actionLoading}>
                Tandai Transaksi Selesai
              </button>
            )}
          </>
        )}

      </div>

    </div>
  );
}
