import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-auto">
      {/* Wave Divider */}
      <div className="absolute top-0 left-0 right-0 transform -translate-y-full">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16">
          <path d="M0 60L48 55C96 50 192 40 288 45C384 50 480 70 576 75C672 80 768 70 864 60C960 50 1056 40 1152 45C1248 50 1344 70 1392 80L1440 90V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z" fill="#0c4a6e"/>
        </svg>
      </div>

      <div className="bg-ocean-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold">水产菜市</h3>
                  <p className="text-ocean-300 text-sm">新鲜直达，每日特惠</p>
                </div>
              </div>
              <p className="text-ocean-200 leading-relaxed">
                我们精选来自优质海域的海虾、蟹类及相关水产品，每日从码头直达，保证最鲜美的口感。
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display text-lg font-semibold mb-6 text-ocean-100">快速链接</h4>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="text-ocean-200 hover:text-white transition-colors flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>首页</span>
                  </a>
                </li>
                <li>
                  <a href="/products" className="text-ocean-200 hover:text-white transition-colors flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>商品列表</span>
                  </a>
                </li>
                <li>
                  <a href="/orders" className="text-ocean-200 hover:text-white transition-colors flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>我的订单</span>
                  </a>
                </li>
                <li>
                  <a href="/user" className="text-ocean-200 hover:text-white transition-colors flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>个人中心</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-lg font-semibold mb-6 text-ocean-100">联系我们</h4>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-ocean-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ocean-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314-11.314z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-ocean-100 font-medium">地址</p>
                    <p className="text-ocean-200">水产市场A区12号</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-ocean-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ocean-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-ocean-100 font-medium">电话</p>
                    <p className="text-ocean-200">13800138000</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-ocean-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ocean-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-ocean-100 font-medium">营业时间</p>
                    <p className="text-ocean-200">周一至周日 6:00 - 18:00</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Payment Methods */}
            <div>
              <h4 className="font-display text-lg font-semibold mb-6 text-ocean-100">支付方式</h4>
              <div className="grid grid-cols-2 gap-3">
                {['微信支付', '支付宝', '银行卡', '到店支付'].map((method, index) => (
                  <div key={index} className="bg-ocean-800 rounded-lg px-4 py-3 text-center text-ocean-200 text-sm">
                    {method}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-ocean-800 pt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-ocean-300 text-sm">
                © 2026 水产菜市. 保留所有权利.
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <a href="#" className="text-ocean-300 hover:text-white transition-colors">服务条款</a>
                <a href="#" className="text-ocean-300 hover:text-white transition-colors">隐私政策</a>
                <a href="#" className="text-ocean-300 hover:text-white transition-colors">关于我们</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
