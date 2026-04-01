import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import { getPromotionByProductId, calculatePromotionPrice } from '../data/promotions';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  
  const promotion = getPromotionByProductId(product.id);
  const originalPrice = product.price;
  const finalPrice = promotion ? calculatePromotionPrice(originalPrice, promotion) : originalPrice;
  const hasPromotion = promotion && finalPrice < originalPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, product.name, finalPrice, 1, product.unit);
  };

  return (
    <Link 
      to={`/product/${product.id}`}
      className="group"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="luxury-card product-card-hover rounded-2xl overflow-hidden h-full relative">
        {/* Promotion Badge */}
        {hasPromotion && (
          <div className="absolute top-3 left-3 z-20">
            <div className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse-slow">
              {promotion?.title}
            </div>
          </div>
        )}
        
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-[4/3]">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover smooth-image-hover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Shimmer Effect on Hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="shimmer-effect absolute inset-0"></div>
          </div>
          
          {/* Freshness Badge */}
          {!hasPromotion && (
            <div className="absolute top-3 left-3">
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border border-white/20 ${
                product.freshness === '今日上岸' 
                  ? 'bg-gradient-to-r from-coral-400/90 to-coral-600/90 text-white shadow-lg shadow-coral-400/30'
                  : 'bg-gradient-to-r from-ocean-400/90 to-ocean-600/90 text-white shadow-lg shadow-ocean-400/30'
              }`}>
                {product.freshness}
              </div>
            </div>
          )}
          
          {/* New Badge */}
          {product.isNew && !hasPromotion && (
            <div className="absolute top-3 right-3">
              <div className="px-3 py-1.5 bg-gradient-to-r from-seaweed-400 to-seaweed-600 text-white text-xs font-bold rounded-full shadow-lg shadow-seaweed-400/30 animate-pulse-slow">
                新品上市
              </div>
            </div>
          )}
          
          {/* Quick Add Button */}
          <div className="absolute bottom-4 right-4 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={handleAddToCart}
              className="water-button text-white px-4 py-2 rounded-full font-medium shadow-lg flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>加入购物车</span>
            </button>
          </div>
          
          {/* Water Ripple Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-wave"></div>
          
          {/* Promotion Overlay */}
          {hasPromotion && (
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h3 className="font-display text-lg font-semibold text-ocean-900 mb-2 group-hover:text-ocean-700 transition-colors">
            {product.name}
          </h3>
          
          <p className="text-ocean-600 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              {hasPromotion ? (
                <>
                  <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                    ¥{finalPrice}
                  </span>
                  <span className="text-sm text-ocean-400 line-through">
                    ¥{originalPrice}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold bg-gradient-to-r from-ocean-600 to-coral-500 bg-clip-text text-transparent">
                    ¥{product.price}
                  </span>
                  <span className="text-ocean-500 font-medium">/{product.unit}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-1 text-sm text-ocean-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>{product.stock}{product.unit}</span>
            </div>
          </div>
          
          {/* Category Tag */}
          <div className="mt-4 pt-4 border-t border-ocean-100">
            <span className="inline-block px-3 py-1 bg-ocean-50 text-ocean-600 text-xs font-medium rounded-full">
              {product.category}
            </span>
            {hasPromotion && (
              <span className="inline-block ml-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                {promotion?.description}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
