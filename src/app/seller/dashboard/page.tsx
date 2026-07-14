'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Order {
  id: number;
  status: string;
  agreed_price: number;
  created_at: string;
  buyer?: { name?: string; email?: string };
  product?: { name?: string };
}

interface Product {
  id: number;
  name: string;
  price: number;
  status_terjual: boolean;
  created_at: string;
  views?: number;
}

interface DashboardStats {
  activeProducts: number;
  soldProducts: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  cancelledOrders: number;
  conversionRate: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRupiah(val: number) {
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}Jt`;
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}k`;
  return `Rp ${val}`;
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Selesai' };
    case 'pending':   return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Pending' };
    case 'cancelled': return { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Batal' };
    default:          return { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', label: status };
  }
}

// ─── Export Helpers ───────────────────────────────────────────────────────────
function exportCSV(orders: Order[], products: Product[], stats: DashboardStats) {
  const rows: string[] = [];

  // Header summary
  rows.push('=== LAPORAN PENJUAL ===');
  rows.push(`Tanggal Ekspor,${new Date().toLocaleDateString('id-ID')}`);
  rows.push('');
  rows.push('--- Ringkasan Statistik ---');
  rows.push('Metrik,Nilai');
  rows.push(`Produk Aktif,${stats.activeProducts}`);
  rows.push(`Produk Terjual,${stats.soldProducts}`);
  rows.push(`Pesanan Pending,${stats.pendingOrders}`);
  rows.push(`Pesanan Selesai,${stats.completedOrders}`);
  rows.push(`Pesanan Dibatalkan,${stats.cancelledOrders}`);
  rows.push(`Total Pendapatan,"${formatRupiah(stats.totalRevenue)}"`);
  rows.push(`Conversion Rate,${stats.conversionRate.toFixed(1)}%`);
  rows.push('');

  // Orders table
  rows.push('--- Riwayat Transaksi ---');
  rows.push('ID,Produk,Pembeli,Harga Kesepakatan,Status,Tanggal');
  orders.forEach(o => {
    const product = o.product?.name ?? '-';
    const buyer   = o.buyer?.name ?? o.buyer?.email ?? '-';
    const price   = `"${formatRupiah(Number(o.agreed_price))}"`;
    const { label } = getStatusColor(o.status);
    const date   = formatDate(o.created_at);
    rows.push(`${o.id},"${product}","${buyer}",${price},${label},${date}`);
  });
  rows.push('');

  // Products table
  rows.push('--- Daftar Produk ---');
  rows.push('ID,Nama,Harga,Status');
  products.forEach(p => {
    rows.push(`${p.id},"${p.name}","${formatRupiah(Number(p.price))}",${p.status_terjual ? 'Terjual' : 'Aktif'}`);
  });

  const csvContent = rows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `laporan-penjual-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(orders: Order[], products: Product[], stats: DashboardStats) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['Statistik', 'Nilai'],
    ['Produk Aktif', stats.activeProducts],
    ['Produk Terjual', stats.soldProducts],
    ['Pesanan Pending', stats.pendingOrders],
    ['Pesanan Selesai', stats.completedOrders],
    ['Pesanan Dibatalkan', stats.cancelledOrders],
    ['Total Pendapatan', stats.totalRevenue],
    ['Conversion Rate (%)', Number(stats.conversionRate.toFixed(1))],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

  const ordersData = orders.map(o => ({
    'ID': o.id,
    'Produk': o.product?.name ?? '-',
    'Pembeli': o.buyer?.name ?? o.buyer?.email ?? '-',
    'Harga Kesepakatan': Number(o.agreed_price),
    'Status': getStatusColor(o.status).label,
    'Tanggal': formatDate(o.created_at)
  }));
  const ordersWs = XLSX.utils.json_to_sheet(ordersData);
  XLSX.utils.book_append_sheet(wb, ordersWs, 'Riwayat Transaksi');

  const productsData = products.map(p => ({
    'ID': p.id,
    'Nama Produk': p.name,
    'Harga': Number(p.price),
    'Status': p.status_terjual ? 'Terjual' : 'Aktif'
  }));
  const productsWs = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, productsWs, 'Daftar Produk');

  XLSX.writeFile(wb, `laporan-penjual-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportPDF(orders: Order[], products: Product[], stats: DashboardStats, userName: string = 'Penjual') {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Laporan Penjual LapakKos', 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);
  doc.text(`Nama Penjual: ${userName}`, 14, 36);

  let finalY = 45;

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Ringkasan Statistik', 14, finalY);
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [['Metrik', 'Nilai']],
    body: [
      ['Produk Aktif', stats.activeProducts.toString()],
      ['Produk Terjual', stats.soldProducts.toString()],
      ['Pesanan Pending', stats.pendingOrders.toString()],
      ['Pesanan Selesai', stats.completedOrders.toString()],
      ['Pesanan Dibatalkan', stats.cancelledOrders.toString()],
      ['Total Pendapatan', formatRupiah(stats.totalRevenue)],
      ['Conversion Rate', `${stats.conversionRate.toFixed(1)}%`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }
  });

  finalY = (doc as any).lastAutoTable.finalY + 15;

  if (finalY > 250) { doc.addPage(); finalY = 20; }
  
  doc.setFontSize(14);
  doc.text('Riwayat Transaksi (Terbaru)', 14, finalY);
  
  const ordersBody = orders.slice(0, 50).map(o => [
    o.id.toString(),
    o.product?.name ?? '-',
    o.buyer?.name ?? o.buyer?.email ?? '-',
    formatRupiah(Number(o.agreed_price)),
    getStatusColor(o.status).label,
    formatDate(o.created_at)
  ]);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['ID', 'Produk', 'Pembeli', 'Harga', 'Status', 'Tanggal']],
    body: ordersBody,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }
  });

  doc.save(`laporan-penjual-${new Date().toISOString().slice(0, 10)}.pdf`);
}


// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MiniBarChart({ orders }: { orders: Order[] }) {
  // Group completed orders by last 6 months
  const months: { label: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('id-ID', { month: 'short' });
    const revenue = orders
      .filter(o => {
        if (o.status !== 'completed') return false;
        const od = new Date(o.created_at);
        return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
      })
      .reduce((sum, o) => sum + Number(o.agreed_price), 0);
    months.push({ label, revenue });
  }

  const max = Math.max(...months.map(m => m.revenue), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px', padding: '0 4px' }}>
      {months.map((m, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
          <div
            title={`${m.label}: ${formatRupiah(m.revenue)}`}
            style={{
              width: '100%',
              height: `${Math.max((m.revenue / max) * 60, 4)}px`,
              background: m.revenue > 0 ? 'var(--primary)' : 'var(--border)',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.6s cubic-bezier(.4,0,.2,1)',
              opacity: i === 5 ? 1 : 0.5 + (i * 0.1),
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{m.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ value, max, color, label, sublabel }: {
  value: number; max: number; color: string; label: string; sublabel: string;
}) {
  const pct = max === 0 ? 0 : Math.min((value / max) * 100, 100);
  const r = 30, stroke = 6;
  const circ = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={40} cy={40} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fill="var(--foreground)">
          {value}
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{sublabel}</div>
      </div>
    </div>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────
function InsightCard({ icon, text, type }: { icon: React.ReactNode; text: string; type: 'info' | 'warning' | 'success' }) {
  const colors = {
    info:    { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)',  color: '#6366f1' },
    warning: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  color: '#f59e0b' },
    success: { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  color: '#10b981' },
  }[type];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: colors.bg, border: `1px solid ${colors.border}` }}>
      <div style={{ color: colors.color, flexShrink: 0, marginTop: '1px' }}>{icon}</div>
      <p style={{ fontSize: '0.84rem', color: 'var(--foreground)', margin: 0, lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SellerDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    activeProducts: 0, soldProducts: 0,
    pendingOrders: 0, completedOrders: 0,
    totalRevenue: 0, cancelledOrders: 0, conversionRate: 0,
  });
  const [allOrders, setAllOrders]     = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [exporting, setExporting]     = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [activeTab, setActiveTab]     = useState<'orders' | 'products'>('orders');

  useEffect(() => {
    if (user === null) return;
    if (!user || user.role !== USER_ROLES.PENJUAL) { router.push('/auth/login'); return; }
    loadDashboardData();
  }, [user, router]);

  async function loadDashboardData() {
    try {
      const [productsData, ordersData] = await Promise.all([
        fetchApi('/my-products'),
        fetchApi('/transactions'),
      ]);

      const products: Product[] = productsData.data || productsData;
      const orders: Order[]     = ordersData.data   || ordersData;

      const activeProducts   = products.filter(p => !p.status_terjual).length;
      const soldProducts     = products.filter(p => p.status_terjual).length;
      const pendingOrders    = orders.filter(o => o.status === 'pending').length;
      const completedOrders  = orders.filter(o => o.status === 'completed').length;
      const cancelledOrders  = orders.filter(o => o.status === 'cancelled').length;
      const totalRevenue     = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.agreed_price), 0);
      const conversionRate   = orders.length === 0 ? 0 : (completedOrders / orders.length) * 100;

      setAllOrders(orders);
      setAllProducts(products);
      setStats({ activeProducts, soldProducts, pendingOrders, completedOrders, totalRevenue, cancelledOrders, conversionRate });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    setExporting(true);
    setTimeout(() => {
      exportCSV(allOrders, allProducts, stats);
      setExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 400);
  }

  function handleExportExcel() {
    setExporting(true);
    setTimeout(() => {
      exportExcel(allOrders, allProducts, stats);
      setExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 400);
  }

  function handleExportPDF() {
    setExporting(true);
    setTimeout(() => {
      exportPDF(allOrders, allProducts, stats, (user as any)?.name);
      setExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 400);
  }

  // Build insights
  const insights: { icon: React.ReactNode; text: string; type: 'info' | 'warning' | 'success' }[] = [];
  if (stats.pendingOrders > 0)
    insights.push({ icon: <Icons.Clock size={16} />, text: `Kamu punya ${stats.pendingOrders} pesanan pending yang perlu ditindaklanjuti.`, type: 'warning' });
  if (stats.conversionRate >= 70)
    insights.push({ icon: <Icons.TrendingUp size={16} />, text: `Conversion rate kamu ${stats.conversionRate.toFixed(0)}% — performa sangat baik! 🎉`, type: 'success' });
  else if (stats.conversionRate > 0 && stats.conversionRate < 40)
    insights.push({ icon: <Icons.AlertTriangle size={16} />, text: `Conversion rate ${stats.conversionRate.toFixed(0)}%. Coba perbarui foto & deskripsi produk agar lebih menarik.`, type: 'info' });
  if (stats.activeProducts === 0 && stats.soldProducts === 0)
    insights.push({ icon: <Icons.Package size={16} />, text: 'Belum ada produk. Mulai tambahkan produk pertamamu sekarang!', type: 'info' });
  if (stats.totalRevenue > 0)
    insights.push({ icon: <Icons.DollarSign size={16} />, text: `Total pendapatanmu sudah mencapai ${formatRupiah(stats.totalRevenue)}. Terus pertahankan!`, type: 'success' });

  const recentOrders   = [...allOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const recentProducts = [...allProducts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  if (loading) return (
    <div className="container" style={{ padding: '80px 0', textAlign: 'center', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--foreground)' }}>
      <Icons.Loader size={32} />
      Memuat dashboard...
    </div>
  );

  const totalProducts = stats.activeProducts + stats.soldProducts;

  return (
    <div className="container" style={{ padding: '40px 1rem', maxWidth: '1200px' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            Dashboard Penjual
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
            Selamat datang, <strong>{(user as any)?.name ?? 'Penjual'}</strong> · Update terakhir: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginRight: '4px' }}>Ekspor Laporan:</span>
          
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px',
              background: exportSuccess ? '#10b981' : 'var(--card)',
              color: exportSuccess ? 'white' : 'var(--foreground)',
              border: exportSuccess ? '1px solid #10b981' : '1px solid var(--border)',
              fontWeight: 600, fontSize: '0.8rem',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!exporting && !exportSuccess) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; }}
            onMouseLeave={e => { if (!exporting && !exportSuccess) (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)'; }}
          >
            <Icons.Download size={14} /> CSV
          </button>
          
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px',
              background: exportSuccess ? '#10b981' : 'var(--card)',
              color: exportSuccess ? 'white' : '#10b981',
              border: exportSuccess ? '1px solid #10b981' : '1px solid #10b981',
              fontWeight: 600, fontSize: '0.8rem',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!exporting && !exportSuccess) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.1)'; } }}
            onMouseLeave={e => { if (!exporting && !exportSuccess) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)'; } }}
          >
            <Icons.Download size={14} /> Excel
          </button>
          
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px',
              background: exportSuccess ? '#10b981' : 'var(--card)',
              color: exportSuccess ? 'white' : '#ef4444',
              border: exportSuccess ? '1px solid #10b981' : '1px solid #ef4444',
              fontWeight: 600, fontSize: '0.8rem',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!exporting && !exportSuccess) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; } }}
            onMouseLeave={e => { if (!exporting && !exportSuccess) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)'; } }}
          >
            <Icons.Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>

        {[
          { value: stats.activeProducts,  label: 'Produk Aktif',     color: '#f59e0b', icon: <Icons.Package size={22} color="#f59e0b" />,       bg: 'rgba(245,158,11,0.1)' },
          { value: stats.soldProducts,    label: 'Produk Terjual',   color: '#6366f1', icon: <Icons.CheckCircle size={22} color="#6366f1" />,    bg: 'rgba(99,102,241,0.1)' },
          { value: stats.pendingOrders,   label: 'Pesanan Masuk',    color: '#ef4444', icon: <Icons.Clock size={22} color="#ef4444" />,           bg: 'rgba(239,68,68,0.1)',   badge: stats.pendingOrders > 0 },
          { value: stats.completedOrders, label: 'Pesanan Selesai',  color: '#10b981', icon: <Icons.CheckCircle size={22} color="#10b981" />,    bg: 'rgba(16,185,129,0.1)' },
          { value: formatRupiah(stats.totalRevenue), label: 'Total Pendapatan', color: 'var(--primary)', icon: <Icons.DollarSign size={22} color="var(--primary)" />, bg: 'var(--primary-light)' },
          { value: `${stats.conversionRate.toFixed(0)}%`, label: 'Conversion Rate', color: '#8b5cf6', icon: <Icons.TrendingUp size={22} color="#8b5cf6" />, bg: 'rgba(139,92,246,0.1)' },
        ].map((s, i) => (
          <div
            key={i}
            className="card"
            style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card)' }}
          >
            {(s as any).badge && (
              <span style={{ position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.2)' }} />
            )}
            <div style={{ width: 40, height: 40, background: s.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: typeof s.value === 'string' ? '1.5rem' : '2rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginTop: 6 }}>
              {s.label}
            </div>
            {/* decorative gradient blob */}
            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: s.bg, opacity: 0.6, pointerEvents: 'none' }} />
          </div>
        ))}
      </div>

      {/* ── Revenue Chart + Product Health ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>

        {/* Revenue 6 months */}
        <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>Pendapatan 6 Bulan</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Dari transaksi selesai</p>
            </div>
            <div style={{ color: 'var(--primary)' }}><Icons.BarChart2 size={20} /></div>
          </div>
          <MiniBarChart orders={allOrders} />
        </div>

        {/* Product Health */}
        <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>Kesehatan Produk</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Distribusi status produk</p>
            </div>
            <div style={{ color: '#f59e0b' }}><Icons.Package size={20} /></div>
          </div>

          {totalProducts === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
              Belum ada produk
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingTop: '8px' }}>
              <CircularProgress value={stats.activeProducts} max={totalProducts} color="#f59e0b" label="Aktif" sublabel={`dari ${totalProducts}`} />
              <div style={{ width: 1, height: 60, background: 'var(--border)' }} />
              <CircularProgress value={stats.soldProducts} max={totalProducts} color="#6366f1" label="Terjual" sublabel={`dari ${totalProducts}`} />
              <div style={{ width: 1, height: 60, background: 'var(--border)' }} />
              <CircularProgress value={stats.cancelledOrders} max={Math.max(allOrders.length, 1)} color="#ef4444" label="Dibatal" sublabel="pesanan" />
            </div>
          )}
        </div>
      </div>

      {/* ── Insights ───────────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Zap size={18} color="#f59e0b" /> Insight & Saran
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {insights.map((ins, i) => (
              <InsightCard key={i} icon={ins.icon} text={ins.text} type={ins.type} />
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Activity Table ───────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--card)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)' }}>Aktivitas Terbaru</h2>
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {(['orders', 'products'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 16px', fontSize: '0.8rem', fontWeight: 600,
                  background: activeTab === tab ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab ? 'white' : 'var(--muted-foreground)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {tab === 'orders' ? 'Pesanan' : 'Produk'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'orders' ? (
          recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
              Belum ada pesanan
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['ID', 'Produk', 'Pembeli', 'Harga', 'Status', 'Tanggal'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => {
                    const { bg, color, label } = getStatusColor(o.status);
                    return (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--accent)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary)' }}>#{o.id}</td>
                        <td style={{ padding: '10px 12px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product?.name ?? '—'}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{o.buyer?.name ?? o.buyer?.email ?? '—'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatRupiah(Number(o.agreed_price))}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>{label}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{formatDate(o.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <Link href="/seller/orders" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Lihat semua pesanan →
                </Link>
              </div>
            </div>
          )
        ) : (
          recentProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>Belum ada produk</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Nama Produk', 'Harga', 'Status', 'Ditambahkan'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--accent)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatRupiah(Number(p.price))}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: p.status_terjual ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                          color:      p.status_terjual ? '#6366f1' : '#10b981',
                          padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                        }}>
                          {p.status_terjual ? 'Terjual' : 'Aktif'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <Link href="/seller/products" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Lihat semua produk →
                </Link>
              </div>
            </div>
          )
        )}
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>Aksi Cepat</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>

        <Link href="/seller/products/create" className="card"
          style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: 'var(--primary)', color: 'white', transition: 'all 0.2s', gap: '12px', border: 'none', boxShadow: 'var(--shadow-md)', borderRadius: '14px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
          <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={24} color="white" /></div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Tambah Produk</span>
        </Link>

        <Link href="/seller/orders" className="card"
          style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--foreground)', border: '1px solid var(--border)', background: 'var(--card)', transition: 'all 0.2s', gap: '12px', borderRadius: '14px', position: 'relative' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
          {stats.pendingOrders > 0 && (
            <span style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: 20 }}>{stats.pendingOrders}</span>
          )}
          <div style={{ width: 48, height: 48, background: 'var(--primary-light)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.ShoppingBag size={24} color="var(--primary)" /></div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Kelola Pesanan</span>
        </Link>

        <Link href="/seller/products" className="card"
          style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--foreground)', border: '1px solid var(--border)', background: 'var(--card)', transition: 'all 0.2s', gap: '12px', borderRadius: '14px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
          <div style={{ width: 48, height: 48, background: 'var(--primary-light)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Store size={24} color="var(--primary)" /></div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Katalog Produk</span>
        </Link>

        <Link href="/seller/offers" className="card"
          style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--foreground)', border: '1px solid var(--border)', background: 'var(--card)', transition: 'all 0.2s', gap: '12px', borderRadius: '14px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#ec4899'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
          <div style={{ width: 48, height: 48, background: 'rgba(236,72,153,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Zap size={24} color="#ec4899" /></div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Tawaran Masuk</span>
        </Link>

        <Link href="/seller/bank-accounts" className="card"
          style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--foreground)', border: '1px solid var(--border)', background: 'var(--card)', transition: 'all 0.2s', gap: '12px', borderRadius: '14px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#10b981'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
          <div style={{ width: 48, height: 48, background: 'rgba(16,185,129,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.CreditCard size={24} color="#10b981" /></div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Rekening Bank</span>
        </Link>

        <Link href="/profile" className="card"
          style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--foreground)', border: '1px solid var(--border)', background: 'var(--card)', transition: 'all 0.2s', gap: '12px', borderRadius: '14px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
          <div style={{ width: 48, height: 48, background: 'var(--primary-light)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.User size={24} color="var(--primary)" /></div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Pengaturan Profil</span>
        </Link>

      </div>
    </div>
  );
}
