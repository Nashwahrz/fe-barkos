'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const data = await fetchApi('/reports');
      setReports(data.data);
    } catch (err) {
      console.error('Gagal mengambil data laporan:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    try {
      await fetchApi(`/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' },
      });
      await loadReports();
    } catch (err) {
      alert('Gagal memperbarui status laporan.');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5 }}>Memuat data laporan...</div>
    </div>
  );

  return (
    <div className="flex md-flex-col" style={{ minHeight: 'calc(100vh - 70px)' }}>
      <AdminSidebar currentPath="/admin/reports" />

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', background: 'rgba(0,0,0,0.02)' }}>
        <div className="container" style={{ maxWidth: '1100px' }}>
          <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Manajemen Laporan</h1>
              <p style={{ opacity: 0.6 }}>Kelola semua pelaporan produk dan pengguna yang bermasalah.</p>
            </div>
            <button onClick={loadReports} className="btn" style={{ border: '1px solid var(--border)' }}>🔄 Refresh</button>
          </header>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {reports.map((report) => (
              <div key={report.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div style={{ fontSize: '2.5rem' }}>🚩</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.25rem' }}>{report.reason}</div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>
                        Oleh <span style={{ fontWeight: 700 }}>{report.reporter?.name}</span> • Pelaporan pada {new Date(report.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <select 
                    value={report.status} 
                    onChange={(e) => updateStatus(report.id, e.target.value)}
                    disabled={updating === report.id}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: 'var(--radius)', 
                      border: '1px solid var(--border)',
                      fontWeight: 600,
                      background: updating === report.id ? 'var(--input)' : 'white'
                    }}
                  >
                    <option value="pending">PENDING</option>
                    <option value="investigated">DALAM PROSES</option>
                    <option value="resolved">SELESAI</option>
                    <option value="dismissed">TOLAK</option>
                  </select>
                </div>

                <div style={{ background: 'var(--input)', padding: '1.5rem', borderRadius: 'var(--radius)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase' }}>Detail Laporan:</div>
                  {report.description || 'Tidak ada deskripsi tambahan.'}
                </div>

                {report.product && (
                  <div className="flex items-center gap-4" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <div style={{ width: '60px', height: '60px', background: 'var(--border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📸</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 700 }}>PRODUK YANG DILAPORKAN:</div>
                      <div style={{ fontWeight: 600 }}>{report.product.nama_barang}</div>
                    </div>
                    <Link href={`/products/${report.product.id}`} target="_blank" className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: '1px solid var(--border)' }}>Lihat Produk</Link>
                  </div>
                )}
              </div>
            ))}

            {reports.length === 0 && (
              <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
                <h2 style={{ fontWeight: 800 }}>Semua Bersih!</h2>
                <p>Tidak ada laporan yang perlu ditindaklanjuti saat ini.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
