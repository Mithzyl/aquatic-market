const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = {
  // Products
  getProducts: async (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_BASE_URL}/products/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  getProduct: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  getPromotions: async () => {
    const response = await fetch(`${API_BASE_URL}/products/promotions/`);
    if (!response.ok) throw new Error('Failed to fetch promotions');
    return response.json();
  },

  // Users
  login: async (phone: string, name: string) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name })
    });
    if (!response.ok) throw new Error('Failed to login');
    return response.json();
  },

  getUser: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  addPoints: async (userId: string, points: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/add-points?points=${points}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to add points');
    return response.json();
  },

  // Orders
  getOrders: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/orders/?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  getOrder: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },

  createOrder: async (order: any) => {
    const response = await fetch(`${API_BASE_URL}/orders/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
  },

  payOrder: async (orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/pay`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to pay order');
    return response.json();
  },

  cancelOrder: async (orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to cancel order');
    return response.json();
  },

  // Cart
  getCart: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/cart/?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch cart');
    return response.json();
  },

  addToCart: async (userId: string, productId: string, quantity: number) => {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, product_id: productId, quantity })
    });
    if (!response.ok) throw new Error('Failed to add to cart');
    return response.json();
  },

  updateCartItem: async (itemId: number, quantity: number) => {
    const response = await fetch(`${API_BASE_URL}/cart/${itemId}?quantity=${quantity}`, {
      method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to update cart');
    return response.json();
  },

  removeFromCart: async (itemId: number) => {
    const response = await fetch(`${API_BASE_URL}/cart/${itemId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to remove from cart');
    return response.json();
  },

  clearCart: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/cart/clear?user_id=${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to clear cart');
    return response.json();
  }
};

export default api;
