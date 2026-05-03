'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminTransactions() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
        router.push('/');
      } else {
        loadTransactions();
      }
    }
  }, [user, authLoading, router]);

  async function loadTransactions() {
    try {
      // TransactionController@index returns all for super_admin
      const data = await fetchApi('/transactions');
      setTransactions(data.data || data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700 }}>PENDING</span>;
      case 'confirmed': return <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700 }}>CONFIRMED</span>;
      case 'completed': return <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>COMPLETED</span>;
      case 'cancelled': return <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>CANCELLED</span>;
      default: return null;
    }
  };

  if (loading || authLoading) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="flex md-flex-col" style={{ minHeight: 'calc(100vh - 70px)' }}>
      <AdminSidebar currentPath="/admin/transactions" />

      <main style={{ flex: 1, padding: '2rem', background: 'rgba(0,0,0,0.02)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Monitoring Transaksi</h1>
              <p style={{ opacity: 0.6 }}>Lihat semua alur transaksi yang terjadi di platform.</p>
            </div>
            <div className="card" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700 }}>
              Total: {transactions.length} Transaksi
            </div>
          </header>

          <div className="card" style={{ padding: 0, overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead style={{ background: 'rgba(0,0,0,0.03)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(0,0,0,0.4)' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem' }}>ID & TANGGAL</th>
                  <th style={{ padding: '1rem' }}>PRODUK</th>
                  <th style={{ padding: '1rem' }}>PEMBELI & PENJUAL</th>
                  <th style={{ padding: '1rem' }}>NILAI TRANSAKSI</th>
                  <th style={{ padding: '1rem' }}>METODE</th>
                  <th style={{ padding: '1rem' }}>STATUS</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                {transactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 700 }}>#{t.id}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(t.created_at).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700 }}>{t.product?.nama_barang}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ opacity: 0.6 }}>P:</span> {t.buyer?.name} <br/>
                        <span style={{ opacity: 0.6 }}>S:</span> {t.seller?.name}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Rp {Number(t.agreed_price).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)', fontSize: '0.75rem', fontWeight: 700 }}>
                        {t.payment_method === 'cod' ? 'COD' : 'TRANSFER'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(t.status)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Belum ada transaksi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
