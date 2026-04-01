import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

const Header: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const totalItems = getTotalItems();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card border-b border-white/50">
        {/* Bubble decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="bubble-decoration"></div>
          <div className="bubble-decoration"></div>
          <div className="bubble-decoration"></div>
          <div className="bubble-decoration"></div>
          <div className="bubble-decoration"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-full flex items-center justify-center animate-pulse-slow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-coral-400 rounded-full animate-pulse"></div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </div>
              <div>
                <h1 className="font-display text-xl font-bold ocean-gradient-text">
                  水产菜市
                </h1>
                <p className="text-xs text-ocean-500">新鲜直达，每日特惠</p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`relative group ${location.pathname === '/' ? 'text-ocean-700 font-medium' : 'text-ocean-600 hover:text-ocean-800'}`}
              >
                <span>首页</span>
                {location.pathname === '/' && (
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-ocean-400 to-coral-400 rounded-full"></span>
                )}
              </Link>
              <Link 
                to="/products" 
                className={`relative group ${location.pathname === '/products' ? 'text-ocean-700 font-medium' : 'text-ocean-600 hover:text-ocean-800'}`}
              >
                <span>商品</span>
                {location.pathname === '/products' && (
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-ocean-400 to-coral-400 rounded-full"></span>
                )}
              </Link>
              <Link 
                to="/orders" 
                className={`relative group ${location.pathname === '/orders' ? 'text-ocean-700 font-medium' : 'text-ocean-600 hover:text-ocean-800'}`}
              >
                <span>订单</span>
                {location.pathname === '/orders' && (
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-ocean-400 to-coral-400 rounded-full"></span>
                )}
              </Link>
              <Link 
                to="/user" 
                className={`relative group ${location.pathname === '/user' ? 'text-ocean-700 font-medium' : 'text-ocean-600 hover:text-ocean-800'}`}
              >
                <span>我的</span>
                {location.pathname === '/user' && (
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-ocean-400 to-coral-400 rounded-full"></span>
                )}
              </Link>
            </nav>
            
            {/* Cart & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative p-2 rounded-full hover:bg-ocean-50 transition-all duration-300 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ocean-600 group-hover:text-ocean-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-coral-400 to-coral-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse-slow">
                    {totalItems}
                  </span>
                )}
              </Link>
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-ocean-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ocean-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-ocean-100 animate-fade-in-up">
              <nav className="flex flex-col space-y-3">
                <Link 
                  to="/" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg ${location.pathname === '/' ? 'bg-ocean-100 text-ocean-700' : 'text-ocean-600 hover:bg-ocean-50'}`}
                >
                  首页
                </Link>
                <Link 
                  to="/products" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg ${location.pathname === '/products' ? 'bg-ocean-100 text-ocean-700' : 'text-ocean-600 hover:bg-ocean-50'}`}
                >
                  商品
                </Link>
                <Link 
                  to="/orders" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg ${location.pathname === '/orders' ? 'bg-ocean-100 text-ocean-700' : 'text-ocean-600 hover:bg-ocean-50'}`}
                >
                  订单
                </Link>
                <Link 
                  to="/user" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg ${location.pathname === '/user' ? 'bg-ocean-100 text-ocean-700' : 'text-ocean-600 hover:bg-ocean-50'}`}
                >
                  我的
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
