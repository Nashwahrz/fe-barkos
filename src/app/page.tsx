'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex-col">
      {/* Hero Section */}
      <section style={{ 
        padding: '100px 0', 
        background: 'linear-gradient(135deg, var(--background) 0%, rgba(99, 102, 241, 0.05) 100%)',
        textAlign: 'center' 
      }}>
        <div className="container">
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.05em', lineHeight: 1.1 }}>
            Temukan <span style={{ color: 'var(--primary)' }}>Kos & Barang</span> Impianmu
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--card-foreground)', opacity: 0.8, maxWidth: '700px', margin: '0 auto 2.5rem' }}>
            Satu platform untuk semua kebutuhan mahasiswa. Dari mencari kos hingga belanja barang bekas berkualitas di sekitar kampus.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/products" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Lihat Produk
            </Link>
            <Link href="/auth/register" className="btn" style={{ padding: '1rem 2rem', fontSize: '1.1rem', border: '1px solid var(--border)' }}>
              Mulai Menjual
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Statistics */}
      <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
        <div className="container flex justify-between flex-wrap gap-8">
          {[
            { label: 'Total Produk', value: '1.2k+' },
            { label: 'Penjual Aktif', value: '500+' },
            { label: 'Kampus Terdaftar', value: '50+' },
            { label: 'Transaksi Sukses', value: '10k+' }
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', flex: '1 1 200px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>{stat.value}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories / Highlights */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="flex justify-between items-center" style={{ marginBottom: '3rem' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Barang Terbaru</h2>
              <p style={{ opacity: 0.6 }}>Lihat apa yang baru saja ditambahkan oleh teman-temanmu.</p>
            </div>
            <Link href="/products" style={{ color: 'var(--primary)', fontWeight: 600 }}>Lihat Semua &rarr;</Link>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '2rem' 
          }}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="card" style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} 
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }} 
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                }}>
                <div style={{ 
                  height: '240px', 
                  background: 'var(--input)', 
                  borderRadius: 'calc(var(--radius) - 4px)', 
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--border)',
                  fontSize: '3rem'
                }}>
                  📦
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Produk Barkos #{item}</div>
                <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem' }}>Rp {(Math.floor(Math.random() * 9) + 1) * 100}.000</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                    <span style={{ padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '20px' }}>Bekas</span>
                    <span style={{ opacity: 0.5 }}>UB - Malang</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ padding: '100px 0', background: 'var(--primary)', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Siap Jualan Barang Tak Terpakai?</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Gabung dengan ratusan mahasiswa lainnya yang sudah mendapatkan uang tambahan dari barang kos yang tidak terpakai lagi.
          </p>
          <Link href="/auth/register?role=penjual" className="btn" style={{ background: 'white', color: 'var(--primary)', padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
            Daftar Sebagai Penjual Sekarang
          </Link>
        </div>
      </section>
    </div>
  );
}
