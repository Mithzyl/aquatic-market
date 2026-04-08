import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../App'
import { retailCategories, retailProducts } from '../data/products'

const categoryStories = {
  shrimp: {
    eyebrow: '鲜活虾类',
    title: '今天主推基围虾和黑虎虾',
    subtitle: '适合白灼、香煎和家庭聚餐，支持直接加选。'
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

function CategoryIcon({ categoryId, active = false, compact = false }) {
  const wrapperClass = compact
    ? `flex h-7 w-7 items-center justify-center rounded-full ${active ? 'bg-[#fff1e6] text-[#d67635]' : 'bg-[#f1e6d7] text-[#8c755d]'}`
    : `flex h-10 w-10 items-center justify-center rounded-full ${active ? 'bg-[#fff1e6] text-[#d67635]' : 'bg-[#f1e6d7] text-[#8c755d]'}`
  const svgClass = compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'

  const commonProps = {
    className: svgClass,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }

  let icon

  if (categoryId === 'shrimp') {
    icon = (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6.5 13.5c2.5-5.5 8.5-7.5 11-5 2 2-1 5-4 5H9.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9.5 13.5c0 2.5 1.5 4 4 4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 10.5 5.5 9M7 13.5l-2 .5M8 16l-1 2" />
      </svg>
    )
  } else if (categoryId === 'crab') {
    icon = (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 12a4 4 0 1 1 8 0v2H8v-2Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 11 5.5 9M16 11 18.5 9M8 14 5 15.5M16 14l3 1.5M10 8.5 8.5 6.5M14 8.5l1.5-2" />
      </svg>
    )
  } else if (categoryId === 'fish') {
    icon = (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5.5 12c2-2.6 4.9-4 8.3-4 2.3 0 4.1.6 5.7 1.9l-2 2.1 2 2.1c-1.6 1.3-3.4 1.9-5.7 1.9-3.4 0-6.3-1.4-8.3-4Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 12h4.5" />
        <circle cx="14.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    )
  } else if (categoryId === 'shell') {
    icon = (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 15c0-4.2 2.5-7 6-7s6 2.8 6 7c-2-.7-4-.7-6 0-2-.7-4-.7-6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 8v7M9 9.2l1.5 5M15 9.2l-1.5 5" />
      </svg>
    )
  } else {
    icon = (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 7h6l1.5 4.5L12 17l-4.5-5.5L9 7Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 7 7 4.5M15 7 17 4.5" />
      </svg>
    )
  }

  return <div className={wrapperClass}>{icon}</div>
}

const PriceQuery = () => {
  const [activeCategoryId, setActiveCategoryId] = useState(retailCategories[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddedToast, setShowAddedToast] = useState(false)
  const [showSummaryBar, setShowSummaryBar] = useState(false)
  const [isSummaryClosing, setIsSummaryClosing] = useState(false)
  const [showCartPreview, setShowCartPreview] = useState(false)
  const { cartItems, addToCart, updateQuantity, totalItems, totalPrice } = useCart()
  const productScrollRef = useRef(null)
  const sectionRefs = useRef({})
  const isProgrammaticScrollRef = useRef(false)
  const scrollReleaseTimerRef = useRef(null)
  const summaryHideTimerRef = useRef(null)
  const cartPreviewRef = useRef(null)

  useEffect(() => {
    if (!showAddedToast) return undefined

    const timer = setTimeout(() => setShowAddedToast(false), 1400)
    return () => clearTimeout(timer)
  }, [showAddedToast])

  useEffect(() => {
    if (summaryHideTimerRef.current) {
      clearTimeout(summaryHideTimerRef.current)
    }

    if (totalItems > 0) {
      setShowSummaryBar(true)
      setIsSummaryClosing(false)
      return undefined
    }

    if (showSummaryBar) {
      setIsSummaryClosing(true)
      summaryHideTimerRef.current = setTimeout(() => {
        setShowSummaryBar(false)
        setIsSummaryClosing(false)
      }, 220)
    }

    return () => {
      if (summaryHideTimerRef.current) {
        clearTimeout(summaryHideTimerRef.current)
      }
    }
  }, [showSummaryBar, totalItems])

  useEffect(() => {
    if (totalItems === 0) {
      setShowCartPreview(false)
    }
  }, [totalItems])

  useEffect(() => {
    if (!showCartPreview) return undefined

    const handlePointerDown = (event) => {
      if (!cartPreviewRef.current?.contains(event.target)) {
        setShowCartPreview(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [showCartPreview])

  const keywordFilteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return retailProducts.filter((product) => {
      if (!normalizedQuery) return true

      return (
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.categoryName.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [searchQuery])

  const groupedProducts = useMemo(
    () =>
      retailCategories
        .map((category) => ({
          ...category,
          products: keywordFilteredProducts.filter((product) => product.category === category.id)
        }))
        .filter((category) => category.products.length > 0),
    [keywordFilteredProducts]
  )

  useEffect(() => {
    if (!groupedProducts.length) return

    const hasActiveCategory = groupedProducts.some((category) => category.id === activeCategoryId)
    if (!hasActiveCategory) {
      setActiveCategoryId(groupedProducts[0].id)
    }
  }, [activeCategoryId, groupedProducts])

  const activeCategory =
    groupedProducts.find((category) => category.id === activeCategoryId) ||
    retailCategories.find((category) => category.id === activeCategoryId) ||
    retailCategories[0]

  const activeStory = categoryStories[activeCategory.id] || categoryStories.shrimp

  const getQuantity = (productId) => {
    const cartItem = cartItems.find((item) => item.id === productId)
    return cartItem ? cartItem.quantity : 0
  }

  const getCategoryCount = (categoryId) => {
    const categoryGroup = groupedProducts.find((category) => category.id === categoryId)
    return categoryGroup ? categoryGroup.products.length : 0
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

  const handleCategoryClick = (categoryId) => {
    const container = productScrollRef.current
    const section = sectionRefs.current[categoryId]
    if (!container || !section) return

    if (scrollReleaseTimerRef.current) {
      clearTimeout(scrollReleaseTimerRef.current)
    }

    isProgrammaticScrollRef.current = true
    setActiveCategoryId(categoryId)
    container.scrollTo({
      top: section.offsetTop - 8,
      behavior: 'smooth'
    })

    scrollReleaseTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 420)
  }

  const handleProductScroll = () => {
    const container = productScrollRef.current
    if (!container || !groupedProducts.length) return
    if (isProgrammaticScrollRef.current) return

    const currentScrollTop = container.scrollTop
    let nextActiveId = groupedProducts[0].id

    groupedProducts.forEach((category) => {
      const section = sectionRefs.current[category.id]
      if (!section) return

      if (currentScrollTop >= section.offsetTop - 72) {
        nextActiveId = category.id
      }
    })

    if (nextActiveId !== activeCategoryId) {
      setActiveCategoryId(nextActiveId)
    }
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: 'calc(100svh - var(--app-bottom-nav-space))',
        background:
          'radial-gradient(circle at top, rgba(255, 242, 221, 0.84), rgba(245, 238, 228, 0.96) 28%, #f7f2ea 62%, #efe6db 100%)',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
      }}
    >
      <div className="border-b border-[#eadfce] bg-[rgba(250,246,239,0.94)] safe-area-top">
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
              </div>

              <Link
                to="/order-management"
                className="rounded-2xl bg-[#f6f0e7] px-3 py-2 text-right text-xs text-[#8a7152] transition-transform active:scale-[0.98]"
              >
                <div className="font-semibold text-[#574533]">我的订单</div>
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

      <div className="mx-auto flex w-full max-w-lg flex-1 min-h-0 px-4 pb-4 pt-4">
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[30px] border border-[#eadfce] bg-[#fffaf3] shadow-[0_22px_48px_rgba(107,75,36,0.08)]">
          <aside className="w-[108px] border-r border-[#eadfce] bg-[#f5ede1]">
            <div className="flex h-full flex-col gap-2 overflow-y-auto px-2 py-4 scrollbar-hide">
              {retailCategories.map((category) => {
                const isActive = category.id === activeCategoryId
                const categoryCount = getCategoryCount(category.id)

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`relative overflow-hidden rounded-[24px] px-2 text-center transition-all duration-300 ${
                      isActive
                        ? 'min-h-[132px] bg-white py-4 text-[#2f281f] shadow-[0_14px_28px_rgba(96,72,39,0.12)]'
                        : categoryCount > 0
                          ? 'min-h-[74px] py-2 text-[#85735e]'
                          : 'text-[#bcae99]'
                    }`}
                  >
                    {isActive && <span className="absolute left-0 top-6 h-10 w-1 rounded-full bg-[#ff7e45]" />}
                    <div className="flex flex-col items-center">
                      <CategoryIcon categoryId={category.id} active={isActive} />
                      <div className={`font-semibold leading-none ${isActive ? 'mt-3 text-[14px]' : 'mt-2 text-[12px]'}`}>
                        {category.name}
                      </div>
                    </div>
                    {isActive && (
                      <div className="mt-3 inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#fff1e6] px-1.5 py-0.5 text-[10px] font-semibold text-[#d66f30]">
                        {categoryCount}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="relative flex min-h-0 flex-1 flex-col bg-[#fffaf3] px-4 py-4">
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
                  {keywordFilteredProducts.length} 款可选
                </span>
              </div>
            </div>

            {groupedProducts.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-[24px] bg-white px-6 text-center shadow-[0_12px_28px_rgba(120,93,53,0.08)]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f6efe5] text-2xl">🔎</div>
                <h3 className="mt-4 text-lg font-semibold text-[#2c241c]">没有找到对应商品</h3>
                <p className="mt-2 text-sm leading-6 text-[#7d6a53]">试试切换左侧分类，或者搜索更短的关键词。</p>
              </div>
            ) : (
              <>
                <div
                  ref={productScrollRef}
                  onScroll={handleProductScroll}
                  className="flex-1 overflow-y-auto pr-1 scrollbar-hide"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className={`space-y-6 ${totalItems > 0 ? 'pb-28' : 'pb-2'}`}>
                    {groupedProducts.map((category) => (
                      <section
                        key={category.id}
                        ref={(node) => {
                          if (node) sectionRefs.current[category.id] = node
                        }}
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <CategoryIcon categoryId={category.id} compact />
                          <h3 className="text-lg font-semibold text-[#2c241c]">{category.name}</h3>
                          <span className="rounded-full bg-[#f7f1e8] px-2 py-1 text-[10px] font-medium text-[#8f7558]">
                            {category.products.length} 款
                          </span>
                        </div>

                        <div className="space-y-3">
                          {category.products.map((product) => {
                            const quantity = getQuantity(product.id)

                            return (
                              <Link
                                key={product.id}
                                to={`/product/${product.id}`}
                                className="block rounded-[24px] bg-white p-3 shadow-[0_12px_28px_rgba(120,93,53,0.08)] transition-transform duration-300 active:scale-[0.99]"
                              >
                                <div className="flex items-stretch gap-3">
                                  <div className="flex w-24 shrink-0 self-stretch flex-col justify-between py-1">
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

                                    <div className="flex h-[56px] w-full flex-col items-center justify-center text-center">
                                      <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-[28px] font-bold leading-none text-[#e0682e]">¥{product.price}</span>
                                        <span className="text-[15px] text-[#b5a18a] line-through">¥{product.originalPrice}</span>
                                      </div>
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

                                    <div className="mt-3 flex h-[56px] items-center justify-end">
                                      {quantity > 0 ? (
                                        <div
                                          key={`stepper-${product.id}`}
                                          className="flex h-14 items-center gap-3 rounded-full bg-[#fff3e9] px-2 py-2"
                                          onClick={(event) => {
                                            event.preventDefault()
                                            event.stopPropagation()
                                          }}
                                        >
                                          <button
                                            onClick={(event) => handleDecrease(event, product.id)}
                                            className="flex h-10 min-h-0 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[24px] leading-none text-[#855326] shadow-[0_4px_10px_rgba(120,93,53,0.08)] transition-transform active:scale-90"
                                          >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 12h14" />
                                            </svg>
                                          </button>
                                          <span className="min-w-[20px] text-center text-[15px] font-semibold text-[#6b4a2b]">
                                            {quantity}
                                          </span>
                                          <button
                                            onClick={(event) => handleAdd(event, product)}
                                            className="flex h-10 min-h-0 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2f6b56] text-[24px] leading-none text-white shadow-[0_8px_16px_rgba(47,107,86,0.22)] transition-transform active:scale-90"
                                          >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 5v14M5 12h14" />
                                            </svg>
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex h-14 items-center">
                                          <button
                                            key={`add-${product.id}`}
                                            onClick={(event) => handleAdd(event, product)}
                                            className="flex h-10 min-h-0 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1f4034] text-white shadow-[0_12px_24px_rgba(31,64,52,0.25)] transition-transform active:scale-90"
                                          >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>

                {showSummaryBar && (
                  <div className="pointer-events-none absolute bottom-4 left-4 right-4">
                    <div ref={cartPreviewRef} className="pointer-events-auto relative">
                      {showCartPreview && (
                        <div className="absolute bottom-[82px] left-0 right-0 rounded-[28px] border border-[#e5d8c8] bg-[rgba(255,251,245,0.98)] p-3 shadow-[0_18px_32px_rgba(84,61,33,0.14)] backdrop-blur-sm">
                          <div className="mb-3 flex items-center justify-between px-1">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-[#c28a55]">已选商品</p>
                              <p className="mt-1 text-sm font-semibold text-[#2e241a]">{totalItems} 件商品，随时可调整</p>
                            </div>
                            <button
                              onClick={() => setShowCartPreview(false)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4e8d8] text-[#7f6548] transition-transform active:scale-95"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m6 6 12 12M6 18 18 6" />
                              </svg>
                            </button>
                          </div>

                          <div className="max-h-64 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
                            {cartItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 rounded-[22px] bg-white px-3 py-3 shadow-[0_10px_22px_rgba(130,96,59,0.05)]"
                              >
                                <img
                                  src={item.image || fallbackImage}
                                  alt={item.name}
                                  className="h-14 w-14 rounded-[16px] object-cover"
                                  onError={(event) => {
                                    event.currentTarget.src = fallbackImage
                                  }}
                                />

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-[#2c241c]">{item.name}</p>
                                  <div className="mt-1 flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-[#df6f33]">¥{(item.price * item.quantity).toFixed(1)}</p>
                                    <div
                                      className="flex h-11 items-center gap-2 rounded-full bg-[#fff3e9] px-2 py-1.5"
                                      onClick={(event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                      }}
                                    >
                                      <button
                                        onClick={(event) => handleDecrease(event, item.id)}
                                        className="flex h-8 min-h-0 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[#855326] shadow-[0_4px_10px_rgba(120,93,53,0.08)] transition-transform active:scale-90"
                                      >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 12h14" />
                                        </svg>
                                      </button>
                                      <span className="min-w-[16px] text-center text-xs font-semibold text-[#6b4a2b]">{item.quantity}</span>
                                      <button
                                        onClick={(event) =>
                                          handleAdd(event, {
                                            id: item.id,
                                            name: item.name,
                                            price: item.price,
                                            image: item.image
                                          })
                                        }
                                        className="flex h-8 min-h-0 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2f6b56] text-white shadow-[0_8px_16px_rgba(47,107,86,0.22)] transition-transform active:scale-90"
                                      >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 5v14M5 12h14" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div
                        className={`rounded-[999px] border border-[#e5d8c8] bg-[rgba(255,251,245,0.98)] p-2 shadow-[0_18px_32px_rgba(84,61,33,0.14)] backdrop-blur-sm transition-all duration-200 ${
                        isSummaryClosing
                          ? 'translate-y-3 scale-95 opacity-0'
                          : 'translate-y-0 scale-100 opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCartPreview((value) => !value)}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-[999px] px-3 py-2 text-left transition-colors hover:bg-[#faf2e8]"
                          >
                            <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#f2e4d2] text-[#6c4a2d]">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M8 7h10l-1 9H9L8 7ZM7 7l-.8-2.2A1.5 1.5 0 0 0 4.8 4H4" />
                                <circle cx="10" cy="19" r="1.2" fill="currentColor" stroke="none" />
                                <circle cx="16" cy="19" r="1.2" fill="currentColor" stroke="none" />
                              </svg>
                              <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-[#9bc44c] px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white">
                                {totalItems}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <p className="text-[11px] text-[#8e765c]">点击查看已选商品</p>
                              <p className="mt-0.5 truncate text-[24px] font-bold leading-none text-[#2e241a]">
                                ¥{totalPrice.toFixed(1)}
                              </p>
                            </div>

                            <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#f5eadb] text-[#7b6249] transition-transform ${showCartPreview ? 'rotate-180' : ''}`}>
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m6 9 6 6 6-6" />
                              </svg>
                            </div>
                          </button>

                          <Link
                            to="/booking"
                            className="flex h-[52px] items-center justify-center rounded-[999px] bg-[#2d2a27] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(35,31,28,0.22)] transition-transform active:scale-[0.98]"
                          >
                            去结算
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
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
