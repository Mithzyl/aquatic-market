import { create } from 'zustand';
import type { User } from '../types';

// Mock user data
const mockUser: User = {
  id: '1',
  name: '张三',
  phone: '13800138000',
  points: 1280,
  level: 'vip'
};

interface UserStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, name: string) => Promise<User>;
  logout: () => void;
  fetchUser: () => void;
  addPoints: (points: number) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,
  
  login: async (phone, name) => {
    set({ loading: true, error: null });
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const user: User = {
          id: Date.now().toString(),
          name,
          phone,
          points: 0,
          level: 'normal'
        };
        
        set({ user, loading: false });
        resolve(user);
      }, 1000);
    });
  },
  
  logout: () => {
    set({ user: null });
  },
  
  fetchUser: () => {
    set({ loading: true, error: null });
    
    // Simulate API call
    setTimeout(() => {
      set({ user: mockUser, loading: false });
    }, 500);
  },
  
  addPoints: (points) => {
    set((state) => {
      if (!state.user) return state;
      
      const newPoints = state.user.points + points;
      let newLevel = state.user.level;
      
      // Update user level based on points
      if (newPoints >= 5000) {
        newLevel = 'premium';
      } else if (newPoints >= 1000) {
        newLevel = 'vip';
      }
      
      return {
        user: {
          ...state.user,
          points: newPoints,
          level: newLevel
        }
      };
    });
  }
}));
