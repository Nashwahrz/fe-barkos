export interface AppNotification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: {
    message: string;
    type: string;
    offer_id?: number;
    transaction_id?: number;
    product_id: number;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  data: AppNotification[];
  unread_count: number;
}
