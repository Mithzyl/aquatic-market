import { View, Text, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import './index.scss'

interface Product {
  id: number
  name: string
  price: number
  original_price: number
  image: string
  tag: string
  description: string
  unit: string
  stock: number
  category_name: string
  badges: string[]
  sales: number
}

export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.params
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (id) fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const res = await Taro.request({ url: `http://localhost:8000/products/${id}` })
      setProduct(res.data as Product)
    } catch (error) {
      console.error('获取商品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = () => {
    if (!product) return
    const cart = Taro.getStorageSync('cart') || []
    const existing = cart.find((item: any) => item.id === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image
      })
    }
    Taro.setStorageSync('cart', cart)
    Taro.showToast({ title: '已加入购物车', icon: 'success' })
  }

  const buyNow = () => {
    addToCart()
    Taro.navigateTo({ url: '/pages/booking/index' })
  }

  if (loading) {
    return <View className='loading'><Text>加载中...</Text></View>
  }

  if (!product) {
    return (
      <View className='empty'>
        <Text className='empty-title'>商品已下架</Text>
        <View className='empty-btn' onClick={() => Taro.switchTab({ url: '/pages/order/index' })}>返回下单页</View>
      </View>
    )
  }

  return (
    <View className='product-detail'>
      {/* 商品图片 */}
      <View className='product-hero'>
        <Image className='hero-image' src={product.image} mode='aspectFill' />
        <View className='hero-back' onClick={() => Taro.navigateBack()}>
          <Text>←</Text>
        </View>
        <View className='hero-tags'>
          <Text className='hero-tag'>{product.category_name || '海鲜鲜选'}</Text>
          <Text className='hero-tag hot'>{product.tag}</Text>
        </View>
      </View>

      {/* 商品信息 */}
      <View className='product-info'>
        <Text className='product-name'>{product.name}</Text>
        <Text className='product-unit'>{product.unit}</Text>
        <View className='product-price'>
          <Text className='price-current'>¥{product.price}</Text>
          {product.original_price && <Text className='price-original'>¥{product.original_price}</Text>}
        </View>

        {/* 标签 */}
        {product.badges?.length > 0 && (
          <View className='product-badges'>
            {product.badges.map(badge => (
              <Text key={badge} className='badge'>{badge}</Text>
            ))}
          </View>
        )}

        {/* 数量选择 */}
        <View className='quantity-section'>
          <Text className='quantity-label'>选择数量</Text>
          <View className='stepper'>
            <View className='stepper-btn' onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</View>
            <Text className='stepper-value'>{quantity}</Text>
            <View className='stepper-btn plus' onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}>+</View>
          </View>
        </View>

        {/* 商品介绍 */}
        <View className='product-desc'>
          <Text className='desc-title'>商品介绍</Text>
          <Text className='desc-content'>{product.description}</Text>
        </View>

        {/* 规格信息 */}
        <View className='product-specs'>
          <View className='spec-item'>
            <Text className='spec-label'>规格</Text>
            <Text className='spec-value'>{product.unit || '门店称重'}</Text>
          </View>
          <View className='spec-item'>
            <Text className='spec-label'>库存</Text>
            <Text className='spec-value'>{product.stock || 99} 件</Text>
          </View>
          <View className='spec-item'>
            <Text className='spec-label'>已售</Text>
            <Text className='spec-value'>{product.sales || 0}</Text>
          </View>
        </View>
      </View>

      {/* 底部操作栏 */}
      <View className='action-bar'>
        <View className='action-btn secondary' onClick={addToCart}>加入已选</View>
        <View className='action-btn primary' onClick={buyNow}>
          立即下单
          <Text className='action-price'>¥{(product.price * quantity).toFixed(0)}</Text>
        </View>
      </View>
    </View>
  )
}