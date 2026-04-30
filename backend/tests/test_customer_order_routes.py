"""
Test Customer Order Routes - 用户端订单API路由测试

测试范围：
- POST /api/customer/orders - 创建订单
- POST /api/customer/orders/{order_id}/cancel - 取消订单
- GET /api/customer/orders/me - 获取用户订单列表
- GET /api/customer/orders/{order_id} - 获取单个订单详情

覆盖场景：
- 正常创建订单（正向）
- 认证验证（异常）
- 取消订单（正向）
- 获取订单列表（正向）
"""
import pytest
import sys
from pathlib import Path
from datetime import datetime, timedelta
from sqlmodel import SQLModel, Session, create_engine, select
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

# 导入共享模块
from shared.models import Order, OrderItem, Product, Merchant, User, MerchantRole
from shared.auth import create_user_token

# 导入路由模块
from services.customer.routes.orders import router as orders_router, get_my_orders, create_order, cancel_order, get_order
from services.order_service import OrderService
from schemas.order import OrderCreateRequest, OrderItemRequest
from shared.database import get_session
from shared.auth import get_user_id, get_current_user


# ============== 测试数据库设置 ==============

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(name="engine")
def engine_fixture():
    """创建测试数据库引擎"""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    
    # 初始化默认角色
    with Session(engine) as session:
        MerchantRole.init_default_roles(session)
    
    yield engine


@pytest.fixture(name="session")
def session_fixture(engine):
    """创建测试数据库会话"""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="test_app")
def test_app_fixture(session: Session):
    """创建测试FastAPI应用"""
    app = FastAPI()
    
    # 覆盖依赖注入
    def get_session_override():
        yield session
    
    app.dependency_overrides["shared.database.get_session"] = get_session_override
    
    # 注册路由
    app.include_router(orders_router, prefix="/api/customer")
    
    return app


@pytest.fixture(name="client")
def client_fixture(test_app: FastAPI):
    """创建测试客户端"""
    return TestClient(test_app)


@pytest.fixture(name="test_data")
def test_data_fixture(session: Session):
    """创建测试数据：商家、商品、用户"""
    # 创建商家
    merchant = Merchant(
        id=1,
        name="测试商家",
        phone="13800138000",
        wechat_openid="test_openid_merchant",
        shop_name="测试海鲜店"
    )
    session.add(merchant)
    
    # 创建用户
    user = User(
        id=100,
        phone="13900139000",
        nickname="测试用户"
    )
    session.add(user)
    
    # 创建商品（有库存）
    product1 = Product(
        id=1,
        merchant_id=1,
        name="大虾",
        price=50.0,
        stock=100,
        is_active=True
    )
    product2 = Product(
        id=2,
        merchant_id=1,
        name="螃蟹",
        price=80.0,
        stock=50,
        is_active=True
    )
    session.add(product1)
    session.add(product2)
    
    session.commit()
    
    # 创建用户Token
    user_token = create_user_token(user_id=100, phone="13900139000")
    
    return {
        "merchant": merchant,
        "user": user,
        "products": [product1, product2],
        "user_token": user_token
    }


# ============== POST /api/customer/orders 测试 ==============

class TestCreateOrderAPI:
    """创建订单API测试"""
    
    def test_create_order_with_auth_success(self, session: Session, test_data: dict):
        """
        测试：带认证的正常订单创建
        
        验证点：
        - 返回201状态码（或200）
        - 订单创建成功
        - 库存正确扣减
        """
        # 创建测试应用和客户端
        app = FastAPI()
        
        def get_session_override():
            yield session
        
        def get_user_id_override():
            return 100
        
        # 使用函数引用进行依赖覆盖
        app.dependency_overrides[get_session] = get_session_override
        app.dependency_overrides[get_user_id] = get_user_id_override
        
        # 注册路由
        app.include_router(orders_router, prefix="/api/customer")
        
        client = TestClient(app)
        
        # 创建订单请求
        order_data = {
            "merchant_id": 1,
            "customer_name": "API测试用户",
            "customer_phone": "13800138001",
            "pickup_time": (datetime.utcnow() + timedelta(hours=2)).isoformat(),
            "items": [
                {"product_id": 1, "quantity": 3},
                {"product_id": 2, "quantity": 2}
            ]
        }
        
        # 发送请求（带认证）
        response = client.post(
            "/api/customer/orders",
            json=order_data,
            headers={"Authorization": f"Bearer {test_data['user_token']}"}
        )
        
        # 验证响应
        assert response.status_code == 200
        result = response.json()
        assert result["id"] is not None
        assert result["merchant_id"] == 1
        assert result["customer_name"] == "API测试用户"
        assert result["status"] == "pending"
        assert result["total_amount"] == 310.0  # 3*50 + 2*80
        
        # 验证库存扣减
        product1 = session.exec(select(Product).where(Product.id == 1)).first()
        product2 = session.exec(select(Product).where(Product.id == 2)).first()
        assert product1.stock == 97
        assert product2.stock == 48
    
    def test_create_order_direct_service_call(self, session: Session, test_data: dict):
        """
        测试：直接调用服务层创建订单
        
        验证点：
        - 服务层正常工作
        - 数据持久化正确
        """
        service = OrderService(session)
        
        order_data = OrderCreateRequest(
            merchant_id=1,
            customer_name="服务层测试",
            customer_phone="13800138002",
            pickup_time=datetime.utcnow() + timedelta(hours=1),
            items=[
                OrderItemRequest(product_id=1, quantity=5)
            ]
        )
        
        result = service.create_order(order_data, user_id=100)
        
        assert result["id"] is not None
        assert result["total_amount"] == 250.0
        
        # 验证数据库持久化
        order = session.exec(select(Order).where(Order.id == result["id"])).first()
        assert order is not None
        assert order.customer_name == "服务层测试"
        
        items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
        assert len(items) == 1


# ============== POST /api/customer/orders/{order_id}/cancel 测试 ==============

class TestCancelOrderAPI:
    """取消订单API测试"""
    
    def test_cancel_order_with_auth_success(self, session: Session, test_data: dict):
        """
        测试：带认证的正常取消订单
        
        验证点：
        - 返回200状态码
        - 订单状态更新为cancelled
        - 库存恢复
        """
        # 先创建订单
        service = OrderService(session)
        order_data = OrderCreateRequest(
            merchant_id=1,
            customer_name="取消API测试",
            customer_phone="13800138003",
            pickup_time=datetime.utcnow() + timedelta(hours=1),
            items=[
                OrderItemRequest(product_id=1, quantity=5)
            ]
        )
        created_order = service.create_order(order_data, user_id=100)
        order_id = created_order["id"]
        
        # 记录扣减后的库存
        stock_after_create = session.exec(select(Product).where(Product.id == 1)).first().stock
        
        # 创建测试应用和客户端
        app = FastAPI()
        
        def get_session_override():
            yield session
        
        def get_user_id_override():
            return 100
        
        # 使用函数引用进行依赖覆盖
        app.dependency_overrides[get_session] = get_session_override
        app.dependency_overrides[get_user_id] = get_user_id_override
        
        app.include_router(orders_router, prefix="/api/customer")
        
        client = TestClient(app)
        
        # 发送取消请求
        response = client.post(
            f"/api/customer/orders/{order_id}/cancel",
            headers={"Authorization": f"Bearer {test_data['user_token']}"}
        )
        
        # 验证响应
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert result["status"] == "cancelled"
        
        # 验证库存恢复
        product1 = session.exec(select(Product).where(Product.id == 1)).first()
        assert product1.stock == stock_after_create + 5


# ============== GET /api/customer/orders/me 测试 ==============

class TestGetMyOrdersAPI:
    """获取用户订单列表API测试"""
    
    def test_get_my_orders_success(self, session: Session, test_data: dict):
        """
        测试：获取当前用户订单列表
        
        验证点：
        - 返回200状态码
        - 返回正确的订单列表
        """
        # 先创建几个订单
        service = OrderService(session)
        for i in range(3):
            order_data = OrderCreateRequest(
                merchant_id=1,
                customer_name=f"列表测试{i}",
                customer_phone=f"138001380{i}",
                pickup_time=datetime.utcnow() + timedelta(hours=1),
                items=[
                    OrderItemRequest(product_id=1, quantity=1)
                ]
            )
            service.create_order(order_data, user_id=100)
        
        # 创建测试应用和客户端
        app = FastAPI()
        
        def get_session_override():
            yield session
        
        def get_user_id_override():
            return 100
        
        # 使用函数引用进行依赖覆盖
        app.dependency_overrides[get_session] = get_session_override
        app.dependency_overrides[get_user_id] = get_user_id_override
        
        app.include_router(orders_router, prefix="/api/customer")
        
        client = TestClient(app)
        
        # 发送请求
        response = client.get(
            "/api/customer/orders/me",
            headers={"Authorization": f"Bearer {test_data['user_token']}"}
        )
        
        # 验证响应
        assert response.status_code == 200
        result = response.json()
        assert len(result) >= 3


# ============== GET /api/customer/orders/{order_id} 测试 ==============

class TestGetOrderByIdAPI:
    """获取单个订单详情API测试"""
    
    def test_get_order_by_id_success(self, session: Session, test_data: dict):
        """
        测试：获取单个订单详情
        
        验证点：
        - 返回200状态码
        - 返回正确的订单信息
        - 包含订单明细
        """
        # 先创建订单
        service = OrderService(session)
        order_data = OrderCreateRequest(
            merchant_id=1,
            customer_name="详情测试",
            customer_phone="13800138004",
            pickup_time=datetime.utcnow() + timedelta(hours=1),
            items=[
                OrderItemRequest(product_id=1, quantity=3),
                OrderItemRequest(product_id=2, quantity=2)
            ]
        )
        created_order = service.create_order(order_data, user_id=100)
        order_id = created_order["id"]
        
        # 创建测试应用和客户端
        app = FastAPI()
        
        def get_session_override():
            yield session
        
        def get_current_user_override():
            return {"user_id": 100}
        
        app.dependency_overrides["shared.database.get_session"] = get_session_override
        
        app.include_router(orders_router, prefix="/api/customer")
        
        client = TestClient(app)
        
        # 发送请求
        response = client.get(
            f"/api/customer/orders/{order_id}",
            headers={"Authorization": f"Bearer {test_data['user_token']}"}
        )
        
        # 验证响应
        assert response.status_code == 200
        result = response.json()
        assert result["id"] == order_id
        assert result["customer_name"] == "详情测试"
        assert len(result["items"]) == 2


# ============== 运行测试 ==============

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])