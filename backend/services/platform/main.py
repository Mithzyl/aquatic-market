"""
Platform Admin Service - 平台后台管理服务

提供平台级管理功能：
- 管理员认证与权限管理
- 商家管理（审核、查询、禁用）
- 用户管理
- 平台统计
- 审核管理

F03: 管理员账号初始化
- Platform服务启动时检查是否存在管理员账号
- 若不存在，从环境变量读取配置（ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL）
- 创建默认管理员账号（密码bcrypt加密）
- 使用数据库锁防止多实例并发初始化冲突
"""
import os
import sys
import logging
import bcrypt
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime

# 添加项目根目录到 Python 路径，以便导入共享模块
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# 添加当前服务目录到 Python 路径，以便导入路由模块
service_root = Path(__file__).parent
sys.path.insert(0, str(service_root))

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("platform_service")

# 导入共享模块
from shared.database import create_db_and_tables, engine
from shared.models import PlatformAdmin, InitLock
from shared.logging_middleware import RequestLoggingMiddleware
from sqlmodel import Session, select

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
    # 生产环境：CORS 配置
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

# 请求日志中间件
app.add_middleware(RequestLoggingMiddleware)

# ============== 启动事件 ==============

def init_admin_account():
    """
    F03: 初始化管理员账号
    
    使用数据库锁防止多实例并发初始化冲突
    """
    with Session(engine) as session:
        try:
            # 尝试获取初始化锁
            lock = session.exec(
                select(InitLock).where(InitLock.lock_name == "admin_init")
            ).first()
            
            if not lock:
                # 创建锁记录
                lock = InitLock(
                    lock_name="admin_init",
                    is_locked=False
                )
                session.add(lock)
                session.commit()
            
            # 检查是否已被锁定
            if lock.is_locked:
                logger.info("管理员账号初始化已被其他实例处理，跳过")
                return
            
            # 检查是否已有管理员账号
            existing_admin = session.exec(select(PlatformAdmin)).first()
            if existing_admin:
                logger.info("管理员账号已存在，无需初始化")
                return
            
            # 锁定初始化过程
            lock.is_locked = True
            lock.locked_at = datetime.utcnow()
            lock.locked_by = f"platform_service_{os.getenv('HOSTNAME', 'localhost')}"
            session.add(lock)
            session.commit()
            
            # 从环境变量读取配置
            admin_username = os.getenv("ADMIN_USERNAME", "admin")
            admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
            admin_email = os.getenv("ADMIN_EMAIL", "admin@platform.com")
            
            # 密码 bcrypt 加密
            password_hash = bcrypt.hashpw(
                admin_password.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
            
            # 创建默认管理员账号
            admin = PlatformAdmin(
                username=admin_username,
                password_hash=password_hash,
                email=admin_email,
                real_name="默认管理员",
                role="super_admin",
                permissions='["platform:read", "platform:write", "merchant:read", "merchant:create", "merchant:update", "merchant:delete", "admin:read", "admin:create", "admin:update", "admin:delete", "report:read", "report:export"]',
                is_active=True
            )
            session.add(admin)
            session.commit()
            
            logger.info(f"默认管理员账号已创建: username={admin_username}")
            
        except Exception as e:
            session.rollback()
            logger.error(f"管理员账号初始化失败: {str(e)}")
            raise


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
    
    # 创建数据库表
    create_db_and_tables()
    
    # F03: 初始化管理员账号
    init_admin_account()


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