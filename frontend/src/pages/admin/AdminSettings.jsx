import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { API_BASE_URL, ADMIN_TOKEN_KEY } from '../../api/config'
import ImageUploader from '../../components/ImageUploader'

function AdminSettings() {
  const navigate = useNavigate()
  const { merchant, token, login, logout } = useAdminAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 页面加载时刷新商家数据
  useEffect(() => {
    const refreshMerchantData = async () => {
      if (!token) return
      
      setIsRefreshing(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/merchant/info`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const merchantData = await response.json()
          // 使用现有 token 和新获取的商家数据更新 Context
          login(token, merchantData)
          console.log('[AdminSettings] 商家数据已刷新:', merchantData)
        } else {
          console.error('[AdminSettings] 获取商家数据失败:', response.status)
        }
      } catch (error) {
        console.error('[AdminSettings] 刷新商家数据出错:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    refreshMerchantData()
  }, [token, login])

  // 退出登录
  const handleLogout = () => {
    // 清除登录状态
    logout()
    
    // 跳转到登录页
    navigate('/admin', { replace: true })
  }

  // 商家信息字段
  const shopName = merchant?.shop_name || '未设置店铺名'
  const merchantName = merchant?.name || '未设置'
  const phone = merchant?.phone || '未绑定手机号'

  return (
    <div className="py-6 space-y-6">
      {/* 加载状态提示 */}
      {isRefreshing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#2f6b56] px-4 py-2 text-sm text-white shadow-lg">
          正在刷新数据...
        </div>
      )}
      
      {/* 页面标题 */}
      <h1
        className="text-xl font-bold text-[#2c241b]"
        style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
      >
        设置
      </h1>

      {/* 店铺Logo卡片 */}
      <div className="bg-white rounded-2xl border border-[#eadfce] shadow-sm overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <svg
              className="w-5 h-5 text-[#9a8062]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-[#2c241b]">店铺 Logo</span>
          </div>
          <ImageUploader
            value={merchant?.shop_logo || ''}
            onChange={async (url) => {
              try {
                const token = localStorage.getItem(ADMIN_TOKEN_KEY)
                // 保存 logo URL 到商家配置
                const response = await fetch(`${API_BASE_URL}/api/admin/config`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({ shop_logo: url }),
                })
                if (response.ok) {
                  // 刷新商家数据
                  window.location.reload()
                }
              } catch (err) {
                console.error('[AdminSettings] 保存 Logo 失败:', err)
              }
            }}
            folder="logos"
            token={localStorage.getItem(ADMIN_TOKEN_KEY)}
            placeholder="上传店铺 Logo"
            previewSize="w-24 h-24 rounded-full"
            maxSizeMB={3}
          />
        </div>
      </div>

      {/* 商家信息卡片 */}
      <div className="bg-white rounded-2xl border border-[#eadfce] shadow-sm overflow-hidden">
        {/* 卡片头部 - 店铺名称 */}
        <div className="px-5 py-4 border-b border-[#f0e8db]">
          <div className="flex items-center gap-3">
            {/* 店铺图标 */}
            <div className="w-12 h-12 rounded-full bg-[#fff4e8] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#ff8b52]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 10.5 12 4l8 6.5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M6.5 9.5V19h11V9.5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M10 19v-5h4v5"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#8b755d] mb-0.5">店铺名称</p>
              <p className="text-base font-semibold text-[#2c241b]">{shopName}</p>
            </div>
          </div>
        </div>

        {/* 商家信息列表 */}
        <div className="divide-y divide-[#f5f0e8]">
          {/* 商家名称 */}
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[#9a8062]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="8" r="4" strokeWidth={1.8} />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 20c0-4 4-6 8-6s8 2 8 6"
                />
              </svg>
              <span className="text-sm text-[#5a4d3d]">商家名称</span>
            </div>
            <span className="text-sm font-medium text-[#2c241b]">{merchantName}</span>
          </div>

          {/* 手机号 */}
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[#9a8062]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect
                  x="7"
                  y="2.5"
                  width="10"
                  height="19"
                  rx="2"
                  strokeWidth={1.8}
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 17.5h.01"
                />
              </svg>
              <span className="text-sm text-[#5a4d3d]">手机号码</span>
            </div>
            <span className="text-sm font-medium text-[#2c241b]">
              {phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
            </span>
          </div>
        </div>
      </div>

      {/* 功能列表 */}
      <div className="bg-white rounded-2xl border border-[#eadfce] shadow-sm overflow-hidden">
        {/* 关于我们 */}
        <button
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#faf7f2] transition-colors active:bg-[#f5f0e8]"
          onClick={() => {
            console.log('[AdminSettings] 关于我们（待实现）')
          }}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-[#9a8062]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 16v-4M12 8h.01"
              />
            </svg>
            <span className="text-sm text-[#2c241b]">关于我们</span>
          </div>
          <svg
            className="w-4 h-4 text-[#b5a18a]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* 版本信息 */}
        <div className="px-5 py-4 flex items-center justify-between border-t border-[#f5f0e8]">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-[#9a8062]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4"
              />
            </svg>
            <span className="text-sm text-[#2c241b]">版本信息</span>
          </div>
          <span className="text-sm text-[#8b755d]">v1.0.0</span>
        </div>
      </div>

      {/* 退出登录按钮 */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full h-12 rounded-xl bg-white border border-[#eadfce] text-[#d67635] font-medium hover:bg-[#faf7f2] active:scale-[0.98] transition-all"
      >
        退出登录
      </button>

      {/* 退出确认弹窗 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="mx-6 w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* 弹窗内容 */}
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#fff4e8] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#ff8b52]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#2c241b] mb-2">
                确认退出登录？
              </h3>
              <p className="text-sm text-[#8b755d]">
                退出后需要重新登录才能管理店铺
              </p>
            </div>

            {/* 弹窗按钮 */}
            <div className="flex border-t border-[#f0e8db]">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-12 text-sm font-medium text-[#5a4d3d] hover:bg-[#faf7f2] active:bg-[#f5f0e8] transition-colors"
              >
                取消
              </button>
              <div className="w-px bg-[#f0e8db]" />
              <button
                onClick={handleLogout}
                className="flex-1 h-12 text-sm font-semibold text-[#d67635] hover:bg-[#faf7f2] active:bg-[#f5f0e8] transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSettings