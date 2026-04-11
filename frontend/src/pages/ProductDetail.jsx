import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../App'
import { getProductById } from '../api/products'

const fallbackImage = 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&h=1200&fit=crop'

function QuantityIcon({ type }) {
  if (type === 'minus') {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 12h14" />
      </svg>
    )
  }

  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 5v14M5 12h14" />
    </svg>
  )
}

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showAddedToast, setShowAddedToast] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetchProduct = async () => {
      try {
        setLoading(true)
        const data = await getProductById(id)
        if (!mounted) return
        setProduct(data)
      } catch (error) {
        if (mounted) {
          setProduct(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchProduct()

    return () => {
      mounted = false
    }
  }, [id])

  useEffect(() => {
    if (!showAddedToast) return undefined

    const timer = setTimeout(() => setShowAddedToast(false), 1600)
    return () => clearTimeout(timer)
  }, [showAddedToast])

  const handleAddToCart = () => {
    if (!product) return

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      },
      quantity
    )
    setShowAddedToast(true)
  }

  const handleBuyNow = () => {
    if (!product) return

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      },
      quantity
    )
    navigate('/booking')
  }

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          background:
            'radial-gradient(circle at top, rgba(255, 242, 221, 0.88), rgba(245, 238, 228, 0.96) 30%, #f7f2ea 62%, #efe6db 100%)',
          fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
        }}
      >
        <div className="flex flex-col items-center gap-4 text-[#7d6a53]">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[#e4d6c2] border-t-[#2f6b56]" />
          <p className="text-sm">正在准备商品详情...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center px-6"
        style={{
          background:
            'radial-gradient(circle at top, rgba(255, 242, 221, 0.88), rgba(245, 238, 228, 0.96) 30%, #f7f2ea 62%, #efe6db 100%)',
          fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
        }}
      >
        <div className="w-full max-w-sm rounded-[32px] border border-[#eadfce] bg-[#fffaf3] px-6 py-8 text-center shadow-[0_24px_48px_rgba(105,77,44,0.1)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3e8d8] text-[#8f775d]">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.17 16.17a4 4 0 0 1 5.66 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1
            className="mt-5 text-[26px] font-bold leading-tight text-[#2f281f]"
            style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
          >
            商品已下架
          </h1>
          <p className="mt-3 text-sm text-[#7d6a53]">当前没有找到这款商品，可以回到下单页继续挑选。</p>
          <button
            onClick={() => navigate('/price-query')}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#1f4034] px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,64,52,0.22)] transition-transform active:scale-95"
          >
            返回下单页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at top, rgba(255, 242, 221, 0.88), rgba(245, 238, 228, 0.96) 30%, #f7f2ea 62%, #efe6db 100%)',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
      }}
    >
      <div className="absolute inset-0 overflow-y-auto pb-[136px]">
        <section className="relative h-[43svh] min-h-[320px]">
          <img
            src={product.image || fallbackImage}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = fallbackImage
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,18,10,0.12)_0%,rgba(25,18,10,0.1)_38%,rgba(25,18,10,0.62)_100%)]" />

          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(255,250,243,0.92)] text-[#3a3127] shadow-[0_10px_24px_rgba(45,31,14,0.12)] backdrop-blur transition-transform active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 19-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => setIsFavorite((value) => !value)}
              className={`flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(255,250,243,0.92)] shadow-[0_10px_24px_rgba(45,31,14,0.12)] backdrop-blur transition-all active:scale-95 ${
                isFavorite ? 'text-[#d56a56]' : 'text-[#8e765d]'
              }`}
            >
              <svg className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 20.36 4.32 12.68a4.5 4.5 0 0 1 6.36-6.36L12 7.64l1.32-1.32a4.5 4.5 0 0 1 6.36 6.36L12 20.36Z" />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
            <div className="flex flex-wrap items-center gap-2 text-white">
              <span className="rounded-full bg-[rgba(255,244,230,0.18)] px-3 py-1 text-xs font-semibold backdrop-blur">
                {product.category_name || '海鲜鲜选'}
              </span>
              {product.tag && (
                <span className="rounded-full bg-[rgba(231,122,63,0.9)] px-3 py-1 text-xs font-semibold text-white shadow-[0_10px_20px_rgba(231,122,63,0.22)]">
                  {product.tag}
                </span>
              )}
              <span className="rounded-full bg-[rgba(255,244,230,0.18)] px-3 py-1 text-xs text-white/85 backdrop-blur">
                已售 {product.sales || 0}
              </span>
            </div>
            <h1
              className="mt-3 max-w-[11ch] text-[38px] font-bold leading-[1.08] text-white"
              style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
            >
              {product.name}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/86">
              {product.unit ? `${product.unit} · ` : ''}{product.description}
            </p>
          </div>
        </section>

        <section className="-mt-7 rounded-t-[34px] border-t border-[#efe2d0] bg-[#fffaf3] px-5 pb-10 pt-6 shadow-[0_-18px_36px_rgba(99,73,41,0.08)]">
          <div className="mx-auto max-w-lg">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c88d55]">今日鲜选</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[38px] font-bold leading-none text-[#df6f33]">¥{product.price}</span>
                  {product.original_price && (
                    <span className="text-base text-[#b49f88] line-through">¥{product.original_price}</span>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#eadfce] bg-[#fbf5ec] px-4 py-3 text-right shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                <div className="text-[11px] text-[#9c8468]">门店现货</div>
                <div className="mt-1 text-lg font-semibold text-[#2f281f]">{product.stock || 99} 件</div>
              </div>
            </div>

            {!!product.badges?.length && (
              <div className="mt-5 flex flex-wrap gap-2">
                {product.badges.map((badge) => (
                  <span key={badge} className="rounded-full bg-[#fff4e8] px-3 py-1.5 text-xs font-medium text-[#d67635]">
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-7 space-y-7">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c88d55]">商品介绍</div>
                <p className="mt-3 text-[15px] leading-8 text-[#6c5944]">
                  {product.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-[30px] border border-[#eadfce] bg-[#fbf6ef] p-4">
                <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                  <div className="text-[11px] text-[#9d876f]">规格</div>
                  <div className="mt-2 text-sm font-semibold text-[#2f281f]">{product.unit || '门店称重'}</div>
                </div>
                <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                  <div className="text-[11px] text-[#9d876f]">到店服务</div>
                  <div className="mt-2 text-sm font-semibold text-[#2f281f]">保鲜处理</div>
                </div>
                <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                  <div className="text-[11px] text-[#9d876f]">推荐方式</div>
                  <div className="mt-2 text-sm font-semibold text-[#2f281f]">{product.badges?.[0] || '门店推荐'}</div>
                </div>
              </div>

              <div className="rounded-[30px] border border-[#eadfce] bg-[linear-gradient(180deg,#fffaf3_0%,#f8f1e7_100%)] px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c88d55]">选择数量</div>
                    <p className="mt-2 text-sm text-[#7d6a53]">按份加入已选，门店会按当前规格为你留货。</p>
                  </div>

                  <div
                    className="flex h-14 items-center gap-3 rounded-full bg-[#fff3e9] px-2 py-2 shadow-[inset_0_0_0_1px_rgba(234,223,206,0.7)]"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                    }}
                  >
                    <button
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#855326] shadow-[0_4px_10px_rgba(120,93,53,0.08)] transition-transform active:scale-90"
                    >
                      <QuantityIcon type="minus" />
                    </button>
                    <span className="min-w-[24px] text-center text-[16px] font-semibold text-[#6b4a2b]">{quantity}</span>
                    <button
                      onClick={() => setQuantity((value) => Math.min(product.stock || 99, value + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f6b56] text-white shadow-[0_8px_16px_rgba(47,107,86,0.22)] transition-transform active:scale-90"
                    >
                      <QuantityIcon type="plus" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ['门店现打氧', '鲜活类商品支持门店现打氧和临时保鲜处理。'],
                  ['到店快取', '下单后可直接去确认页填写取货时间，减少排队。'],
                  ['建议即食', '刺身和冷盘类建议 2 小时内食用口感更佳。']
                ].map(([title, description]) => (
                  <div key={title} className="flex gap-3 border-b border-[#efe4d4] pb-3 last:border-b-0 last:pb-0">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#d87b40]" />
                    <div>
                      <div className="text-sm font-semibold text-[#2f281f]">{title}</div>
                      <p className="mt-1 text-sm leading-6 text-[#7d6a53]">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[linear-gradient(180deg,rgba(251,246,239,0)_0%,rgba(251,246,239,0.94)_20%,#fbf6ef_100%)] px-4 pb-4 pt-6 safe-area-bottom">
        <div className="mx-auto max-w-lg rounded-[30px] border border-[#eadfce] bg-[rgba(255,250,243,0.92)] p-3 shadow-[0_18px_40px_rgba(90,65,38,0.12)] backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddToCart}
              className="flex h-14 flex-1 items-center justify-center rounded-[22px] border border-[#d9c6ae] bg-white text-sm font-semibold text-[#3f3326] transition-transform active:scale-[0.98]"
            >
              加入已选
            </button>
            <button
              onClick={handleBuyNow}
              className="flex h-14 flex-[1.3] items-center justify-center gap-2 rounded-[22px] bg-[#1f4034] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(31,64,52,0.24)] transition-transform active:scale-[0.98]"
            >
              立即下单
              <span className="rounded-full bg-[rgba(255,255,255,0.14)] px-2.5 py-1 text-xs font-medium">
                ¥{(product.price * quantity).toFixed(0)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showAddedToast && (
        <div className="pointer-events-none fixed left-1/2 top-16 z-[200] -translate-x-1/2">
          <div className="rounded-full bg-[#1f4034] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(31,64,52,0.24)]">
            已加入已选
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
