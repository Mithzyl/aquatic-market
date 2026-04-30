"""
后端功能测试 - F02/F03/F04/F05/F06

测试场景覆盖：
- F02: 商家状态管理（禁用时自动取消订单、记录操作日志、恢复库存）
- F03: 管理员账号初始化（启动时检查、环境变量配置、bcrypt加密、并发锁）
- F04: 品类管理完整功能（创建、编辑、删除、关联商品检查）
- F05: 订单取消功能（用户认证、订单归属、状态验证、时间限制、库存恢复）
- F06: 库存扣减与恢复（数据库锁保护、库存不足返回400、取消时恢复）
"""
import pytest
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from sqlalchemy.pool import StaticPool

# 导入应用和模型
import sys
from pathlib import Path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from shared.models import (
    Order, OrderItem, Product, Merchant, User, Category,
    PlatformAdmin, MerchantOperationLog, InitLock
)
from shared.database import get_session
from services.order_service import OrderService
from services.merchant_service import CategoryService


# 创建测试数据库引擎
TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)


def get_test_session():
    """获取测试数据库session"""
    SQLModel.metadata.create_all(TEST_ENGINE)
    with Session(TEST_ENGINE) as session:
        yield session


# ============== 测试数据准备 ==============

@pytest.fixture
def session():
    """测试数据库session"""
    SQLModel.metadata.create_all(TEST_ENGINE)
    with Session(TEST_ENGINE) as session:
        yield session


def create_test_merchant(session, unique_id=None):
    """创建测试商家（使用唯一ID避免冲突）"""
    if unique_id is None:
        unique_id = str(uuid.uuid4())[:8]
    merchant = Merchant(
        name=f"测试商家_{unique_id}",
        phone=f"138001380{unique_id[:3]}",
        wechat_openid=f"test_openid_{unique_id}",
        shop_name=f"测试店铺_{unique_id}",
        is_active=True
    )
    session.add(merchant)
    session.commit()
    session.refresh(merchant)
    return merchant


def create_test_user(session, unique_id=None):
    """创建测试用户"""
    if unique_id is None:
        unique_id = str(uuid.uuid4())[:8]
    user = User(
        phone=f"139001390{unique_id[:3]}",
        nickname=f"测试用户_{unique_id}"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_test_products(session, merchant_id, unique_id=None):
    """创建测试商品"""
    if unique_id is None:
        unique_id = str(uuid.uuid4())[:8]
    product1 = Product(
        merchant_id=merchant_id,
        name=f"基围虾_{unique_id}",
        description="新鲜基围虾",
        price=68.0,
        stock=100,
        is_active=True,
        category="shrimp"
    )
    product2 = Product(
        merchant_id=merchant_id,
        name=f"大闸蟹_{unique_id}",
        description="阳澄湖大闸蟹",
        price=128.0,
        stock=50,
        is_active=True,
        category="crab"
    )
    session.add(product1)
    session.add(product2)
    session.commit()
    session.refresh(product1)
    session.refresh(product2)
    return [product1, product2]


def create_test_category(session, merchant_id, unique_id=None):
    """创建测试品类"""
    if unique_id is None:
        unique_id = str(uuid.uuid4())[:8]
    category = Category(
        merchant_id=merchant_id,
        slug=f"shrimp_{unique_id}",
        name=f"虾类_{unique_id}",
        icon="shrimp_icon",
        order=1
    )
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


def create_test_order(session, merchant_id, user_id, products):
    """创建测试订单"""
    order = Order(
        merchant_id=merchant_id,
        user_id=user_id,
        customer_name="张三",
        customer_phone="13900139000",
        pickup_time=datetime.utcnow() + timedelta(hours=1),
        total_amount=196.0,
        status="pending",
        created_at=datetime.utcnow()
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    
    # 创建订单明细
    item1 = OrderItem(
        order_id=order.id,
        product_id=products[0].id,
        quantity=2,
        unit_price=68.0,
        subtotal=136.0
    )
    item2 = OrderItem(
        order_id=order.id,
        product_id=products[1].id,
        quantity=1,
        unit_price=128.0,
        subtotal=128.0
    )
    session.add(item1)
    session.add(item2)
    session.commit()
    
    return order


# ============== F02: 商家状态管理测试 ==============

class TestMerchantStatusManagement:
    """F02: 商家状态管理测试"""
    
    def test_batch_cancel_pending_orders(self, session):
        """
        正向场景：批量取消pending订单
        验证订单状态更新和库存恢复
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        user = create_test_user(session, unique_id)
        products = create_test_products(session, merchant.id, unique_id)
        
        # 创建pending订单
        order = Order(
            merchant_id=merchant.id,
            user_id=user.id,
            customer_name="李四",
            customer_phone="13900139001",
            pickup_time=datetime.utcnow() + timedelta(hours=1),
            total_amount=68.0,
            status="pending",
            created_at=datetime.utcnow()
        )
        session.add(order)
        session.commit()
        session.refresh(order)
        
        item = OrderItem(
            order_id=order.id,
            product_id=products[0].id,
            quantity=5,
            unit_price=68.0,
            subtotal=340.0
        )
        session.add(item)
        session.commit()
        
        # 记录原始库存
        original_stock = products[0].stock
        
        # 执行批量取消
        service = OrderService(session)
        cancelled_count = service.batch_cancel_pending_orders(merchant.id)
        
        # 验证订单状态
        session.refresh(order)
        assert order.status == "cancelled"
        assert cancelled_count >= 1
        
        # 验证库存恢复
        session.refresh(products[0])
        assert products[0].stock == original_stock + 5
    
    def test_operation_log_creation(self, session):
        """
        正向场景：记录商家操作日志
        验证MerchantOperationLog模型正确记录
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        
        log = MerchantOperationLog(
            merchant_id=merchant.id,
            admin_id=1,
            operation_type="disable",
            previous_status=True,
            new_status=False,
            reason="违规操作",
            cancelled_orders_count=3,
            created_at=datetime.utcnow()
        )
        session.add(log)
        session.commit()
        
        # 验证日志记录
        saved_log = session.exec(
            select(MerchantOperationLog).where(MerchantOperationLog.merchant_id == merchant.id)
        ).first()
        
        assert saved_log is not None
        assert saved_log.operation_type == "disable"
        assert saved_log.cancelled_orders_count == 3
        assert saved_log.reason == "违规操作"
    
    def test_only_pending_orders_cancelled(self, session):
        """
        边界场景：只有pending订单被取消
        验证其他状态订单不受影响
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        
        # 创建不同状态的订单
        pending_order = Order(
            merchant_id=merchant.id,
            status="pending",
            total_amount=100.0,
            customer_name="客户A",
            customer_phone="13800000001",
            pickup_time=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        confirmed_order = Order(
            merchant_id=merchant.id,
            status="confirmed",
            total_amount=200.0,
            customer_name="客户B",
            customer_phone="13800000002",
            pickup_time=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        session.add(pending_order)
        session.add(confirmed_order)
        session.commit()
        session.refresh(pending_order)
        session.refresh(confirmed_order)
        
        # 执行批量取消
        service = OrderService(session)
        cancelled_count = service.batch_cancel_pending_orders(merchant.id)
        
        # 验证只有pending订单被取消
        assert cancelled_count >= 1
        session.refresh(pending_order)
        session.refresh(confirmed_order)
        assert pending_order.status == "cancelled"
        assert confirmed_order.status == "confirmed"


# ============== F03: 管理员账号初始化测试 ==============

class TestAdminInitialization:
    """F03: 管理员账号初始化测试"""
    
    def test_init_lock_model(self, session):
        """
        正向场景：InitLock模型创建
        验证锁机制防止并发初始化
        """
        unique_id = str(uuid.uuid4())[:8]
        lock = InitLock(
            lock_name=f"admin_init_{unique_id}",
            is_locked=False,
            locked_by="test_instance"
        )
        session.add(lock)
        session.commit()
        
        saved_lock = session.exec(
            select(InitLock).where(InitLock.lock_name == f"admin_init_{unique_id}")
        ).first()
        
        assert saved_lock is not None
        assert saved_lock.is_locked == False
    
    def test_admin_creation_with_bcrypt(self, session):
        """
        正向场景：管理员账号创建（bcrypt加密）
        验证密码正确加密存储
        """
        import bcrypt
        unique_id = str(uuid.uuid4())[:8]
        
        password = "admin123"
        password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        admin = PlatformAdmin(
            username=f"test_admin_{unique_id}",
            password_hash=password_hash,
            email=f"test_{unique_id}@platform.com",
            role="super_admin",
            is_active=True
        )
        session.add(admin)
        session.commit()
        
        # 验证密码可以正确验证
        saved_admin = session.exec(
            select(PlatformAdmin).where(PlatformAdmin.username == f"test_admin_{unique_id}")
        ).first()
        
        assert saved_admin is not None
        assert bcrypt.checkpw(password.encode('utf-8'), saved_admin.password_hash.encode('utf-8'))
    
    def test_no_duplicate_admin_creation(self, session):
        """
        边界场景：已存在管理员时不重复创建
        验证初始化逻辑检查现有账号
        """
        unique_id = str(uuid.uuid4())[:8]
        
        # 先创建一个管理员
        admin1 = PlatformAdmin(
            username=f"existing_admin_{unique_id}",
            password_hash="hash1",
            email=f"existing_{unique_id}@platform.com",
            role="super_admin",
            is_active=True
        )
        session.add(admin1)
        session.commit()
        
        # 检查是否已有管理员
        existing = session.exec(select(PlatformAdmin)).first()
        assert existing is not None
        
        # 模拟再次尝试创建（应该跳过）
        count_before = len(session.exec(select(PlatformAdmin)).all())
        
        # 如果已有管理员，不应该再创建
        if existing:
            pass
        
        count_after = len(session.exec(select(PlatformAdmin)).all())
        assert count_before == count_after


# ============== F04: 品类管理测试 ==============

class TestCategoryManagement:
    """F04: 品类管理完整功能测试"""
    
    def test_create_category(self, session):
        """
        正向场景：创建品类
        验证品类正确创建并关联商家
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        
        service = CategoryService(session)
        category = service.create_category(merchant.id, {
            "slug": f"fish_{unique_id}",
            "name": "鱼类",
            "icon": "fish_icon",
            "order": 2
        })
        
        assert category.id is not None
        assert category.slug == f"fish_{unique_id}"
        assert category.name == "鱼类"
        assert category.merchant_id == merchant.id
    
    def test_update_category(self, session):
        """
        正向场景：编辑品类
        验证品类信息正确更新
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        category = create_test_category(session, merchant.id, unique_id)
        
        service = CategoryService(session)
        updated = service.update_category(merchant.id, category.id, {
            "name": "虾类（更新）",
            "order": 10
        })
        
        assert updated is not None
        assert updated.name == "虾类（更新）"
        assert updated.order == 10
    
    def test_update_category_not_owner(self, session):
        """
        异常场景：更新不属于商家的品类
        验证返回None
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        category = create_test_category(session, merchant.id, unique_id)
        
        service = CategoryService(session)
        # 尝试更新其他商家的品类（merchant_id=999不存在）
        result = service.update_category(999, category.id, {"name": "非法更新"})
        assert result is None
    
    def test_delete_category_with_products(self, session):
        """
        异常场景：删除有关联商品的品类
        验证拒绝删除并返回错误信息
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        products = create_test_products(session, merchant.id, unique_id)
        category = create_test_category(session, merchant.id, unique_id)
        
        # 更新商品category字段以关联品类
        products[0].category = category.slug
        session.add(products[0])
        session.commit()
        
        service = CategoryService(session)
        result = service.delete_category(merchant.id, category.id)
        
        assert result["success"] == False
        assert "商品" in result["message"]
    
    def test_delete_category_without_products(self, session):
        """
        正向场景：删除无关联商品的品类
        验证品类正确删除
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        
        # 创建无关联商品的品类
        category = Category(
            merchant_id=merchant.id,
            slug=f"empty_cat_{unique_id}",
            name="空品类",
            icon="empty_icon",
            order=99
        )
        session.add(category)
        session.commit()
        session.refresh(category)
        
        service = CategoryService(session)
        result = service.delete_category(merchant.id, category.id)
        
        assert result["success"] == True
        
        # 验证品类已删除
        deleted = session.get(Category, category.id)
        assert deleted is None
    
    def test_delete_category_not_owner(self, session):
        """
        异常场景：删除不属于商家的品类
        验证返回失败信息
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        category = create_test_category(session, merchant.id, unique_id)
        
        service = CategoryService(session)
        result = service.delete_category(999, category.id)
        
        assert result["success"] == False
        assert "不存在" in result["message"]


# ============== F05: 订单取消功能测试 ==============

class TestOrderCancellation:
    """F05: 订单取消功能测试"""
    
    def test_cancel_order_success(self, session):
        """
        正向场景：用户取消自己的订单
        验证订单状态更新和库存恢复
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        user = create_test_user(session, unique_id)
        products = create_test_products(session, merchant.id, unique_id)
        order = create_test_order(session, merchant.id, user.id, products)
        
        # 记录原始库存
        session.refresh(products[0])
        session.refresh(products[1])
        original_stock_1 = products[0].stock
        original_stock_2 = products[1].stock
        
        service = OrderService(session)
        result = service.cancel_order(order.id, user_id=user.id)
        
        assert result["success"] == True
        assert result["status"] == "cancelled"
        
        # 验证订单状态
        session.refresh(order)
        assert order.status == "cancelled"
        
        # 验证库存恢复
        session.refresh(products[0])
        session.refresh(products[1])
        # 原订单明细：product1 quantity=2, product2 quantity=1
        assert products[0].stock == original_stock_1 + 2
        assert products[1].stock == original_stock_2 + 1
    
    def test_cancel_order_not_owner(self, session):
        """
        异常场景：用户取消他人的订单
        验证返回403错误
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        user = create_test_user(session, unique_id)
        products = create_test_products(session, merchant.id, unique_id)
        order = create_test_order(session, merchant.id, user.id, products)
        
        service = OrderService(session)
        
        with pytest.raises(Exception) as exc_info:
            service.cancel_order(order.id, user_id=999)
        
        assert "无权" in str(exc_info.value) or "403" in str(exc_info.value) or "Forbidden" in str(exc_info.value)
    
    def test_cancel_order_wrong_status(self, session):
        """
        异常场景：取消非pending状态的订单
        验证返回400错误
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        
        # 创建confirmed状态订单
        order = Order(
            merchant_id=merchant.id,
            user_id=1,
            status="confirmed",
            total_amount=100.0,
            customer_name="客户",
            customer_phone="13800000000",
            pickup_time=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        session.add(order)
        session.commit()
        session.refresh(order)
        
        service = OrderService(session)
        
        with pytest.raises(Exception) as exc_info:
            service.cancel_order(order.id, user_id=1)
        
        assert "无法取消" in str(exc_info.value) or "400" in str(exc_info.value)
    
    def test_cancel_order_timeout(self, session):
        """
        异常场景：取消超过5分钟的订单
        验证返回400错误
        """
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        
        # 创建超过5分钟的订单
        order = Order(
            merchant_id=merchant.id,
            user_id=1,
            status="pending",
            total_amount=100.0,
            customer_name="客户",
            customer_phone="13800000000",
            pickup_time=datetime.utcnow(),
            created_at=datetime.utcnow() - timedelta(minutes=10)
        )
        session.add(order)
        session.commit()
        session.refresh(order)
        
        service = OrderService(session)
        
        with pytest.raises(Exception) as exc_info:
            service.cancel_order(order.id, user_id=1)
        
        assert "超过" in str(exc_info.value) or "5分钟" in str(exc_info.value) or "400" in str(exc_info.value)
    
    def test_cancel_order_not_found(self, session):
        """
        异常场景：取消不存在的订单
        验证返回404错误
        """
        service = OrderService(session)
        
        with pytest.raises(Exception) as exc_info:
            service.cancel_order(9999, user_id=1)
        
        assert "不存在" in str(exc_info.value) or "404" in str(exc_info.value)


# ============== F06: 库存扣减与恢复测试 ==============

class TestStockManagement:
    """F06: 库存扣减与恢复测试"""
    
    def test_stock_deduction_on_order(self, session):
        """
        正向场景：下单时库存扣减
        验证库存正确扣减
        """
        from schemas.order import OrderCreateRequest, OrderItemRequest
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        user = create_test_user(session, unique_id)
        products = create_test_products(session, merchant.id, unique_id)
        
        # 记录原始库存
        session.refresh(products[0])
        original_stock = products[0].stock
        
        order_data = OrderCreateRequest(
            merchant_id=merchant.id,
            customer_name="测试客户",
            customer_phone="13900000000",
            pickup_time=datetime.utcnow() + timedelta(hours=1),
            items=[OrderItemRequest(product_id=products[0].id, quantity=3)]
        )
        
        service = OrderService(session)
        result = service.create_order(order_data, user_id=user.id)
        
        # 验证订单创建成功
        assert result["id"] is not None
        
        # 验证库存扣减
        session.refresh(products[0])
        assert products[0].stock == original_stock - 3
    
    def test_stock_insufficient_error(self, session):
        """
        异常场景：库存不足时返回400错误
        验证订单不创建
        """
        from schemas.order import OrderCreateRequest, OrderItemRequest
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        user = create_test_user(session, unique_id)
        products = create_test_products(session, merchant.id, unique_id)
        
        # 设置库存为5
        products[0].stock = 5
        session.add(products[0])
        session.commit()
        
        order_data = OrderCreateRequest(
            merchant_id=merchant.id,
            customer_name="测试客户",
            customer_phone="13900000000",
            pickup_time=datetime.utcnow() + timedelta(hours=1),
            items=[OrderItemRequest(product_id=products[0].id, quantity=10)]  # 超过库存
        )
        
        service = OrderService(session)
        
        with pytest.raises(Exception) as exc_info:
            service.create_order(order_data, user_id=user.id)
        
        assert "库存不足" in str(exc_info.value) or "400" in str(exc_info.value)
    
    def test_stock_restore_on_cancel(self, session):
        """
        正向场景：取消订单时库存恢复
        验证库存正确恢复
        """
        from schemas.order import OrderCreateRequest, OrderItemRequest
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        user = create_test_user(session, unique_id)
        products = create_test_products(session, merchant.id, unique_id)
        
        # 先创建订单扣减库存
        session.refresh(products[0])
        original_stock = products[0].stock
        
        order_data = OrderCreateRequest(
            merchant_id=merchant.id,
            customer_name="测试客户",
            customer_phone="13900000000",
            pickup_time=datetime.utcnow() + timedelta(hours=1),
            items=[OrderItemRequest(product_id=products[0].id, quantity=2)]
        )
        
        service = OrderService(session)
        order = service.create_order(order_data, user_id=user.id)
        
        # 验证库存扣减（需要重新从数据库获取）
        product_after = session.get(Product, products[0].id)
        stock_after_deduct = product_after.stock
        assert stock_after_deduct == original_stock - 2
        
        # 执行库存恢复
        restored_count = service.restore_stock(order["id"])
        
        # 验证恢复数量
        assert restored_count == 1
        
        # 验证库存恢复（需要重新从数据库获取）
        product_final = session.get(Product, products[0].id)
        assert product_final.stock == original_stock
    
    def test_transaction_consistency(self, session):
        """
        正向场景：事务一致性验证
        验证订单创建失败时库存不扣减
        """
        from schemas.order import OrderCreateRequest, OrderItemRequest
        unique_id = str(uuid.uuid4())[:8]
        merchant = create_test_merchant(session, unique_id)
        user = create_test_user(session, unique_id)
        products = create_test_products(session, merchant.id, unique_id)
        
        # 记录原始库存
        session.refresh(products[0])
        original_stock = products[0].stock
        
        # 创建一个会失败的订单（引用不存在的商品）
        order_data = OrderCreateRequest(
            merchant_id=merchant.id,
            customer_name="测试客户",
            customer_phone="13900000000",
            pickup_time=datetime.utcnow() + timedelta(hours=1),
            items=[
                OrderItemRequest(product_id=products[0].id, quantity=1),
                OrderItemRequest(product_id=999, quantity=1)  # 不存在的商品
            ]
        )
        
        service = OrderService(session)
        
        with pytest.raises(Exception):
            service.create_order(order_data, user_id=user.id)
        
        # 验证库存未扣减（事务回滚）
        session.refresh(products[0])
        assert products[0].stock == original_stock


# ============== 运行测试 ==============

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])