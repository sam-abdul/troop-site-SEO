import api from "./api";

export interface SitePage {
  id: string;
  title: string;
  pageType?: "normal" | "event" | "merch";
  html: string;
  css: string;
  bodyBackgroundColor?: string;
  bodyTextColor?: string;
  bodyFontFamily?: string;
  bodyTextAlign?: string;
  bodyMaxWidth?: string;
}

export interface Site {
  id: string;
  name: string;
  description: string;
  domain: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  isPublished: boolean;
  pages: SitePage[];
  defaultPage?: string;
  imageUrl?: string;
  logoUrl?: string;
  shareImageUrl?: string;
  bannerUrl?: string;
  coverImageUrl?: string;
  disabled?: boolean;
}

export interface SiteResponse {
  success: boolean;
  data: Site;
  message?: string;
}

export const sitesAPI = {
  getSiteByDomain: async (domain: string): Promise<SiteResponse> => {
    const response = await api.get(
      `/sites/domain/${encodeURIComponent(domain)}`
    );
    return response.data;
  },
};
