// Product types
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string; // 斤 or 只
  description: string;
  image: string;
  stock: number;
  isNew: boolean;
  freshness: string; // 今日上岸, 暂养3天内
  promotionId?: string; // 促销活动ID
}

// Promotion types
export interface Promotion {
  id: string;
  productId: string;
  type: 'discount' | 'special';
  discount?: number;
  promotionPrice?: number;
  startDate: string;
  endDate: string;
  title?: string;
  description?: string;
}

// Order types
export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  unit: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  pickupTime?: string;
  deliveryType: 'self-pickup' | 'delivery';
  address?: string;
}

// User types
export interface User {
  id: string;
  name: string;
  phone: string;
  points: number;
  level: 'normal' | 'vip' | 'premium';
}

// Category types
export interface Category {
  id: string;
  name: string;
  icon: string;
}