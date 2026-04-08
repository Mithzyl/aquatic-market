import { create } from 'zustand';
import type { Order, OrderItem } from '../types';

// Mock data for orders
const mockOrders: Order[] = [
  {
    id: '1',
    items: [
      {
        productId: '1',
        productName: '新鲜海虾',
        price: 68.8,
        quantity: 2,
        unit: '斤'
      }
    ],
    totalAmount: 137.6,
    status: 'completed',
    createdAt: '2026-03-30T10:00:00',
    pickupTime: '2026-03-30T14:00:00',
    deliveryType: 'self-pickup'
  },
  {
    id: '2',
    items: [
      {
        productId: '2',
        productName: '大闸蟹',
        price: 128.0,
        quantity: 3,
        unit: '只'
      }
    ],
    totalAmount: 384.0,
    status: 'processing',
    createdAt: '2026-04-01T09:00:00',
    pickupTime: '2026-04-01T16:00:00',
    deliveryType: 'self-pickup'
  }
];

interface OrderStore {
  orders: Order[];
  loading: boolean;
  error: string | null;
  createOrder: (items: OrderItem[], totalAmount: number, deliveryType: 'self-pickup' | 'delivery', pickupTime?: string, address?: string) => Promise<Order>;
  fetchOrders: () => void;
  getOrderById: (id: string) => Order | undefined;
  payOrder: (orderId: string) => Promise<boolean>;
  cancelOrder: (orderId: string) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  
  createOrder: async (items, totalAmount, deliveryType, pickupTime, address) => {
    set({ loading: true, error: null });
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newOrder: Order = {
          id: Date.now().toString(),
          items,
          totalAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
          pickupTime,
          deliveryType,
          address
        };
        
        set((state) => ({
          orders: [newOrder, ...state.orders],
          loading: false
        }));
        
        resolve(newOrder);
      }, 1000);
    });
  },
  
  fetchOrders: () => {
    set({ loading: true, error: null });
    
    // Simulate API call
    setTimeout(() => {
      set({ 
        orders: mockOrders, 
        loading: false 
      });
    }, 500);
  },
  
  getOrderById: (id) => {
    const { orders } = get();
    return orders.find(order => order.id === id);
  },
  
  payOrder: async (orderId) => {
    set({ loading: true, error: null });
    
    // Simulate payment API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 90% success rate
        const success = Math.random() > 0.1;
        
        if (success) {
          set((state) => ({
            orders: state.orders.map(order => 
              order.id === orderId 
                ? { ...order, status: 'paid' as const }
                : order
            ),
            loading: false
          }));
          resolve(true);
        } else {
          set({ 
            loading: false, 
            error: '支付失败，请稍后重试' 
          });
          resolve(false);
        }
      }, 2000); // 2 second delay to show loading
    });
  },
  
  cancelOrder: async (orderId) => {
    set({ loading: true, error: null });
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        set((state) => ({
          orders: state.orders.map(order => 
            order.id === orderId 
              ? { ...order, status: 'cancelled' as const }
              : order
          ),
          loading: false
        }));
        resolve();
      }, 1000);
    });
  }
}));
