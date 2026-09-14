// src/types/index.ts

export interface ProductVariant {
  id: string;
  product_id: string;
  size?: string;
  color?: string;
  color_hex?: string;
  price: number;
  stock: number;
  image_url?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  images?: string[];
  category?: string;
  stock: number;
  is_active: boolean;
  has_variants: boolean;
  product_variants?: ProductVariant[];
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_city?: string;
  delivery_area?: string;
  items: OrderItem[];
  total_price: number;
  shipping_cost: number;
  payment_method: string;
  status: string;
  tracking_number?: string;
  delivery_provider?: string;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image_url?: string;
}

export interface StoreSettings {
  id?: string;
  store_name: string;
  logo_url?: string;
  primary_color?: string;
  currency: string;
  shipping_cost: number;
  free_shipping_threshold?: number;
  whatsapp_number?: string;
  instagram_url?: string;
  facebook_url?: string;
}

export interface EzonePayload {
  Title: string;
  OrderReference: string;
  IsUniqueOrderReference: boolean;
  InternalReference: string;
  Amount: number;
  Currency: number;
  Note: string;
  Customer: {
    FirstName: string;
    LastName: string;
    PhoneNumber: string;
  };
  RedirectUrl: string;
}