import api from "./api";

export interface MerchItem {
  id: string;
  [key: string]: any;
}

export interface MerchResponse {
  success: boolean;
  data: MerchItem[];
  message?: string;
}

export const merchAPI = {
  getUserMerchItems: async (userId: string): Promise<MerchResponse> => {
    const response = await api.get(`/merch/user/${encodeURIComponent(userId)}`);
    return response.data;
  },
  getSingleMerch: async (merchId: string): Promise<any> => {
    const response = await api.get(`/merch/${encodeURIComponent(merchId)}`);
    return response.data;
  },
};
