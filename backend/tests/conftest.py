"""
Test Configuration - Pytest fixtures for backend tests
"""
import os
import sys
import pytest
from pathlib import Path

# 确保 backend 目录在 Python 路径中
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# ---- 关键：在导入任何应用代码之前，覆盖数据库为 SQLite ----
# 必须设置在 load_dotenv() 可读取的环境变量中
# 数据库文件放在 tests 目录下
test_db_path = backend_dir / "tests" / "test_aquatic_market.db"
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
os.environ.setdefault("ENVIRONMENT", "development")


@pytest.fixture(scope="session")
def merchant_token() -> str:
    """生成一个测试用的商家 JWT Token"""
    from shared.auth import create_access_token
    return create_access_token(
        merchant_id=1,
        role_code="owner",
        permissions=["product:read", "product:create", "product:update", "product:delete"]
    )


@pytest.fixture(scope="session")
def merchant_token_2() -> str:
    """生成商家2的 JWT Token"""
    from shared.auth import create_access_token
    return create_access_token(merchant_id=2, role_code="owner")


@pytest.fixture
def auth_headers(merchant_token) -> dict:
    """返回带有 JWT Token 的认证请求头"""
    return {"Authorization": f"Bearer {merchant_token}"}


@pytest.fixture
def auth_headers_2(merchant_token_2) -> dict:
    """返回商家2的认证请求头"""
    return {"Authorization": f"Bearer {merchant_token_2}"}


@pytest.fixture(scope="session")
def _setup_database():
    """会话级别的数据库初始化（在 client 之前执行）"""
    # 删除旧的测试数据库
    if test_db_path.exists():
        test_db_path.unlink()
    # 创建新的数据库表
    from shared.database import create_db_and_tables
    create_db_and_tables()
    yield
    # 清理测试数据库
    if test_db_path.exists():
        test_db_path.unlink()


@pytest.fixture(scope="function")
def client(_setup_database):
    """FastAPI TestClient"""
    from fastapi.testclient import TestClient
    from main import app
    with TestClient(app) as c:
        yield c
