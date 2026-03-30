import api from "./api";

export interface GlobalJsData {
  code: string;
  lastUpdated: number;
}

export const globalJsAPI = {
  getGlobalJs: async (siteId: string): Promise<GlobalJsData | null> => {
    try {
      const response = await api.get(`/global-js/${siteId}`);
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      if (response.data && response.data.code !== undefined) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error("Error fetching global JS:", error);
      return null;
    }
  },
};
