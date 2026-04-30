"""
用户端手机号+密码登录测试
TASK-2026-04-29-002

测试场景：
- 正向：正确手机号+密码登录成功，返回JWT Token
- 边界：空手机号/空密码
- 异常：密码错误、手机号不存在、账号被禁用
- 集成：登录后的token可用于/auth/me
- 保留端点：/auth/register 仍然可用
"""
import pytest
import sys
import os
from pathlib import Path
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine, select
from sqlalchemy.pool import StaticPool

# 添加 backend 路径
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from shared.models import User, hash_password
from shared.database import get_session


# ============== 测试数据库引擎 ==============

TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)


def get_test_session():
    """测试会话工厂"""
    SQLModel.metadata.create_all(TEST_ENGINE)
    with Session(TEST_ENGINE) as session:
        yield session


# ============== 导入 customer app（必须在 get_test_session 定义后） ==============

# 将 services/customer 也加入 path（customer main.py 内部需要）
services_path = backend_path / "services" / "customer"
sys.path.insert(0, str(services_path))

from services.customer.main import app

# 覆盖依赖
app.dependency_overrides[get_session] = get_test_session


# ============== Fixtures ==============

@pytest.fixture(autouse=True)
def setup_db():
    """每个测试前创建表，测试后清理"""
    SQLModel.metadata.create_all(TEST_ENGINE)
    yield
    SQLModel.metadata.drop_all(TEST_ENGINE)


@pytest.fixture
def client():
    """测试客户端"""
    return TestClient(app)


@pytest.fixture
def session():
    """测试数据库会话"""
    with Session(TEST_ENGINE) as session:
        yield session


@pytest.fixture
def active_user(session):
    """创建已激活、有密码的用户"""
    password_hash = hash_password("test123456")
    user = User(
        phone="13800138000",
        password_hash=password_hash,
        nickname="测试用户",
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def disabled_user(session):
    """创建已禁用的用户"""
    password_hash = hash_password("test123456")
    user = User(
        phone="13900139000",
        password_hash=password_hash,
        nickname="禁用用户",
        is_active=False,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# ============== 测试类 ==============

class TestPasswordLogin:
    """密码登录核心测试"""

    def test_login_success(self, client, active_user):
        """正向：正确手机号+密码登录成功"""
        response = client.post("/api/customer/auth/login", json={
            "phone": "13800138000",
            "password": "test123456"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user_id"] == active_user.id
        assert data["phone"] == "13800138000"
        assert data["nickname"] == "测试用户"
        assert len(data["token"]) > 20  # JWT token 应足够长

    def test_login_success_returns_all_fields(self, client, active_user):
        """正向：登录响应包含所有必需字段"""
        response = client.post("/api/customer/auth/login", json={
            "phone": "13800138000",
            "password": "test123456"
        })
        
        data = response.json()
        expected_fields = {"token", "user_id", "phone", "nickname", "avatar_url", "default_merchant_id"}
        assert expected_fields.issubset(set(data.keys()))

    def test_login_wrong_password(self, client, active_user):
        """异常：密码错误返回 401"""
        response = client.post("/api/customer/auth/login", json={
            "phone": "13800138000",
            "password": "wrong_password"
        })
        
        assert response.status_code == 401
        assert "手机号或密码错误" in response.json()["detail"]

    def test_login_nonexistent_phone(self, client):
        """异常：不存在的手机号返回 401"""
        response = client.post("/api/customer/auth/login", json={
            "phone": "19900199000",
            "password": "test123456"
        })
        
        assert response.status_code == 401
        assert "手机号或密码错误" in response.json()["detail"]

    def test_login_disabled_user(self, client, disabled_user):
        """异常：账号被禁用返回 403"""
        response = client.post("/api/customer/auth/login", json={
            "phone": "13900139000",
            "password": "test123456"
        })
        
        assert response.status_code == 403
        assert "账号已被禁用" in response.json()["detail"]

    def test_login_empty_phone(self, client):
        """边界：空手机号"""
        response = client.post("/api/customer/auth/login", json={
            "phone": "",
            "password": "test123456"
        })
        
        # FastAPI 验证：空字符串不满足 max_length 约束？不，空字符串不违反 max_length
        # 但实际会查数据库，找不到用户返回 401
        assert response.status_code == 401

    def test_login_empty_password(self, client, active_user):
        """边界：空密码"""
        response = client.post("/api/customer/auth/login", json={
            "phone": "13800138000",
            "password": ""
        })
        
        # min_length=6，FastAPI Pydantic 验证应返回 422
        assert response.status_code == 422

    def test_login_short_password(self, client, active_user):
        """边界：密码太短"""
        response = client.post("/api/customer/auth/login", json={
            "phone": "13800138000",
            "password": "12345"
        })
        
        # 不足 6 位，Pydantic 验证返回 422
        assert response.status_code == 422

    def test_login_missing_phone(self, client):
        """边界：缺少 phone 字段"""
        response = client.post("/api/customer/auth/login", json={
            "password": "test123456"
        })
        
        assert response.status_code == 422

    def test_login_missing_password(self, client):
        """边界：缺少 password 字段"""
        response = client.post("/api/customer/auth/login", json={
            "phone": "13800138000"
        })
        
        assert response.status_code == 422

    def test_login_updates_last_login_at(self, client, session, active_user):
        """正向：登录后更新 last_login_at"""
        import time
        before_login = active_user.last_login_at
        
        client.post("/api/customer/auth/login", json={
            "phone": "13800138000",
            "password": "test123456"
        })
        
        # 刷新用户
        session.refresh(active_user)
        after_login = active_user.last_login_at
        
        if before_login is None:
            assert after_login is not None
        else:
            assert after_login >= before_login

    def test_login_token_works_for_me(self, client, active_user):
        """集成：登录后的 token 可用于 /auth/me"""
        login_response = client.post("/api/customer/auth/login", json={
            "phone": "13800138000",
            "password": "test123456"
        })
        token = login_response.json()["token"]
        
        me_response = client.get(
            "/api/customer/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["phone"] == "13800138000"
        assert me_data["id"] == active_user.id


class TestRegisterPreserved:
    """保留 /auth/register 端点"""

    def test_register_still_works(self, client, session):
        """正向：/auth/register 端点仍然可用"""
        response = client.post("/api/customer/auth/register", json={
            "phone": "13600136000",
            "nickname": "新用户"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["phone"] == "13600136000"

    def test_register_existing_user_returns_token(self, client, active_user):
        """正向：已存在用户调用 register 返回 token"""
        response = client.post("/api/customer/auth/register", json={
            "phone": "13800138000"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == "13800138000"
        assert data["user_id"] == active_user.id


class TestAuthMeUnchanged:
    """验证 /auth/me GET 和 PUT 不变"""

    def test_get_me_requires_auth(self, client):
        """边界：未认证访问 /auth/me 返回 401"""
        response = client.get("/api/customer/auth/me")
        assert response.status_code == 401

    def test_put_me_requires_auth(self, client):
        """边界：未认证访问 PUT /auth/me 返回 401"""
        response = client.put("/api/customer/auth/me")
        assert response.status_code == 401
