"""
Test Config API - 测试配置接口

测试三种场景：
1. 无商家时返回 is_empty=true + 空配置模板
2. 有商家但未传 merchant_id 时返回首个商家配置
3. 传入 merchant_id 时保持原逻辑
"""
import pytest
import sys
import os
from pathlib import Path
from sqlmodel import SQLModel, Session, create_engine, select

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

# 导入共享模块
from shared.models import Merchant, MerchantConfig, MerchantRole

# 导入路由模块
from services.customer.routes.config import get_config, CustomerConfigResponse


# ============== 测试数据库设置 ==============

# 使用内存数据库进行测试
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


# ============== 测试用例 ==============

class TestConfigAPIEmptyMerchant:
    """场景1：无商家时返回空配置"""
    
    def test_empty_merchant_returns_is_empty_true(self, session: Session):
        """
        测试：无商家时返回 is_empty=true
        
        验证点：
        - is_empty 字段为 true
        - merchant_id 为 null
        - 其他字段为默认空值
        - 不抛出 404 错误
        """
        # 确保数据库中没有商家
        merchants = session.exec(select(Merchant)).all()
        for m in merchants:
            session.delete(m)
        session.commit()
        
        # 直接调用路由函数
        response = get_config(merchant_id=None, session=session)
        
        # 验证响应
        assert response.is_empty is True, "期望 is_empty 为 true"
        assert response.merchant_id is None, "期望 merchant_id 为 null"
        assert response.shop_name == "", "期望 shop_name 为空字符串"
        assert response.shop_logo == "", "期望 shop_logo 为空字符串"
        assert response.contact_phone == "", "期望 contact_phone 为空字符串"
        assert response.contact_wechat == "", "期望 contact_wechat 为空字符串"
        assert response.address == "", "期望 address 为空字符串"
        assert response.business_hours == "", "期望 business_hours 为空字符串"
        assert response.announcement == "", "期望 announcement 为空字符串"
        assert response.theme_color == "#1890ff", "期望 theme_color 为默认值 #1890ff"
        assert response.enable_ordering is True, "期望 enable_ordering 为 true"
        assert response.enable_pickup is True, "期望 enable_pickup 为 true"
        assert response.min_order_amount == 0, "期望 min_order_amount 为 0"
    
    def test_empty_merchant_with_merchant_id_returns_404(self, session: Session):
        """
        测试：无商家时，传入不存在的 merchant_id 返回 404
        
        验证点：
        - 返回 404 状态码
        - 错误信息为"商家不存在"
        """
        # 确保数据库中没有商家
        merchants = session.exec(select(Merchant)).all()
        for m in merchants:
            session.delete(m)
        session.commit()
        
        # 调用路由函数，传入不存在的 merchant_id
        from fastapi import HTTPException
        
        try:
            get_config(merchant_id=999, session=session)
            assert False, "期望抛出 HTTPException"
        except HTTPException as e:
            assert e.status_code == 404, f"期望状态码 404，实际 {e.status_code}"
            assert "商家不存在" in e.detail


class TestConfigAPIFirstMerchant:
    """场景2：有商家但未传 merchant_id 时返回首个商家配置"""
    
    def test_returns_first_merchant_config(self, session: Session):
        """
        测试：有商家时，未传 merchant_id 返回首个商家配置
        
        验证点：
        - is_empty 为 false
        - merchant_id 为首个商家的 ID
        - 返回正确的配置信息
        """
        # 清空数据库
        merchants = session.exec(select(Merchant)).all()
        for m in merchants:
            session.delete(m)
        session.commit()
        
        # 创建测试商家
        merchant1 = Merchant(
            id=10,
            name="测试商家1",
            phone="13800138001",
            wechat_openid="test_openid_1",
            shop_name="测试店铺1"
        )
        merchant2 = Merchant(
            id=20,
            name="测试商家2",
            phone="13800138002",
            wechat_openid="test_openid_2",
            shop_name="测试店铺2"
        )
        session.add(merchant1)
        session.add(merchant2)
        session.commit()
        
        # 创建商家配置
        config1 = MerchantConfig(
            merchant_id=10,
            shop_name="测试店铺1配置",
            shop_logo="https://example.com/logo1.png",
            contact_phone="13800138001",
            contact_wechat="wechat1",
            address="地址1",
            business_hours="09:00-18:00",
            announcement="公告1",
            theme_color="#ff0000",
            enable_ordering=True,
            enable_pickup=False,
            min_order_amount=10.0
        )
        session.add(config1)
        session.commit()
        
        # 直接调用路由函数（不传 merchant_id）
        response = get_config(merchant_id=None, session=session)
        
        # 验证响应
        assert response.is_empty is False, "期望 is_empty 为 false"
        assert response.merchant_id == 10, f"期望 merchant_id 为 10（首个商家），实际 {response.merchant_id}"
        assert response.shop_name == "测试店铺1配置", f"期望 shop_name 为 '测试店铺1配置'，实际 {response.shop_name}"
        assert response.shop_logo == "https://example.com/logo1.png"
        assert response.contact_phone == "13800138001"
        assert response.contact_wechat == "wechat1"
        assert response.address == "地址1"
        assert response.business_hours == "09:00-18:00"
        assert response.announcement == "公告1"
        assert response.theme_color == "#ff0000"
        assert response.enable_ordering is True
        assert response.enable_pickup is False
        assert response.min_order_amount == 10.0
    
    def test_first_merchant_without_config_creates_default(self, session: Session):
        """
        测试：首个商家没有配置时，自动创建默认配置
        
        验证点：
        - 返回默认配置
        - 数据库中创建了配置记录
        """
        # 清空数据库
        merchants = session.exec(select(Merchant)).all()
        for m in merchants:
            session.delete(m)
        session.commit()
        
        # 创建测试商家（不创建配置）
        merchant = Merchant(
            id=30,
            name="无配置商家",
            phone="13800138030",
            wechat_openid="test_openid_30",
            shop_name="无配置店铺"
        )
        session.add(merchant)
        session.commit()
        
        # 调用路由函数
        response = get_config(merchant_id=None, session=session)
        
        # 验证响应
        assert response.is_empty is False
        assert response.merchant_id == 30
        assert response.shop_name == "无配置店铺"  # 使用商家的 shop_name
        
        # 验证数据库中创建了配置
        config = session.exec(
            select(MerchantConfig).where(MerchantConfig.merchant_id == 30)
        ).first()
        assert config is not None, "期望数据库中创建了配置记录"


class TestConfigAPISpecifiedMerchant:
    """场景3：传入 merchant_id 时保持原逻辑"""
    
    def test_returns_specified_merchant_config(self, session: Session):
        """
        测试：传入 merchant_id 时返回指定商家配置
        
        验证点：
        - is_empty 为 false
        - merchant_id 为指定的 ID
        - 返回正确的配置信息
        """
        # 清空数据库
        merchants = session.exec(select(Merchant)).all()
        for m in merchants:
            session.delete(m)
        session.commit()
        
        # 创建测试商家
        merchant1 = Merchant(
            id=100,
            name="指定商家1",
            phone="13800138100",
            wechat_openid="test_openid_100",
            shop_name="指定店铺1"
        )
        merchant2 = Merchant(
            id=200,
            name="指定商家2",
            phone="13800138200",
            wechat_openid="test_openid_200",
            shop_name="指定店铺2"
        )
        session.add(merchant1)
        session.add(merchant2)
        session.commit()
        
        # 创建商家配置
        config1 = MerchantConfig(
            merchant_id=100,
            shop_name="指定店铺1配置",
            contact_phone="13800138100"
        )
        config2 = MerchantConfig(
            merchant_id=200,
            shop_name="指定店铺2配置",
            contact_phone="13800138200"
        )
        session.add(config1)
        session.add(config2)
        session.commit()
        
        # 调用路由函数，指定 merchant_id=200
        response = get_config(merchant_id=200, session=session)
        
        # 验证响应
        assert response.is_empty is False
        assert response.merchant_id == 200, f"期望 merchant_id 为 200，实际 {response.merchant_id}"
        assert response.shop_name == "指定店铺2配置"
    
    def test_specified_merchant_not_exists_returns_404(self, session: Session):
        """
        测试：传入不存在的 merchant_id 返回 404
        
        验证点：
        - 返回 404 状态码
        - 错误信息为"商家不存在"
        """
        # 清空数据库
        merchants = session.exec(select(Merchant)).all()
        for m in merchants:
            session.delete(m)
        session.commit()
        
        # 调用路由函数，传入不存在的 merchant_id
        from fastapi import HTTPException
        
        try:
            get_config(merchant_id=9999, session=session)
            assert False, "期望抛出 HTTPException"
        except HTTPException as e:
            assert e.status_code == 404
            assert "商家不存在" in e.detail
    
    def test_specified_merchant_without_config_creates_default(self, session: Session):
        """
        测试：指定商家没有配置时，自动创建默认配置
        
        验证点：
        - 返回默认配置
        - 数据库中创建了配置记录
        """
        # 清空数据库
        merchants = session.exec(select(Merchant)).all()
        for m in merchants:
            session.delete(m)
        session.commit()
        
        # 创建测试商家（不创建配置）
        merchant = Merchant(
            id=300,
            name="指定无配置商家",
            phone="13800138300",
            wechat_openid="test_openid_300",
            shop_name="指定无配置店铺"
        )
        session.add(merchant)
        session.commit()
        
        # 调用路由函数，指定 merchant_id=300
        response = get_config(merchant_id=300, session=session)
        
        # 验证响应
        assert response.is_empty is False
        assert response.merchant_id == 300
        assert response.shop_name == "指定无配置店铺"  # 使用商家的 shop_name
        
        # 验证数据库中创建了配置
        config = session.exec(
            select(MerchantConfig).where(MerchantConfig.merchant_id == 300)
        ).first()
        assert config is not None


class TestConfigAPIBackwardCompatibility:
    """向后兼容性测试"""
    
    def test_response_structure_compatibility(self, session: Session):
        """
        测试：响应结构保持向后兼容
        
        验证点：
        - 所有原有字段都存在
        - 新增 is_empty 字段
        - merchant_id 类型变为 Optional[int]
        """
        # 清空数据库
        merchants = session.exec(select(Merchant)).all()
        for m in merchants:
            session.delete(m)
        session.commit()
        
        # 创建测试商家
        merchant = Merchant(
            id=400,
            name="兼容性测试商家",
            phone="13800138400",
            wechat_openid="test_openid_400",
            shop_name="兼容性测试店铺"
        )
        session.add(merchant)
        session.commit()
        
        # 调用路由函数
        response = get_config(merchant_id=None, session=session)
        
        # 验证响应结构
        assert response.is_empty is False
        assert response.merchant_id == 400
        
        # 验证所有字段都存在
        expected_fields = [
            "is_empty",
            "merchant_id",
            "shop_name",
            "shop_logo",
            "contact_phone",
            "contact_wechat",
            "address",
            "business_hours",
            "announcement",
            "theme_color",
            "enable_ordering",
            "enable_pickup",
            "min_order_amount"
        ]
        for field in expected_fields:
            assert hasattr(response, field), f"期望字段 '{field}' 存在于响应中"


# ============== 运行测试 ==============

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])