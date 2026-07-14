import { Offer } from '@/types/offer';
import { fetchApi } from '@/lib/api';

export interface CreateOfferDto {
  offered_price: number;
}

export interface OfferResponse {
  message: string;
  data: Offer;
}

export interface OffersResponse {
  data: Offer[];
}

export const offerApi = {
  create: async (productId: number, data: CreateOfferDto): Promise<OfferResponse> => {
    return await fetchApi(`/products/${productId}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  getBuyerOffers: async (): Promise<OffersResponse> => {
    return await fetchApi('/offers/buyer');
  },

  getSellerOffers: async (): Promise<OffersResponse> => {
    return await fetchApi('/offers/seller');
  },

  updateStatus: async (offerId: number, action: 'accept' | 'reject' | 'cancel'): Promise<OfferResponse> => {
    return await fetchApi(`/offers/${offerId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  },
};
