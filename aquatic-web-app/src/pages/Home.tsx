import React, { useEffect } from 'react';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/ProductCard';

const Home: React.FC = () => {
  const { filteredProducts, loading, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const featuredProducts = filteredProducts.slice(0, 4);

  return (
    <div className="relative z-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Enhanced Background with Multiple Layers */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-ocean-50 via-white to-sand-50"></div>
          
          {/* Animated orbs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-ocean-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute top-20 right-0 w-80 h-80 bg-sand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-seaweed-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float" style={{ animationDelay: '4s' }}></div>
          
          {/* Decorative bubbles */}
          <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-ocean-300 rounded-full opacity-60 animate-bubble-rise"></div>
          <div className="absolute top-1/3 right-1/5 w-3 h-3 bg-coral-300 rounded-full opacity-40 animate-bubble-rise" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-2/3 left-1/4 w-2 h-2 bg-seaweed-300 rounded-full opacity-50 animate-bubble-rise" style={{ animationDelay: '2s' }}></div>
          
          {/* Wave pattern overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="wave-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M50 0 Q75 50, 50 100 T50 0" fill="none" stroke="#0ea5e9" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wave-pattern)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Premium Badge */}
            <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white/70 backdrop-blur-md rounded-full border border-ocean-200 mb-10 animate-fade-in-up premium-shadow">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-coral-500"></span>
              </span>
              <span className="text-ocean-700 font-medium text-sm tracking-wide">今日特惠 · 新鲜直达</span>
            </div>

            {/* Main Heading with Dynamic Typography */}
            <h1 className="premium-title text-5xl md:text-7xl mb-8 animate-fade-in-up stagger-1">
              <span className="ocean-gradient-text">
                新鲜水产
              </span>
              <br />
              <span className="text-ocean-800 text-4xl md:text-6xl">每日码头直送</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-ocean-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-2">
              我们精选来自优质海域的海虾、蟹类及相关水产品，
              <br className="hidden md:block" />
              每日从码头直达，保证最鲜美的口感
            </p>

            {/* CTA Buttons with Shimmer Effect */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in-up stagger-3">
              <a 
                href="/products"
                className="shimmer-button water-button text-white px-10 py-4 rounded-2xl font-semibold text-lg premium-shadow-lg flex items-center space-x-3 group"
              >
                <span>立即选购</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a 
                href="/user"
                className="px-10 py-4 rounded-2xl font-semibold text-lg border-2 border-ocean-300 text-ocean-700 hover:bg-white hover:border-ocean-400 hover:shadow-lg transition-all duration-300 flex items-center space-x-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>加入会员</span>
              </a>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-24">
            <path d="M0 60L48 55C96 50 192 40 288 45C384 50 480 70 576 75C672 80 768 70 864 60C960 50 1056 40 1152 45C1248 50 1344 70 1392 80L1440 90V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z" fill="rgba(255, 255, 255, 0.5)"/>
            <path d="M0 90L48 85C96 80 192 70 288 75C384 80 480 100 576 105C672 110 768 100 864 90C960 80 1056 70 1152 75C1248 80 1344 100 1392 110L1440 120V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V90Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="bg-white/80 backdrop-blur-sm py-24">
        <div className="container mx-auto px-4">
          {/* Section Header with Elegant Divider */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div className="relative">
              <h2 className="premium-title text-4xl md:text-5xl font-bold text-ocean-900 mb-4">
                今日推荐
              </h2>
              <p className="text-ocean-600 text-lg mt-3">每日精选，新鲜上岸</p>
              <div className="elegant-divider mt-6"></div>
            </div>
            <a 
              href="/products" 
              className="mt-8 md:mt-0 inline-flex items-center space-x-3 text-ocean-600 hover:text-ocean-800 font-medium transition-all group"
            >
              <span>查看全部商品</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

          {/* Bento Grid Layout for Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="luxury-card rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gradient-to-br from-ocean-100 to-ocean-200"></div>
                  <div className="p-6">
                    <div className="h-7 bg-ocean-100 rounded mb-4 w-3/4"></div>
                    <div className="h-4 bg-ocean-50 rounded mb-5 w-full"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-9 bg-ocean-100 rounded w-28"></div>
                      <div className="h-6 bg-ocean-50 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Freshness Guarantee Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ocean-50/50"></div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="guarantee-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="#0ea5e9" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#guarantee-pattern)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="premium-title text-4xl md:text-5xl font-bold text-ocean-900 mb-6 mx-auto">
              新鲜保障
            </h2>
            <p className="text-ocean-600 text-lg max-w-2xl mx-auto leading-relaxed">
              我们承诺，您收到的每一份水产都是最新鲜的品质
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: '每日新鲜',
                description: '每日清晨从码头直送菜市，保证最佳新鲜度',
                gradient: 'from-ocean-400 to-ocean-600',
                iconColor: 'text-ocean-600',
                bgGradient: 'from-ocean-50 to-ocean-100'
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: '品质保证',
                description: '专业人员严格挑选，只售最优质的水产',
                gradient: 'from-coral-400 to-coral-600',
                iconColor: 'text-coral-600',
                bgGradient: 'from-coral-50 to-coral-100'
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: '快速配送',
                description: '支持到店自提和同城配送，灵活选择',
                gradient: 'from-seaweed-400 to-seaweed-600',
                iconColor: 'text-seaweed-600',
                bgGradient: 'from-seaweed-50 to-seaweed-100'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="luxury-card rounded-3xl p-10 text-center hover-lift group"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br ${feature.bgGradient} flex items-center justify-center ${feature.iconColor} group-hover:scale-110 transition-transform duration-500`}>
                  {feature.icon}
                </div>
                <h3 className="premium-title text-2xl font-semibold text-ocean-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-ocean-600 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-b from-ocean-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="premium-title text-4xl md:text-5xl font-bold text-ocean-900 mb-6 mx-auto">
              客户评价
            </h2>
            <p className="text-ocean-600 text-lg max-w-2xl mx-auto leading-relaxed">
              听听他们怎么说
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {[
              {
                name: '李先生',
                text: '海虾非常新鲜，肉质紧实，价格也很实惠。现在每周都来这里采购，已经是老顾客了！',
                rating: 5,
                avatar: 'L'
              },
              {
                name: '王女士',
                text: '大闸蟹的品质非常好，蟹黄饱满，客服态度也特别好。强烈推荐给大家！',
                rating: 5,
                avatar: 'W'
              }
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="luxury-card rounded-3xl p-10 hover-lift"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Quote decoration */}
                <div className="absolute top-6 left-8 text-6xl text-ocean-100 font-serif leading-none">"</div>
                
                <div className="relative flex items-center space-x-1 mb-6">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-sand-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-ocean-700 text-xl mb-8 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div className="flex flex-col">
                    <div className="font-semibold text-ocean-800 text-lg">
                      {testimonial.name}
                    </div>
                    <div className="text-ocean-500 text-sm">忠实客户</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
