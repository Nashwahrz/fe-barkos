'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminPromotions() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
        router.push('/');
      } else {
        loadPromotions();
      }
    }
  }, [user, authLoading, router]);

  async function loadPromotions() {
    try {
      const data = await fetchApi('/admin/promotions');
      setPromotions(data.data || []);
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || authLoading) return <div className="p-8 text-center">Memuat data promosi...</div>;

  const activeCount = promotions.filter(p => p.status === 'active' && new Date(p.end_date) > new Date()).length;
  const expiredCount = promotions.length - activeCount;

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 70px)', background: '#f8faf9' }}>
      <AdminSidebar currentPath="/admin/promotions" />

      <main style={{ flex: 1, padding: '2.5rem' }}>
        <div className="container" style={{ maxWidth: '1100px' }}>
          <header style={{ marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.6rem', color: '#111827' }}>📊 Monitor Promosi</h1>
            <p style={{ opacity: 0.7, fontSize: '1rem' }}>Pantau distribusi paket promosi dan efektivitas fitur boost di marketplace.</p>
          </header>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {[
              { label: 'Total Transaksi', value: promotions.length, color: 'var(--primary)', icon: '📈' },
              { label: 'Promosi Aktif', value: activeCount, color: '#16a34a', icon: '🔥' },
              { label: 'Total Pendapatan', value: `Rp ${promotions.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0).toLocaleString('id-ID')}`, color: '#111827', icon: '💰' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ fontSize: '2.5rem' }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.5, marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'white' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>Daftar Pembelian Promosi</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '1rem 1.5rem' }}>Produk</th>
                    <th style={{ padding: '1rem' }}>Penjual</th>
                    <th style={{ padding: '1rem' }}>Paket</th>
                    <th style={{ padding: '1rem' }}>Biaya</th>
                    <th style={{ padding: '1rem' }}>Berakhir</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.9rem' }}>
                  {promotions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af', fontWeight: 500 }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Empty</div>
                        Belum ada data promosi yang tercatat.
                      </td>
                    </tr>
                  ) : promotions.map(promo => {
                    const isActive = promo.status === 'active' && new Date(promo.end_at) > new Date();
                    return (
                      <tr key={promo.id} style={{ borderBottom: '1px solid var(--border)', background: 'white' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ fontWeight: 800, color: '#111827' }}>{promo.product?.nama_barang || '-'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: #{promo.product_id}</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#4b5563', fontWeight: 500 }}>
                          {promo.product?.user?.name || '-'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                            {promo.package?.name || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#111827' }}>
                          Rp {Number(promo.amount_paid || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                          {new Date(promo.end_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {isActive ? (
                            <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', fontWeight: 900, fontSize: '0.7rem' }}>
                              🔥 AKTIF
                            </span>
                          ) : (
                            <span style={{ padding: '5px 12px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280', fontWeight: 800, fontSize: '0.7rem' }}>
                              EXPIRED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
