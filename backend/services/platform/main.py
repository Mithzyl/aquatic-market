"""
Platform Admin Service - 平台后台管理服务

提供平台级管理功能：
- 管理员认证与权限管理
- 商家管理（审核、查询、禁用）
- 用户管理
- 平台统计
- 审核管理
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
from shared.models import PlatformAdmin

# 导入路由（从当前服务目录）
from routes.auth import router as auth_router
from routes.merchants import router as merchants_router
from routes.users import router as users_router
from routes.statistics import router as statistics_router
from routes.audit import router as audit_router

# 创建 FastAPI 应用
app = FastAPI(
    title="平台后台管理服务",
    description="""
平台后台管理 API 服务

## 功能模块
- **认证管理**：管理员登录、Token 验证、权限管理
- **商家管理**：商家审核、查询、禁用、统计
- **用户管理**：用户查询、管理
- **统计分析**：平台级数据统计
- **审核管理**：商家入驻审核、资质审核

## 认证方式
使用 JWT Bearer Token 认证，在请求头中添加：
```
Authorization: Bearer <token>
```
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
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:8003",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ============== 启动事件 ==============

@app.on_event("startup")
def on_startup():
    """应用启动时初始化数据库表"""
    create_db_and_tables()
    # TODO: 初始化默认超级管理员账号


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
        "service": "platform"
    }


@app.get("/", tags=["系统"])
def read_root():
    """根路径"""
    return {
        "message": "平台后台管理服务",
        "docs": "/docs",
        "version": "1.0.0"
    }


# ============== 注册路由 ==============

app.include_router(auth_router, prefix="/api/platform", tags=["认证管理"])
app.include_router(merchants_router, prefix="/api/platform", tags=["商家管理"])
app.include_router(users_router, prefix="/api/platform", tags=["用户管理"])
app.include_router(statistics_router, prefix="/api/platform", tags=["统计分析"])
app.include_router(audit_router, prefix="/api/platform", tags=["审核管理"])


# ============== 主程序入口 ==============

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PLATFORM_SERVICE_PORT", 8003))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )