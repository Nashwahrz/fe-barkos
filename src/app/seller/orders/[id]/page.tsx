'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat detail pesanan...</div>
    </div>
  );
  if (!order) return null;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <Link href="/seller/orders" style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
          <Icons.ArrowLeft size={16} /> Kembali ke Pesanan Masuk
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.25rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Pesanan #{order.id}</h1>
          <div style={{ fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.6 }}>Dibuat pada {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</div>
        </div>
        <div style={{ 
          padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px',
          background: order.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' :
                      order.status === 'cancelled' ? 'rgba(220, 38, 38, 0.1)' :
                      order.status === 'confirmed' ? 'var(--primary-light)' : 'rgba(245, 158, 11, 0.1)',
          color:      order.status === 'completed' ? 'var(--success)' :
                      order.status === 'cancelled' ? 'var(--danger)' :
                      order.status === 'confirmed' ? 'var(--primary)' : 'var(--warning)',
          border: `1px solid ${
                      order.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' :
                      order.status === 'cancelled' ? 'rgba(220, 38, 38, 0.2)' :
                      order.status === 'confirmed' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
        }}>
          {order.status === 'completed' && <Icons.CheckCircle size={14} />}
          {order.status === 'cancelled' && <Icons.XCircle size={14} />}
          {order.status === 'confirmed' && <Icons.CheckCircle size={14} />}
          {order.status === 'pending' && <Icons.Clock size={14} />}
          STATUS: {order.status.toUpperCase()}
        </div>
      </div>

      {message && (
        <div style={{
          padding: '1.25rem', borderRadius: '12px', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(220, 38, 38, 0.1)',
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
          fontWeight: 600
        }}>
          {message.type === 'success' ? <Icons.CheckCircle size={20} /> : <Icons.AlertTriangle size={20} />}
          {message.text}
        </div>
      )}

      {/* Info Pembeli */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
          <Icons.User size={20} color="var(--primary)" /> Informasi Pembeli
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', fontSize: '0.95rem' }}>
          <div style={{ color: 'var(--foreground)', opacity: 0.6, fontWeight: 600 }}>Nama</div>
          <div style={{ color: 'var(--foreground)', fontWeight: 700 }}>{order.buyer?.name}</div>
          
          <div style={{ color: 'var(--foreground)', opacity: 0.6, fontWeight: 600 }}>WhatsApp</div>
          <div style={{ color: 'var(--foreground)', fontWeight: 700 }}>{order.buyer?.phone || '-'}</div>
          
          <div style={{ color: 'var(--foreground)', opacity: 0.6, fontWeight: 600 }}>Catatan</div>
          <div style={{ color: 'var(--foreground)', fontWeight: 700 }}>{order.notes || '-'}</div>
        </div>
        
        {order.status !== 'cancelled' && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button onClick={() => { if (order.product?.id && order.buyer?.id) { window.location.href = `/chat/${order.product.id}/${order.buyer.id}`; } }} variant="secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Icons.MessageCircle size={18} /> Chat di Aplikasi
            </Button>
            <Button href={`https://wa.me/${order.buyer?.phone?.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" variant="primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', background: '#25D366', color: 'white', borderColor: '#25D366' }}>
              <Icons.Phone size={18} /> Hubungi via WhatsApp
            </Button>
          </div>
        )}
      </div>

      {/* Info Produk */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
          <Icons.Package size={20} color="var(--primary)" /> Produk yang Dipesan
        </h2>
        <div className="flex gap-6 items-start flex-wrap">
          <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: 'var(--input)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
            {order.product?.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getStorageUrl(order.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><Icons.Package size={40} color="var(--border)" /></div>}
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)' }}>{order.product?.nama_barang}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7, marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 500 }}>
              {order.payment_method === 'cod' ? <Icons.Handshake size={16} /> : <Icons.CreditCard size={16} />}
              Metode: {order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Transfer Bank'}
            </div>
            <div style={{ color: 'var(--foreground)', fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Rp {Number(order.agreed_price).toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      {/* Bukti Bayar (jika Bank Transfer) */}
      {order.payment_method === 'bank_transfer' && order.status !== 'pending' && order.status !== 'cancelled' && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
            <Icons.Image size={20} color="var(--primary)" /> Bukti Pembayaran
          </h2>
          {order.has_payment_proof ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 700, marginBottom: '1.5rem', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Icons.CheckCircle size={20} /> Pembeli sudah mengunggah bukti pembayaran.
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '12px', background: 'var(--input)', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={order.payment_proof_url} alt="Bukti Transfer" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', display: 'block' }} />
              </div>
            </div>
          ) : (
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '2rem', background: 'var(--input)', borderRadius: '16px', color: 'var(--foreground)', opacity: 0.7, border: '1px dashed var(--border)' }}>
               <Icons.Clock size={24} color="var(--primary)" />
               <div>
                 <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)' }}>Menunggu Pembayaran</div>
                 <div style={{ fontSize: '0.9rem' }}>Pembeli belum mengunggah bukti transfer.</div>
               </div>
             </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-end mt-8 flex-wrap">
        
        {/* State 1: Pending */}
        {order.status === 'pending' && (
          <>
            <Button onClick={() => handleAction('confirm', 'PATCH', { action: 'reject' })} style={{ background: 'transparent', color: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={actionLoading}>
              Tolak Pesanan
            </Button>
            <Button onClick={() => handleAction('confirm', 'PATCH', { action: 'confirm' })} variant="primary" disabled={actionLoading}>
              Konfirmasi (Terima) Pesanan
            </Button>
          </>
        )}

        {/* State 2: Confirmed */}
        {order.status === 'confirmed' && (
          <>
            {order.payment_method === 'bank_transfer' && !order.has_payment_proof ? (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <Icons.AlertTriangle size={18} /> Menunggu pembeli upload bukti transfer sebelum bisa menyelesaikan pesanan.
              </div>
            ) : (
              <Button onClick={() => handleAction('complete', 'PATCH')} style={{ background: 'var(--success)', color: 'white', borderColor: 'var(--success)' }} disabled={actionLoading}>
                <Icons.CheckCircle size={18} /> Tandai Transaksi Selesai
              </Button>
            )}
          </>
        )}

      </div>

    </div>
  );
}
