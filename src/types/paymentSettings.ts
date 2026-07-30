export interface PaymentBankAccount {
  id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentSettings {
  midtrans_enabled: boolean;
  manual_transfer_enabled: boolean;
  qris_image_url: string | null;
  bank_accounts: PaymentBankAccount[];
}
