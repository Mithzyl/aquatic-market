import { View, Text, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface Product {
  id: number
  name: string
  price: number
  image: string
  tag: string
  description: string
}

interface Category {
  id: string
  name: string
  icon: string
  description: string
}

export default function Index() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        Taro.request({ url: 'http://localhost:8000/products' }),
        Taro.request({ url: 'http://localhost:8000/categories' })
      ])
      setProducts(productsRes.data as Product[])
      setCategories(categoriesRes.data.map((cat: any) => ({
        id: cat.slug,
        name: cat.name,
        icon: cat.icon,
        description: cat.description || '精选品类'
      })))
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const heroProduct = products[0]
  const showcaseProducts = products.slice(0, 3)

  if (loading) {
    return (
      <View className='loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='home'>
      {/* Hero 区域 */}
      <View className='hero'>
        {heroProduct && (
          <Image 
            className='hero-image' 
            src={heroProduct.image}
            mode='aspectFill'
          />
        )}
        <View className='hero-content'>
          <View className='hero-badge'>NEW RETAIL SEAFOOD</View>
          <Text className='hero-title'>当日直采的海鲜零售首页</Text>
          <Text className='hero-subtitle'>柳州鲜选海产店</Text>
          <View className='hero-actions'>
            <View 
              className='btn-primary'
              onClick={() => Taro.switchTab({ url: '/pages/order/index' })}
            >
              进入下单
            </View>
            <View 
              className='btn-secondary'
              onClick={() => Taro.switchTab({ url: '/pages/orders/index' })}
            >
              查看订单
            </View>
          </View>
          {heroProduct && (
            <View className='hero-product'>
              <Text className='hero-product-name'>{heroProduct.name}</Text>
              <View className='hero-price'>
                <Text className='price-label'>早市价</Text>
                <Text className='price-value'>¥{heroProduct.price}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 分类入口 */}
      <View className='categories'>
        <View className='section-header'>
          <Text className='section-title'>从主力类目进入下单</Text>
          <Text className='section-link' onClick={() => Taro.switchTab({ url: '/pages/order/index' })}>去下单</Text>
        </View>
        <View className='category-grid'>
          {categories.map(category => (
            <View 
              key={category.id}
              className='category-item'
              onClick={() => Taro.switchTab({ url: '/pages/order/index' })}
            >
              <Text className='category-icon'>{category.icon}</Text>
              <Text className='category-name'>{category.name}</Text>
              <Text className='category-desc'>{category.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 今日热卖 */}
      <View className='hot-products'>
        <View className='section-header'>
          <Text className='section-title'>今日热卖商品</Text>
          <Text className='section-link' onClick={() => Taro.switchTab({ url: '/pages/order/index' })}>去下单</Text>
        </View>
        {showcaseProducts.map(product => (
          <View 
            key={product.id}
            className='product-card'
            onClick={() => Taro.navigateTo({ url: `/pages/product-detail/index?id=${product.id}` })}
          >
            <Image className='product-image' src={product.image} mode='aspectFill' />
            <View className='product-info'>
              <View className='product-tag'>{product.tag}</View>
              <Text className='product-name'>{product.name}</Text>
              <Text className='product-desc'>{product.description}</Text>
              <View className='product-price'>
                <Text className='price-current'>¥{product.price}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}