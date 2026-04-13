import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState, useMemo } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface Order {
  id: number
  customer_name: string
  customer_phone: string
  pickup_time: string
  total_amount: number
  status: string
  created_at: string
  items: { name: string; quantity: number; price: number }[]
}

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'preparing', label: '待取货' },
  { key: 'pending', label: '已下单' },
  { key: 'completed', label: '已完成' }
]

const statusConfig = {
  preparing: { label: '待取货', color: '#1f7a55', bg: '#effbf5' },
  pending: { label: '已下单', color: '#f4b54a', bg: '#fff7e8' },
  completed: { label: '已领取', color: '#786553', bg: '#faf6f0' },
  cancelled: { label: '已取消', color: '#8b7865', bg: '#efe8df' }
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await Taro.request({ url: 'http://localhost:8000/orders/user/1' })
      setOrders(res.data as Order[])
    } catch (error) {
      console.error('获取订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeFilter === 'all') return true
      return order.status === activeFilter
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [orders, activeFilter])

  const stats = useMemo(() => ({
    preparing: orders.filter(o => o.status === 'preparing').length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length
  }), [orders])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getOrderTitle = (order: Order) => {
    if (!order.items?.length) return '海鲜订单'
    if (order.items.length === 1) return order.items[0].name
    return `${order.items[0].name}等${order.items.length}款鲜货`
  }

  if (loading) {
    return <View className='loading'><Text>加载中...</Text></View>
  }

  return (
    <View className='orders-page'>
      {/* 头部 */}
      <View className='header'>
        <View className='header-badge'>
          <Text className='badge-dot'>●</Text>
          <Text>Customer View</Text>
        </View>
        <Text className='header-title'>我的订单</Text>
        <View className='header-btn' onClick={() => Taro.switchTab({ url: '/pages/order/index' })}>继续下单</View>
      </View>

      {/* 统计卡片 */}
      <View className='stats'>
        <View className='stat-card preparing'>
          <Text className='stat-label'>待取货</Text>
          <Text className='stat-value'>{stats.preparing}</Text>
        </View>
        <View className='stat-card pending'>
          <Text className='stat-label'>待确认</Text>
          <Text className='stat-value'>{stats.pending}</Text>
        </View>
        <View className='stat-card completed'>
          <Text className='stat-label'>历史订单</Text>
          <Text className='stat-value'>{stats.completed}</Text>
        </View>
      </View>

      {/* 筛选栏 */}
      <View className='filter-bar'>
        {filterTabs.map(tab => (
          <View
            key={tab.key}
            className={`filter-item ${activeFilter === tab.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.key)}
          >
            <Text>{tab.label}</Text>
            <Text className='filter-count'>
              {tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length}
            </Text>
          </View>
        ))}
      </View>

      {/* 订单列表 */}
      <ScrollView className='order-list' scrollY>
        {filteredOrders.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>📋</Text>
            <Text className='empty-title'>当前没有这类订单</Text>
            <Text className='empty-desc'>切换筛选看看其他状态，或者回到下单页继续选购鲜货。</Text>
            <View className='empty-btn' onClick={() => Taro.switchTab({ url: '/pages/order/index' })}>去下单</View>
          </View>
        ) : (
          filteredOrders.map(order => {
            const config = statusConfig[order.status] || statusConfig.pending
            return (
              <View key={order.id} className='order-card'>
                {/* 状态徽章 */}
                <View className='order-header'>
                  <View className={`status-badge ${order.status}`} style={{ background: config.bg }}>
                    <View className='badge-dot' style={{ background: config.color }} />
                    <Text className='badge-label' style={{ color: config.color }}>{config.label}</Text>
                  </View>
                  <View className='order-meta'>
                    <Text className='meta-id'>订单号 {order.id}</Text>
                    <Text className='meta-date'>{formatDate(order.created_at)}</Text>
                  </View>
                </View>

                {/* 订单标题 */}
                <View className='order-title-row'>
                  <Text className='order-title'>{getOrderTitle(order)}</Text>
                  <Text className='order-amount'>¥{order.total_amount}</Text>
                </View>

                {/* 展开/收起 */}
                <View 
                  className='expand-btn'
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                >
                  <Text>订单明细</Text>
                  <Text className={`expand-icon ${expandedOrderId === order.id ? 'expanded' : ''}`}>▼</Text>
                </View>

                {/* 订单明细 */}
                {expandedOrderId === order.id && (
                  <View className='order-items'>
                    {order.items.map((item, idx) => (
                      <View key={idx} className='item-row'>
                        <View className='item-info'>
                          <Text className='item-name'>{item.name}</Text>
                          <View className='item-tags'>
                            <Text className='item-tag'>标准处理</Text>
                            <Text className='item-tag'>鲜度复核</Text>
                          </View>
                        </View>
                        <View className='item-meta'>
                          <Text className='item-qty'>x{item.quantity}</Text>
                          <Text className='item-price'>¥{item.price * item.quantity}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}