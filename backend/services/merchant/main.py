"""
Merchant Service - 商家端独立服务

提供商家端所有功能：
- 商家认证与登录（用户名+密码，bcrypt）
- 商品管理（创建、更新、删除、上下架）
- 品类管理
- 订单管理
- 收益统计
- 商家信息管理
"""
import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 添加 /app 到 Python 路径（Docker 容器内 config/shared 都在 /app/ 下）
sys.path.insert(0, "/app")

# 加载环境变量
load_dotenv()

# 导入配置
from config.database import create_db_and_tables

# 导入共享模块
from shared.logging_middleware import RequestLoggingMiddleware

# 导入路由
from routes.product_routes import router as product_router
from routes.order_routes import router as order_router
from routes.merchant_routes import router as merchant_router
from routes.category_routes import router as category_router
from routes.admin_routes import router as admin_router

# 创建 FastAPI 应用
app = FastAPI(
    title="海鲜零售预订系统 - 商家端",
    description="提供商品查询、价格查询、预订下单、订单管理等功能"
)

# 配置 CORS 中间件
environment = os.getenv("ENVIRONMENT", "development")

if environment == "production":
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "").strip()
    
    if allowed_origins_str == "*":
        # 临时允许所有来源（使用 regex 模式，兼容 allow_credentials=True）
        app.add_middleware(
            CORSMiddleware,
            allow_origin_regex=".*",
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    elif allowed_origins_str:
        allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "Accept"],
        )
    else:
        import warnings
        warnings.warn(
            "生产环境未配置 ALLOWED_ORIGINS，CORS 将拒绝所有跨域请求。"
            "请设置环境变量 ALLOWED_ORIGINS=https://your-domain.com",
            UserWarning
        )
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "Accept"],
        )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:5177"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 请求日志中间件
app.add_middleware(RequestLoggingMiddleware)

# 启动时创建数据库表
@app.on_event("startup")
def on_startup():
    jwt_secret = os.getenv("JWT_SECRET")
    environment = os.getenv("ENVIRONMENT", "development")
    if environment == "production" and not jwt_secret:
        raise RuntimeError(
            "JWT_SECRET 环境变量未设置！生产环境必须配置 JWT_SECRET，服务拒绝启动。"
            "请在 .env 文件或环境变量中设置 JWT_SECRET。"
        )
    create_db_and_tables()

# 注册路由
app.include_router(product_router)
app.include_router(order_router)
app.include_router(merchant_router)
app.include_router(category_router)
app.include_router(admin_router)


# ============== 根路径 ==============

@app.get("/")
def read_root():
    return {"message": "海鲜零售预订系统 API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "merchant"}
