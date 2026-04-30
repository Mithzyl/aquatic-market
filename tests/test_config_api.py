"""
Test Config API - 配置 API 测试

测试商家配置相关的 API 端点：
- GET /api/customer/config - 用户端获取配置
- GET /api/admin/config - 商家端获取配置
- PUT /api/admin/config - 商家端更新配置
"""
import pytest
import sys
import os
from pathlib import Path
from datetime import datetime
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine, select

# 添加项目路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
backend_path = project_root / "backend"
sys.path.insert(0, str(backend_path))

# 设置测试环境变量
os.environ["ENVIRONMENT"] = "test"
os.environ["JWT_SECRET"] = "test_secret_key_for_testing"

# 导入模型和应用
from shared.models import Merchant, MerchantConfig, MerchantRole
from shared.auth import create_jwt_token


# ============== 测试数据库设置 ==============

# 使用内存数据库进行测试
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})


def create_test_db():
    """创建测试数据库表"""
    SQLModel.metadata.create_all(test_engine)


def get_test_session():
    """获取测试数据库会话"""
    with Session(test_engine) as session:
        yield session


# ============== 测试 Fixtures ==============

@pytest.fixture(autouse=True)
def setup_db():
    """每个测试前设置数据库"""
    create_test_db()
    yield
    # 清理：删除所有表
    SQLModel.metadata.drop_all(test_engine)


@pytest.fixture
def session():
    """获取数据库会话"""
    with Session(test_engine) as session:
        yield session


@pytest.fixture
def test_merchant(session):
    """创建测试商家"""
    merchant = Merchant(
        id=1,
        name="测试商家",
        phone="13800138000",
        wechat_openid="test_openid_001",
        shop_name="测试海鲜店"
    )
    session.add(merchant)
    session.commit()
    session.refresh(merchant)
    return merchant


@pytest.fixture
def test_merchant_config(session, test_merchant):
    """创建测试商家配置"""
    config = MerchantConfig(
        merchant_id=test_merchant.id,
        shop_name="测试海鲜店",
        shop_logo="https://example.com/logo.png",
        contact_phone="13800138000",
        contact_wechat="test_wechat",
        address="测试地址123号",
        business_hours="08:00-20:00",
        announcement="欢迎光临！",
        theme_color="#1890ff",
        enable_ordering=True,
        enable_pickup=True,
        min_order_amount=10.0
    )
    session.add(config)
    session.commit()
    session.refresh(config)
    return config


@pytest.fixture
def auth_token(test_merchant):
    """生成认证 Token"""
    return create_jwt_token({"merchant_id": test_merchant.id, "openid": test_merchant.wechat_openid})


@pytest.fixture
def customer_app():
    """创建用户端测试应用"""
    from services.customer.main import app
    # 覆盖数据库依赖
    from config.dependencies import get_session as original_get_session
    app.dependency_overrides[original_get_session] = get_test_session
    # 同时覆盖 shared.database 的 get_session
    from shared.database import get_session as shared_get_session
    app.dependency_overrides[shared_get_session] = get_test_session
    return app


@pytest.fixture
def admin_app():
    """创建管理端测试应用"""
    from main import app
    # 覆盖数据库依赖
    from config.database import get_session as admin_get_session
    app.dependency_overrides[admin_get_session] = get_test_session
    return app


# ============== 用户端配置 API 测试 ==============

class TestCustomerConfigAPI:
    """用户端配置 API 测试类"""

    def test_get_config_success(self, customer_app, test_merchant_config):
        """测试成功获取配置"""
        client = TestClient(customer_app)
        response = client.get("/api/customer/config?merchant_id=1")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["merchant_id"] == 1
        assert data["shop_name"] == "测试海鲜店"
        assert data["shop_logo"] == "https://example.com/logo.png"
        assert data["contact_phone"] == "13800138000"
        assert data["business_hours"] == "08:00-20:00"
        assert data["announcement"] == "欢迎光临！"
        assert data["theme_color"] == "#1890ff"
        assert data["enable_ordering"] == True
        assert data["enable_pickup"] == True
        assert data["min_order_amount"] == 10.0

    def test_get_config_default_merchant(self, customer_app, test_merchant, session):
        """测试不传 merchant_id 时使用默认商家"""
        client = TestClient(customer_app)
        response = client.get("/api/customer/config")
        
        assert response.status_code == 200
        data = response.json()
        
        # 应返回默认商家（ID=1）的配置
        assert data["merchant_id"] == 1

    def test_get_config_auto_create(self, customer_app, test_merchant, session):
        """测试配置不存在时自动创建默认配置"""
        client = TestClient(customer_app)
        response = client.get("/api/customer/config?merchant_id=1")
        
        assert response.status_code == 200
        data = response.json()
        
        # 验证默认配置值
        assert data["merchant_id"] == 1
        assert data["business_hours"] == "08:00-20:00"
        assert data["announcement"] == "欢迎光临！"
        assert data["theme_color"] == "#1890ff"
        assert data["enable_ordering"] == True
        assert data["enable_pickup"] == True
        assert data["min_order_amount"] == 0

    def test_get_config_merchant_not_found(self, customer_app, session):
        """测试商家不存在时返回404"""
        client = TestClient(customer_app)
        response = client.get("/api/customer/config?merchant_id=999")
        
        assert response.status_code == 404
        assert "商家不存在" in response.json()["detail"]


# ============== 商家端配置管理 API 测试 ==============

class TestAdminConfigAPI:
    """商家端配置管理 API 测试类"""

    def test_get_config_success(self, admin_app, test_merchant_config, auth_token):
        """测试商家端成功获取配置"""
        client = TestClient(admin_app)
        response = client.get(
            "/api/admin/config",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["merchant_id"] == 1
        assert data["shop_name"] == "测试海鲜店"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_get_config_auto_create(self, admin_app, test_merchant, session, auth_token):
        """测试商家端配置不存在时自动创建"""
        client = TestClient(admin_app)
        response = client.get(
            "/api/admin/config",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # 验证自动创建的默认配置
        assert data["merchant_id"] == 1
        assert data["business_hours"] == "08:00-20:00"
        assert data["theme_color"] == "#1890ff"

    def test_update_config_success(self, admin_app, test_merchant_config, auth_token):
        """测试成功更新配置"""
        client = TestClient(admin_app)
        
        update_data = {
            "shop_name": "新店铺名称",
            "contact_phone": "13900139000",
            "announcement": "新公告内容",
            "min_order_amount": 20.0
        }
        
        response = client.put(
            "/api/admin/config",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["shop_name"] == "新店铺名称"
        assert data["contact_phone"] == "13900139000"
        assert data["announcement"] == "新公告内容"
        assert data["min_order_amount"] == 20.0
        # 未更新的字段保持不变
        assert data["business_hours"] == "08:00-20:00"
        assert data["theme_color"] == "#1890ff"

    def test_update_config_partial(self, admin_app, test_merchant_config, auth_token):
        """测试部分更新配置"""
        client = TestClient(admin_app)
        
        update_data = {
            "enable_ordering": False
        }
        
        response = client.put(
            "/api/admin/config",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["enable_ordering"] == False
        # 其他字段保持不变
        assert data["shop_name"] == "测试海鲜店"
        assert data["enable_pickup"] == True

    def test_update_config_auto_create(self, admin_app, test_merchant, session, auth_token):
        """测试更新配置时自动创建"""
        client = TestClient(admin_app)
        
        update_data = {
            "shop_name": "我的店铺"
        }
        
        response = client.put(
            "/api/admin/config",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["shop_name"] == "我的店铺"
        assert data["merchant_id"] == 1

    def test_get_config_without_auth(self, admin_app, test_merchant_config):
        """测试无认证时获取配置返回401"""
        client = TestClient(admin_app)
        response = client.get("/api/admin/config")
        
        assert response.status_code == 401

    def test_update_config_without_auth(self, admin_app, test_merchant_config):
        """测试无认证时更新配置返回401"""
        client = TestClient(admin_app)
        response = client.put(
            "/api/admin/config",
            json={"shop_name": "测试"}
        )
        
        assert response.status_code == 401


# ============== MerchantConfig 模型测试 ==============

class TestMerchantConfigModel:
    """MerchantConfig 模型测试类"""

    def test_get_default_config(self):
        """测试获取默认配置"""
        config = MerchantConfig.get_default_config(1)
        
        assert config.merchant_id == 1
        assert config.shop_name == ""
        assert config.business_hours == "08:00-20:00"
        assert config.announcement == "欢迎光临！"
        assert config.theme_color == "#1890ff"
        assert config.enable_ordering == True
        assert config.enable_pickup == True
        assert config.min_order_amount == 0

    def test_config_persistence(self, session, test_merchant):
        """测试配置持久化"""
        config = MerchantConfig(
            merchant_id=test_merchant.id,
            shop_name="持久化测试店铺",
            contact_phone="13800138001"
        )
        session.add(config)
        session.commit()
        
        # 查询验证
        saved_config = session.exec(
            select(MerchantConfig).where(MerchantConfig.merchant_id == test_merchant.id)
        ).first()
        
        assert saved_config is not None
        assert saved_config.shop_name == "持久化测试店铺"
        assert saved_config.contact_phone == "13800138001"

    def test_config_unique_merchant_id(self, session, test_merchant):
        """测试 merchant_id 唯一约束"""
        config1 = MerchantConfig(merchant_id=test_merchant.id, shop_name="店铺1")
        session.add(config1)
        session.commit()
        
        # 尝试创建第二个配置（应该失败）
        config2 = MerchantConfig(merchant_id=test_merchant.id, shop_name="店铺2")
        session.add(config2)
        
        with pytest.raises(Exception):  # 应抛出唯一约束异常
            session.commit()


# ============== 运行测试 ==============

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])