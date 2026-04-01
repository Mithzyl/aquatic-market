import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loading, fetchOrders, payOrder, cancelOrder, error } = useOrderStore();
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{ orderId: string; success: boolean } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待支付';
      case 'paid':
        return '已支付';
      case 'processing':
        return '处理中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'paid':
        return 'text-blue-500';
      case 'processing':
        return 'text-purple-500';
      case 'completed':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const handlePay = async (orderId: string) => {
    setPayingOrderId(orderId);
    try {
      const success = await payOrder(orderId);
      setPaymentSuccess({ orderId, success });
      
      if (success) {
        // Show success animation then clear
        setTimeout(() => {
          setPaymentSuccess(null);
        }, 3000);
      } else {
        // Show error for longer
        setTimeout(() => {
          setPaymentSuccess(null);
          setPayingOrderId(null);
        }, 3000);
      }
    } catch (err) {
      setPaymentSuccess({ orderId, success: false });
      setTimeout(() => {
        setPaymentSuccess(null);
        setPayingOrderId(null);
      }, 3000);
    }
  };

  const handleCancel = async (orderId: string) => {
    await cancelOrder(orderId);
    setShowCancelConfirm(null);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">我的订单</h1>
      
      {loading && !payingOrderId ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="p-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden relative">
              
              {/* Payment Success Overlay */}
              {paymentSuccess?.orderId === order.id && paymentSuccess.success && (
                <div className="absolute inset-0 bg-green-500/10 backdrop-blur-sm z-10 flex items-center justify-center animate-scale-in">
                  <div className="bg-white rounded-2xl p-8 shadow-2xl text-center transform animate-bounce-in">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-green-500 animate-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-green-600 mb-2">支付成功</h3>
                    <p className="text-gray-600">您的订单已支付成功</p>
                  </div>
                </div>
              )}
              
              {/* Payment Error Overlay */}
              {paymentSuccess?.orderId === order.id && !paymentSuccess.success && (
                <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm z-10 flex items-center justify-center animate-scale-in">
                  <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-red-600 mb-2">支付失败</h3>
                    <p className="text-gray-600">{error || '请稍后重试'}</p>
                  </div>
                </div>
              )}
              
              {/* Cancel Confirmation Modal */}
              {showCancelConfirm === order.id && (
                <div className="absolute inset-0 bg-ocean-900/20 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4">
                    <h3 className="text-xl font-bold mb-4">确认取消订单</h3>
                    <p className="text-gray-600 mb-6">确定要取消这个订单吗？此操作不可撤销。</p>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowCancelConfirm(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        继续保留
                      </button>
                      <button
                        onClick={() => handleCancel(order.id)}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        确认取消
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <div className="font-medium">订单号: {order.id}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className={`font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </div>
              </div>
              <div className="p-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-600">
                        {item.quantity} {item.unit} × ¥{item.price}
                      </div>
                    </div>
                    <div className="font-medium">¥{item.price * item.quantity}</div>
                  </div>
                ))}
                <div className="flex justify-between py-4 font-medium">
                  <div>合计</div>
                  <div className="text-xl">¥{order.totalAmount}</div>
                </div>
                {order.deliveryType === 'self-pickup' && order.pickupTime && (
                  <div className="text-sm text-gray-600 mb-2">
                    自提时间: {new Date(order.pickupTime).toLocaleString()}
                  </div>
                )}
                {order.deliveryType === 'delivery' && order.address && (
                  <div className="text-sm text-gray-600 mb-2">
                    配送地址: {order.address}
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setShowCancelConfirm(order.id)}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                      disabled={loading}
                    >
                      取消订单
                    </button>
                    <button
                      onClick={() => handlePay(order.id)}
                      className="px-6 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                      disabled={payingOrderId === order.id}
                    >
                      {payingOrderId === order.id ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>支付中...</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span>去支付</span>
                        </>
                      )}
                    </button>
                  </>
                )}
                {order.status === 'paid' && (
                  <>
                    <button className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition">
                      查看详情
                    </button>
                    <button
                      onClick={() => navigate('/products')}
                      className="px-4 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition"
                    >
                      再次购买
                    </button>
                  </>
                )}
                {order.status === 'completed' && (
                  <>
                    <button className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition">
                      查看详情
                    </button>
                    <button
                      onClick={() => navigate('/products')}
                      className="px-4 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition"
                    >
                      再次购买
                    </button>
                  </>
                )}
                {order.status === 'cancelled' && (
                  <button
                    onClick={() => navigate('/products')}
                    className="px-4 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition"
                  >
                    重新下单
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-bold mb-2">暂无订单</h2>
          <p className="text-gray-600 mb-6">去挑选一些新鲜的水产品吧</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition"
          >
            去购物
          </button>
        </div>
      )}
      
      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes bounce-in {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        @keyframes check {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        
        .animate-check {
          animation: check 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Orders;
