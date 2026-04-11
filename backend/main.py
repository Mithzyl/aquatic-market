"""
海鲜零售预订系统 - 主入口
FastAPI 应用配置和路由注册
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 导入配置
from config.database import create_db_and_tables

# 导入路由
from routes.product_routes import router as product_router
from routes.order_routes import router as order_router
from routes.merchant_routes import router as merchant_router
from routes.category_routes import router as category_router
from routes.admin_routes import router as admin_router  # 路径别名：/api/admin/*

# 创建 FastAPI 应用
app = FastAPI(
    title="海鲜零售预订系统",
    description="提供商品查询、价格查询、预订下单、订单管理等功能"
)

# 配置 CORS 中间件 - 安全修复（Critical #4）
environment = os.getenv("ENVIRONMENT", "development")

if environment == "production":
    # 生产环境：严格 CORS 配置
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
    allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]
    
    if not allowed_origins:
        # 如果未配置 ALLOWED_ORIGINS，使用默认安全配置
        import warnings
        warnings.warn(
            "生产环境未配置 ALLOWED_ORIGINS，CORS 将拒绝所有跨域请求。"
            "请设置环境变量 ALLOWED_ORIGINS=https://your-domain.com",
            UserWarning
        )
        allowed_origins = []
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
    )
else:
    # 开发环境：宽松 CORS 配置（仅限本地开发端口）
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

# 启动时创建数据库表
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# 注册路由
app.include_router(product_router)
app.include_router(order_router)
app.include_router(merchant_router)
app.include_router(category_router)
app.include_router(admin_router)  # 注册 /api/admin/* 路径别名


# ============== 根路径 ==============

@app.get("/")
def read_root():
    return {"message": "海鲜零售预订系统 API"}
