export interface Offer {
  id: number;
  product_id: number;
  buyer_id: number;
  seller_id: number;
  offered_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
  
  // Relations
  product?: any;
  buyer?: any;
  seller?: any;
}
