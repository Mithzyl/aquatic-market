// utils/env.js - 环境配置
// 小程序环境变量配置文件
// 根据实际部署环境修改此文件

const ENV = {
  // 开发环境
  development: {
    apiBase: 'http://localhost:8002'
  },
  
  // 测试环境
  test: {
    apiBase: 'http://test.your-domain.com'
  },
  
  // 生产环境
  production: {
    apiBase: 'https://your-domain.com'
  }
}

// 当前环境：development | test | production
// 可通过修改此值切换环境
const currentEnv = 'development'

module.exports = {
  ENV,
  currentEnv,
  // 导出当前环境的配置
  config: ENV[currentEnv]
}