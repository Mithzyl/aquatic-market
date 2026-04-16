import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, getCategories } from '../api/products'
import { getCustomerConfig } from '../api/config'

// CategoryIcon 组件（复用 PriceQuery.jsx 的实现）
function CategoryIcon({ categoryId }) {
  const commonProps = {
    className: 'h-8 w-8',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }

  if (categoryId === 'shrimp') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6.5 13.5c2.5-5.5 8.5-7.5 11-5 2 2-1 5-4 5H9.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9.5 13.5c0 2.5 1.5 4 4 4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 10.5 5.5 9M7 13.5l-2 .5M8 16l-1 2" />
      </svg>
    )
  } else if (categoryId === 'crab') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 12a4 4 0 1 1 8 0v2H8v-2Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 11 5.5 9M16 11 18.5 9M8 14 5 15.5M16 14l3 1.5M10 8.5 8.5 6.5M14 8.5l1.5-2" />
      </svg>
    )
  } else if (categoryId === 'fish') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5.5 12c2-2.6 4.9-4 8.3-4 2.3 0 4.1.6 5.7 1.9l-2 2.1 2 2.1c-1.6 1.3-3.4 1.9-5.7 1.9-3.4 0-6.3-1.4-8.3-4Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 12h4.5" />
        <circle cx="14.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    )
  } else if (categoryId === 'shell') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 15c0-4.2 2.5-7 6-7s6 2.8 6 7c-2-.7-4-.7-6 0-2-.7-4-.7-6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 8v7M9 9.2l1.5 5M15 9.2l-1.5 5" />
      </svg>
    )
  } else if (categoryId === 'lobster') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 7h6l1.5 4.5L12 17l-4.5-5.5L9 7Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 7 7 4.5M15 7 17 4.5" />
      </svg>
    )
  }

  return null
}

const Home = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [serviceHighlights, setServiceHighlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEmptyMerchant, setIsEmptyMerchant] = useState(false)
  const [merchantConfig, setMerchantConfig] = useState(null)

  // 获取配置数据（serviceHighlights）
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configData = await getCustomerConfig()
        // 检查是否为空商家状态
        if (configData.is_empty) {
          setIsEmptyMerchant(true)
          setMerchantConfig(configData)
          console.log('[Home] 无商家状态:', configData)
        } else if (configData.serviceHighlights) {
          setServiceHighlights(configData.serviceHighlights)
          setMerchantConfig(configData)
          console.log('[Home] 配置数据已加载:', configData.serviceHighlights)
        }
      } catch (error) {
        console.error('[Home] 获取配置失败:', error)
        // 使用默认值
        setServiceHighlights([
          { title: '门店现挑', description: '鲜活现捞，支持代处理和冷链打包。', stat: '30 min' },
          { title: '今日早市', description: '上午档到货批次更新，价格更适合家用。', stat: '9 折起' },
          { title: '聚餐配货', description: '龙虾、蟹类和贝类支持多人餐组合。', stat: '48 款' }
        ])
      }
    }
    fetchConfig()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ])
        setProducts(productsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const heroProduct = products[0] || null
  const showcaseProducts = products.slice(0, 3)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f6efe4 0%, #f8f4ee 26%, #fbf8f3 60%, #f2ebe0 100%)' }}>
        <p className="text-[#7d6a53]">加载中...</p>
      </div>
    )
  }

  // 暂无商家状态 UI
  if (isEmptyMerchant) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #f6efe4 0%, #f8f4ee 26%, #fbf8f3 60%, #f2ebe0 100%)',
          fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          paddingBottom: 'calc(var(--app-bottom-nav-space) + 12px)'
        }}
      >
        <div className="mx-auto max-w-lg px-4 pt-5 flex-1 flex flex-col">
          {/* 空状态 Hero */}
          <section className="flex-1 flex flex-col items-center justify-center rounded-[34px] bg-[rgba(255,251,245,0.92)] border border-[#eadfce] shadow-[0_18px_38px_rgba(102,76,42,0.07)] px-6 py-10">
            {/* 图标 */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f6efe5] text-[#b17e4b] shadow-[0_8px_20px_rgba(94,70,38,0.08)]">
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-4 0H5m4 0H5m14 0h2M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>

            {/* 主标题 */}
            <h1
              className="mt-6 text-[26px] font-bold text-center text-[#2c241b]"
              style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
            >
              暂无商家入驻
            </h1>

            {/* 说明文案 */}
            <p className="mt-3 text-sm leading-6 text-center text-[#7d6a53] max-w-[280px]">
              当前平台暂无商家入驻，敬请期待优质海鲜商家上线。
            </p>

            {/* 联系方式（如果有） */}
            {merchantConfig?.contact_phone && (
              <div className="mt-6 rounded-[22px] bg-[#fff4e8] px-5 py-4 text-center">
                <p className="text-xs text-[#b17e4b]">如有疑问，请联系平台</p>
                <p className="mt-2 text-lg font-semibold text-[#2c241b]">{merchantConfig.contact_phone}</p>
              </div>
            )}

            {/* 操作按钮 */}
            <button
              onClick={() => window.location.reload()}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#2d2a27] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(35,31,28,0.22)] transition-transform active:scale-[0.98]"
            >
              稍后再来
            </button>
          </section>
        </div>
      </div>
    )
  }

  if (!heroProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f6efe4 0%, #f8f4ee 26%, #fbf8f3 60%, #f2ebe0 100%)' }}>
        <p className="text-[#7d6a53]">暂无商品数据</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(180deg, #f6efe4 0%, #f8f4ee 26%, #fbf8f3 60%, #f2ebe0 100%)',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        paddingBottom: 'calc(var(--app-bottom-nav-space) + 12px)'
      }}
    >
      <div className="mx-auto max-w-lg px-4 pt-5">
        <section className="relative overflow-hidden rounded-[34px] bg-[#201710] text-white shadow-[0_24px_60px_rgba(40,24,14,0.24)]">
          <img
            src={heroProduct.image}
            alt={heroProduct.name}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,11,7,0.92),rgba(50,33,19,0.58),rgba(18,11,7,0.88))]" />

          <div className="relative px-5 pb-6 pt-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-medium tracking-[0.18em] text-white/82 backdrop-blur">
              NEW RETAIL SEAFOOD
            </div>

            <div className="mt-10 max-w-[220px]">
              <p className="text-sm text-white/70">柳州鲜选海产店</p>
              <h1
                className="mt-2 text-[30px] font-bold leading-[1.1]"
                style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
              >
                当日直采的
                <br />
                海鲜零售首页
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/72">
                把门店鲜度、今日活动和招牌商品先讲清楚，再进入具体分类下单。
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                to="/price-query"
                className="inline-flex items-center justify-center rounded-full bg-[#ff8b52] px-5 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
              >
                进入下单
              </Link>
              <Link
                to="/order-management"
                className="inline-flex items-center justify-center rounded-full border border-white/22 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-transform active:scale-[0.98]"
              >
                查看订单
              </Link>
            </div>

            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">Today Spotlight</p>
                <p className="mt-1 text-lg font-semibold">{heroProduct.name}</p>
              </div>
              <div className="rounded-[22px] bg-white/10 px-4 py-3 text-right backdrop-blur">
                <p className="text-xs text-white/65">早市价</p>
                <p className="mt-1 text-2xl font-bold">¥{heroProduct.price}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-3">
          {serviceHighlights.map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-[#eadfce] bg-[rgba(255,251,245,0.86)] p-3 shadow-[0_12px_26px_rgba(94,70,38,0.06)]"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#b17e4b]">{item.stat}</p>
              <h2 className="mt-2 text-sm font-semibold leading-5 text-[#2c241b]">{item.title}</h2>
              <p className="mt-2 text-xs leading-5 text-[#7d6a53]">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-[30px] border border-[#eadfce] bg-[rgba(255,249,242,0.96)] p-4 shadow-[0_18px_38px_rgba(102,76,42,0.07)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#ba8752]">Category Preview</p>
              <h2
                className="mt-2 text-[22px] font-bold text-[#2b231a]"
                style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
              >
                从主力类目进入下单
              </h2>
            </div>
            <Link to="/price-query" className="text-sm font-medium text-[#2f6b56]">
              去下单
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/price-query"
                className="flex min-h-[92px] flex-col items-center justify-center rounded-[22px] bg-[#fff4e8] px-2 py-3 text-center transition-transform active:scale-[0.98]"
              >
                <CategoryIcon categoryId={category.id} />
                <span className="mt-2 text-xs font-semibold text-[#46392c]">{category.name}</span>
                <span className="mt-1 text-[10px] text-[#9a8062]">{category.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#ba8752]">Top Picks</p>
              <h2
                className="mt-2 text-[22px] font-bold text-[#2b231a]"
                style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
              >
                今日热卖商品
              </h2>
            </div>
            <Link to="/price-query" className="text-sm font-medium text-[#2f6b56]">
              去下单
            </Link>
          </div>

          <div className="space-y-3">
            {showcaseProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="flex items-center gap-3 rounded-[28px] border border-[#eadfce] bg-[rgba(255,255,255,0.86)] p-3 shadow-[0_14px_32px_rgba(112,86,54,0.06)]"
              >
                <div className="h-24 w-24 overflow-hidden rounded-[22px] bg-[#f2e9dd]">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#fff1e5] px-2 py-1 text-[10px] font-semibold text-[#d67635]">
                      {product.tag}
                    </span>
                    <span className="text-[11px] text-[#8f7658]">{product.category_name}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-[#2c241c]">{product.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#7d6a53]">{product.description}</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#e0682e]">¥{product.price}</span>
                    <span className="text-xs text-[#b5a18a] line-through">¥{product.original_price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
