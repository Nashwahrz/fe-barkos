'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminLayout from '@/components/AdminLayout';
import { Icons } from '@/components/Icons';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Pagination } from '@/components/Pagination';
import { Badge } from '@/components/ui/Badge';

export default function AdminTransactions() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, paginatedData, totalItems
  } = useTablePagination(transactions, ['id', 'product.nama_barang', 'buyer.name', 'seller.name', 'status', 'payment_method'], 10);

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
      case 'pending': return <Badge tone="warning">Pending</Badge>;
      case 'confirmed': return <Badge tone="primary">Confirmed</Badge>;
      case 'completed': return <Badge tone="success">Completed</Badge>;
      case 'cancelled': return <Badge tone="danger">Cancelled</Badge>;
      default: return null;
    }
  };

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat data...</div>
    </div>
  );

  return (
    <AdminLayout currentPath="/admin/transactions">
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: '1 1 auto', minWidth: '300px' }}>
            <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Monitoring Transaksi</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', margin: 0 }}>Lihat semua alur transaksi yang terjadi di platform.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', flex: '0 0 auto' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Icons.Search size={16} color="var(--foreground)" style={{ opacity: 0.5 }} />
              </div>
              <input 
                type="text" 
                placeholder="Cari transaksi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem', margin: 0 }}
              />
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
              Total: {totalItems} Transaksi
            </div>
          </div>
        </header>

        <div className="card" style={{ padding: 0, overflow: 'hidden', overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', background: 'var(--card)' }}>
            <thead style={{ background: 'var(--input)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr>
                <th style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>ID & TANGGAL</th>
                <th style={{ padding: '1.25rem', fontWeight: 700 }}>PRODUK</th>
                <th style={{ padding: '1.25rem', fontWeight: 700 }}>PEMBELI & PENJUAL</th>
                <th style={{ padding: '1.25rem', fontWeight: 700 }}>NILAI TRANSAKSI</th>
                <th style={{ padding: '1.25rem', fontWeight: 700 }}>METODE</th>
                <th style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>STATUS</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.95rem' }}>
              {paginatedData.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-bg-input">
                  <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--foreground)' }}>#{t.id}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6 }}>{new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{t.product?.nama_barang}</div>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><span style={{ opacity: 0.5, fontWeight: 600, display: 'inline-block', width: '20px' }}>P:</span> <strong>{t.buyer?.name}</strong></div>
                      <div><span style={{ opacity: 0.5, fontWeight: 600, display: 'inline-block', width: '20px' }}>S:</span> <strong>{t.seller?.name}</strong></div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    Rp {Number(t.agreed_price).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {t.payment_method === 'cod' ? <><Icons.Handshake size={12}/> COD</> : <><Icons.CreditCard size={12}/> TRANSFER</>}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 2rem' }}>
                    {getStatusBadge(t.status)}
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5 }}>
                    <Icons.Inbox size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Belum ada transaksi.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    </AdminLayout>
  );
}
