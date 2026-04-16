// utils/format.js - 格式化工具

/**
 * 格式化日期时间
 * @param {string} value - 日期时间字符串
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(value) {
  if (!value) return value
  const date = new Date(String(value).replace(' ', 'T'))
  if (isNaN(date.getTime())) return value
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

/**
 * 格式化日期
 * @param {string} value - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(value) {
  if (!value) return value
  const date = new Date(String(value).replace(' ', 'T'))
  if (isNaN(date.getTime())) return value
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/**
 * 获取订单标题
 * @param {object} order - 订单对象
 * @returns {string} 订单标题
 */
function getOrderTitle(order) {
  if (!order || !order.items || !order.items.length) return '海鲜订单'
  if (order.items.length === 1) return order.items[0].name
  return `${order.items[0].name}等${order.items.length}款鲜货`
}

/**
 * 获取工艺标签
 * @param {string} itemName - 商品名称
 * @returns {Array} 工艺标签数组
 */
function getCraftTags(itemName) {
  const tags = {
    '三文鱼刺身': ['现切', '冰鲜处理'],
    '鲜活龙虾': ['去线', '氧气处理'],
    '鲍鱼': ['刷洗净选', '规格复核'],
    '帝王蟹': ['分切处理', '低温保鲜'],
    '扇贝': ['代开壳', '净选即烹'],
    '金枪鱼': ['低温冷藏', '即切即取']
  }
  return tags[itemName] || ['标准处理', '鲜度复核']
}

/**
 * 格式化价格
 * @param {number} price - 价格
 * @returns {string} 格式化后的价格字符串
 */
function formatPrice(price) {
  return Number(price).toFixed(price % 1 === 0 ? 0 : 1)
}

module.exports = {
  formatDateTime,
  formatDate,
  getOrderTitle,
  getCraftTags,
  formatPrice
}