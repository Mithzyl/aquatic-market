import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { useUserStore } from '../store/userStore';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [deliveryType, setDeliveryType] = useState<'self-pickup' | 'delivery'>('self-pickup');
  const [pickupTime, setPickupTime] = useState('');
  const [address, setAddress] = useState('');
  
  const { items, updateQuantity, removeFromCart, getTotalAmount, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();
  const { user, fetchUser } = useUserStore();
  
  const totalAmount = getTotalAmount();

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = items.find(item => item.productId === productId);
    if (item) {
      updateQuantity(productId, item.quantity + delta);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    if (!user) {
      // Redirect to login page if user is not logged in
      navigate('/user');
      return;
    }
    
    try {
      await createOrder(items, totalAmount, deliveryType, pickupTime, address);
      clearCart();
      navigate('/orders');
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">购物车为空</h2>
          <p className="text-gray-600 mb-6">去挑选一些新鲜的水产品吧</p>
          <button 
            onClick={() => navigate('/products')}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-accent transition"
          >
            去购物
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">购物车</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="font-medium">商品清单</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.productId} className="p-4 flex items-center">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{item.productName}</h3>
                    <p className="text-gray-600 text-sm">¥{item.price}/{item.unit}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border border-gray-300 rounded">
                      <button 
                        onClick={() => handleUpdateQuantity(item.productId, -1)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="px-3 py-1">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.productId, 1)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-medium">¥{item.price * item.quantity}</div>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Checkout */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">结算信息</h2>
            
            {/* Delivery Type */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">配送方式</h3>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setDeliveryType('self-pickup')}
                  className={`flex-1 py-2 border rounded ${deliveryType === 'self-pickup' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'}`}
                >
                  到店自提
                </button>
                <button 
                  onClick={() => setDeliveryType('delivery')}
                  className={`flex-1 py-2 border rounded ${deliveryType === 'delivery' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'}`}
                >
                  同城配送
                </button>
              </div>
            </div>
            
            {/* Pickup Time */}
            {deliveryType === 'self-pickup' && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">自提时间</h3>
                <input
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            
            {/* Address */}
            {deliveryType === 'delivery' && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">配送地址</h3>
                <input
                  type="text"
                  placeholder="请输入配送地址"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            
            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">商品总价</span>
                <span>¥{totalAmount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">配送费</span>
                <span>¥{deliveryType === 'self-pickup' ? 0 : 5}</span>
              </div>
              <div className="flex justify-between font-medium text-lg mt-4">
                <span>合计</span>
                <span>¥{totalAmount + (deliveryType === 'self-pickup' ? 0 : 5)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-accent transition"
            >
              提交订单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
