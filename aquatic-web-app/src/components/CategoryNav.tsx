import React, { useState } from 'react';
import type { Category } from '../types';

interface CategoryNavProps {
  onCategoryChange?: (category: string | null) => void;
  selectedCategory?: string | null;
}

const categories: Category[] = [
  {
    id: 'shrimp',
    name: '虾类',
    icon: '🦐'
  },
  {
    id: 'crab',
    name: '蟹类',
    icon: '🦀'
  },
  {
    id: 'shellfish',
    name: '贝类',
    icon: '🐚'
  },
  {
    id: 'fish',
    name: '鱼类',
    icon: '🐟'
  }
];

const CategoryNav: React.FC<CategoryNavProps> = ({ 
  onCategoryChange,
  selectedCategory = null 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? null : categoryId;
    onCategoryChange?.(newCategory);
  };

  const toggleMobileNav = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAllProducts = () => {
    onCategoryChange?.(null);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleMobileNav}
        className="md:hidden fixed bottom-4 left-4 z-50 glass-card rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 text-ocean-600 transition-transform duration-300 ${
            isExpanded ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isExpanded ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
        
        {/* Category count badge */}
        {selectedCategory && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-coral-400 to-coral-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">1</span>
          </div>
        )}
      </button>

      {/* Mobile Overlay */}
      {isExpanded && (
        <div
          className="md:hidden fixed inset-0 bg-ocean-900/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={toggleMobileNav}
        />
      )}

      {/* Navigation Container */}
      <nav
        className={`
          fixed left-0 top-16 bottom-0 z-40
          w-28 md:w-32
          transform transition-transform duration-300 ease-in-out
          ${isExpanded ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-full glass-card rounded-r-2xl border-r-0 border-l border-t-0 border-b-0 border-white/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-ocean-100/50 backdrop-blur-sm bg-gradient-to-r from-ocean-50/50 to-transparent">
            <div className="text-center">
              <h2 className="font-display text-sm font-semibold ocean-gradient-text mb-1">
                分类
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-ocean-400 to-coral-400 rounded-full mx-auto"></div>
            </div>
          </div>

          {/* Category List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2 px-3">
            {/* All Products */}
            <button
              onClick={handleAllProducts}
              className={`
                w-full group relative
                p-3 rounded-xl
                transition-all duration-300 ease-out
                transform hover:scale-105
                ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg shadow-ocean-500/30'
                    : 'hover:bg-ocean-50 text-ocean-700 hover:text-ocean-900'
                }
              `}
            >
              {/* Active indicator */}
              <div
                className={`
                  absolute left-0 top-1/2 -translate-y-1/2
                  w-1 h-8 rounded-r-full
                  transition-all duration-300
                  ${
                    selectedCategory === null
                      ? 'bg-coral-400 shadow-lg shadow-coral-400/50'
                      : 'bg-transparent group-hover:bg-ocean-300/50'
                  }
                `}
              />

              <div className="flex flex-col items-center space-y-2">
                {/* Icon */}
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${
                      selectedCategory === null
                        ? 'bg-white/20 backdrop-blur-sm'
                        : 'bg-ocean-100 group-hover:bg-ocean-200'
                    }
                  `}
                >
                  <span className="text-2xl">🏪</span>
                </div>

                {/* Label */}
                <span className="text-xs font-medium text-center leading-tight">
                  全部商品
                </span>
              </div>

              {/* Hover glow effect */}
              <div
                className={`
                  absolute inset-0 rounded-xl
                  bg-gradient-to-r from-ocean-400/10 to-transparent
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-300
                  pointer-events-none
                `}
              />
            </button>

            {/* Category Items */}
            {categories.map((category, index) => {
              const isActive = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`
                    w-full group relative
                    p-3 rounded-xl
                    transition-all duration-300 ease-out
                    transform hover:scale-105
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg shadow-ocean-500/30'
                        : 'hover:bg-ocean-50 text-ocean-700 hover:text-ocean-900'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {/* Active indicator */}
                  <div
                    className={`
                      absolute left-0 top-1/2 -translate-y-1/2
                      w-1 h-8 rounded-r-full
                      transition-all duration-300
                      ${
                        isActive
                          ? 'bg-coral-400 shadow-lg shadow-coral-400/50'
                          : 'bg-transparent group-hover:bg-ocean-300/50'
                      }
                    `}
                  />

                  <div className="flex flex-col items-center space-y-2">
                    {/* Icon Container */}
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        transition-all duration-300 relative
                        ${
                          isActive
                            ? 'bg-white/20 backdrop-blur-sm'
                            : 'bg-ocean-100 group-hover:bg-ocean-200'
                        }
                      `}
                    >
                      <span className="text-2xl transform transition-transform duration-300 group-hover:scale-110">
                        {category.icon}
                      </span>
                      
                      {/* Decorative ring for active state */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-pulse" />
                      )}
                    </div>

                    {/* Label */}
                    <span className="text-xs font-medium text-center leading-tight">
                      {category.name}
                    </span>
                  </div>

                  {/* Hover glow effect */}
                  <div
                    className={`
                      absolute inset-0 rounded-xl
                      bg-gradient-to-r from-ocean-400/10 to-transparent
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-300
                      pointer-events-none
                    `}
                  />

                  {/* Ripple effect on click */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <div
                      className={`
                        absolute inset-0
                        bg-gradient-to-r from-transparent via-white/20 to-transparent
                        -translate-x-full
                        ${
                          isActive
                            ? 'animate-wave'
                            : ''
                        }
                      `}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer decoration */}
          <div className="p-4 border-t border-ocean-100/50">
            <div className="relative">
              {/* Bubble decorations */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex space-x-2">
                <div className="w-2 h-2 bg-ocean-300/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-ocean-400/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-ocean-300/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
            
            {/* Current selection hint */}
            {selectedCategory && (
              <div className="mt-2 text-center">
                <p className="text-xs text-ocean-500 animate-pulse-slow">
                  已选择分类筛选
                </p>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile expanded state indicator */}
      {isExpanded && (
        <div className="md:hidden fixed top-20 left-32 z-50 animate-scale-in">
          <div className="glass-card rounded-full px-4 py-2 shadow-lg">
            <span className="text-sm text-ocean-600 font-medium">
              展开分类
            </span>
          </div>
        </div>
      )}

      {/* Style tag for animations */}
      <style>{`
        @keyframes wave {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        
        .animate-wave {
          animation: wave 1.5s ease-out;
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default CategoryNav;
