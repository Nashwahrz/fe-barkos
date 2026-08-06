import { PublicProfile, UserDetail } from '@/types/user';
import { fetchApi } from '@/lib/api';

export interface UserDetailResponse {
  data: UserDetail;
}

export interface PublicProfileResponse {
  data: PublicProfile;
}

export const userApi = {
  getDetail: async (userId: number): Promise<UserDetailResponse> => {
    return await fetchApi(`/users/${userId}`);
  },
  getPublicProfile: async (userId: number): Promise<PublicProfileResponse> => {
    return await fetchApi(`/users/${userId}/public-profile`);
  },
};
