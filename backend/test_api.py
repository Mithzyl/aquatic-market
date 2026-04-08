"""
用户端 API 测试
测试商品查询、价格查询、订单创建等功能
"""
import pytest
import os
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session, select

# 设置测试环境变量（使用 JWT_SECRET）
os.environ["JWT_SECRET"] = "test-secret-key-for-jwt-testing-min-32-chars"

from models import Merchant, Product, Order, OrderItem
from main import app

# 创建测试数据库引擎
TEST_DATABASE_URL = "sqlite:///./test_user_api.db"
test_engine = create_engine(TEST_DATABASE_URL, echo=False)


def get_test_session():
    """获取测试数据库会话"""
    with Session(test_engine) as session:
        yield session


# 覆盖依赖
from admin_routes import get_session as admin_get_session
from main import get_session as main_get_session
app.dependency_overrides[admin_get_session] = get_test_session
app.dependency_overrides[main_get_session] = get_test_session


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """模块级别设置：创建数据库表"""
    SQLModel.metadata.create_all(test_engine)
    
    # 创建测试商家和商品
    with Session(test_engine) as session:
        # 创建测试商家
        merchant = Merchant(
            name="测试商家",
            phone="13800138000",
            wechat_openid="test_openid_user_api",
            shop_name="测试店铺"
        )
        session.add(merchant)
        session.commit()
        session.refresh(merchant)
        
        # 创建测试商品
        product1 = Product(
            merchant_id=merchant.id,
            name="测试商品1",
            description="测试商品描述1",
            price=99.99,
            category="海鲜",
            stock=100,
            is_active=True
        )
        product2 = Product(
            merchant_id=merchant.id,
            name="测试商品2",
            description="测试商品描述2",
            price=199.99,
            category="鱼类",
            stock=50,
            is_active=True
        )
        session.add(product1)
        session.add(product2)
        session.commit()
    
    yield
    
    # 清理
    app.dependency_overrides.clear()
    if os.path.exists("./test_user_api.db"):
        os.remove("./test_user_api.db")


@pytest.fixture
def client():
    """创建测试客户端"""
    with TestClient(app) as c:
        yield c


# ============== 商品相关测试 ==============

class TestProducts:
    """商品接口测试"""
    
    def test_get_products(self, client):
        """测试获取商品列表"""
        response = client.get("/products")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert len(response.json()) >= 2
    
    def test_get_products_with_merchant_id(self, client):
        """测试按商家ID获取商品列表"""
        response = client.get("/products?merchant_id=1")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_product_by_id(self, client):
        """测试获取单个商品"""
        response = client.get("/products/1")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "price" in data
    
    def test_get_product_not_found(self, client):
        """测试获取不存在的商品"""
        response = client.get("/products/99999")
        assert response.status_code == 200
        assert "error" in response.json()


# ============== 价格查询测试 ==============

class TestPriceSearch:
    """价格查询接口测试"""
    
    def test_search_products_by_price(self, client):
        """测试按价格范围搜索商品"""
        response = client.get("/products/price/search?min_price=50&max_price=150")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        # 验证价格范围
        for p in products:
            assert p["price"] >= 50
            assert p["price"] <= 150
    
    def test_search_products_by_price_default(self, client):
        """测试默认价格范围搜索"""
        response = client.get("/products/price/search")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_products_by_category(self, client):
        """测试按品类获取商品"""
        response = client.get("/products/price/category?category=海鲜")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        for p in products:
            assert p["category"] == "海鲜"


# ============== 订单相关测试 ==============

class TestOrders:
    """订单接口测试"""
    
    def test_get_orders(self, client):
        """测试获取订单列表 - 安全修复后必须提供 merchant_id"""
        # P0 安全修复：防止跨商家数据泄露，merchant_id 为必填参数
        response = client.get("/orders?merchant_id=1")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_orders_with_merchant_id(self, client):
        """测试按商家ID获取订单"""
        response = client.get("/orders?merchant_id=1")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_order(self, client):
        """测试创建订单"""
        order_data = {
            "merchant_id": 1,
            "customer_name": "测试用户",
            "customer_phone": "13800138000",
            "pickup_time": datetime.now().isoformat(),
            "items": [
                {"product_id": 1, "quantity": 2},
                {"product_id": 2, "quantity": 1}
            ]
        }
        response = client.post("/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert data["customer_name"] == "测试用户"
        assert data["status"] == "pending"
        assert "items" in data
        assert len(data["items"]) == 2
    
    def test_create_order_empty_items(self, client):
        """测试创建空订单"""
        order_data = {
            "merchant_id": 1,
            "customer_name": "空订单用户",
            "customer_phone": "13800138001",
            "pickup_time": datetime.now().isoformat(),
            "items": []
        }
        response = client.post("/orders", json=order_data)
        assert response.status_code == 200
        assert response.json()["total_amount"] == 0
    
    def test_create_order_invalid_product(self, client):
        """测试创建订单使用不存在的商品"""
        order_data = {
            "merchant_id": 1,
            "customer_name": "测试用户",
            "customer_phone": "13800138000",
            "pickup_time": datetime.now().isoformat(),
            "items": [
                {"product_id": 99999, "quantity": 1}
            ]
        }
        response = client.post("/orders", json=order_data)
        assert response.status_code == 200
        assert "error" in response.json()
    
    def test_get_order_by_id(self, client):
        """测试获取单个订单"""
        # 先创建一个订单
        order_data = {
            "merchant_id": 1,
            "customer_name": "查询测试用户",
            "customer_phone": "13800138002",
            "pickup_time": datetime.now().isoformat(),
            "items": [
                {"product_id": 1, "quantity": 1}
            ]
        }
        create_response = client.post("/orders", json=order_data)
        order_id = create_response.json()["id"]
        
        # 获取订单
        response = client.get(f"/orders/{order_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == order_id
        assert "items" in data
    
    def test_get_order_not_found(self, client):
        """测试获取不存在的订单"""
        response = client.get("/orders/99999")
        assert response.status_code == 200
        assert "error" in response.json()


# ============== 事务完整性测试 ==============

class TestOrderTransaction:
    """订单事务完整性测试 - TC-P1-05"""
    
    def test_order_item_persisted_with_order(self, client):
        """测试 OrderItem 与 Order 在同一事务中持久化"""
        # 创建订单
        order_data = {
            "merchant_id": 1,
            "customer_name": "事务测试用户",
            "customer_phone": "13900139000",
            "pickup_time": datetime.now().isoformat(),
            "items": [
                {"product_id": 1, "quantity": 3},
                {"product_id": 2, "quantity": 2}
            ]
        }
        response = client.post("/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        
        order_id = data["id"]
        
        # 验证订单明细已持久化
        detail_response = client.get(f"/orders/{order_id}")
        assert detail_response.status_code == 200
        detail_data = detail_response.json()
        
        # 验证明细数量和内容
        assert "items" in detail_data
        assert len(detail_data["items"]) == 2
        
        # 验证明细数据正确
        item1 = next((item for item in detail_data["items"] if item["product_id"] == 1), None)
        item2 = next((item for item in detail_data["items"] if item["product_id"] == 2), None)
        
        assert item1 is not None
        assert item1["quantity"] == 3
        assert item1["unit_price"] == 99.99  # 从 setup 数据
        
        assert item2 is not None
        assert item2["quantity"] == 2
        assert item2["unit_price"] == 199.99  # 从 setup 数据
    
    def test_stock_deducted_on_order_success(self, client):
        """测试订单创建成功时库存正确扣减"""
        # 获取初始库存
        product_response = client.get("/products/1")
        initial_stock = product_response.json()["stock"]
        
        # 创建订单
        order_data = {
            "merchant_id": 1,
            "customer_name": "库存扣减测试",
            "customer_phone": "13900139001",
            "pickup_time": datetime.now().isoformat(),
            "items": [
                {"product_id": 1, "quantity": 5}
            ]
        }
        response = client.post("/orders", json=order_data)
        assert response.status_code == 200
        
        # 验证库存已扣减
        product_response = client.get("/products/1")
        new_stock = product_response.json()["stock"]
        assert new_stock == initial_stock - 5
    
    def test_stock_not_deducted_on_insufficient_stock(self, client):
        """测试库存不足时库存不扣减（事务回滚）"""
        # 获取初始库存
        product_response = client.get("/products/1")
        initial_stock = product_response.json()["stock"]
        
        # 尝试创建超出库存的订单
        order_data = {
            "merchant_id": 1,
            "customer_name": "库存不足测试",
            "customer_phone": "13900139002",
            "pickup_time": datetime.now().isoformat(),
            "items": [
                {"product_id": 1, "quantity": 99999}  # 超大数量
            ]
        }
        response = client.post("/orders", json=order_data)
        
        # 应该返回错误
        assert "error" in response.json()
        
        # 验证库存未扣减
        product_response = client.get("/products/1")
        new_stock = product_response.json()["stock"]
        assert new_stock == initial_stock
    
    def test_stock_not_deducted_on_invalid_product(self, client):
        """测试商品不存在时库存不扣减（事务回滚）"""
        # 获取初始库存
        product_response = client.get("/products/1")
        initial_stock = product_response.json()["stock"]
        
        # 尝试创建包含不存在商品的订单
        order_data = {
            "merchant_id": 1,
            "customer_name": "无效商品测试",
            "customer_phone": "13900139003",
            "pickup_time": datetime.now().isoformat(),
            "items": [
                {"product_id": 1, "quantity": 2},
                {"product_id": 99999, "quantity": 1}  # 不存在的商品
            ]
        }
        response = client.post("/orders", json=order_data)
        
        # 应该返回错误
        assert "error" in response.json()
        
        # 验证库存未扣减
        product_response = client.get("/products/1")
        new_stock = product_response.json()["stock"]
        assert new_stock == initial_stock
    
    def test_order_not_created_on_stock_error(self, client):
        """测试库存不足时订单不创建（事务回滚）"""
        # 获取当前订单数量
        orders_response = client.get("/orders?merchant_id=1")
        initial_order_count = len(orders_response.json())
        
        # 尝试创建超出库存的订单
        order_data = {
            "merchant_id": 1,
            "customer_name": "订单回滚测试",
            "customer_phone": "13900139004",
            "pickup_time": datetime.now().isoformat(),
            "items": [
                {"product_id": 1, "quantity": 99999}  # 超大数量
            ]
        }
        response = client.post("/orders", json=order_data)
        
        # 应该返回错误
        assert "error" in response.json()
        
        # 验证订单数量未增加
        orders_response = client.get("/orders?merchant_id=1")
        new_order_count = len(orders_response.json())
        assert new_order_count == initial_order_count
    
    def test_atomic_order_creation_multiple_items(self, client):
        """测试多商品订单的原子性创建"""
        # 获取初始库存
        product1_response = client.get("/products/1")
        product2_response = client.get("/products/2")
        initial_stock1 = product1_response.json()["stock"]
        initial_stock2 = product2_response.json()["stock"]
        
        # 创建包含多商品的订单
        order_data = {
            "merchant_id": 1,
            "customer_name": "多商品原子测试",
            "customer_phone": "13900139005",
            "pickup_time": datetime.now().isoformat(),
            "items": [
                {"product_id": 1, "quantity": 2},
                {"product_id": 2, "quantity": 3}
            ]
        }
        response = client.post("/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        
        # 验证订单创建成功
        assert data["customer_name"] == "多商品原子测试"
        assert len(data["items"]) == 2
        
        # 验证两个商品库存都已扣减
        product1_response = client.get("/products/1")
        product2_response = client.get("/products/2")
        assert product1_response.json()["stock"] == initial_stock1 - 2
        assert product2_response.json()["stock"] == initial_stock2 - 3
        
        # 验证订单明细已持久化
        order_detail = client.get(f"/orders/{data['id']}")
        assert len(order_detail.json()["items"]) == 2


# 运行测试的入口
if __name__ == "__main__":
    pytest.main([__file__, "-v"])