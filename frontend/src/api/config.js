/**
 * API 配置文件
 * 管理 API 请求的基础配置
 */

/**
 * API 基础 URL
 * 优先从环境变量读取，默认使用 localhost
 */
// API配置：商家端服务端口8001
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'

/**
 * API 路径前缀
 */
export const API_PREFIX = '/api'

/**
 * Token 存储 Key
 */
export const ADMIN_TOKEN_KEY = 'admin_token'

/**
 * 商家信息存储 Key
 */
export const ADMIN_MERCHANT_KEY = 'admin_merchant'

/**
 * 登录页面路径
 */
export const LOGIN_ROUTE = '/admin/login'