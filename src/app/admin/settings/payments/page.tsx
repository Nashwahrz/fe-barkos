'use client';

import { useState, useEffect, useRef } from 'react';
import { getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminLayout from '@/components/AdminLayout';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { paymentSettingsApi } from '@/services/api/paymentSettings.api';
import { PaymentBankAccount, PaymentSettings } from '@/types/paymentSettings';

export default function AdminPaymentSettings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [bankAccounts, setBankAccounts] = useState<PaymentBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingToggles, setSavingToggles] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const qrisInputRef = useRef<HTMLInputElement>(null);
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisPreview, setQrisPreview] = useState<string>('');

  // Bank account modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentBankAccount | null>(null);
  const [formData, setFormData] = useState({ bank_name: '', account_number: '', account_name: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
        router.push('/');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  async function loadData() {
    try {
      const [settingsRes, accountsRes] = await Promise.all([
        paymentSettingsApi.get(),
        paymentSettingsApi.adminListBankAccounts(),
      ]);
      setSettings(settingsRes.data);
      setBankAccounts(accountsRes.data || []);
    } catch (err) {
      console.error('Failed to load payment settings:', err);
    } finally {
      setLoading(false);
    }
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleQrisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrisFile(file);
      setQrisPreview(URL.createObjectURL(file));
    }
  };

  const saveSettings = async (overrides?: Partial<Pick<PaymentSettings, 'midtrans_enabled' | 'manual_transfer_enabled'>>) => {
    if (!settings) return;
    setSavingToggles(true);
    try {
      const formPayload = new FormData();
      const midtransEnabled = overrides?.midtrans_enabled ?? settings.midtrans_enabled;
      const manualEnabled = overrides?.manual_transfer_enabled ?? settings.manual_transfer_enabled;
      formPayload.append('midtrans_enabled', midtransEnabled ? '1' : '0');
      formPayload.append('manual_transfer_enabled', manualEnabled ? '1' : '0');
      if (qrisFile) {
        formPayload.append('qris_image', qrisFile);
      }

      const res = await paymentSettingsApi.adminUpdate(formPayload);
      setSettings(prev => prev ? {
        ...prev,
        midtrans_enabled: res.data.midtrans_enabled ?? midtransEnabled,
        manual_transfer_enabled: res.data.manual_transfer_enabled ?? manualEnabled,
        qris_image_url: res.data.qris_image_url ?? prev.qris_image_url,
      } : prev);
      setQrisFile(null);
      setQrisPreview('');
      showMessage('Pengaturan pembayaran berhasil disimpan.', 'success');
    } catch (err: any) {
      showMessage(err.message || 'Gagal menyimpan pengaturan pembayaran.', 'error');
    } finally {
      setSavingToggles(false);
    }
  };

  const handleOpenModal = (account: PaymentBankAccount | null = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({ bank_name: account.bank_name, account_number: account.account_number, account_name: account.account_name });
    } else {
      setEditingAccount(null);
      setFormData({ bank_name: '', account_number: '', account_name: '' });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (editingAccount) {
        await paymentSettingsApi.adminUpdateBankAccount(editingAccount.id, formData);
      } else {
        await paymentSettingsApi.adminCreateBankAccount(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan rekening.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus rekening ini?')) return;
    try {
      await paymentSettingsApi.adminDeleteBankAccount(id);
      setBankAccounts(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      showMessage(err.message || 'Gagal menghapus rekening.', 'error');
    }
  };

  const toggleActive = async (account: PaymentBankAccount) => {
    try {
      await paymentSettingsApi.adminUpdateBankAccount(account.id, { is_active: !account.is_active });
      setBankAccounts(prev => prev.map(a => a.id === account.id ? { ...a, is_active: !a.is_active } : a));
    } catch (err: any) {
      showMessage(err.message || 'Gagal mengubah status rekening.', 'error');
    }
  };

  if (loading || authLoading || !settings) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat pengaturan pembayaran...</div>
    </div>
  );

  return (
    <AdminLayout currentPath="/admin/settings/payments" maxWidth={900}>
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Pengaturan Pembayaran</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem' }}>Atur metode pembayaran yang tersedia untuk pembelian paket promosi.</p>
        </header>

        {message && (
          <div style={{
            padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '2rem',
            background: message.type === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? '#16a34a' : '#ef4444',
            fontWeight: 700,
          }}>
            {message.text}
          </div>
        )}

        {/* Toggle Metode */}
        <div className="card" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--foreground)' }}>Metode Pembayaran Aktif</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.25rem', border: '1px solid var(--border)', borderRadius: '14px', transition: 'border-color 0.2s ease' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>Midtrans</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Pembayaran otomatis via Midtrans Snap.</div>
              </div>
              <Toggle
                checked={settings.midtrans_enabled}
                onChange={(checked) => saveSettings({ midtrans_enabled: checked })}
                disabled={savingToggles}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.25rem', border: '1px solid var(--border)', borderRadius: '14px', transition: 'border-color 0.2s ease' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>Transfer Manual</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Seller upload bukti transfer, diverifikasi OCR + admin.</div>
              </div>
              <Toggle
                checked={settings.manual_transfer_enabled}
                onChange={(checked) => saveSettings({ manual_transfer_enabled: checked })}
                disabled={savingToggles}
              />
            </div>
          </div>
        </div>

        {/* QRIS */}
        <div className="card" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--foreground)' }}>QRIS</h2>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              onClick={() => qrisInputRef.current?.click()}
              style={{
                width: '160px', height: '160px', borderRadius: '12px', border: '2px dashed var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                background: '#f9fafb', flexShrink: 0,
              }}
            >
              {qrisPreview || settings.qris_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrisPreview || getStorageUrl(settings.qris_image_url) || ''} alt="QRIS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
                  <Icons.Image size={28} style={{ marginBottom: '4px' }} />
                  <div>Klik untuk upload</div>
                </div>
              )}
            </div>

            <input type="file" ref={qrisInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleQrisChange} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6, maxWidth: '350px' }}>
                Upload gambar QRIS yang akan ditampilkan ke seller saat memilih transfer manual.
              </p>
              <Button type="button" variant="primary" onClick={() => saveSettings()} disabled={savingToggles || !qrisFile}>
                {savingToggles ? 'Menyimpan...' : 'Simpan QRIS'}
              </Button>
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--foreground)' }}>Rekening Bank Tujuan</h2>
            <Button onClick={() => handleOpenModal()} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Plus size={18} /> Tambah Rekening
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
              <thead style={{ background: 'var(--input)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>BANK</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>NO. REKENING</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>ATAS NAMA</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '1.25rem 2rem', fontWeight: 700, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.95rem' }}>
                {bankAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5 }}>
                      Belum ada rekening bank ditambahkan.
                    </td>
                  </tr>
                ) : bankAccounts.map(acc => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover-bg-input">
                    <td style={{ padding: '1.25rem 2rem', fontWeight: 700, color: 'var(--foreground)' }}>{acc.bank_name}</td>
                    <td style={{ padding: '1.25rem', color: 'var(--foreground)' }}>{acc.account_number}</td>
                    <td style={{ padding: '1.25rem', color: 'var(--foreground)' }}>{acc.account_name}</td>
                    <td style={{ padding: '1.25rem' }}>
                      <button onClick={() => toggleActive(acc)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <Badge tone={acc.is_active ? 'success' : 'neutral'}>{acc.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                      </button>
                    </td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenModal(acc)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} title="Edit">
                          <Icons.Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(acc.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} title="Hapus">
                          <Icons.Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAccount ? 'Edit Rekening' : 'Tambah Rekening'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {formError && (
            <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}>
              {formError}
            </div>
          )}
          <Input
            label="Nama Bank"
            placeholder="Mis. BCA, Mandiri, BRI"
            value={formData.bank_name}
            onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
            required
          />
          <Input
            label="Nomor Rekening"
            placeholder="Mis. 1234567890"
            value={formData.account_number}
            onChange={e => setFormData({ ...formData, account_number: e.target.value })}
            required
          />
          <Input
            label="Atas Nama"
            placeholder="Mis. PT Lapak Kos Indonesia"
            value={formData.account_name}
            onChange={e => setFormData({ ...formData, account_name: e.target.value })}
            required
          />
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? 'Menyimpan...' : 'Simpan Rekening'}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
