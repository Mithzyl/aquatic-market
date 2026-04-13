import { View, Text, Image, Input } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
}

export default function Booking() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const cart = Taro.getStorageSync('cart') || []
    setCartItems(cart)
  }, [])

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

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleSubmit = async () => {
    if (cartItems.length === 0 || !customerName || !customerPhone || !pickupTime) {
      Taro.showToast({ title: '请填写完整信息', icon: 'error' })
      return
    }

    setSubmitting(true)
    try {
      await Taro.request({
        url: 'http://localhost:8000/orders',
        method: 'POST',
        data: {
          user_id: 1, // mock
          merchant_id: 1,
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
      })
      setShowSuccess(true)
      Taro.removeStorageSync('cart')
      setCartItems([])
      setTimeout(() => {
        setShowSuccess(false)
        Taro.switchTab({ url: '/pages/orders/index' })
      }, 1800)
    } catch (error) {
      Taro.showToast({ title: '提交失败', icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='booking-page'>
      {/* 头部 */}
      <View className='header'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <Text>←</Text>
        </View>
        <View className='header-info'>
          <Text className='header-label'>Confirm Order</Text>
          <Text className='header-title'>到店下单确认</Text>
        </View>
      </View>

      {/* 已选商品 */}
      <View className='section'>
        <View className='section-header'>
          <View className='section-badge'>1</View>
          <Text className='section-title'>已选商品</Text>
        </View>
        {cartItems.length === 0 ? (
          <View className='empty-cart'>
            <Text className='empty-icon'>🛒</Text>
            <Text className='empty-title'>还没有选择商品</Text>
            <View className='empty-btn' onClick={() => Taro.switchTab({ url: '/pages/order/index' })}>去下单</View>
          </View>
        ) : (
          <View className='cart-list'>
            {cartItems.map(item => (
              <View key={item.id} className='cart-item'>
                <Image className='item-image' src={item.image} mode='aspectFill' />
                <View className='item-info'>
                  <Text className='item-name'>{item.name}</Text>
                  <Text className='item-price'>¥{item.price}</Text>
                  <View className='item-stepper'>
                    <View className='stepper-btn' onClick={() => updateQuantity(item.id, -1)}>-</View>
                    <Text className='stepper-value'>{item.quantity}</Text>
                    <View className='stepper-btn plus' onClick={() => updateQuantity(item.id, 1)}>+</View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 取货信息 */}
      <View className='section'>
        <View className='section-header'>
          <View className='section-badge'>2</View>
          <Text className='section-title'>取货信息</Text>
        </View>
        <View className='form'>
          <View className='form-item'>
            <Text className='form-label'>取货人</Text>
            <Input
              className='form-input'
              placeholder='请输入姓名'
              value={customerName}
              onInput={(e) => setCustomerName(e.detail.value)}
            />
          </View>
          <View className='form-item'>
            <Text className='form-label'>手机号</Text>
            <Input
              className='form-input'
              type='number'
              placeholder='请输入手机号'
              value={customerPhone}
              onInput={(e) => setCustomerPhone(e.detail.value)}
            />
          </View>
          <View className='form-item'>
            <Text className='form-label'>到店时间</Text>
            <Input
              className='form-input'
              placeholder='请选择时间'
              value={pickupTime}
              onInput={(e) => setPickupTime(e.detail.value)}
            />
          </View>
        </View>
      </View>

      {/* 订单摘要 */}
      <View className='section'>
        <View className='section-header'>
          <View className='section-badge'>3</View>
          <Text className='section-title'>订单摘要</Text>
        </View>
        <View className='summary'>
          <View className='summary-row'>
            <Text className='summary-label'>商品件数</Text>
            <Text className='summary-value'>{totalItems} 件</Text>
          </View>
          <View className='summary-row'>
            <Text className='summary-label'>订单状态</Text>
            <Text className='summary-value'>待处理</Text>
          </View>
          <View className='summary-row'>
            <Text className='summary-label'>取货方式</Text>
            <Text className='summary-value'>到店自提</Text>
          </View>
          <View className='summary-total'>
            <Text className='total-label'>合计</Text>
            <Text className='total-value'>¥{totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* 底部操作栏 */}
      <View className='action-bar'>
        <View className='action-info'>
          <Text className='action-label'>合计</Text>
          <Text className='action-price'>¥{totalAmount.toFixed(2)}</Text>
          <Text className='action-count'>{totalItems} 件商品</Text>
        </View>
        {cartItems.length === 0 ? (
          <View className='action-btn' onClick={() => Taro.switchTab({ url: '/pages/order/index' })}>去下单</View>
        ) : (
          <View 
            className={`action-btn ${submitting ? 'disabled' : ''}`} 
            onClick={handleSubmit}
          >
            {submitting ? '提交中...' : '提交订单'}
          </View>
        )}
      </View>

      {/* 成功弹窗 */}
      {showSuccess && (
        <View className='success-modal'>
          <View className='success-content'>
            <Text className='success-icon'>✓</Text>
            <Text className='success-title'>下单成功</Text>
            <Text className='success-desc'>订单已创建成功，正在跳转到订单页。</Text>
          </View>
        </View>
      )}
    </View>
  )
}