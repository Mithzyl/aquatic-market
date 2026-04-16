// services/config.js - 配置服务（从 API 获取商家配置）
// 支持无商家场景优雅降级
const { get } = require('../utils/request')

// 缓存的商家配置
let cachedConfig = null

/**
 * 获取商家配置
 * @param {number} merchantId - 商家ID（可选，不传则返回首个商家配置）
 * @returns {Promise} 商家配置信息
 */
function getMerchantConfig(merchantId) {
  const params = merchantId ? { merchant_id: merchantId } : {}
  return get('/config', params)
}

/**
 * 获取商家配置（带缓存）
 * @param {number} merchantId - 商家ID（可选）
 * @returns {Promise} 商家配置信息
 */
async function getConfig(merchantId) {
  // 如果有缓存，直接返回
  if (cachedConfig) {
    return cachedConfig
  }
  
  // 从 API 获取配置
  try {
    const config = await getMerchantConfig(merchantId)
    
    // 处理无商家场景
    if (config.is_empty) {
      console.log('[Config] 无商家数据，返回空配置模板')
      const emptyConfig = getEmptyConfig()
      cachedConfig = emptyConfig
      return emptyConfig
    }
    
    // 有商家，缓存配置
    cachedConfig = config
    return config
  } catch (error) {
    console.error('Failed to fetch merchant config:', error)
    // 返回空配置模板
    return getEmptyConfig()
  }
}

/**
 * 清除配置缓存
 */
function clearConfigCache() {
  cachedConfig = null
}

/**
 * 获取空配置模板（无商家场景）
 * 与后端 API 保持一致
 */
function getEmptyConfig() {
  return {
    is_empty: true,
    merchant_id: null,
    shop_name: '',
    shop_logo: '',
    contact_phone: '',
    contact_wechat: '',
    address: '',
    business_hours: '',
    announcement: '',
    theme_color: '#1890ff',
    enable_ordering: true,
    enable_pickup: true,
    min_order_amount: 0
  }
}

/**
 * 获取默认配置（当 API 获取失败时使用）
 * @deprecated 请使用 getEmptyConfig() 替代
 */
function getDefaultConfig() {
  return getEmptyConfig()
}

/**
 * 获取店铺名称
 */
async function getShopName() {
  const config = await getConfig()
  return config.shop_name || ''
}

/**
 * 获取联系电话
 */
async function getContactPhone() {
  const config = await getConfig()
  return config.contact_phone || ''
}

/**
 * 获取店铺公告
 */
async function getAnnouncement() {
  const config = await getConfig()
  return config.announcement || ''
}

/**
 * 获取营业时间
 */
async function getBusinessHours() {
  const config = await getConfig()
  return config.business_hours || ''
}

/**
 * 检查是否有商家配置
 */
async function hasMerchant() {
  const config = await getConfig()
  return !config.is_empty && config.merchant_id !== null
}

/**
 * 获取商家ID
 */
async function getMerchantId() {
  const config = await getConfig()
  return config.merchant_id
}

module.exports = {
  getMerchantConfig,
  getConfig,
  clearConfigCache,
  getEmptyConfig,
  getDefaultConfig,
  getShopName,
  getContactPhone,
  getAnnouncement,
  getBusinessHours,
  hasMerchant,
  getMerchantId
}