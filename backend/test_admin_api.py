"""
商家端 API 测试
测试商家登录、商品管理、品类管理、收益统计、商家信息等 API

安全修复说明：
- Critical #1: 微信授权登录需要 WECHAT_DEMO_MODE=true
- Critical #2: 自动创建商家需要 AUTO_CREATE_MERCHANT=true
- Critical #3: 登录限流已启用
- #7: 订单状态流转规则已启用
"""
import pytest
import os
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from fastapi import FastAPI
from sqlmodel import SQLModel, create_engine, Session, select

# 设置测试环境变量（使用 JWT_SECRET）
os.environ["JWT_SECRET"] = "test-secret-key-for-jwt-testing-min-32-chars"

# 安全修复：设置演示模式环境变量
os.environ["WECHAT_DEMO_MODE"] = "true"
os.environ["AUTO_CREATE_MERCHANT"] = "true"
os.environ["VERIFY_CODE_DEMO_MODE"] = "true"
os.environ["DEMO_VERIFY_CODE"] = "123456"

# 导入模块
from models import Merchant, Product, Order, OrderItem, Category
from auth import create_access_token
from routes.merchant_routes import router as merchant_router, get_session as merchant_get_session

# 创建独立的测试应用
test_app = FastAPI(title="商家端测试")
test_app.include_router(merchant_router)

# 创建测试数据库引擎
TEST_DATABASE_URL = "sqlite:///./test_admin_api.db"
test_engine = create_engine(TEST_DATABASE_URL, echo=False)


def get_test_session():
    """获取测试数据库会话"""
    with Session(test_engine) as session:
        yield session


# 覆盖依赖
test_app.dependency_overrides[merchant_get_session] = get_test_session


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """模块级别设置：创建数据库表"""
    SQLModel.metadata.create_all(test_engine)
    yield
    # 清理：删除测试数据库
    test_app.dependency_overrides.clear()
    if os.path.exists("./test_admin_api.db"):
        os.remove("./test_admin_api.db")


@pytest.fixture
def clean_session():
    """每个测试前清理数据库"""
    # 重置登录限流器
    from services.merchant_service import reset_login_rate_limit
    reset_login_rate_limit()
    
    with Session(test_engine) as session:
        # 删除所有数据
        for item in session.exec(select(OrderItem)).all():
            session.delete(item)
        for order in session.exec(select(Order)).all():
            session.delete(order)
        for product in session.exec(select(Product)).all():
            session.delete(product)
        for category in session.exec(select(Category)).all():
            session.delete(category)
        for merchant in session.exec(select(Merchant)).all():
            session.delete(merchant)
        session.commit()
    yield


@pytest.fixture
def client(clean_session):
    """创建测试客户端"""
    with TestClient(test_app) as c:
        yield c


@pytest.fixture
def test_merchant(client):
    """创建测试商家 - 通过API创建"""
    response = client.post("/api/merchant/login", json={"code": "test_merchant_code_001"})
    data = response.json()
    return {
        "id": data["merchant"]["id"],
        "token": data["token"],
        "name": data["merchant"]["name"],
        "phone": data["merchant"]["phone"],
        "shop_name": data["merchant"]["shop_name"]
    }


@pytest.fixture
def other_merchant(client):
    """创建另一个商家（用于测试数据隔离）"""
    response = client.post("/api/merchant/login", json={"code": "test_merchant_code_002"})
    data = response.json()
    return {
        "id": data["merchant"]["id"],
        "token": data["token"],
        "name": data["merchant"]["name"],
        "phone": data["merchant"]["phone"],
        "shop_name": data["merchant"]["shop_name"]
    }


@pytest.fixture
def auth_header(test_merchant):
    """创建认证头"""
    return {"Authorization": f"Bearer {test_merchant['token']}"}


@pytest.fixture
def other_auth_header(other_merchant):
    """创建另一个商家的认证头"""
    return {"Authorization": f"Bearer {other_merchant['token']}"}


@pytest.fixture
def test_product(client, auth_header):
    """创建测试商品 - 通过API创建"""
    product_data = {
        "name": "测试商品",
        "description": "测试商品描述",
        "price": 99.99,
        "image_url": "http://example.com/image.jpg",
        "category": "海鲜",
        "stock": 100
    }
    response = client.post("/api/merchant/products", json=product_data, headers=auth_header)
    return response.json()


# ============== 认证相关测试 ==============

class TestAdminLogin:
    """商家登录测试"""
    
    def test_login_with_code_success(self, client):
        """测试微信授权登录成功"""
        response = client.post("/api/merchant/login", json={"code": "wx_test_code_001"})
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "merchant" in data
    
    def test_login_with_code_create_new_merchant(self, client):
        """测试微信授权登录自动创建新商家"""
        response = client.post("/api/merchant/login", json={"code": "new_wx_code_123"})
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "merchant" in data
        assert data["merchant"]["name"] == "新商家"
    
    def test_login_with_existing_code(self, client):
        """测试使用已存在的code登录"""
        # 第一次登录创建商家
        response1 = client.post("/api/merchant/login", json={"code": "existing_code_001"})
        assert response1.status_code == 200
        merchant1_id = response1.json()["merchant"]["id"]
        
        # 第二次登录应该返回同一个商家
        response2 = client.post("/api/merchant/login", json={"code": "existing_code_001"})
        assert response2.status_code == 200
        merchant2_id = response2.json()["merchant"]["id"]
        
        # 应该是同一个商家
        assert merchant1_id == merchant2_id
    
    def test_login_with_phone_success(self, client):
        """测试手机号验证码登录 - 演示模式下返回 200"""
        # 安全修复：VERIFY_CODE_DEMO_MODE=true 时允许演示登录
        # 演示模式下使用正确的验证码可以登录成功
        response = client.post("/api/merchant/login", json={
            "phone": "13800138888",
            "verify_code": "123456"  # DEMO_VERIFY_CODE
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "merchant" in data
    
    def test_login_with_phone_create_new_merchant(self, client):
        """测试手机号验证码登录自动创建新商家 - 演示模式"""
        # 安全修复：AUTO_CREATE_MERCHANT=true 时允许自动创建
        response = client.post("/api/merchant/login", json={
            "phone": "13800139999",
            "verify_code": "123456"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "merchant" in data
        assert data["merchant"]["name"] == "新商家"
    
    def test_login_with_invalid_verify_code(self, client):
        """测试错误的验证码 - 演示模式下返回 400"""
        # 演示模式下验证码错误会返回 400
        response = client.post("/api/merchant/login", json={
            "phone": "13800137777",
            "verify_code": "000000"  # 错误验证码
        })
        
        assert response.status_code == 400
        assert "验证码错误" in response.json()["detail"]
    
    def test_login_without_credentials(self, client):
        """测试缺少登录凭证"""
        response = client.post("/api/merchant/login", json={})
        
        assert response.status_code == 400
        assert "请提供登录凭证" in response.json()["detail"]


# ============== 商品管理测试 ==============

class TestProductManagement:
    """商品管理测试"""
    
    def test_get_products_success(self, client, auth_header, test_product):
        """测试获取商品列表成功"""
        response = client.get("/api/merchant/products", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_get_products_empty(self, client, auth_header):
        """测试获取空商品列表"""
        response = client.get("/api/merchant/products", headers=auth_header)
        
        assert response.status_code == 200
        # 新商家没有商品
        assert response.json() == []
    
    def test_get_products_unauthorized(self, client):
        """测试未认证获取商品列表"""
        response = client.get("/api/merchant/products")
        
        assert response.status_code == 403 or response.status_code == 401
    
    def test_create_product_success(self, client, auth_header):
        """测试创建商品成功"""
        product_data = {
            "name": "新商品",
            "description": "新商品描述",
            "price": 88.88,
            "image_url": "http://example.com/new.jpg",
            "category": "鱼类",
            "stock": 50
        }
        
        response = client.post("/api/merchant/products", json=product_data, headers=auth_header)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "新商品"
        assert data["price"] == 88.88
        assert data["stock"] == 50
        assert data["is_active"] == True
    
    def test_create_product_with_minimal_data(self, client, auth_header):
        """测试创建商品（最小数据）"""
        product_data = {
            "name": "最小商品",
            "price": 10.0
        }
        
        response = client.post("/api/merchant/products", json=product_data, headers=auth_header)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "最小商品"
        assert data["price"] == 10.0
        assert data["description"] == ""
        assert data["stock"] == 0
    
    def test_create_product_invalid_price(self, client, auth_header):
        """测试创建商品价格无效"""
        product_data = {
            "name": "无效商品",
            "price": -10.0
        }
        
        response = client.post("/api/merchant/products", json=product_data, headers=auth_header)
        
        assert response.status_code == 422  # Validation error
    
    def test_create_product_zero_price(self, client, auth_header):
        """测试创建商品价格为0"""
        product_data = {
            "name": "零价格商品",
            "price": 0
        }
        
        response = client.post("/api/merchant/products", json=product_data, headers=auth_header)
        
        assert response.status_code == 422  # Validation error (price > 0)
    
    def test_update_product_success(self, client, auth_header, test_product):
        """测试更新商品成功"""
        update_data = {
            "name": "更新商品",
            "price": 199.99
        }
        
        response = client.put(
            f"/api/merchant/products/{test_product['id']}",
            json=update_data,
            headers=auth_header
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "更新商品"
        assert data["price"] == 199.99
    
    def test_update_product_not_found(self, client, auth_header):
        """测试更新不存在的商品"""
        update_data = {"name": "不存在"}
        
        response = client.put(
            "/api/merchant/products/99999",
            json=update_data,
            headers=auth_header
        )
        
        assert response.status_code == 404
        assert "商品不存在" in response.json()["detail"]
    
    def test_update_product_other_merchant(self, client, other_auth_header, test_product):
        """测试更新其他商家的商品（数据隔离）"""
        update_data = {"name": "尝试修改"}
        
        response = client.put(
            f"/api/merchant/products/{test_product['id']}",
            json=update_data,
            headers=other_auth_header
        )
        
        assert response.status_code == 404  # 不应该找到其他商家的商品
    
    def test_delete_product_success(self, client, auth_header):
        """测试删除商品成功"""
        # 先创建一个商品
        product_data = {"name": "待删除商品", "price": 10.0}
        create_response = client.post("/api/merchant/products", json=product_data, headers=auth_header)
        product_id = create_response.json()["id"]
        
        # 删除商品
        response = client.delete(
            f"/api/merchant/products/{product_id}",
            headers=auth_header
        )
        
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # 验证已删除
        get_response = client.get("/api/merchant/products", headers=auth_header)
        products = get_response.json()
        assert all(p["id"] != product_id for p in products)
    
    def test_delete_product_not_found(self, client, auth_header):
        """测试删除不存在的商品"""
        response = client.delete("/api/merchant/products/99999", headers=auth_header)
        
        assert response.status_code == 404
    
    def test_delete_product_other_merchant(self, client, other_auth_header, test_product):
        """测试删除其他商家的商品（数据隔离）"""
        response = client.delete(
            f"/api/merchant/products/{test_product['id']}",
            headers=other_auth_header
        )
        
        assert response.status_code == 404
    
    def test_update_product_status_activate(self, client, auth_header):
        """测试上架商品"""
        # 创建一个商品
        product_data = {"name": "下架商品", "price": 10.0, "stock": 1}
        create_response = client.post("/api/merchant/products", json=product_data, headers=auth_header)
        product_id = create_response.json()["id"]
        
        # 先下架
        client.patch(
            f"/api/merchant/products/{product_id}/status",
            json={"is_active": False},
            headers=auth_header
        )
        
        # 再上架
        response = client.patch(
            f"/api/merchant/products/{product_id}/status",
            json={"is_active": True},
            headers=auth_header
        )
        
        assert response.status_code == 200
        assert response.json()["is_active"] == True
    
    def test_update_product_status_deactivate(self, client, auth_header, test_product):
        """测试下架商品"""
        response = client.patch(
            f"/api/merchant/products/{test_product['id']}/status",
            json={"is_active": False},
            headers=auth_header
        )
        
        assert response.status_code == 200
        assert response.json()["is_active"] == False
    
    def test_update_product_status_not_found(self, client, auth_header):
        """测试更新不存在商品的状态"""
        response = client.patch(
            "/api/merchant/products/99999/status",
            json={"is_active": False},
            headers=auth_header
        )
        
        assert response.status_code == 404


# ============== 品类管理测试 ==============

class TestCategoryManagement:
    """品类管理测试"""
    
    def test_get_categories_success(self, client, auth_header):
        """测试获取品类列表成功"""
        response = client.get("/api/merchant/categories", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_categories_empty(self, client, auth_header):
        """测试获取空品类列表"""
        response = client.get("/api/merchant/categories", headers=auth_header)
        
        assert response.status_code == 200
        # 新商家没有品类
        assert response.json() == []
    
    def test_get_categories_unauthorized(self, client):
        """测试未认证获取品类列表"""
        response = client.get("/api/merchant/categories")
        
        assert response.status_code == 403 or response.status_code == 401
    
    def test_categories_data_isolation(self, client, auth_header, other_auth_header):
        """测试品类数据隔离"""
        # 商家1获取品类
        response1 = client.get("/api/merchant/categories", headers=auth_header)
        assert response1.status_code == 200
        
        # 商家2获取品类
        response2 = client.get("/api/merchant/categories", headers=other_auth_header)
        assert response2.status_code == 200


# ============== 收益统计测试 ==============

class TestRevenueStats:
    """收益统计测试"""
    
    def test_get_revenue_stats_success(self, client, auth_header):
        """测试获取收益统计成功"""
        response = client.get("/api/merchant/revenue/stats", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert "today" in data
        assert "week" in data
        assert "month" in data
        assert "amount" in data["today"]
        assert "order_count" in data["today"]
        assert "growth" in data["today"]
    
    def test_get_revenue_stats_empty(self, client, auth_header):
        """测试无订单时的收益统计"""
        response = client.get("/api/merchant/revenue/stats", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        # 新商家没有订单，金额应为0
        assert data["today"]["amount"] == 0
        assert data["today"]["order_count"] == 0
    
    def test_get_revenue_stats_unauthorized(self, client):
        """测试未认证获取收益统计"""
        response = client.get("/api/merchant/revenue/stats")
        
        assert response.status_code == 403 or response.status_code == 401
    
    def test_get_orders_success(self, client, auth_header):
        """测试获取订单列表成功"""
        response = client.get("/api/merchant/orders", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert isinstance(data["orders"], list)
    
    def test_get_orders_empty(self, client, auth_header):
        """测试获取空订单列表"""
        response = client.get("/api/merchant/orders", headers=auth_header)
        
        assert response.status_code == 200
        # 新商家没有订单
        assert response.json()["orders"] == []
    
    def test_get_orders_with_date_filter(self, client, auth_header):
        """测试按日期筛选订单"""
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        response = client.get(f"/api/merchant/orders?date={today}", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
    
    def test_get_orders_invalid_date_format(self, client, auth_header):
        """测试无效日期格式"""
        response = client.get("/api/merchant/orders?date=invalid-date", headers=auth_header)
        
        assert response.status_code == 400
        assert "日期格式错误" in response.json()["detail"]
    
    def test_orders_data_isolation(self, client, auth_header, other_auth_header):
        """测试订单数据隔离"""
        # 商家1获取订单
        response1 = client.get("/api/merchant/orders", headers=auth_header)
        assert response1.status_code == 200
        
        # 商家2获取订单
        response2 = client.get("/api/merchant/orders", headers=other_auth_header)
        assert response2.status_code == 200


# ============== 商家信息测试 ==============

class TestMerchantInfo:
    """商家信息测试"""
    
    def test_get_merchant_info_success(self, client, auth_header, test_merchant):
        """测试获取商家信息成功"""
        response = client.get("/api/merchant/merchant/info", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "phone" in data
        assert "shop_name" in data
    
    def test_get_merchant_info_unauthorized(self, client):
        """测试未认证获取商家信息"""
        response = client.get("/api/merchant/merchant/info")
        
        assert response.status_code == 403 or response.status_code == 401
    
    def test_update_merchant_info_success(self, client, auth_header, test_merchant):
        """测试更新商家信息成功"""
        update_data = {
            "name": "更新后的商家名",
            "shop_name": "更新后的店铺名"
        }
        
        response = client.put(
            "/api/merchant/merchant/info",
            json=update_data,
            headers=auth_header
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "更新后的商家名"
        assert data["shop_name"] == "更新后的店铺名"
    
    def test_update_merchant_info_partial(self, client, auth_header):
        """测试部分更新商家信息"""
        update_data = {"phone": "13900139001"}
        
        response = client.put(
            "/api/merchant/merchant/info",
            json=update_data,
            headers=auth_header
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == "13900139001"
    
    def test_update_merchant_info_empty_update(self, client, auth_header):
        """测试空更新请求"""
        update_data = {}
        
        response = client.put(
            "/api/merchant/merchant/info",
            json=update_data,
            headers=auth_header
        )
        
        assert response.status_code == 200


# ============== Profile 接口测试 ==============

class TestMerchantProfile:
    """商家 Profile 接口测试"""
    
    def test_get_profile_success(self, client, auth_header, test_merchant):
        """测试获取商家 profile 成功"""
        response = client.get("/api/merchant/profile", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "phone" in data
        assert "shop_name" in data
        assert data["id"] == test_merchant["id"]
    
    def test_get_profile_unauthorized(self, client):
        """测试未认证获取 profile"""
        response = client.get("/api/merchant/profile")
        
        assert response.status_code == 403 or response.status_code == 401
    
    def test_get_profile_returns_correct_merchant(self, client, auth_header, other_auth_header):
        """测试 profile 返回正确的商家信息"""
        # 商家1获取 profile
        response1 = client.get("/api/merchant/profile", headers=auth_header)
        assert response1.status_code == 200
        
        # 商家2获取 profile
        response2 = client.get("/api/merchant/profile", headers=other_auth_header)
        assert response2.status_code == 200
        
        # 两个商家的信息应该不同
        assert response1.json()["id"] != response2.json()["id"]


# ============== 订单状态更新测试 ==============

class TestOrderStatusUpdate:
    """订单状态更新测试"""
    
    @pytest.fixture
    def test_order_with_items(self, client, auth_header, test_product):
        """创建测试订单（带明细）"""
        # 使用 main.py 的订单创建接口
        order_data = {
            "merchant_id": 1,
            "customer_name": "测试客户",
            "customer_phone": "13800138001",
            "pickup_time": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
            "items": [
                {"product_id": test_product["id"], "quantity": 2}
            ]
        }
        response = client.post("/orders", json=order_data)
        if response.status_code != 200:
            # 如果失败，手动创建订单
            with Session(test_engine) as session:
                # 获取商家ID - 安全修复后 openid 格式为 demo_{code}
                merchant = session.exec(
                    select(Merchant).where(Merchant.wechat_openid == "demo_test_merchant_code_001")
                ).first()
                
                order = Order(
                    merchant_id=merchant.id if merchant else 1,
                    customer_name="测试客户",
                    customer_phone="13800138001",
                    pickup_time=datetime.utcnow() + timedelta(hours=1),
                    total_amount=test_product["price"] * 2,
                    status="pending"
                )
                session.add(order)
                session.commit()
                session.refresh(order)
                
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=test_product["id"],
                    quantity=2,
                    unit_price=test_product["price"],
                    subtotal=test_product["price"] * 2
                )
                session.add(order_item)
                session.commit()
                
                return {"id": order.id, "status": order.status}
        return response.json()
    
    def test_update_order_status_success(self, client, auth_header, test_order_with_items):
        """测试更新订单状态成功"""
        order_id = test_order_with_items["id"]
        
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "confirmed"},
            headers=auth_header
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "confirmed"
        assert data["id"] == order_id
    
    def test_update_order_status_to_ready(self, client, auth_header, test_order_with_items):
        """测试更新订单状态为 ready - 需要先经过 confirmed"""
        order_id = test_order_with_items["id"]
        
        # 安全修复 #7：状态流转规则验证
        # pending -> confirmed -> ready
        
        # 第一步：pending -> confirmed
        response1 = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "confirmed"},
            headers=auth_header
        )
        assert response1.status_code == 200
        assert response1.json()["status"] == "confirmed"
        
        # 第二步：confirmed -> ready
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "ready"},
            headers=auth_header
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "ready"
    
    def test_update_order_status_to_completed(self, client, auth_header, test_order_with_items):
        """测试更新订单状态为 completed - 需要先经过 confirmed 和 ready"""
        order_id = test_order_with_items["id"]
        
        # 安全修复 #7：状态流转规则验证
        # pending -> confirmed -> ready -> completed
        
        # 第一步：pending -> confirmed
        response1 = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "confirmed"},
            headers=auth_header
        )
        assert response1.status_code == 200
        
        # 第二步：confirmed -> ready
        response2 = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "ready"},
            headers=auth_header
        )
        assert response2.status_code == 200
        
        # 第三步：ready -> completed
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "completed"},
            headers=auth_header
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "completed"
    
    def test_update_order_status_to_cancelled(self, client, auth_header, test_order_with_items):
        """测试更新订单状态为 cancelled"""
        order_id = test_order_with_items["id"]
        
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "cancelled"},
            headers=auth_header
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"
    
    def test_update_order_status_invalid_status(self, client, auth_header, test_order_with_items):
        """测试更新订单状态为无效值"""
        order_id = test_order_with_items["id"]
        
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "invalid_status"},
            headers=auth_header
        )
        
        assert response.status_code == 400
        assert "无效的订单状态" in response.json()["detail"]
    
    def test_update_order_status_not_found(self, client, auth_header):
        """测试更新不存在的订单状态"""
        response = client.put(
            "/api/merchant/orders/99999/status",
            json={"status": "confirmed"},
            headers=auth_header
        )
        
        assert response.status_code == 404
        assert "订单不存在" in response.json()["detail"]
    
    def test_update_order_status_other_merchant(self, client, other_auth_header, test_order_with_items):
        """测试更新其他商家订单状态（数据隔离）"""
        order_id = test_order_with_items["id"]
        
        # 其他商家尝试更新订单状态，应该返回 404（订单不存在或不属于当前商家）
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "confirmed"},
            headers=other_auth_header
        )
        
        # 数据隔离验证：其他商家无法找到该订单
        assert response.status_code == 404
        assert "订单不存在" in response.json()["detail"]
    
    def test_update_order_status_unauthorized(self, client, test_order_with_items):
        """测试未认证更新订单状态"""
        order_id = test_order_with_items["id"]
        
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "confirmed"}
        )
        
        assert response.status_code == 403 or response.status_code == 401
    
    def test_update_order_status_returns_items(self, client, auth_header, test_order_with_items):
        """测试更新订单状态返回订单明细"""
        order_id = test_order_with_items["id"]
        
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "confirmed"},
            headers=auth_header
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
    
    def test_update_order_status_empty_body(self, client, auth_header, test_order_with_items):
        """测试更新订单状态缺少 status 字段"""
        order_id = test_order_with_items["id"]
        
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={},
            headers=auth_header
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_order_status_transition_invalid(self, client, auth_header, test_order_with_items):
        """测试订单状态流转规则 - 非法跳转（#7）"""
        order_id = test_order_with_items["id"]
        
        # pending -> completed 是非法的（必须经过 confirmed 和 ready）
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "completed"},
            headers=auth_header
        )
        
        assert response.status_code == 400
        assert "不能从" in response.json()["detail"]
    
    def test_order_status_transition_from_completed_blocked(self, client, auth_header, test_order_with_items):
        """测试从 completed 状态无法再转换（#7）"""
        order_id = test_order_with_items["id"]
        
        # 先按正确流程转到 completed
        client.put(f"/api/merchant/orders/{order_id}/status", json={"status": "confirmed"}, headers=auth_header)
        client.put(f"/api/merchant/orders/{order_id}/status", json={"status": "ready"}, headers=auth_header)
        client.put(f"/api/merchant/orders/{order_id}/status", json={"status": "completed"}, headers=auth_header)
        
        # 从 completed 无法再转换到任何状态
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "cancelled"},
            headers=auth_header
        )
        
        assert response.status_code == 400
        assert "不能从 completed" in response.json()["detail"]
    
    def test_order_cancellation_allowed_from_pending(self, client, auth_header, test_order_with_items):
        """测试从 pending 状态可以取消（#7）"""
        order_id = test_order_with_items["id"]
        
        # pending -> cancelled 是合法的
        response = client.put(
            f"/api/merchant/orders/{order_id}/status",
            json={"status": "cancelled"},
            headers=auth_header
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"


# ============== 数据隔离综合测试 ==============

class TestDataIsolation:
    """数据隔离综合测试"""
    
    def test_products_isolation(self, client, auth_header, other_auth_header):
        """测试商品数据隔离"""
        # 商家1创建商品
        product_data = {"name": "商家1商品", "price": 10.0}
        client.post("/api/merchant/products", json=product_data, headers=auth_header)
        
        # 商家2创建商品
        product_data2 = {"name": "商家2商品", "price": 20.0}
        client.post("/api/merchant/products", json=product_data2, headers=other_auth_header)
        
        # 商家1只能看到自己的商品
        response1 = client.get("/api/merchant/products", headers=auth_header)
        assert response1.status_code == 200
        products1 = response1.json()
        assert all(p["name"] != "商家2商品" for p in products1)
        assert any(p["name"] == "商家1商品" for p in products1)
        
        # 商家2只能看到自己的商品
        response2 = client.get("/api/merchant/products", headers=other_auth_header)
        assert response2.status_code == 200
        products2 = response2.json()
        assert all(p["name"] != "商家1商品" for p in products2)
        assert any(p["name"] == "商家2商品" for p in products2)
    
    def test_cannot_access_other_merchant_product(self, client, other_auth_header, test_product):
        """测试不能访问其他商家的商品"""
        # 尝试更新其他商家的商品
        response = client.put(
            f"/api/merchant/products/{test_product['id']}",
            json={"name": "尝试修改"},
            headers=other_auth_header
        )
        assert response.status_code == 404
        
        # 尝试删除其他商家的商品
        response = client.delete(
            f"/api/merchant/products/{test_product['id']}",
            headers=other_auth_header
        )
        assert response.status_code == 404
        
        # 尝试修改其他商家商品的状态
        response = client.patch(
            f"/api/merchant/products/{test_product['id']}/status",
            json={"is_active": False},
            headers=other_auth_header
        )
        assert response.status_code == 404
    
    def test_merchant_info_isolation(self, client, auth_header, other_auth_header):
        """测试商家信息隔离"""
        # 商家1获取自己的信息
        response1 = client.get("/api/merchant/merchant/info", headers=auth_header)
        assert response1.status_code == 200
        merchant1 = response1.json()
        
        # 商家2获取自己的信息
        response2 = client.get("/api/merchant/merchant/info", headers=other_auth_header)
        assert response2.status_code == 200
        merchant2 = response2.json()
        
        # 两个商家的信息应该是不同的
        assert merchant1["id"] != merchant2["id"]


# ============== 安全修复测试 ==============

class TestSecurityFixes:
    """安全修复测试"""
    
    def test_login_rate_limit(self, client):
        """测试登录限流（Critical #3）"""
        # 重置限流器
        from services.merchant_service import reset_login_rate_limit
        reset_login_rate_limit()
        
        # 连续5次登录尝试应该成功
        for i in range(5):
            response = client.post("/api/merchant/login", json={"code": f"rate_limit_test_{i}"})
            assert response.status_code == 200
        
        # 第6次应该被限流（返回 429）
        response = client.post("/api/merchant/login", json={"code": "rate_limit_blocked"})
        assert response.status_code == 429
        assert "过于频繁" in response.json()["detail"]


# ============== Token 验证测试 ==============

class TestTokenValidation:
    """Token验证测试"""
    
    def test_invalid_token(self, client):
        """测试无效Token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/merchant/products", headers=headers)
        
        assert response.status_code == 401
    
    def test_expired_token(self, client):
        """测试过期Token"""
        import jwt
        
        expired_payload = {
            "merchant_id": 1,
            "exp": datetime.utcnow() - timedelta(seconds=1),
            "iat": datetime.utcnow() - timedelta(seconds=10)
        }
        expired_token = jwt.encode(expired_payload, "test-secret-key-for-jwt-testing-min-32-chars", algorithm="HS256")
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/merchant/products", headers=headers)
        
        assert response.status_code == 401
        assert "过期" in response.json()["detail"]
    
    def test_missing_token(self, client):
        """测试缺少Token"""
        response = client.get("/api/merchant/products")
        
        assert response.status_code == 403 or response.status_code == 401


# 运行测试的入口
if __name__ == "__main__":
    pytest.main([__file__, "-v"])