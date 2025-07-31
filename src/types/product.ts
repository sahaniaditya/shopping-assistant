// Product type definitions

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  images: string[];
  category: string;
  subcategory?: string;
  brand: string;
  inStock: boolean;
  stockCount: number;
  features: string[];
  specifications: Record<string, string>;
  tags: string[];
  seller: Seller;
  shipping: ShippingInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface Seller {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
}

export interface ShippingInfo {
  free: boolean;
  cost?: number;
  estimatedDays: number;
  fastDelivery?: boolean;
}

export interface ProductSearchQuery {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  brand?: string;
  inStockOnly?: boolean;
  sortBy?: SortOption;
  limit?: number;
  offset?: number;
}

export type SortOption = 
  | 'relevance'
  | 'price_low_high'
  | 'price_high_low'
  | 'rating'
  | 'reviews'
  | 'newest';

export interface ProductSearchResult {
  products: Product[];
  total: number;
  query: ProductSearchQuery;
  suggestions?: string[];
  filters: SearchFilters;
}

export interface SearchFilters {
  categories: FilterOption[];
  brands: FilterOption[];
  priceRanges: PriceRange[];
  ratings: FilterOption[];
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface PriceRange {
  min: number;
  max: number;
  label: string;
  count: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  addedAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceAdjustment?: number;
  imageUrl?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  updatedAt: Date;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  verified: boolean;
  createdAt: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: ProductCategory[];
  productCount: number;
  imageUrl?: string;
} 