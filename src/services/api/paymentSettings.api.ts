import { fetchApi } from '@/lib/api';
import { PaymentBankAccount, PaymentSettings } from '@/types/paymentSettings';

export interface PaymentSettingsResponse {
  data: PaymentSettings;
}

export interface PaymentBankAccountResponse {
  message: string;
  data: PaymentBankAccount;
}

export interface PaymentBankAccountsResponse {
  data: PaymentBankAccount[];
}

export const paymentSettingsApi = {
  get: async (): Promise<PaymentSettingsResponse> => {
    return await fetchApi('/payment-settings');
  },

  adminUpdate: async (formData: FormData): Promise<{ message: string; data: Partial<PaymentSettings> }> => {
    return await fetchApi('/admin/payment-settings', {
      method: 'POST',
      body: formData,
    });
  },

  adminListBankAccounts: async (): Promise<PaymentBankAccountsResponse> => {
    return await fetchApi('/admin/payment-bank-accounts');
  },

  adminCreateBankAccount: async (data: { bank_name: string; account_number: string; account_name: string }): Promise<PaymentBankAccountResponse> => {
    return await fetchApi('/admin/payment-bank-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  adminUpdateBankAccount: async (id: number, data: Partial<{ bank_name: string; account_number: string; account_name: string; is_active: boolean }>): Promise<PaymentBankAccountResponse> => {
    return await fetchApi(`/admin/payment-bank-accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  adminDeleteBankAccount: async (id: number): Promise<{ message: string }> => {
    return await fetchApi(`/admin/payment-bank-accounts/${id}`, {
      method: 'DELETE',
    });
  },
};
