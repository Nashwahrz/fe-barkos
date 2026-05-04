'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/Icons';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; Icon: any }> = {
  pending:   { label: 'Menunggu Konfirmasi Penjual', bg: '#FEF3C7', color: '#92400E', Icon: Icons.Clock },
  confirmed: { label: 'Dikonfirmasi Penjual',        bg: '#DBEAFE', color: '#1D4ED8', Icon: Icons.CheckCircle },
  completed: { label: 'Transaksi Selesai',            bg: '#D8F3DC', color: '#2D6A4F', Icon: Icons.CheckCircle },
  cancelled: { label: 'Dibatalkan',                   bg: '#FEE2E2', color: '#991B1B', Icon: Icons.X },
};

export default function BuyerOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user === null) return;
    if (!user) { router.push('/auth/login'); return; }
    loadOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, resolvedParams.id]);

  async function loadOrder() {
    try {
      const data = await fetchApi(`/transactions/${resolvedParams.id}`);
      setOrder(data.data || data);
    } catch {
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  }

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCancel = async () => {
    if (!confirm('Yakin ingin membatalkan pesanan ini?')) return;
    setActionLoading(true);
    try {
      await fetchApi(`/transactions/${resolvedParams.id}/cancel`, { method: 'DELETE' });
      showToast('Pesanan berhasil dibatalkan', 'success');
      loadOrder();
    } catch (err: any) {
      showToast(err.message || 'Gagal membatalkan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('_method', 'PATCH');
      formData.append('payment_proof', file);

      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/transactions/${resolvedParams.id}/payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload gagal');
      showToast('Bukti pembayaran berhasil diunggah!', 'success');
      loadOrder();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) return <div className="container" style={{ paddingTop: '80px', textAlign: 'center', opacity: 0.5 }}>Memuat pesanan...</div>;
  if (!order) return null;

  const s = STATUS_MAP[order.status] || STATUS_MAP.pending;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '720px' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 3000, padding: '14px 20px', borderRadius: '12px', background: toast.type === 'success' ? '#D8F3DC' : '#FEE2E2', color: toast.type === 'success' ? '#2D6A4F' : '#991B1B', fontWeight: 700, fontSize: '0.9rem', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {toast.type === 'success' ? <Icons.CheckCircle size={18} color="#2D6A4F" /> : <Icons.X size={18} color="#991B1B" />}{toast.text}
        </div>
      )}

      {/* Back */}
      <Link href="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', marginBottom: '2rem' }}>
        ← Kembali ke Pesanan
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Detail Pesanan</h1>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', fontFamily: 'monospace', marginTop: '4px' }}>
            #{String(order.id).padStart(6, '0')}
          </div>
        </div>
        <div style={{ padding: '8px 16px', borderRadius: '9999px', background: s.bg, color: s.color, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <s.Icon size={16} /> {s.label}
        </div>
      </div>

      {/* Status Timeline */}
      <div style={{ marginBottom: '2rem', padding: '1.25rem', background: s.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <s.Icon size={20} color={s.color} />
        </div>
        <p style={{ color: s.color, fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
          {order.status === 'pending' && 'Pesananmu sudah masuk. Menunggu penjual mengkonfirmasi.'}
          {order.status === 'confirmed' && order.payment_method === 'bank_transfer' && !order.has_payment_proof && 'Pesanan dikonfirmasi! Silakan upload bukti transfer di bawah.'}
          {order.status === 'confirmed' && order.payment_method === 'bank_transfer' && order.has_payment_proof && 'Bukti bayar sudah dikirim. Menunggu penjual memverifikasi.'}
          {order.status === 'confirmed' && order.payment_method === 'cod' && 'Pesanan dikonfirmasi! Hubungi penjual untuk mengatur tempat COD.'}
          {order.status === 'completed' && 'Transaksi berhasil diselesaikan. Terima kasih!'}
          {order.status === 'cancelled' && 'Pesanan ini telah dibatalkan.'}
        </p>
      </div>

      {/* Product Card */}
      <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '1rem' }}>Ringkasan Pesanan</h3>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: 'var(--card)', overflow: 'hidden', flexShrink: 0 }}>
            {order.product?.foto
              ? <img src={getStorageUrl(order.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={40} color="#d1d5db" /></div>}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>{order.product?.nama_barang}</h3>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total</div>
                <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.25rem' }}>Rp {Number(order.agreed_price).toLocaleString('id-ID')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Metode</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {order.payment_method === 'cod' ? <><Icons.Handshake size={14}/> COD</> : <><Icons.CreditCard size={14}/> Transfer Bank</>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Tanggal</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </div>
        {order.notes && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--card)', borderRadius: '12px', fontSize: '0.875rem', color: '#6b7280', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ marginTop: '2px', flexShrink: 0 }}><Icons.MessageCircle size={16} color="#6b7280" /></div>
            <span style={{ lineHeight: 1.5 }}>Catatan: {order.notes}</span>
          </div>
        )}
      </div>

      {/* Seller Info */}
      <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '1.25rem' }}>Informasi Penjual</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: order.status === 'confirmed' ? '1.25rem' : 0 }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
            {order.seller?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{order.seller?.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{order.seller?.phone || 'Nomor tidak tersedia'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button onClick={() => { if (order.product?.id && order.seller?.id) { window.location.href = `/chat/${order.product.id}/${order.seller.id}`; } }} className="btn" style={{ width: '100%', border: '2px solid var(--primary)', background: 'white', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
            <Icons.MessageCircle size={18} color="var(--primary)" /> Chat Penjual (Aplikasi)
          </button>
          
          {order.status === 'confirmed' && order.seller?.phone && (
            <a href={`https://wa.me/${order.seller.phone.replace(/^0/, '62').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', background: '#25D366', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none' }}>
              <Icons.Phone size={18} color="white" /> Hubungi via WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* ── Upload Bukti Bayar ────────────────────────── */}
      {order.payment_method === 'bank_transfer' && order.status === 'confirmed' && (
        <div style={{ padding: '1.5rem', background: 'var(--card)', borderRadius: '16px', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Upload size={20} /> Upload Bukti Pembayaran
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Upload foto/screenshot bukti transfer agar penjual bisa memverifikasi pembayaranmu.
          </p>

          {order.has_payment_proof && (
            <div style={{ padding: '1rem', background: '#D8F3DC', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#2D6A4F', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Icons.CheckCircle size={16} color="#2D6A4F" /> Bukti sudah diunggah</span>
              {order.payment_proof_url && (
                <a href={order.payment_proof_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}>Lihat →</a>
              )}
            </div>
          )}

          <form onSubmit={handleUploadPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', padding: '2.5rem 1.5rem', border: '2px dashed var(--border)', borderRadius: '16px', textAlign: 'center', background: '#fff', transition: 'border-color 0.2s', ...(!proofPreview ? { ':hover': { borderColor: 'var(--primary)' } } : {}) as React.CSSProperties }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><Icons.Upload size={32} color={proofPreview ? 'var(--primary)' : '#6b7280'} /></div>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: proofPreview ? 'var(--primary)' : 'var(--foreground)' }}>{proofPreview ? 'File siap diunggah ✓' : 'Pilih gambar bukti transfer'}</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Format: JPG, PNG — Maks. 5 MB</span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                required
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) setProofPreview(URL.createObjectURL(f));
                }}
              />
            </label>
            {proofPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proofPreview} alt="Preview bukti" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)' }} />
            )}
            <button type="submit" disabled={uploadLoading} className="btn btn-primary" style={{ height: '48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {uploadLoading ? <><Icons.Loader size={18} color="white" /> Mengunggah...</> : <><Icons.Upload size={18} color="white" /> Upload Bukti Transfer</>}
            </button>
          </form>
        </div>
      )}

      {/* Cancel Button */}
      {order.status === 'pending' && (
        <div style={{ textAlign: 'right' }}>
          <button onClick={handleCancel} disabled={actionLoading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'underline' }}>
            {actionLoading ? 'Membatalkan...' : 'Batalkan Pesanan'}
          </button>
        </div>
      )}
    </div>
  );
}
