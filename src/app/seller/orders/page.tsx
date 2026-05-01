'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) return;
    if (!user || user.role !== USER_ROLES.PENJUAL) {
      router.push('/auth/login');
      return;
    }
    loadOrders();
  }, [user, router]);

  async function loadOrders() {
    try {
      const data = await fetchApi('/transactions'); // TransactionController index handles role logic
      setOrders(data.data || data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>Menunggu Konfirmasi</span>;
      case 'confirmed': return <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700 }}>Dikonfirmasi</span>;
      case 'completed': return <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>Selesai</span>;
      case 'cancelled': return <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}>Dibatalkan</span>;
      default: return null;
    }
  };

  if (loading) return <div className="container" style={{ padding: '40px 1rem' }}>Memuat pesanan masuk...</div>;

  return (
    <div className="container" style={{ padding: '40px 1rem', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>Pesanan Masuk</h1>
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', opacity: 0.6 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Belum ada pesanan masuk</h2>
          <p>Tingkatkan promosi produkmu agar cepat laku!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {orders.map(order => (
            <Link href={`/seller/orders/${order.id}`} key={order.id} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s' }} 
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              
              <div style={{ width: '100px', height: '100px', borderRadius: 'var(--radius)', background: 'var(--input)', overflow: 'hidden' }}>
                {order.product?.foto ? (
                   // eslint-disable-next-line @next/next/no-img-element
                  <img src={getStorageUrl(order.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{order.product?.nama_barang}</h3>
                  {getStatusBadge(order.status)}
                </div>
                <div style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Pembeli: {order.buyer?.name} • Tanggal: {new Date(order.created_at).toLocaleDateString('id-ID')}
                </div>
                <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>
                  Rp {Number(order.agreed_price).toLocaleString('id-ID')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
