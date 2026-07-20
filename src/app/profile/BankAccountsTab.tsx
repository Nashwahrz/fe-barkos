'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Icons } from '@/components/Icons';

export default function BankAccountsTab() {
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
    loadData();
  }, []);

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

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--foreground)' }}>
      <Icons.Loader size={32} />
      Memuat data rekening...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ padding: '0 0.5rem' }}>
        <p style={{ opacity: 0.7, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Kelola nomor rekening bank atau e-wallet yang akan ditampilkan kepada pembeli saat mereka memilih metode pembayaran Transfer Bank.
        </p>

        {message && (
          <div style={{
            padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
            background: message.type === 'success' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${message.type === 'success' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
            fontWeight: 500, fontSize: '0.95rem'
          }}>
            {message.text}
          </div>
        )}

        {/* Form Tambah/Edit Rekening */}
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
            {isEditing ? <><Icons.Edit size={20} /> Edit Rekening</> : <><Icons.Plus size={20} /> Tambah Rekening Baru</>}
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Nama Bank / E-Wallet</label>
              <input 
                type="text" 
                name="bank_name"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--foreground)', fontSize: '0.95rem' }} 
                placeholder="Misal: BCA, Mandiri, DANA, OVO" 
                value={formData.bank_name} 
                onChange={handleInputChange} 
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Nomor Rekening / No. HP</label>
              <input 
                type="text" 
                name="account_number"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--foreground)', fontSize: '0.95rem' }} 
                placeholder="Misal: 1234567890" 
                value={formData.account_number} 
                onChange={handleInputChange} 
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Nama Pemilik Rekening</label>
              <input 
                type="text" 
                name="account_name"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--foreground)', fontSize: '0.95rem' }} 
                placeholder="Sesuai nama yang tertera di buku tabungan/aplikasi" 
                value={formData.account_name} 
                onChange={handleInputChange} 
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {actionLoading ? 'Memproses...' : (isEditing ? 'Simpan Perubahan' : 'Tambah Rekening')}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} style={{ padding: '0.875rem', borderRadius: '12px', background: 'var(--input)', color: 'var(--foreground)', fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer' }}>
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Daftar Rekening */}
      <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
          <Icons.List size={20} /> Daftar Rekening Tersimpan
        </h2>

        {accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'var(--input)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            <Icons.CreditCard size={32} color="var(--foreground)" style={{ opacity: 0.3 }} />
            <p style={{ marginTop: '1rem', color: 'var(--foreground)', opacity: 0.7, fontSize: '0.95rem' }}>Belum ada rekening yang ditambahkan.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {accounts.map(acc => (
              <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--card)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)', marginBottom: '0.2rem' }}>{acc.bank_name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--primary)', fontWeight: 600 }}>{acc.account_number}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.7, marginTop: '0.2rem' }}>a.n. {acc.account_name}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(acc)} style={{ background: 'var(--input)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--foreground)' }} title="Edit">
                    <Icons.Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--danger)' }} title="Hapus">
                    <Icons.Trash size={16} />
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
