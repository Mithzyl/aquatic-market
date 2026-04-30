"""
AuthService.login() 单元测试
测试 username + password + bcrypt 登录
"""
import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from shared.models import Merchant, MerchantRole, hash_password
from services.merchant_service import AuthService, reset_login_rate_limit


@pytest.fixture(scope="function")
def engine():
    """为每个测试函数创建独立的内存数据库"""
    e = create_engine("sqlite://", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(e)
    return e


@pytest.fixture(scope="function")
def session(engine):
    """创建数据库会话并初始化默认角色"""
    with Session(engine) as s:
        # 初始化默认角色
        MerchantRole.init_default_roles(s)
        yield s


@pytest.fixture(scope="function")
def seed_merchant(session):
    """创建一个活跃商家用于测试"""
    role = session.exec(
        select(MerchantRole).where(MerchantRole.code == "owner")
    ).first()
    
    merchant = Merchant(
        name="测试商家",
        phone="13800138000",
        username="testuser",
        password_hash=hash_password("test123456"),
        shop_name="测试店铺",
        role_id=role.id,
        is_active=True,
    )
    # wechat_openid 需要唯一值
    merchant.wechat_openid = "wx_test_" + str(hash("testuser") % 100000)
    session.add(merchant)
    session.commit()
    session.refresh(merchant)
    return merchant


@pytest.fixture(scope="function")
def seed_disabled_merchant(session):
    """创建一个已被禁用的商家"""
    role = session.exec(
        select(MerchantRole).where(MerchantRole.code == "owner")
    ).first()
    
    merchant = Merchant(
        name="禁用商家",
        phone="13800138001",
        username="disabled_user",
        password_hash=hash_password("test123456"),
        shop_name="禁用店铺",
        role_id=role.id,
        is_active=False,
    )
    merchant.wechat_openid = "wx_disabled_" + str(hash("disabled") % 100000)
    session.add(merchant)
    session.commit()
    session.refresh(merchant)
    return merchant


# ── 正向测试 ──

def test_login_success_returns_token_and_merchant(session, seed_merchant):
    """正确用户名密码登录成功，返回 token 和 merchant 信息"""
    service = AuthService(session)
    
    result = service.login(username="testuser", password="test123456")
    
    assert "token" in result
    assert "merchant" in result
    assert result["merchant"]["id"] == seed_merchant.id
    assert result["merchant"]["name"] == "测试商家"
    assert result["merchant"]["role"]["code"] == "owner"
    assert len(result["merchant"]["role"]["permissions"]) > 0


def test_login_success_with_client_ip(session, seed_merchant):
    """带 client_ip 的登录也正常工作"""
    reset_login_rate_limit()
    service = AuthService(session)
    
    result = service.login(
        username="testuser",
        password="test123456",
        client_ip="192.168.1.1"
    )
    
    assert "token" in result
    assert result["merchant"]["id"] == seed_merchant.id


# ── 边界测试 ──

def test_login_nonexistent_username(session, seed_merchant):
    """不存在的用户名返回统一错误"""
    service = AuthService(session)
    
    with pytest.raises(ValueError, match="用户名或密码错误"):
        service.login(username="nobody", password="whatever")


def test_login_wrong_password(session, seed_merchant):
    """密码错误返回统一错误（与用户名不存在相同消息）"""
    service = AuthService(session)
    
    with pytest.raises(ValueError, match="用户名或密码错误"):
        service.login(username="testuser", password="wrong_password")


def test_login_disabled_merchant(session, seed_disabled_merchant):
    """被禁用的商家无法登录"""
    service = AuthService(session)
    
    with pytest.raises(ValueError, match="已被禁用"):
        service.login(username="disabled_user", password="test123456")


# ── 异常测试 ──

def test_login_empty_username(session):
    """空用户名导致查询不到"""
    service = AuthService(session)
    
    with pytest.raises(ValueError, match="用户名或密码错误"):
        service.login(username="", password="anything")


def test_login_empty_password(session, seed_merchant):
    """空密码验证失败"""
    service = AuthService(session)
    
    with pytest.raises(ValueError, match="用户名或密码错误"):
        service.login(username="testuser", password="")


# ── 限流测试 ──

def test_login_rate_limit(session, seed_merchant):
    """同一IP 1分钟内超过5次被限流"""
    reset_login_rate_limit()
    service = AuthService(session)
    
    # 前5次应该成功
    for i in range(5):
        result = service.login(
            username="testuser",
            password="test123456",
            client_ip="10.0.0.1"
        )
        assert "token" in result
    
    # 第6次被限流
    with pytest.raises(ValueError, match="过于频繁"):
        service.login(
            username="testuser",
            password="test123456",
            client_ip="10.0.0.1"
        )
    
    # 不同IP不受影响
    result = service.login(
        username="testuser",
        password="test123456",
        client_ip="10.0.0.2"
    )
    assert "token" in result


def test_login_no_rate_limit_without_ip(session, seed_merchant):
    """不提供 client_ip 时不限流"""
    reset_login_rate_limit()
    service = AuthService(session)
    
    # 多次登录不受限制
    for i in range(10):
        result = service.login(username="testuser", password="test123456")
        assert "token" in result
