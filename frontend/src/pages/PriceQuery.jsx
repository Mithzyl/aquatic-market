import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../App'
import { retailCategories, retailProducts } from '../data/products'

const categoryStories = {
  all: {
    eyebrow: '全部商品',
    title: '按左侧类目快速筛选今天想买的海鲜',
    subtitle: '虾类、蟹类、鱼类和贝类都在一个工作面里，适合直接点单。'
  },
  shrimp: {
    eyebrow: '鲜活虾类',
    title: '今天主推基围虾和黑虎虾',
    subtitle: '适合白灼、香煎和家庭聚餐，支持直接加购。'
  },
  crab: {
    eyebrow: '肥美蟹类',
    title: '梭子蟹与帝王蟹腿正在热卖',
    subtitle: '时令货量充足，适合清蒸、火锅和宴请。'
  },
  fish: {
    eyebrow: '刺身与家常',
    title: '三文鱼和金鲳鱼适合今天现做',
    subtitle: '一个适合生食，一个适合煎蒸，组合更完整。'
  },
  shell: {
    eyebrow: '净选贝类',
    title: '生蚝和北极贝做冷盘最稳',
    subtitle: '门店支持代开壳与冷藏保鲜，聚餐更省事。'
  },
  lobster: {
    eyebrow: '聚餐招牌',
    title: '波士顿龙虾和小青龙适合多人餐',
    subtitle: '规格稳定，适合周末聚餐和节庆宴请。'
  }
}

const fallbackImage = 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&h=800&fit=crop'
const categoryOptions = [{ id: 'all', name: '全部', icon: '🛒', description: '整店速览' }, ...retailCategories]

const PriceQuery = () => {
  const [selectedCategory, setSelectedCategory] = useState('shrimp')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddedToast, setShowAddedToast] = useState(false)
  const { cartItems, addToCart, updateQuantity, totalItems, totalPrice } = useCart()

  useEffect(() => {
    if (!showAddedToast) return undefined

    const timer = setTimeout(() => setShowAddedToast(false), 1400)
    return () => clearTimeout(timer)
  }, [showAddedToast])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return retailProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const matchesSearch =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.categoryName.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesSearch
    })
  }, [searchQuery, selectedCategory])

  const activeCategory = categoryOptions.find((category) => category.id === selectedCategory) || categoryOptions[0]
  const activeStory = categoryStories[selectedCategory] || categoryStories.all

  const getQuantity = (productId) => {
    const cartItem = cartItems.find((item) => item.id === productId)
    return cartItem ? cartItem.quantity : 0
  }

  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return retailProducts.length
    return retailProducts.filter((product) => product.category === categoryId).length
  }

  const handleAdd = (event, product) => {
    event.preventDefault()
    event.stopPropagation()
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    })
    setShowAddedToast(true)
  }

  const handleDecrease = (event, productId) => {
    event.preventDefault()
    event.stopPropagation()
    updateQuantity(productId, -1)
  }

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background:
          'radial-gradient(circle at top, rgba(255, 242, 221, 0.84), rgba(245, 238, 228, 0.96) 28%, #f7f2ea 62%, #efe6db 100%)',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
      }}
    >
      <div className="sticky top-0 z-40 border-b border-[#eadfce] bg-[rgba(250,246,239,0.94)] backdrop-blur-md safe-area-top">
        <div className="mx-auto max-w-lg px-4 pb-4 pt-4">
          <div className="rounded-[28px] bg-white px-4 py-4 shadow-[0_18px_40px_rgba(120,93,53,0.08)]">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#fff4e6] px-3 py-1 text-xs font-semibold text-[#bb6c25]">
                  <span className="h-2 w-2 rounded-full bg-[#ff7e45]" />
                  自助下单
                </div>
                <h1
                  className="text-[24px] font-bold leading-tight text-[#2f281f]"
                  style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
                >
                  左侧分类，右侧商品
                </h1>
                <p className="mt-2 text-sm text-[#7d6a53]">按类目快速切换，直接查看规格、价格和下单状态。</p>
              </div>

              <Link
                to="/order-management"
                className="rounded-2xl bg-[#f6f0e7] px-3 py-2 text-right text-xs text-[#8a7152] transition-transform active:scale-[0.98]"
              >
                <div className="font-semibold text-[#574533]">我的订单</div>
                <div>查看履约状态</div>
              </Link>
            </div>

            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-4 text-[#9f896f]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索虾类、黑虎虾、三文鱼..."
                className="h-12 w-full rounded-full bg-[#f7f1e8] pl-12 pr-12 text-sm text-[#2f281f] placeholder:text-[#a28d74]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#d8c6b1] text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-44 pt-4">
        <div className="overflow-hidden rounded-[30px] border border-[#eadfce] bg-[#fffaf3] shadow-[0_22px_48px_rgba(107,75,36,0.08)]">
          <div className="grid min-h-[620px] grid-cols-[92px,minmax(0,1fr)]">
            <aside className="border-r border-[#eadfce] bg-[#f5ede1]">
              <div className="flex flex-col gap-1 px-2 py-3">
                {categoryOptions.map((category) => {
                  const isActive = category.id === selectedCategory

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`relative rounded-[22px] px-2 py-3 text-center transition-all duration-300 ${
                        isActive
                          ? 'bg-white text-[#2f281f] shadow-[0_14px_28px_rgba(96,72,39,0.12)]'
                          : 'text-[#85735e]'
                      }`}
                    >
                      {isActive && <span className="absolute left-0 top-4 h-10 w-1 rounded-full bg-[#ff7e45]" />}
                      <div className="text-xl">{category.icon}</div>
                      <div className="mt-1 text-sm font-semibold">{category.name}</div>
                      <div className="mt-1 text-[11px]">{category.description}</div>
                      <div
                        className={`mt-2 inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          isActive ? 'bg-[#fff1e6] text-[#d66f30]' : 'bg-[#ebe1d3] text-[#8a7152]'
                        }`}
                      >
                        {getCategoryCount(category.id)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </aside>

            <section className="bg-[#fffaf3] px-4 py-4">
              <div className="mb-4 rounded-[24px] bg-[linear-gradient(135deg,#fff3e6_0%,#fffaf3_100%)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c98b52]">
                  {activeStory.eyebrow}
                </p>
                <h2
                  className="mt-2 text-xl font-bold leading-snug text-[#2d251b]"
                  style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
                >
                  {activeStory.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#7f6a54]">{activeStory.subtitle}</p>

                <div className="mt-3 flex items-center gap-2 text-xs text-[#8f6f46]">
                  <span className="rounded-full bg-white px-2.5 py-1 font-semibold shadow-sm">
                    {activeCategory.name}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                    {filteredProducts.length} 款可选
                  </span>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] bg-white px-6 text-center shadow-[0_12px_28px_rgba(120,93,53,0.08)]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f6efe5] text-2xl">🔎</div>
                  <h3 className="mt-4 text-lg font-semibold text-[#2c241c]">没有找到对应商品</h3>
                  <p className="mt-2 text-sm leading-6 text-[#7d6a53]">试试切换左侧分类，或者搜索更短的关键词。</p>
                </div>
              ) : (
                <div className="space-y-3 animate-slide-up">
                  {filteredProducts.map((product) => {
                    const quantity = getQuantity(product.id)

                    return (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="block rounded-[24px] bg-white p-3 shadow-[0_12px_28px_rgba(120,93,53,0.08)] transition-transform duration-300 active:scale-[0.99]"
                      >
                        <div className="flex gap-3">
                          <div className="relative h-24 w-24 overflow-hidden rounded-[20px] bg-[#f6efe5]">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.target.src = fallbackImage
                              }}
                            />
                            <div className="absolute left-2 top-2 rounded-full bg-[#51351f] px-2 py-1 text-[10px] font-semibold text-white">
                              {product.tag}
                            </div>
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-[17px] font-semibold text-[#2c241c]">{product.name}</h3>
                                  <p className="mt-1 text-xs text-[#8a7258]">{product.unit}</p>
                                </div>
                                <span className="rounded-full bg-[#f7f1e8] px-2 py-1 text-[10px] font-medium text-[#8f7558]">
                                  已售 {product.sales}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {product.badges.map((badge) => (
                                  <span
                                    key={badge}
                                    className="rounded-full bg-[#fff5ea] px-2 py-1 text-[10px] font-medium text-[#d67635]"
                                  >
                                    {badge}
                                  </span>
                                ))}
                              </div>

                              <p
                                className="mt-2 text-xs leading-5 text-[#7d6a53]"
                                style={{
                                  display: '-webkit-box',
                                  WebkitBoxOrient: 'vertical',
                                  WebkitLineClamp: 2,
                                  overflow: 'hidden'
                                }}
                              >
                                {product.description}
                              </p>
                            </div>

                            <div className="mt-3 flex items-end justify-between">
                              <div className="flex items-baseline gap-1">
                                <span className="text-[22px] font-bold leading-none text-[#e0682e]">¥{product.price}</span>
                                <span className="text-xs text-[#b5a18a] line-through">¥{product.originalPrice}</span>
                              </div>

                              {quantity > 0 ? (
                                <div
                                  className="flex items-center gap-2 rounded-full bg-[#fff3e9] px-2 py-1.5"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                  }}
                                >
                                  <button
                                    onClick={(event) => handleDecrease(event, product.id)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-medium text-[#855326] shadow-sm transition-transform active:scale-90"
                                  >
                                    -
                                  </button>
                                  <span className="min-w-[16px] text-center text-sm font-semibold text-[#6b4a2b]">
                                    {quantity}
                                  </span>
                                  <button
                                    onClick={(event) => handleAdd(event, product)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2f6b56] text-sm font-medium text-white shadow-sm transition-transform active:scale-90"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(event) => handleAdd(event, product)}
                                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f4034] text-white shadow-[0_12px_24px_rgba(31,64,52,0.25)] transition-transform active:scale-90"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

      </div>

      <div className="fixed inset-x-0 bottom-[84px] z-40">
        <div className="mx-auto max-w-lg px-4">
          <div className="rounded-[999px] border border-[#e5d8c8] bg-[rgba(255,251,245,0.96)] p-2 shadow-[0_22px_40px_rgba(84,61,33,0.16)] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[999px] px-3 py-2">
                <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#f2e4d2] text-[#6c4a2d]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M8 7h10l-1 9H9L8 7ZM7 7l-.8-2.2A1.5 1.5 0 0 0 4.8 4H4" />
                    <circle cx="10" cy="19" r="1.2" fill="currentColor" stroke="none" />
                    <circle cx="16" cy="19" r="1.2" fill="currentColor" stroke="none" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-[#9bc44c] px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white">
                      {totalItems}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] text-[#8e765c]">
                    {totalItems > 0 ? `到手约 ¥${totalPrice.toFixed(1)}` : '先从右侧挑选商品'}
                  </p>
                  <p className="mt-0.5 truncate text-[24px] font-bold leading-none text-[#2e241a]">
                    {totalItems > 0 ? `¥${totalPrice.toFixed(1)}` : '¥0.0'}
                  </p>
                </div>
              </div>

              <Link
                to="/booking"
                className={`flex h-[52px] items-center justify-center rounded-[999px] px-6 text-sm font-semibold transition-transform active:scale-[0.98] ${
                  totalItems > 0
                    ? 'bg-[#2d2a27] text-white shadow-[0_14px_30px_rgba(35,31,28,0.22)]'
                    : 'pointer-events-none bg-[#d9d0c5] text-white'
                }`}
              >
                去结算
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showAddedToast && (
        <div className="fixed left-1/2 top-24 z-[120] -translate-x-1/2 rounded-full bg-[#1f4034] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,64,52,0.32)] animate-bounce-in">
          已加入已选
        </div>
      )}
    </div>
  )
}

export default PriceQuery
