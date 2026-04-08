import React from 'react';

const LinkStylesDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sand-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="premium-title text-5xl md:text-6xl font-bold text-ocean-900 mb-6">
            超链接样式演示
          </h1>
          <p className="text-xl text-ocean-600 max-w-2xl mx-auto">
            海洋主题的超链接样式系统，包含15种不同的链接样式
          </p>
          <div className="elegant-divider mt-8 max-w-md mx-auto"></div>
        </div>

        {/* Link Styles Grid */}
        <div className="space-y-16">
          {/* 1. Primary Link */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">1. 主要链接 (Primary)</h2>
            <p className="text-ocean-600 mb-6">带渐变下划线动画的主要链接样式</p>
            <div className="flex flex-wrap gap-6">
              <a href="#" className="link-primary">查看详情</a>
              <a href="#" className="link-primary">了解更多</a>
              <a href="#" className="link-primary">联系我们</a>
            </div>
          </section>

          {/* 2. Wave Link */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">2. 水波纹链接 (Wave)</h2>
            <p className="text-ocean-600 mb-6">悬停时产生水波纹扩散效果</p>
            <div className="flex flex-wrap gap-6">
              <a href="#" className="link-wave">探索产品</a>
              <a href="#" className="link-wave">浏览分类</a>
              <a href="#" className="link-wave">查看推荐</a>
            </div>
          </section>

          {/* 3. Border Gradient Link */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">3. 渐变边框链接 (Border Gradient)</h2>
            <p className="text-ocean-600 mb-6">悬停时显示动态渐变边框</p>
            <div className="flex flex-wrap gap-6">
              <a href="#" className="link-border-gradient">立即购买</a>
              <a href="#" className="link-border-gradient">加入购物车</a>
              <a href="#" className="link-border-gradient">立即预订</a>
            </div>
          </section>

          {/* 4. Bubble Link */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">4. 气泡链接 (Bubble)</h2>
            <p className="text-ocean-600 mb-6">悬停时出现上升的气泡装饰</p>
            <div className="flex flex-wrap gap-6">
              <a href="#" className="link-bubble">新鲜海虾</a>
              <a href="#" className="link-bubble">大闸蟹</a>
              <a href="#" className="link-bubble">特色水产</a>
            </div>
          </section>

          {/* 5. Underline Links */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">5. 下划线滑动链接 (Underline)</h2>
            <p className="text-ocean-600 mb-6">三种不同的下划线动画方向</p>
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-sm text-ocean-500 mb-3">从左滑入</p>
                <a href="#" className="link-underline-left">产品介绍</a>
              </div>
              <div>
                <p className="text-sm text-ocean-500 mb-3">从中间展开</p>
                <a href="#" className="link-underline-center">服务说明</a>
              </div>
              <div>
                <p className="text-sm text-ocean-500 mb-3">从右滑入</p>
                <a href="#" className="link-underline-right">帮助中心</a>
              </div>
            </div>
          </section>

          {/* 6. Glow Link */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">6. 发光链接 (Glow)</h2>
            <p className="text-ocean-600 mb-6">悬停时产生发光效果</p>
            <div className="flex flex-wrap gap-6">
              <a href="#" className="link-glow">精选推荐</a>
              <a href="#" className="link-glow">热门商品</a>
              <a href="#" className="link-glow">限时特惠</a>
            </div>
          </section>

          {/* 7. Arrow Link */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">7. 箭头链接 (Arrow)</h2>
            <p className="text-ocean-600 mb-6">带动态箭头的导航链接</p>
            <div className="flex flex-wrap gap-6">
              <a href="#" className="link-arrow">查看全部商品</a>
              <a href="#" className="link-arrow">浏览更多</a>
              <a href="#" className="link-arrow">下一页</a>
            </div>
          </section>

          {/* 8. Card Link */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">8. 卡片链接 (Card)</h2>
            <p className="text-ocean-600 mb-6">整个卡片可点击的链接样式</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a href="#" className="link-card bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-semibold text-ocean-900 mb-2">新鲜海虾</h3>
                <p className="text-ocean-600 text-sm">今日上岸，肉质鲜美</p>
              </a>
              <a href="#" className="link-card bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-semibold text-ocean-900 mb-2">大闸蟹</h3>
                <p className="text-ocean-600 text-sm">蟹黄饱满，品质上乘</p>
              </a>
              <a href="#" className="link-card bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-semibold text-ocean-900 mb-2">特色水产</h3>
                <p className="text-ocean-600 text-sm">精选优质，新鲜直达</p>
              </a>
            </div>
          </section>

          {/* 9. Text Link */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">9. 文本内链接 (Text)</h2>
            <p className="text-ocean-600 mb-6">段落中使用的柔和链接样式</p>
            <p className="text-lg text-ocean-700 leading-relaxed">
              我们致力于为您提供最新鲜的水产品。所有产品均来自<a href="#" className="link-text">优质海域</a>，
              经过严格筛选和检验。了解更多关于我们的<a href="#" className="link-text">品质保证</a>和
              <a href="#" className="link-text">配送服务</a>。
            </p>
          </section>

          {/* 10. Social Links */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">10. 社交链接 (Social)</h2>
            <p className="text-ocean-600 mb-6">圆形背景的社交媒体链接</p>
            <div className="flex gap-4">
              <a href="#" className="link-social" aria-label="微信">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                </svg>
              </a>
              <a href="#" className="link-social" aria-label="微博">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.579-.18-.405-.649.381-.998.42-1.859.001-2.469-.787-1.146-2.939-1.085-5.378-.03 0 0-.769.334-.573-.271.378-1.2.32-2.206-.267-2.787-1.333-1.318-4.869.049-7.897 3.054C1.299 10.542 0 12.682 0 14.526c0 3.526 4.524 5.669 8.951 5.669 5.797 0 9.649-3.367 9.649-6.041 0-1.618-1.363-2.535-2.541-2.505zm1.698-5.459c-.247-.293-.617-.423-.972-.354-.355.07-.645.293-.78.601-.134.307-.1.66.089.939.19.278.498.45.828.45.34 0 .657-.166.849-.444.192-.278.218-.636.068-.938-.149-.301-.434-.509-.763-.559l-.219.305zm.884-.916c.419.06.802.285 1.051.619.249.333.339.756.249 1.163-.09.406-.347.756-.707.96-.36.205-.788.241-1.178.098-.39-.143-.701-.452-.857-.846-.156-.394-.14-.835.045-1.217.185-.382.519-.671.919-.795l.478.018zm2.489-.849c-.628-.839-1.578-1.368-2.616-1.456-1.038-.088-2.063.27-2.823.982-.76.712-1.176 1.713-1.138 2.751.038 1.038.525 2.006 1.336 2.66.811.654 1.858.927 2.879.75 1.021-.178 1.921-.757 2.473-1.59.552-.832.699-1.859.401-2.805-.298-.946-.961-1.735-1.838-2.18l.526-.112z"/>
                </svg>
              </a>
              <a href="#" className="link-social" aria-label="抖音">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            </div>
          </section>

          {/* 11. Button Links */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">11. 按钮式链接 (Button)</h2>
            <p className="text-ocean-600 mb-6">主要和次要CTA按钮样式</p>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="link-button-primary">立即购买</a>
              <a href="#" className="link-button-secondary">加入购物车</a>
              <a href="#" className="link-button-primary">立即预订</a>
              <a href="#" className="link-button-secondary">了解更多</a>
            </div>
          </section>

          {/* 12. Breadcrumb Links */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">12. 面包屑链接 (Breadcrumb)</h2>
            <p className="text-ocean-600 mb-6">导航路径链接</p>
            <div className="flex items-center flex-wrap gap-2">
              <a href="#" className="link-breadcrumb">首页</a>
              <a href="#" className="link-breadcrumb">商品分类</a>
              <a href="#" className="link-breadcrumb">海鲜水产</a>
              <span className="link-breadcrumb">新鲜海虾</span>
            </div>
          </section>

          {/* 13. Tag Links */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">13. 标签链接 (Tag)</h2>
            <p className="text-ocean-600 mb-6">分类标签链接</p>
            <div className="flex flex-wrap gap-3">
              <a href="#" className="link-tag">海虾</a>
              <a href="#" className="link-tag">大闸蟹</a>
              <a href="#" className="link-tag">龙虾</a>
              <a href="#" className="link-tag">贝类</a>
              <a href="#" className="link-tag">鱼类</a>
              <a href="#" className="link-tag">特色水产</a>
            </div>
          </section>

          {/* 14. Disabled Link */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">14. 禁用状态 (Disabled)</h2>
            <p className="text-ocean-600 mb-6">不可点击的禁用链接</p>
            <div className="flex flex-wrap gap-6">
              <a href="#" className="link-disabled">已售罄</a>
              <a href="#" className="link-disabled">暂无库存</a>
            </div>
          </section>

          {/* 15. Mixed Examples */}
          <section className="luxury-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-ocean-900 mb-6">15. 组合示例</h2>
            <p className="text-ocean-600 mb-6">实际应用场景示例</p>
            
            {/* Product Card Example */}
            <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
              <h3 className="text-lg font-semibold text-ocean-900 mb-3">产品卡片</h3>
              <div className="flex items-start gap-4">
                <div className="w-32 h-32 bg-gradient-to-br from-ocean-100 to-ocean-200 rounded-lg flex items-center justify-center text-ocean-400">
                  图片
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-ocean-900 mb-2">新鲜海虾</h4>
                  <p className="text-ocean-600 mb-3">今日上岸，肉质鲜美，营养丰富</p>
                  <div className="flex items-center gap-3 mb-4">
                    <a href="#" className="link-tag">海虾</a>
                    <a href="#" className="link-tag">今日特惠</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <a href="#" className="link-button-primary text-sm px-4 py-2">立即购买</a>
                    <a href="#" className="link-arrow text-sm">查看详情</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Example */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-ocean-900 mb-3">导航菜单</h3>
              <nav className="flex items-center gap-8">
                <a href="#" className="link-primary">首页</a>
                <a href="#" className="link-primary">商品</a>
                <a href="#" className="link-primary">订单</a>
                <a href="#" className="link-primary">我的</a>
              </nav>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="elegant-divider max-w-md mx-auto mb-8"></div>
          <p className="text-ocean-600">
            所有链接样式均支持响应式设计和无障碍访问
          </p>
        </div>
      </div>
    </div>
  );
};

export default LinkStylesDemo;
