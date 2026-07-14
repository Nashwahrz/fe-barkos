'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { fetchApi } from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';
import { Icons } from '@/components/Icons';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'super_admin') {
        router.replace('/');
        return;
      }
      loadData();
    }
  }, [user, authLoading, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [statsData, activitiesData] = await Promise.all([
        fetchApi('/admin/stats'),
        fetchApi('/admin/recent-activities')
      ]);
      setStats(statsData.stats);
      setActivities(activitiesData);
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat data dashboard...</div>
    </div>
  );

  return (
    <div className="flex md-flex-col" style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--background)' }}>
      <AdminSidebar currentPath="/admin/dashboard" />

      {/* Main Content */}
      <main className="page-padding" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Dashboard Super Admin</h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '1.05rem' }}>Pantau kinerja platform Lapak Kos secara real-time.</p>
        </header>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
          <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pengguna</div>
              <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '10px', color: 'var(--primary)' }}><Icons.Users size={20} /></div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>{stats?.users?.total || 0}</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.75rem', color: 'var(--foreground)', opacity: 0.8, fontWeight: 500 }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{stats?.users?.penjual || 0}</span> Penjual &bull; <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{stats?.users?.pembeli || 0}</span> Pembeli
            </div>
          </div>
          
          <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--success)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produk Aktif</div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--success)' }}><Icons.Package size={20} /></div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>{stats?.products?.available || 0}</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
              <Icons.TrendingUp size={14} style={{ display: 'inline', marginRight: '4px' }}/>{stats?.products?.sold || 0} Telah Terjual
            </div>
          </div>
          
          <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--danger)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Laporan Pending</div>
              <div style={{ background: 'rgba(220, 38, 38, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--danger)' }}><Icons.AlertTriangle size={20} /></div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--danger)', lineHeight: 1.2 }}>{stats?.reports?.pending || 0}</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.75rem', color: 'var(--foreground)', opacity: 0.6, fontWeight: 500 }}>
              Dari total {stats?.reports?.total || 0} laporan
            </div>
          </div>
          
          <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--warning)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaksi Selesai</div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--warning)' }}><Icons.DollarSign size={20} /></div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>{stats?.transactions?.completed || 0}</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>
              <Icons.CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }}/>Total keberhasilan
            </div>
          </div>
        </div>

        {/* Recent Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Recent Reports Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--foreground)' }}>Laporan Terbaru</h3>
              <Link href="/admin/reports" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Lihat Semua <Icons.ArrowRight size={16} />
              </Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
                <thead style={{ background: 'var(--input)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '1rem 2rem', fontWeight: 700 }}>PELAPOR</th>
                    <th style={{ padding: '1rem', fontWeight: 700 }}>ALASAN</th>
                    <th style={{ padding: '1rem', fontWeight: 700 }}>STATUS</th>
                    <th style={{ padding: '1rem 2rem', fontWeight: 700 }}>TANGGAL</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.95rem' }}>
                  {activities?.recent_reports?.map((report: any) => (
                    <tr key={report.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }} className="hover-bg-input">
                      <td style={{ padding: '1.25rem 2rem', fontWeight: 700, color: 'var(--foreground)' }}>{report.reporter?.name}</td>
                      <td style={{ padding: '1.25rem', color: 'var(--foreground)', opacity: 0.8 }}>{report.reason}</td>
                      <td style={{ padding: '1.25rem' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          background: report.status === 'pending' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: report.status === 'pending' ? 'var(--danger)' : 'var(--success)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          border: `1px solid ${report.status === 'pending' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                        }}>
                          {report.status}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 2rem', color: 'var(--foreground)', opacity: 0.6, fontSize: '0.9rem', fontWeight: 500 }}>
                        {new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {activities?.recent_reports?.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5 }}>
                        <Icons.Inbox size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Tidak ada laporan terbaru.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
