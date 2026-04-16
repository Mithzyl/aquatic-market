"""
数据库配置模块
统一管理数据库连接、引擎和会话
支持 RBAC：启动时初始化默认角色
"""
import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库连接 URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aquatic_market.db")


def create_engine_with_config():
    """根据数据库类型创建配置好的引擎"""
    if DATABASE_URL.startswith("mysql"):
        # MySQL 配置
        return create_engine(
            DATABASE_URL,
            pool_pre_ping=True,  # 自动检测连接是否有效
            pool_recycle=3600,   # 每小时回收连接
            echo=False,          # 生产环境关闭SQL日志
            connect_args={"charset": "utf8mb4"}
        )
    else:
        # SQLite 配置
        return create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )


# 创建引擎实例
engine = create_engine_with_config()


def create_db_and_tables():
    """创建所有数据库表并初始化默认角色"""
    SQLModel.metadata.create_all(engine)
    
    # 初始化默认角色（RBAC）
    from shared.models import MerchantRole
    with Session(engine) as session:
        MerchantRole.init_default_roles(session)


def get_session():
    """获取数据库会话的依赖项"""
    with Session(engine) as session:
        yield session
