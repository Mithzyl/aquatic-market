"""
Merchant Service - 商家端独立服务

提供商家端所有功能：
- 商家认证与登录
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

# 添加项目根目录到 Python 路径，以便导入共享模块
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# 添加当前服务目录到 Python 路径，以便导入路由模块
service_root = Path(__file__).parent
sys.path.insert(0, str(service_root))

# 加载环境变量
load_dotenv()

# 导入共享模块
from shared.database import create_db_and_tables

# 导入路由（从当前服务目录）
from routes import router as merchant_router, admin_router, carousel_router

# 导入共享上传路由
from shared.upload_routes import router as upload_router

# 创建 FastAPI 应用
app = FastAPI(
    title="商家端服务",
    description="""
商家端 API 服务

## 功能模块
- **认证管理**：商家登录、Token 验证、权限管理
- **商品管理**：商品创建、更新、删除、上下架
- **品类管理**：品类查询
- **订单管理**：订单查询、状态更新
- **收益统计**：今日/本周/本月收益统计
- **商家信息**：商家信息查询与更新

## 认证方式
使用 JWT Bearer Token 认证，在请求头中添加：
```
Authorization: Bearer <token>
```

## 路径别名
本服务同时支持 `/api/merchant/*` 和 `/api/admin/*` 路径，功能完全相同。
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置 CORS 中间件
environment = os.getenv("ENVIRONMENT", "development")

if environment == "production":
    # 生产环境：严格 CORS 配置
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
    allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]
    
    if not allowed_origins:
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
    # 开发环境：宽松 CORS 配置
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:5177",
            "http://localhost:8001",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ============== 启动事件 ==============

@app.on_event("startup")
def on_startup():
    """应用启动时初始化数据库表并校验必要环境变量"""
    # 生产环境必须设置 JWT_SECRET，否则拒绝启动
    jwt_secret = os.getenv("JWT_SECRET")
    environment = os.getenv("ENVIRONMENT", "development")
    if environment == "production" and not jwt_secret:
        raise RuntimeError(
            "JWT_SECRET 环境变量未设置！生产环境必须配置 JWT_SECRET，服务拒绝启动。"
            "请在 .env 文件或环境变量中设置 JWT_SECRET。"
        )
    create_db_and_tables()


# ============== 健康检查 ==============

@app.get("/health", tags=["系统"])
def health_check():
    """
    健康检查接口
    
    Returns:
        dict: 服务健康状态
    """
    return {
        "status": "healthy",
        "service": "merchant"
    }


@app.get("/", tags=["系统"])
def read_root():
    """根路径"""
    return {
        "message": "商家端服务",
        "docs": "/docs",
        "version": "1.0.0"
    }


# ============== 注册路由 ==============

app.include_router(merchant_router)
app.include_router(admin_router)
app.include_router(carousel_router)
app.include_router(upload_router)


# ============== 主程序入口 ==============

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("MERCHANT_SERVICE_PORT", 8001))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )