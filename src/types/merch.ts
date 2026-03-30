export interface VariantOption {
  type: string; // e.g., "Size", "Color", "Material"
  value: string; // e.g., "Large", "Red", "Cotton"
}

export interface MerchItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  country: string;
  variants: VariantOption[];
  images: { url: string; storagePath: string }[];
  userID: string;
  phoneNumber?: string;
  createdAt: number;
  updatedAt: number;
  unviewedOrders?: number;
  timestamp: number;
}

export interface CreateMerchData {
  name: string;
  description: string;
  quantity: number;
  price: string;
  country: string; // Only this gets sent to backend
  variants: VariantOption[];
  phoneNumber?: string;
  images: {
    type: "image";
    url: string;
    storagePath: string;
    file?: File; // Store the original file for upload
  }[];
}

export interface MerchImage {
  type: "image";
  url: string;
  storagePath: string;
}
