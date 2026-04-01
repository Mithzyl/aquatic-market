import { create } from 'zustand';
import type { OrderItem } from '../types';

interface CartStore {
  items: OrderItem[];
  addToCart: (productId: string, productName: string, price: number, quantity: number, unit: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addToCart: (productId, productName, price, quantity, unit) => {
    const { items } = get();
    const existingItem = items.find(item => item.productId === productId);
    
    if (existingItem) {
      const updatedItems = items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + quantity } 
          : item
      );
      set({ items: updatedItems });
    } else {
      const newItem: OrderItem = {
        productId,
        productName,
        price,
        quantity,
        unit
      };
      set({ items: [...items, newItem] });
    }
  },
  
  removeFromCart: (productId) => {
    const { items } = get();
    const updatedItems = items.filter(item => item.productId !== productId);
    set({ items: updatedItems });
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    
    const { items } = get();
    const updatedItems = items.map(item => 
      item.productId === productId 
        ? { ...item, quantity } 
        : item
    );
    set({ items: updatedItems });
  },
  
  clearCart: () => {
    set({ items: [] });
  },
  
  getTotalItems: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.quantity, 0);
  },
  
  getTotalAmount: () => {
    const { items } = get();
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
