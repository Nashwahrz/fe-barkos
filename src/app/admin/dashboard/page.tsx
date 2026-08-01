'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { fetchApi } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Icons } from '@/components/Icons';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';

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
    <AdminLayout currentPath="/admin/dashboard">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
            <Badge tone="primary" icon={<Icons.BarChart2 size={12} />}>Live Overview</Badge>
          </div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Dashboard Super Admin</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', marginTop: '0.35rem' }}>Pantau kinerja platform Lapak Kos secara real-time.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard
          label="Total Pengguna"
          value={stats?.users?.total || 0}
          icon={<Icons.Users size={20} />}
          accent="var(--primary)"
          accentBg="var(--primary-light)"
          footer={<span style={{ color: 'var(--muted-foreground)' }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>{stats?.users?.penjual || 0}</span> Penjual &bull; <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{stats?.users?.pembeli || 0}</span> Pembeli</span>}
        />
        <StatCard
          label="Produk Aktif"
          value={stats?.products?.available || 0}
          icon={<Icons.Package size={20} />}
          accent="var(--success)"
          accentBg="rgba(5, 150, 105, 0.1)"
          footer={<span style={{ color: 'var(--success)' }}><Icons.TrendingUp size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />{stats?.products?.sold || 0} Telah Terjual</span>}
        />
        <StatCard
          label="Laporan Pending"
          value={<span style={{ color: 'var(--danger)' }}>{stats?.reports?.pending || 0}</span>}
          icon={<Icons.AlertTriangle size={20} />}
          accent="var(--danger)"
          accentBg="rgba(220, 38, 38, 0.1)"
          footer={<span style={{ color: 'var(--muted-foreground)' }}>Dari total {stats?.reports?.total || 0} laporan</span>}
        />
        <StatCard
          label="Transaksi Selesai"
          value={stats?.transactions?.completed || 0}
          icon={<Icons.DollarSign size={20} />}
          accent="var(--warning)"
          accentBg="rgba(217, 119, 6, 0.1)"
          footer={<span style={{ color: 'var(--warning)' }}><Icons.CheckCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />Total keberhasilan</span>}
        />
      </div>

      {/* Recent Tables */}
      <Card padding="none">
        <CardHeader
          title="Laporan Terbaru"
          subtitle="Aktivitas pelaporan pelanggaran terkini di platform"
          action={
            <Link href="/admin/reports" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Lihat Semua <Icons.ArrowRight size={16} />
            </Link>
          }
        />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
            <thead style={{ background: 'var(--input)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr>
                <th style={{ padding: '0.9rem 1.75rem', fontWeight: 700 }}>Pelapor</th>
                <th style={{ padding: '0.9rem', fontWeight: 700 }}>Alasan</th>
                <th style={{ padding: '0.9rem', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '0.9rem 1.75rem', fontWeight: 700 }}>Tanggal</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.9rem' }}>
              {activities?.recent_reports?.map((report: any) => (
                <tr key={report.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }} className="hover-bg-input">
                  <td style={{ padding: '1.1rem 1.75rem', fontWeight: 700, color: 'var(--foreground)' }}>{report.reporter?.name}</td>
                  <td style={{ padding: '1.1rem', color: 'var(--card-foreground)' }}>{report.reason}</td>
                  <td style={{ padding: '1.1rem' }}>
                    <Badge tone={report.status === 'pending' ? 'danger' : 'success'}>{report.status}</Badge>
                  </td>
                  <td style={{ padding: '1.1rem 1.75rem', color: 'var(--muted-foreground)', fontSize: '0.85rem', fontWeight: 500 }}>
                    {new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {activities?.recent_reports?.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    <Icons.Inbox size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>Tidak ada laporan terbaru.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
