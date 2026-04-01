import { create } from 'zustand';
import type { Product } from '../types';
import { api } from '../services/api';

const categoryIdToName: Record<string, string> = {
  'shrimp': '虾类',
  'crab': '蟹类',
  'shellfish': '贝类',
  'fish': '鱼类'
};

interface ProductStore {
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  fetchProducts: () => Promise<void>;
  filterByCategory: (category: string | null) => void;
  searchProducts: (query: string) => void;
  getProductById: (id: string) => Product | undefined;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  filteredProducts: [],
  loading: false,
  error: null,
  selectedCategory: null,
  searchQuery: '',
  
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await api.getProducts();
      set({ 
        products, 
        filteredProducts: products, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        loading: false 
      });
    }
  },
  
  filterByCategory: (category) => {
    const { products, searchQuery } = get();
    set({ selectedCategory: category });
    
    let filtered = products;
    
    if (category) {
      const categoryName = categoryIdToName[category] || category;
      filtered = filtered.filter(product => product.category === categoryName);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    set({ filteredProducts: filtered });
  },
  
  searchProducts: (query) => {
    const { products, selectedCategory } = get();
    set({ searchQuery: query });
    
    let filtered = products;
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    if (query) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    set({ filteredProducts: filtered });
  },
  
  getProductById: (id) => {
    const { products } = get();
    return products.find(product => product.id === id);
  }
}));
