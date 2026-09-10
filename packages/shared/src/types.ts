export type SearchSourceType = "image" | "screenshot" | "gallery" | "text" | "barcode";

export type OfferCondition = "new" | "used" | "refurbished";

export type OfferAvailability = "in_stock" | "out_of_stock" | "limited" | "unknown";

export interface ProductIdentification {
  id: string;
  sourceType: SearchSourceType;
  name: string;
  brand?: string;
  model?: string;
  category?: string;
  color?: string;
  visibleFeatures: string[];
  barcode?: string;
  ocrText?: string;
  confidence: number;
  imageUrl?: string;
  createdAt: string;
}

export interface ProductSearchInput {
  query: string;
  brand?: string;
  model?: string;
  category?: string;
  color?: string;
  country: string;
  currency: string;
  condition?: OfferCondition;
}

export type OfferMatchType = "exact" | "similar";

export interface NormalizedOffer {
  id: string;
  provider: string;
  storeName: string;
  sellerName?: string;
  title: string;
  brand?: string;
  model?: string;
  variant?: string;
  condition: OfferCondition;
  productUrl: string;
  imageUrl?: string;
  currency: string;
  itemPrice: number;
  shippingPrice: number;
  estimatedTax?: number;
  totalPrice: number;
  availability: OfferAvailability;
  estimatedDelivery?: string;
  sellerRating?: number;
  storeTrustScore: number;
  matchConfidence: number;
  matchType?: OfferMatchType;
  matchReason?: string;
  isSponsored?: boolean;
  sponsoredDisclosure?: string;
  affiliateUrl?: string;
  affiliateProvider?: string;
  affiliateDisclosure?: string;
  lastUpdatedAt: string;
  isMock?: boolean;
}

export interface OfferFilters {
  minPrice?: number;
  maxPrice?: number;
  condition?: OfferCondition | "any";
  freeShippingOnly?: boolean;
  country?: string;
  minRating?: number;
  brand?: string;
  color?: string;
  store?: string;
  verifiedSellersOnly?: boolean;
}
