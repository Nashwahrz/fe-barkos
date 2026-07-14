'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';

export default function SellerBankAccounts() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_name: ''
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.PENJUAL) {
        router.push('/');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  async function loadData() {
    try {
      const res = await fetchApi('/bank-accounts');
      setAccounts(res.data || res);
    } catch (err) {
      console.error('Failed to load bank accounts', err);
    } finally {
      setLoading(false);
    }
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ bank_name: '', account_number: '', account_name: '' });
  };

  const handleEdit = (acc: any) => {
    setIsEditing(true);
    setEditId(acc.id);
    setFormData({
      bank_name: acc.bank_name,
      account_number: acc.account_number,
      account_name: acc.account_name
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus rekening ini?')) return;
    setActionLoading(true);
    try {
      await fetchApi(`/bank-accounts/${id}`, { method: 'DELETE' });
      showMessage('Rekening berhasil dihapus', 'success');
      loadData();
    } catch (err: any) {
      showMessage(err.message || 'Gagal menghapus rekening', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (isEditing && editId) {
        await fetchApi(`/bank-accounts/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        showMessage('Rekening berhasil diubah', 'success');
      } else {
        await fetchApi('/bank-accounts', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        showMessage('Rekening berhasil ditambahkan', 'success');
      }
      resetForm();
      loadData();
    } catch (err: any) {
      showMessage(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || authLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat data rekening...</div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '60px 1rem', maxWidth: '800px' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <Icons.CreditCard size={36} color="var(--primary)" /> Pengaturan Rekening
        </h1>
        <p style={{ opacity: 0.7, maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Kelola nomor rekening bank atau e-wallet yang akan ditampilkan kepada pembeli saat mereka memilih metode pembayaran Transfer Bank.
        </p>
      </header>

      {message && (
        <div style={{
          padding: '1.25rem', borderRadius: '10px', marginBottom: '2.5rem',
          background: message.type === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#16a34a' : '#ef4444',
          fontWeight: 700, textAlign: 'center', border: message.type === 'success' ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            {message.type === 'success' ? <Icons.CheckCircle size={20} color="#16a34a" /> : <Icons.X size={20} color="#ef4444" />}
            {message.text}
          </span>
        </div>
      )}

      {/* Form Tambah/Edit Rekening */}
      <div className="card" style={{ padding: '2.5rem', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
          {isEditing ? <><Icons.Edit size={24} /> Edit Rekening</> : <><Icons.Plus size={24} /> Tambah Rekening Baru</>}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.6rem', fontWeight: 700, color: '#374151' }}>Nama Bank / E-Wallet</label>
            <input 
              type="text" 
              name="bank_name"
              className="input-field" 
              placeholder="Misal: BCA, Mandiri, DANA, OVO" 
              value={formData.bank_name} 
              onChange={handleInputChange} 
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.6rem', fontWeight: 700, color: '#374151' }}>Nomor Rekening / No. HP</label>
            <input 
              type="text" 
              name="account_number"
              className="input-field" 
              placeholder="Misal: 1234567890" 
              value={formData.account_number} 
              onChange={handleInputChange} 
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.6rem', fontWeight: 700, color: '#374151' }}>Nama Pemilik Rekening</label>
            <input 
              type="text" 
              name="account_name"
              className="input-field" 
              placeholder="Sesuai nama yang tertera di buku tabungan/aplikasi" 
              value={formData.account_name} 
              onChange={handleInputChange} 
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ flex: 1, padding: '1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {actionLoading ? <><Icons.Loader size={18} /> Memproses...</> : <><Icons.Save size={18} /> {isEditing ? 'Simpan Perubahan' : 'Tambah Rekening'}</>}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="btn" style={{ padding: '1rem', fontWeight: 700, background: '#f3f4f6', color: '#4b5563' }}>
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Daftar Rekening */}
      <div className="card" style={{ padding: '2.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
          <Icons.List size={24} /> Daftar Rekening Tersimpan
        </h2>

        {accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f9fafb', borderRadius: '12px', border: '2px dashed var(--border)' }}>
            <Icons.CreditCard size={48} color="#d1d5db" />
            <p style={{ marginTop: '1rem', color: '#6b7280', fontWeight: 600 }}>Belum ada rekening yang ditambahkan.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {accounts.map(acc => (
              <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'white' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#111827', marginBottom: '0.2rem' }}>{acc.bank_name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: 'var(--primary)', fontWeight: 800 }}>{acc.account_number}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.2rem', fontWeight: 600 }}>a.n. {acc.account_name}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(acc)} style={{ background: '#f3f4f6', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#4b5563' }} title="Edit">
                    <Icons.Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} style={{ background: '#fee2e2', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }} title="Hapus">
                    <Icons.Trash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
