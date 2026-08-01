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
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { TrendChart, TrendSeries } from '@/components/ui/TrendChart';
import { Skeleton } from '@/components/Skeleton';

interface Report {
  id: number;
  reporter?: { name: string };
  reason: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
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
      const [statsData, activitiesData, trendsData] = await Promise.all([
        fetchApi('/admin/stats'),
        fetchApi('/admin/recent-activities'),
        fetchApi('/admin/stats/trends'),
      ]);
      setStats(statsData.stats);
      setActivities(activitiesData);
      setTrends(trendsData);
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const reportColumns: DataTableColumn<Report>[] = [
    { key: 'reporter', header: 'Pelapor', render: r => <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{r.reporter?.name}</span> },
    { key: 'reason', header: 'Alasan', render: r => <span style={{ color: 'var(--card-foreground)' }}>{r.reason}</span> },
    { key: 'status', header: 'Status', render: r => <Badge tone={r.status === 'pending' ? 'danger' : 'success'}>{r.status}</Badge> },
    {
      key: 'date', header: 'Tanggal', render: r => (
        <span style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', fontWeight: 500 }}>
          {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
  ];

  const trendSeries: TrendSeries[] | null = trends ? [
    { key: 'users', label: 'Pengguna Baru', color: '#0D9488', data: trends.users },
    { key: 'products', label: 'Produk Baru', color: '#14B8A6', data: trends.products },
    { key: 'transactions', label: 'Transaksi Selesai', color: '#D97706', data: trends.transactions },
  ] : null;

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
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="lg">
              <Skeleton width="60%" height="0.85rem" style={{ marginBottom: '1rem' }} />
              <Skeleton width="40%" height="2.35rem" style={{ marginBottom: '0.75rem' }} />
              <Skeleton width="80%" height="0.85rem" />
            </Card>
          ))
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Trend Chart */}
      <Card padding="none" style={{ marginBottom: '2rem' }}>
        <CardHeader
          title="Tren Platform"
          subtitle="Pengguna, produk, dan transaksi baru dalam 6 bulan terakhir"
        />
        <div style={{ padding: '1.5rem 1.25rem 1rem' }}>
          {loading || !trendSeries ? (
            <Skeleton width="100%" height="280px" borderRadius="12px" />
          ) : (
            <TrendChart series={trendSeries} />
          )}
        </div>
      </Card>

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
        <DataTable<Report>
          columns={reportColumns}
          data={activities?.recent_reports || []}
          keyExtractor={r => r.id}
          loading={loading}
          skeletonRows={4}
          emptyMessage="Tidak ada laporan terbaru."
        />
      </Card>
    </AdminLayout>
  );
}
