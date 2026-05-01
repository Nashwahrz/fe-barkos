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
    <div className="flex" style={{ minHeight: 'calc(100vh - 70px)' }}>
      <AdminSidebar currentPath="/admin/promotions" />

      <main style={{ flex: 1, padding: '2rem', background: 'rgba(0,0,0,0.02)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <header style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Monitor Promosi</h1>
            <p style={{ opacity: 0.6 }}>Pantau semua paket promosi yang aktif dan riwayat pembelian promosi oleh penjual.</p>
          </header>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Promosi', value: promotions.length, color: 'var(--primary)' },
              { label: 'Sedang Aktif', value: activeCount, color: '#10b981' },
              { label: 'Sudah Berakhir', value: expiredCount, color: '#6b7280' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.25rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'rgba(0,0,0,0.03)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(0,0,0,0.4)' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem' }}>PRODUK</th>
                  <th style={{ padding: '1rem' }}>PENJUAL</th>
                  <th style={{ padding: '1rem' }}>PAKET</th>
                  <th style={{ padding: '1rem' }}>BERAKHIR</th>
                  <th style={{ padding: '1rem' }}>STATUS</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                      Belum ada data promosi.
                    </td>
                  </tr>
                ) : promotions.map(promo => {
                  const isActive = promo.status === 'active' && new Date(promo.end_at) > new Date();
                  return (
                    <tr key={promo.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>
                        {promo.product?.nama_barang || '-'}
                      </td>
                      <td style={{ padding: '1rem', opacity: 0.7 }}>
                        {promo.product?.user?.name || '-'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 700, fontSize: '0.8rem' }}>
                          {promo.package?.name || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', opacity: 0.7, fontSize: '0.85rem' }}>
                        {new Date(promo.end_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {isActive ? (
                          <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 800, fontSize: '0.78rem' }}>
                            🔥 AKTIF
                          </span>
                        ) : (
                          <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(0,0,0,0.05)', color: '#6b7280', fontWeight: 800, fontSize: '0.78rem' }}>
                            BERAKHIR
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
      </main>
    </div>
  );
}
