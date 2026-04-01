import React, { useEffect, useState } from 'react';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/ProductCard';
import CategoryNav from '../components/CategoryNav';

const Products: React.FC = () => {
  const { 
    products, 
    filteredProducts, 
    loading, 
    fetchProducts, 
    filterByCategory, 
    searchProducts, 
    selectedCategory 
  } = useProductStore();
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(product => product.category)));

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchProducts(query);
  };

  const handleCategoryFilter = (category: string | null) => {
    filterByCategory(category);
  };

  return (
    <div className="flex min-h-screen pt-16">
      {/* Left Category Navigation */}
      <CategoryNav 
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryFilter}
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-32 md:ml-32 transition-all duration-300">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <h1 className="text-3xl font-bold mb-6 lg:mb-8 text-ocean-900">商品列表</h1>
          
          {/* Search Bar - Only show on mobile and when category nav is hidden */}
          <div className="mb-6 lg:mb-8">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="搜索商品..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full px-4 py-3 border border-ocean-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white/80 backdrop-blur-sm"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Pills - Show on mobile only */}
          <div className="lg:hidden mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryFilter(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === null 
                    ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg' 
                    : 'bg-white text-ocean-700 hover:bg-ocean-50 border border-ocean-200'
                }`}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category 
                      ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg' 
                      : 'bg-white text-ocean-700 hover:bg-ocean-50 border border-ocean-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array(8).fill(0).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gradient-to-br from-ocean-100 to-ocean-200"></div>
                  <div className="p-4">
                    <div className="h-6 bg-ocean-100 rounded mb-2"></div>
                    <div className="h-4 bg-ocean-50 rounded mb-4"></div>
                    <div className="h-10 bg-ocean-100 rounded"></div>
                  </div>
                </div>
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="inline-block p-4 bg-ocean-50 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-ocean-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-ocean-600 text-lg">没有找到符合条件的商品</p>
                <p className="text-ocean-400 text-sm mt-2">试试其他分类或关键词</p>
              </div>
            )}
          </div>

          {/* Empty state when no products */}
          {!loading && filteredProducts.length === 0 && products.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block p-6 bg-ocean-50 rounded-full mb-6 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-ocean-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-ocean-800 mb-2">暂无商品</h3>
              <p className="text-ocean-600">商品正在上新中，敬请期待</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
