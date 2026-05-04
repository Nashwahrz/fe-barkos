'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';

export default function SellerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    activeProducts: 0,
    soldProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) return;
    if (!user || user.role !== USER_ROLES.PENJUAL) {
      router.push('/auth/login');
      return;
    }
    loadDashboardData();
  }, [user, router]);

  async function loadDashboardData() {
    try {
      const [productsData, ordersData] = await Promise.all([
        fetchApi('/my-products'),
        fetchApi('/transactions')
      ]);

      const products = productsData.data || productsData;
      const orders = ordersData.data || ordersData;

      const activeProducts = products.filter((p: any) => !p.status_terjual).length;
      const soldProducts = products.filter((p: any) => p.status_terjual).length;
      
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      const completedOrders = orders.filter((o: any) => o.status === 'completed').length;
      
      const totalRevenue = orders
        .filter((o: any) => o.status === 'completed')
        .reduce((sum: number, o: any) => sum + Number(o.agreed_price), 0);

      setStats({ activeProducts, soldProducts, pendingOrders, completedOrders, totalRevenue });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="container" style={{ padding: '40px 1rem' }}>Memuat dashboard...</div>;

  return (
    <div className="container" style={{ padding: '40px 1rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>Dashboard Penjual</h1>
      
      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}><Icons.Package size={22} color="#f59e0b" /></div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--foreground)' }}>{stats.activeProducts}</div>
          <div style={{ opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '4px' }}>Produk Aktif</div>
        </div>

        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #10b981' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}><Icons.CheckCircle size={22} color="#10b981" /></div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--foreground)' }}>{stats.soldProducts}</div>
          <div style={{ opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '4px' }}>Produk Terjual</div>
        </div>

        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #ef4444', position: 'relative' }}>
          {stats.pendingOrders > 0 && (
            <span style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'block' }} />
          )}
          <div style={{ width: '40px', height: '40px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}><Icons.Clock size={22} color="#ef4444" /></div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--foreground)' }}>{stats.pendingOrders}</div>
          <div style={{ opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '4px' }}>Pesanan Masuk</div>
        </div>

        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(22,163,74,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}><Icons.DollarSign size={22} color="#16a34a" /></div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--foreground)', marginTop: '0.25rem' }}>
            {stats.totalRevenue >= 1000000
              ? `Rp ${(stats.totalRevenue / 1000000).toFixed(1)}Jt`
              : `Rp ${(stats.totalRevenue / 1000).toFixed(0)}k`}
          </div>
          <div style={{ opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '4px' }}>Total Pendapatan</div>
        </div>

      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Aksi Cepat</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        
        <Link href="/seller/products/create" className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: 'var(--primary)', color: 'white', transition: 'transform 0.2s', gap: '0.75rem' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={24} color="white" /></div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Tambah Produk Baru</span>
        </Link>

        <Link href="/seller/orders" className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)', transition: 'transform 0.2s', gap: '0.75rem' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '44px', height: '44px', background: 'rgba(22,163,74,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.ShoppingBag size={24} color="#16a34a" /></div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Kelola Pesanan</span>
        </Link>

        <Link href="/seller/products" className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)', transition: 'transform 0.2s', gap: '0.75rem' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '44px', height: '44px', background: 'rgba(22,163,74,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Store size={24} color="#16a34a" /></div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Kelola Katalog Produk</span>
        </Link>

        <Link href="/profile" className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)', transition: 'transform 0.2s', gap: '0.75rem' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '44px', height: '44px', background: 'rgba(22,163,74,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.User size={24} color="#16a34a" /></div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Pengaturan Profil</span>
        </Link>

      </div>

    </div>
  );
}
