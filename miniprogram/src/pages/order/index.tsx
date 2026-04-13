import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface Product {
  id: number
  name: string
  price: number
  original_price: number
  image: string
  tag: string
  category: string
  category_name: string
  description: string
  unit: string
  sales: number
  badges: string[]
}

interface Category {
  id: string
  name: string
  icon: string
  description: string
}

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
}

export default function Order() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // 从全局状态获取购物车
    const cart = Taro.getStorageSync('cart') || []
    setCartItems(cart)
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        Taro.request({ url: 'http://localhost:8000/products' }),
        Taro.request({ url: 'http://localhost:8000/categories' })
      ])
      setProducts(productsRes.data as Product[])
      const cats = categoriesRes.data.map((cat: any) => ({
        id: cat.slug,
        name: cat.name,
        icon: cat.icon,
        description: cat.description || '精选品类'
      }))
      setCategories(cats)
      if (cats.length > 0) setActiveCategory(cats[0].id)
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return p.category === activeCategory || activeCategory === ''
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.description.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const addToCart = (product: Product) => {
    const newCart = [...cartItems]
    const existing = newCart.find(item => item.id === product.id)
    if (existing) {
      existing.quantity += 1
    } else {
      newCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image
      })
    }
    setCartItems(newCart)
    Taro.setStorageSync('cart', newCart)
    Taro.showToast({ title: '已加入购物车', icon: 'success' })
  }

  const updateQuantity = (productId: number, change: number) => {
    const newCart = cartItems.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: item.quantity + change }
      }
      return item
    }).filter(item => item.quantity > 0)
    setCartItems(newCart)
    Taro.setStorageSync('cart', newCart)
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (loading) {
    return <View className='loading'><Text>加载中...</Text></View>
  }

  return (
    <View className='order-page'>
      {/* 搜索栏 */}
      <View className='search-bar'>
        <View className='search-input-wrapper'>
          <Text className='search-icon'>🔍</Text>
          <input 
            className='search-input'
            placeholder='搜索虾类、黑虎虾、三文鱼...'
            value={searchQuery}
            onInput={(e) => setSearchQuery(e.detail.value)}
          />
        </View>
      </View>

      {/* 分类导航 */}
      <View className='category-nav'>
        {categories.map(cat => (
          <View
            key={cat.id}
            className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <Text className='category-icon'>{cat.icon}</Text>
            <Text className='category-name'>{cat.name}</Text>
          </View>
        ))}
      </View>

      {/* 商品列表 */}
      <ScrollView className='product-list' scrollY>
        {filteredProducts.map(product => {
          const inCart = cartItems.find(item => item.id === product.id)
          return (
            <View
              key={product.id}
              className='product-card'
              onClick={() => Taro.navigateTo({ url: `/pages/product-detail/index?id=${product.id}` })}
            >
              <Image className='product-image' src={product.image} mode='aspectFill' />
              <View className='product-info'>
                <View className='product-tag'>{product.tag}</View>
                <Text className='product-name'>{product.name}</Text>
                <Text className='product-unit'>{product.unit}</Text>
                <View className='product-price'>
                  <Text className='price-current'>¥{product.price}</Text>
                  <Text className='price-original'>¥{product.original_price}</Text>
                </View>
              </View>
              <View className='product-actions'>
                {inCart ? (
                  <View className='stepper'>
                    <View className='stepper-btn' onClick={() => updateQuantity(product.id, -1)}>-</View>
                    <Text className='stepper-value'>{inCart.quantity}</Text>
                    <View className='stepper-btn plus' onClick={() => addToCart(product)}>+</View>
                  </View>
                ) : (
                  <View className='add-btn' onClick={() => addToCart(product)}>+</View>
                )}
              </View>
            </View>
          )
        })}
      </ScrollView>

      {/* 购物车浮层 */}
      {totalItems > 0 && (
        <View className='cart-bar'>
          <View className='cart-info'>
            <Text className='cart-count'>{totalItems} 件</Text>
            <Text className='cart-price'>¥{totalPrice.toFixed(1)}</Text>
          </View>
          <View 
            className='checkout-btn'
            onClick={() => Taro.navigateTo({ url: '/pages/booking/index' })}
          >
            去结算
          </View>
        </View>
      )}
    </View>
  )
}