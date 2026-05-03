"""
Test Merchant CRUD - 测试商家 CRUD 三端点 (N01/N02/N03)

测试覆盖：
- N01: POST /merchants 新增商家
- N02: PUT /merchants/{id} 修改商家信息
- N03: DELETE /merchants/{id} 删除商家
"""
import pytest
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
from sqlmodel import SQLModel, Session, create_engine, select
from fastapi import HTTPException

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

# 导入共享模块
from shared.models import (
    Merchant, Product, Order, OrderItem, MerchantConfig,
    MerchantOperationLog, MerchantRole, PlatformAdmin,
    hash_password
)

# 导入路由处理函数
from services.platform.routes.merchants import (
    create_merchant,
    update_merchant,
    delete_merchant,
    MerchantCreateRequest,
    MerchantUpdateRequest,
    MerchantDeleteRequest,
)


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


@pytest.fixture(name="admin_payload")
def admin_payload_fixture():
    """模拟管理员认证 payload"""
    return {
        "admin_id": 1,
        "username": "super_admin",
        "role": "super_admin",
        "permissions": [
            "merchant:read", "merchant:create", "merchant:update", "merchant:delete"
        ]
    }


def _create_merchant(session, username="test_shop", shop_name="测试店铺", name="测试", phone="13800000001"):
    """辅助方法：创建测试商家"""
    merchant = Merchant(
        username=username,
        password_hash=hash_password("123456"),
        shop_name=shop_name,
        name=name,
        phone=phone,
        role_id=1,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(merchant)
    session.commit()
    session.refresh(merchant)
    return merchant


def _create_product(session, merchant_id, name="测试商品", price=10.0, stock=100):
    """辅助方法：创建测试商品"""
    product = Product(
        merchant_id=merchant_id,
        name=name,
        price=price,
        stock=stock,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def _create_order(session, merchant_id, status="pending", user_id=None):
    """辅助方法：创建测试订单"""
    order = Order(
        merchant_id=merchant_id,
        user_id=user_id,
        customer_name="测试客户",
        customer_phone="13800000000",
        pickup_time=datetime.utcnow() + timedelta(hours=2),
        total_amount=100.0,
        status=status,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return order


def _create_order_item(session, order_id, product_id, quantity=1):
    """辅助方法：创建订单明细"""
    item = OrderItem(
        order_id=order_id,
        product_id=product_id,
        quantity=quantity,
        unit_price=10.0,
        subtotal=10.0 * quantity
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


# ============== N01: POST /merchants 新增商家测试 ==============

class TestCreateMerchant:
    """N01: 新增商家测试"""

    def test_create_merchant_success(self, session, admin_payload):
        """正常创建商家 → 201"""
        request = MerchantCreateRequest(
            username="new_shop",
            password="secure123",
            shop_name="新店铺",
            name="李四",
            phone="13900000001"
        )
        result = create_merchant(request, admin_payload, session)

        assert result["username"] == "new_shop"
        assert result["shop_name"] == "新店铺"
        assert result["name"] == "李四"
        assert result["phone"] == "13900000001"
        assert result["role_id"] == 1
        assert result["is_active"] is True
        assert "id" in result
        assert result["message"] == "商家创建成功"

        # 验证数据库记录
        merchant = session.exec(
            select(Merchant).where(Merchant.username == "new_shop")
        ).first()
        assert merchant is not None
        assert merchant.shop_name == "新店铺"

        # 验证 MerchantConfig 自动创建
        config = session.exec(
            select(MerchantConfig).where(MerchantConfig.merchant_id == merchant.id)
        ).first()
        assert config is not None
        assert config.shop_name == "新店铺"

    def test_create_merchant_duplicate_username(self, session, admin_payload):
        """重复用户名 → 400"""
        _create_merchant(session, username="existing_shop")

        request = MerchantCreateRequest(
            username="existing_shop",
            password="secure123",
            shop_name="重复店铺"
        )

        with pytest.raises(HTTPException) as exc_info:
            create_merchant(request, admin_payload, session)

        assert exc_info.value.status_code == 400
        assert "用户名已被占用" in exc_info.value.detail

    def test_create_merchant_minimal_fields(self, session, admin_payload):
        """最少必填字段 → 201"""
        request = MerchantCreateRequest(
            username="min_shop",
            password="123456",
            shop_name="最小店铺"
        )
        result = create_merchant(request, admin_payload, session)

        assert result["username"] == "min_shop"
        assert result["shop_name"] == "最小店铺"
        assert result["name"] == ""  # 默认值
        assert result["phone"] == ""  # 默认值

# ============== N02: PUT /merchants/{id} 修改商家信息测试 ==============

class TestUpdateMerchant:
    """N02: 修改商家信息测试"""

    def test_update_shop_name_syncs_config(self, session, admin_payload):
        """修改 shop_name → 同步更新 merchant_config.shop_name (Q1: A)"""
        merchant = _create_merchant(session, shop_name="旧店铺名")
        # 创建初始 config
        config = MerchantConfig.get_default_config(merchant.id)
        config.shop_name = "旧店铺名"
        session.add(config)
        session.commit()

        request = MerchantUpdateRequest(shop_name="新店铺名")
        result = update_merchant(merchant.id, request, admin_payload, session)

        assert result["success"] is True
        assert result["merchant"]["shop_name"] == "新店铺名"
        assert result["config"]["shop_name"] == "新店铺名"

        # 验证数据库
        db_config = session.exec(
            select(MerchantConfig).where(MerchantConfig.merchant_id == merchant.id)
        ).first()
        assert db_config.shop_name == "新店铺名"

    def test_update_config_fields(self, session, admin_payload):
        """修改 config 字段（address 等）→ 200"""
        merchant = _create_merchant(session)

        request = MerchantUpdateRequest(
            address="北京市朝阳区XX路88号",
            business_hours="09:00-22:00",
            contact_phone="400-888-9999",
            theme_color="#ff0000",
            enable_ordering=False,
            min_order_amount=30.0
        )
        result = update_merchant(merchant.id, request, admin_payload, session)

        assert result["success"] is True
        assert result["config"]["address"] == "北京市朝阳区XX路88号"
        assert result["config"]["business_hours"] == "09:00-22:00"
        assert result["config"]["contact_phone"] == "400-888-9999"
        assert result["config"]["theme_color"] == "#ff0000"
        assert result["config"]["enable_ordering"] is False
        assert result["config"]["min_order_amount"] == 30.0

    def test_update_partial_fields(self, session, admin_payload):
        """只更新部分字段 → 其他字段不变"""
        merchant = _create_merchant(session, name="原名", phone="111")
        # 创建 config
        config = MerchantConfig.get_default_config(merchant.id)
        config.address = "原地址"
        config.business_hours = "08:00-20:00"
        session.add(config)
        session.commit()

        request = MerchantUpdateRequest(name="新名")
        result = update_merchant(merchant.id, request, admin_payload, session)

        assert result["merchant"]["name"] == "新名"
        assert result["merchant"]["phone"] == "111"  # 未修改

    def test_update_merchant_not_found(self, session, admin_payload):
        """商家不存在 → 404"""
        request = MerchantUpdateRequest(shop_name="不存在")

        with pytest.raises(HTTPException) as exc_info:
            update_merchant(99999, request, admin_payload, session)

        assert exc_info.value.status_code == 404
        assert "商家不存在" in exc_info.value.detail

    def test_update_empty_request(self, session, admin_payload):
        """请求体全为空 → 400"""
        merchant = _create_merchant(session)

        request = MerchantUpdateRequest()
        with pytest.raises(HTTPException) as exc_info:
            update_merchant(merchant.id, request, admin_payload, session)

        assert exc_info.value.status_code == 400
        assert "至少需要提供一个修改字段" in exc_info.value.detail

    def test_update_upsert_config_when_not_exists(self, session, admin_payload):
        """商家无 config 时修改 config 字段 → 自动创建 config"""
        merchant = _create_merchant(session)
        # 不创建 config

        request = MerchantUpdateRequest(address="新地址", business_hours="10:00-18:00")
        result = update_merchant(merchant.id, request, admin_payload, session)

        assert result["success"] is True
        assert result["config"] is not None
        assert result["config"]["address"] == "新地址"
        assert result["config"]["business_hours"] == "10:00-18:00"

# ============== N03: DELETE /merchants/{id} 删除商家测试 ==============

class TestDeleteMerchant:
    """N03: 删除商家测试"""

    def test_delete_merchant_no_orders(self, session, admin_payload):
        """商家无订单 → 200 + 级联删除"""
        merchant = _create_merchant(session)
        _create_product(session, merchant.id, name="商品A")
        _create_product(session, merchant.id, name="商品B")
        # 创建 config
        config = MerchantConfig.get_default_config(merchant.id)
        session.add(config)
        session.commit()

        merchant_id = merchant.id
        request = MerchantDeleteRequest(force=False)
        result = delete_merchant(merchant_id, request, admin_payload, session)

        assert result["success"] is True
        assert result["deleted"]["merchant_id"] == merchant_id
        assert result["deleted"]["products_count"] == 2
        assert result["deleted"]["orders_count"] == 0
        assert result["deleted"]["cancelled_orders_count"] == 0
        assert result["deleted"]["config_deleted"] is True

        # 验证级联删除
        assert session.get(Merchant, merchant_id) is None
        products = session.exec(
            select(Product).where(Product.merchant_id == merchant_id)
        ).all()
        assert len(products) == 0

    def test_delete_merchant_with_orders_force_false(self, session, admin_payload):
        """有 pending 订单且 force=false → 409"""
        merchant = _create_merchant(session)
        _create_order(session, merchant.id, status="pending")

        request = MerchantDeleteRequest(force=False)
        with pytest.raises(HTTPException) as exc_info:
            delete_merchant(merchant.id, request, admin_payload, session)

        assert exc_info.value.status_code == 409
        assert "未完成订单" in exc_info.value.detail

    def test_delete_merchant_with_orders_force_true(self, session, admin_payload):
        """有 pending 订单且 force=true → 取消订单 + 删除"""
        merchant = _create_merchant(session)
        product = _create_product(session, merchant.id, stock=50)
        order = _create_order(session, merchant.id, status="pending")
        _create_order_item(session, order.id, product.id, quantity=3)

        merchant_id = merchant.id
        request = MerchantDeleteRequest(force=True)
        result = delete_merchant(merchant_id, request, admin_payload, session)

        assert result["success"] is True
        assert result["deleted"]["cancelled_orders_count"] >= 1
        assert session.get(Merchant, merchant_id) is None

    def test_delete_merchant_with_confirmed_order_force_false(self, session, admin_payload):
        """有 confirmed 订单且 force=false → 409"""
        merchant = _create_merchant(session)
        _create_order(session, merchant.id, status="confirmed")

        request = MerchantDeleteRequest(force=False)
        with pytest.raises(HTTPException) as exc_info:
            delete_merchant(merchant.id, request, admin_payload, session)

        assert exc_info.value.status_code == 409

    def test_delete_merchant_with_ready_order_force_false(self, session, admin_payload):
        """有 ready 订单且 force=false → 409"""
        merchant = _create_merchant(session)
        _create_order(session, merchant.id, status="ready")

        request = MerchantDeleteRequest(force=False)
        with pytest.raises(HTTPException) as exc_info:
            delete_merchant(merchant.id, request, admin_payload, session)

        assert exc_info.value.status_code == 409

    def test_delete_merchant_with_completed_orders_no_block(self, session, admin_payload):
        """有 completed 订单 + force=false → 200（已完成订单不阻止删除）"""
        merchant = _create_merchant(session)
        _create_order(session, merchant.id, status="completed")

        merchant_id = merchant.id
        request = MerchantDeleteRequest(force=False)
        result = delete_merchant(merchant_id, request, admin_payload, session)

        assert result["success"] is True
        assert result["deleted"]["orders_count"] == 1

    def test_delete_merchant_not_found(self, session, admin_payload):
        """商家不存在 → 404"""
        request = MerchantDeleteRequest(force=False)
        with pytest.raises(HTTPException) as exc_info:
            delete_merchant(99999, request, admin_payload, session)

        assert exc_info.value.status_code == 404

    def test_delete_merchant_cascade_order_items(self, session, admin_payload):
        """级联删除验证：OrderItem 也被删除"""
        merchant = _create_merchant(session)
        product = _create_product(session, merchant.id)
        order = _create_order(session, merchant.id, status="completed")
        item = _create_order_item(session, order.id, product.id, quantity=2)

        merchant_id = merchant.id
        request = MerchantDeleteRequest(force=False)
        result = delete_merchant(merchant_id, request, admin_payload, session)

        assert result["success"] is True
        # 验证 OrderItem 也被删除
        remaining_items = session.exec(
            select(OrderItem).where(OrderItem.order_id == order.id)
        ).all()
        assert len(remaining_items) == 0

    def test_delete_merchant_cascade_operation_logs(self, session, admin_payload):
        """级联删除验证：MerchantOperationLog 也被删除"""
        merchant = _create_merchant(session)
        log = MerchantOperationLog(
            merchant_id=merchant.id,
            admin_id=1,
            operation_type="enable",
            previous_status=False,
            new_status=True,
            reason="test"
        )
        session.add(log)
        session.commit()

        merchant_id = merchant.id
        request = MerchantDeleteRequest(force=False)
        result = delete_merchant(merchant_id, request, admin_payload, session)

        assert result["success"] is True
        remaining_logs = session.exec(
            select(MerchantOperationLog).where(MerchantOperationLog.merchant_id == merchant_id)
        ).all()
        assert len(remaining_logs) == 0

    def test_delete_merchant_with_cancelled_orders(self, session, admin_payload):
        """有 cancelled 订单 + force=false → 200（已取消订单不阻止）"""
        merchant = _create_merchant(session)
        _create_order(session, merchant.id, status="cancelled")

        merchant_id = merchant.id
        request = MerchantDeleteRequest(force=False)
        result = delete_merchant(merchant_id, request, admin_payload, session)

        assert result["success"] is True
