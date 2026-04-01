import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/productStore';
import { useCartStore } from '../store/cartStore';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  
  const { getProductById, fetchProducts } = useProductStore();
  const addToCart = useCartStore((state) => state.addToCart);
  
  const product = getProductById(id || '');

  useEffect(() => {
    if (!product) {
      fetchProducts();
    }
  }, [product, fetchProducts]);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center py-12">
          <p className="text-gray-600">商品不存在</p>
          <Link to="/products" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded hover:bg-accent transition">
            返回商品列表
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product.id, product.name, product.price, quantity, product.unit);
    navigate('/cart');
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Image */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-lg shadow-md p-4">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-96 object-cover rounded"
            />
          </div>
        </div>
        
        {/* Product Info */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded">
                    {product.freshness}
                  </span>
                  {product.isNew && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      新品
                    </span>
                  )}
                </div>
              </div>
              <div className="text-primary font-bold text-2xl">
                ¥{product.price}/{product.unit}
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">{product.description}</p>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">库存</span>
                <span>{product.stock} {product.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(product.stock / 100) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <span className="text-gray-700 mr-4">数量</span>
                <div className="flex items-center border border-gray-300 rounded">
                  <button 
                    onClick={() => handleQuantityChange(-1)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="px-4 py-1">{quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(1)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-lg font-medium">
                小计：¥{product.price * quantity}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-accent transition"
              >
                加入购物车
              </button>
              <button 
                className="flex-1 border border-primary text-primary py-3 rounded-lg hover:bg-primary hover:text-white transition"
              >
                立即购买
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Description */}
      <div className="mt-12 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">商品详情</h2>
        <div className="text-gray-600">
          <p className="mb-4">{product.description}</p>
          <p className="mb-4">我们的{product.name}来自优质海域，每日新鲜捕捞，确保品质。</p>
          <p>适合多种烹饪方式，是家庭聚餐和朋友聚会的理想选择。</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
