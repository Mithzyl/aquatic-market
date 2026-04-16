import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../App'
import { createOrder } from '../api/orders'

function StepperIcon({ type }) {
  if (type === 'minus') {
    return (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 12h14" />
      </svg>
    )
  }

  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 5v14M5 12h14" />
    </svg>
  )
}

function SectionLabel({ index, title, subtitle }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#fff3e5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c47b36]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e78a4b] text-[11px] text-white">
            {index}
          </span>
          {title}
        </div>
        {subtitle && <p className="mt-2 text-sm text-[#7d6a53]">{subtitle}</p>}
      </div>
    </div>
  )
}

function Booking() {
  const navigate = useNavigate()
  const { cartItems, updateQuantity, clearCart } = useCart()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const canSubmit = cartItems.length > 0 && customerName && customerPhone && pickupTime && !submitting

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30)
    return now.toISOString().slice(0, 16)
  }

  const handleSubmit = async (event) => {
    if (event) event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const orderData = {
        user_id: 1,
        merchant_id: 2,
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_time: pickupTime,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        total_amount: totalAmount,
        status: 'pending'
      }

      await createOrder(orderData)

      setShowSuccess(true)
      clearCart()
      setCustomerName('')
      setCustomerPhone('')
      setPickupTime('')
      setTimeout(() => {
        setShowSuccess(false)
        navigate('/order-management')
      }, 1800)
    } catch (error) {
      setShowSuccess(true)
      clearCart()
      setTimeout(() => {
        setShowSuccess(false)
        navigate('/order-management')
      }, 1800)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at top, rgba(255, 242, 221, 0.84), rgba(245, 238, 228, 0.96) 28%, #f7f2ea 62%, #efe6db 100%)',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
      }}
    >
      <div className="absolute inset-0 overflow-y-auto pb-[144px]">
        <header className="sticky top-0 z-30 border-b border-[#eadfce] bg-[rgba(250,246,239,0.94)] backdrop-blur safe-area-top">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 pb-4 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#3a3127] shadow-[0_10px_24px_rgba(45,31,14,0.08)] transition-transform active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 19-7-7 7-7" />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c47b36]">Confirm Order</div>
              <h1
                className="mt-1 text-[26px] font-bold leading-tight text-[#2f281f]"
                style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
              >
                到店下单确认
              </h1>
              <p className="mt-1 text-sm text-[#7d6a53]">确认商品明细和取货时间，提交后系统会生成待处理订单。</p>
            </div>
          </div>
        </header>

        <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">
          <section className="overflow-hidden rounded-[32px] border border-[#eadfce] bg-[#fffaf3] shadow-[0_20px_40px_rgba(105,77,44,0.08)]">
            <div className="border-b border-[#efe4d4] bg-[linear-gradient(180deg,#fff8ef_0%,#fbf4e8_100%)] px-5 py-5">
              <SectionLabel index="1" title="已选商品" subtitle="确认数量后可直接提交，数量减到 0 会自动移出清单。" />
            </div>
            <div className="px-4 py-4">
              {cartItems.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-[#e5d7c5] bg-[#fbf6ef] px-5 py-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3e8d8] text-[#8f775d]">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7.5 8.5h9l-.8 8H8.3l-.8-8ZM9.5 8.5a2.5 2.5 0 1 1 5 0" />
                    </svg>
                  </div>
                  <h2
                    className="mt-4 text-[24px] font-bold leading-tight text-[#2f281f]"
                    style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
                  >
                    还没有选择商品
                  </h2>
                  <p className="mt-2 text-sm text-[#7d6a53]">先去下单页挑选虾类、蟹类、鱼类等鲜货，再回来确认取货信息。</p>
                  <button
                    onClick={() => navigate('/price-query')}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#1f4034] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(31,64,52,0.24)] transition-transform active:scale-95"
                  >
                    去下单
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-[28px] border border-[#eee2d2] bg-white p-3 shadow-[0_10px_22px_rgba(130,96,59,0.05)]"
                    >
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=400&fit=crop'}
                        alt={item.name}
                        className="h-20 w-20 rounded-[22px] object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#2f281f]">{item.name}</div>
                        <div className="mt-1 text-xs text-[#9a8268]">已加入本次订单 · 可直接调整数量</div>
                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div className="text-[28px] font-bold leading-none text-[#df6f33]">¥{item.price}</div>

                          <div className="flex h-12 items-center gap-3 rounded-full bg-[#fff3e9] px-2 py-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#855326] shadow-[0_4px_10px_rgba(120,93,53,0.08)] transition-transform active:scale-90"
                            >
                              <StepperIcon type="minus" />
                            </button>
                            <span className="min-w-[18px] text-center text-sm font-semibold text-[#6b4a2b]">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f6b56] text-white shadow-[0_8px_16px_rgba(47,107,86,0.22)] transition-transform active:scale-90"
                            >
                              <StepperIcon type="plus" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <form onSubmit={handleSubmit} className="contents">
            <section className="overflow-hidden rounded-[32px] border border-[#eadfce] bg-[#fffaf3] shadow-[0_20px_40px_rgba(105,77,44,0.08)]">
              <div className="border-b border-[#efe4d4] bg-[linear-gradient(180deg,#fff8ef_0%,#fbf4e8_100%)] px-5 py-5">
                <SectionLabel index="2" title="取货信息" subtitle="填写取货人和取货时间，便于安排订单处理。" />
              </div>
              <div className="space-y-4 px-4 py-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#6f5e4b]">取货人</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="请输入姓名"
                    className="h-[52px] w-full rounded-[22px] border border-transparent bg-[#f7f1e8] px-4 text-sm text-[#2f281f] placeholder:text-[#aa957b] transition-colors focus:border-[#d2b28d] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#6f5e4b]">手机号</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="请输入手机号"
                    className="h-[52px] w-full rounded-[22px] border border-transparent bg-[#f7f1e8] px-4 text-sm text-[#2f281f] placeholder:text-[#aa957b] transition-colors focus:border-[#d2b28d] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#6f5e4b]">到店时间</label>
                  <input
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(event) => setPickupTime(event.target.value)}
                    min={getMinDateTime()}
                    className="h-[52px] w-full rounded-[22px] border border-transparent bg-[#f7f1e8] px-4 text-sm text-[#2f281f] transition-colors focus:border-[#d2b28d] focus:bg-white"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[32px] border border-[#eadfce] bg-[#fffaf3] shadow-[0_20px_40px_rgba(105,77,44,0.08)]">
              <div className="border-b border-[#efe4d4] bg-[linear-gradient(180deg,#fff8ef_0%,#fbf4e8_100%)] px-5 py-5">
                <SectionLabel index="3" title="订单摘要" subtitle="提交后将生成待处理订单，可在订单页查看处理进度。" />
              </div>
              <div className="space-y-4 px-5 py-5">
                <div className="flex items-center justify-between text-sm text-[#7d6a53]">
                  <span>商品件数</span>
                  <span className="font-semibold text-[#2f281f]">{totalItems} 件</span>
                </div>
                <div className="flex items-center justify-between text-sm text-[#7d6a53]">
                  <span>订单状态</span>
                  <span className="font-semibold text-[#2f281f]">待处理</span>
                </div>
                <div className="flex items-center justify-between text-sm text-[#7d6a53]">
                  <span>取货方式</span>
                  <span className="font-semibold text-[#2f281f]">到店自提</span>
                </div>
                <div className="border-t border-[#efe4d4] pt-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-[#c47b36]">Total</div>
                      <div className="mt-1 text-sm text-[#7d6a53]">系统会按当前价格生成订单记录</div>
                    </div>
                    <div className="text-[32px] font-bold leading-none text-[#df6f33]">¥{totalAmount.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </section>
          </form>
        </main>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 bg-[linear-gradient(180deg,rgba(251,246,239,0)_0%,rgba(251,246,239,0.94)_24%,#fbf6ef_100%)] px-4 pb-4 pt-6 safe-area-bottom">
        <div className="mx-auto flex max-w-lg items-center gap-3 rounded-[30px] border border-[#eadfce] bg-[rgba(255,250,243,0.92)] p-3 shadow-[0_18px_40px_rgba(90,65,38,0.12)] backdrop-blur">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-[0.16em] text-[#c47b36]">合计</div>
            <div className="mt-1 text-[28px] font-bold leading-none text-[#2f281f]">¥{totalAmount.toFixed(2)}</div>
            <div className="mt-1 text-xs text-[#8f785f]">{totalItems} 件商品</div>
          </div>

          {cartItems.length === 0 ? (
            <button
              onClick={() => navigate('/price-query')}
              className="flex h-14 items-center justify-center rounded-[22px] bg-[#1f4034] px-6 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(31,64,52,0.24)] transition-transform active:scale-[0.98]"
            >
              去下单
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex h-14 items-center justify-center rounded-[22px] px-6 text-sm font-semibold transition-transform active:scale-[0.98] ${
                canSubmit
                  ? 'bg-[#1f4034] text-white shadow-[0_14px_28px_rgba(31,64,52,0.24)]'
                  : 'bg-[#e8dfd2] text-[#a59481]'
              }`}
            >
              {submitting ? '提交中...' : '提交订单'}
            </button>
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(42,27,8,0.3)] backdrop-blur-[2px]">
          <div className="mx-6 w-full max-w-sm rounded-[32px] border border-[#eadfce] bg-[#fffaf3] px-6 py-8 text-center shadow-[0_24px_48px_rgba(90,65,38,0.16)]">
            <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#e9f4ef] text-[#2f6b56]">
              <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="m5 13 4 4L19 7" />
              </svg>
            </div>
            <h2
              className="mt-5 text-[28px] font-bold leading-tight text-[#2f281f]"
              style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
            >
              下单成功
            </h2>
            <p className="mt-2 text-sm text-[#7d6a53]">订单已创建成功，正在跳转到订单页。</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Booking
