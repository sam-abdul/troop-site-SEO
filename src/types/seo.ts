export interface RobotsSeoSettings {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  noimageindex?: boolean;
  maxSnippet?: number;
  maxImagePreview?: "none" | "standard" | "large";
  maxVideoPreview?: number;
}

export interface OpenGraphSeoSettings {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  type?: string;
  url?: string;
  siteName?: string;
}

export interface TwitterSeoSettings {
  card?: "summary" | "summary_large_image" | "app" | "player";
  title?: string;
  description?: string;
  image?: string;
  site?: string;
  creator?: string;
}

export interface GeoSeoSettings {
  country?: string;
  state?: string;
  city?: string;
}

export interface SeoSettings {
  title?: string;
  description?: string;
  brandName?: string;
  keywords?: string[];
  canonicalPath?: string;
  locale?: string;
  category?: string;
  applicationName?: string;
  themeColor?: string;
  focusKeyword?: string;
  image?: string;
  authors?: string[];
  robots?: RobotsSeoSettings;
  openGraph?: OpenGraphSeoSettings;
  twitter?: TwitterSeoSettings;
  jsonLd?: string;
  geo?: GeoSeoSettings;
  updatedAt?: number;
}

