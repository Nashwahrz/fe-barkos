export interface UserActivity {
  products_count: number;
  products_sold_count: number;
  transactions_as_seller_count: number;
  transactions_completed_count: number;
  transactions_as_buyer_count: number;
}

export interface PublicProfile {
  id: number;
  name: string;
  avatar: string | null;
  asal_kampus: string | null;
  role: string;
  created_at: string | null;
  is_online: boolean;
  last_active_at: string | null;
  activity: {
    products_count: number;
    products_sold_count: number;
  };
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  asal_kampus: string | null;
  role: string;
  is_active: boolean;
  created_at: string | null;
  last_active_at: string | null;
  is_online: boolean;
  activity: UserActivity;
}
