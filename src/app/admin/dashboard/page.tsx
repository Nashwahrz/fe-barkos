'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
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
    loadData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5 }}>Memuat data dashboard...</div>
    </div>
  );

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 70px)' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', borderRight: '1px solid var(--border)', padding: '2rem' }}>
        <div className="flex-col gap-6">
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu Utama</div>
          <Link href="/admin/dashboard" style={{ fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            📊 Dashboard
          </Link>
          <Link href="/admin/reports" style={{ fontWeight: 500, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            🚩 Laporan Pengguna
          </Link>
          <Link href="/admin/users" style={{ fontWeight: 500, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            👥 Manajemen User
          </Link>
          <Link href="/admin/settings" style={{ fontWeight: 500, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            ⚙️ Pengaturan
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', background: 'rgba(0,0,0,0.02)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <header style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Dashboard Super Admin</h1>
            <p style={{ opacity: 0.6 }}>Pantau kinerja platform Lapak Kos secara real-time.</p>
          </header>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <div className="card">
              <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.5, marginBottom: '0.5rem' }}>Total Pengguna</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.users?.total}</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--primary)' }}>{stats?.users?.penjual} Penjual | {stats?.users?.pembeli} Pembeli</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.5, marginBottom: '0.5rem' }}>Produk Aktif</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.products?.available}</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#22c55e' }}>{stats?.products?.sold} Telah Terjual</div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.5, marginBottom: '0.5rem' }}>Laporan Pending</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{stats?.reports?.pending}</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Dari total {stats?.reports?.total} laporan</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.5, marginBottom: '0.5rem' }}>Total Chat</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.activities?.chats}</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--accent)' }}>Interaksi antar user</div>
            </div>
          </div>

          {/* Recent Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            {/* Recent Reports Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800 }}>Laporan Terbaru</h3>
                <Link href="/admin/reports" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Lihat Semua &rarr;</Link>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(0,0,0,0.03)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(0,0,0,0.4)' }}>
                  <tr>
                    <th style={{ padding: '1rem 1.5rem' }}>PELAPOR</th>
                    <th style={{ padding: '1rem' }}>ALASAN</th>
                    <th style={{ padding: '1rem' }}>STATUS</th>
                    <th style={{ padding: '1rem' }}>TANGGAL</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.9rem' }}>
                  {activities?.recent_reports?.map((report: any) => (
                    <tr key={report.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{report.reporter?.name}</td>
                      <td style={{ padding: '1rem' }}>{report.reason}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          background: report.status === 'pending' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: report.status === 'pending' ? '#ef4444' : '#22c55e',
                          textTransform: 'uppercase'
                        }}>
                          {report.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', opacity: 0.6 }}>{new Date(report.created_at).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                  {activities?.recent_reports?.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Tidak ada laporan terbaru.</td>
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
