// utils/config.js - 配置常量（用户端服务端口8002）
// 注意：商家配置（店铺名称、联系电话等）已移至 services/config.js 从 API 获取
const { config: envConfig } = require('./env')

const config = {
  // API 基地址：从环境配置读取
  apiBase: envConfig.apiBase,
  
  // API 路径前缀：用户端路由
  apiPrefix: '/api/customer',

  // Token 存储 Key
  tokenKey: 'customer_token',

  // 用户信息存储 Key
  userKey: 'customer_user',

  // 默认图片
  defaultImage: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&h=800&fit=crop',

  // 品类描述（前端配置，后端 API 不返回）
  categoryDescriptions: {
    shrimp: '鲜活现捞',
    crab: '肥美到店',
    fish: '刺身精选',
    shell: '净选即烹',
    lobster: '宴请招牌'
  },

  // 品类故事（前端配置，后端 API 不返回）
  categoryStories: {
    shrimp: { eyebrow: '鲜活虾类', title: '今天主推基围虾和黑虎虾', subtitle: '适合白灼、香煎和家庭聚餐，支持直接加选。' },
    crab: { eyebrow: '肥美蟹类', title: '梭子蟹与帝王蟹腿正在热卖', subtitle: '时令货量充足，适合清蒸、火锅和宴请。' },
    fish: { eyebrow: '刺身与家常', title: '三文鱼和金鲳鱼适合今天现做', subtitle: '一个适合生食，一个适合煎蒸，组合更完整。' },
    shell: { eyebrow: '净选贝类', title: '生蚝和北极贝做冷盘最稳', subtitle: '门店支持代开壳与冷藏保鲜，聚餐更省事。' },
    lobster: { eyebrow: '聚餐招牌', title: '波士顿龙虾和小青龙适合多人餐', subtitle: '规格稳定，适合周末聚餐和节庆宴请。' }
  },

  // 服务亮点（前端配置，后端 API 不返回）
  serviceHighlights: [
    { title: '门店现挑', description: '鲜活现捞，支持代处理和冷链打包。', stat: '30 min' },
    { title: '今日早市', description: '上午档到货批次更新，价格更适合家用。', stat: '9 折起' },
    { title: '聚餐配货', description: '龙虾、蟹类和贝类支持多人餐组合。', stat: '48 款' }
  ],

  // 订单状态配置（前端配置，后端 API 不返回）
  statusConfig: {
    preparing: { badgeLabel: '待取货', badgeBg: '#1f7a55', badgeColor: '#ffffff' },
    pending: { badgeLabel: '已下单', badgeBg: '#f4b54a', badgeColor: '#4c3414' },
    completed: { badgeLabel: '已领取', badgeBg: '#ebe7e1', badgeColor: '#786553' },
    cancelled: { badgeLabel: '已取消', badgeBg: '#efe8df', badgeColor: '#8b7865' }
  }
}

module.exports = config