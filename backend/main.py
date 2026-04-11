"""
海鲜零售预订系统 - 主入口
FastAPI 应用配置和路由注册
"""
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

# 创建 FastAPI 应用
app = FastAPI(
    title="海鲜零售预订系统",
    description="提供商品查询、价格查询、预订下单、订单管理等功能"
)

# 配置 CORS 中间件
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


# ============== 根路径 ==============

@app.get("/")
def read_root():
    return {"message": "海鲜零售预订系统 API"}
