import { UserDetail } from '@/types/user';
import { fetchApi } from '@/lib/api';

export interface UserDetailResponse {
  data: UserDetail;
}

export const userApi = {
  getDetail: async (userId: number): Promise<UserDetailResponse> => {
    return await fetchApi(`/users/${userId}`);
  },
};
