"""
RBAC 权限模型测试
测试角色定义、权限校验、JWT Token 扩展、权限中间件

遵循 TDD 流程：先写测试，再实现功能
"""
import pytest
import os
import json
from datetime import datetime, timedelta
from typing import List
import jwt

# 设置测试环境变量
os.environ["JWT_SECRET"] = "test-secret-key-for-jwt-testing-min-32-chars"
os.environ["WECHAT_DEMO_MODE"] = "true"
os.environ["AUTO_CREATE_MERCHANT"] = "true"

# 测试时会导入这些模块
from sqlmodel import SQLModel, Session, create_engine, select
from models import Merchant, MerchantRole
from auth import (
    create_access_token,
    verify_token,
    SECRET_KEY,
    ALGORITHM,
    check_permission,
    require_permission,
    get_current_merchant_with_permissions,
)


# ============== 测试数据库设置 ==============

@pytest.fixture(name="session")
def session_fixture():
    """创建测试数据库会话"""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        # 初始化默认角色
        MerchantRole.init_default_roles(session)
        yield session


# ============== MerchantRole 模型测试 ==============

class TestMerchantRoleModel:
    """MerchantRole 模型测试"""
    
    def test_create_role_with_valid_data(self, session: Session):
        """测试创建角色 - 正常场景"""
        role = MerchantRole(
            name="测试角色",
            code="test_role",
            permissions=json.dumps(["test:read", "test:write"]),
            description="这是一个测试角色",
            is_active=True
        )
        session.add(role)
        session.commit()
        session.refresh(role)
        
        assert role.id is not None
        assert role.name == "测试角色"
        assert role.code == "test_role"
        assert role.is_active == True
    
    def test_role_permissions_as_list(self, session: Session):
        """测试角色权限列表获取"""
        role = session.exec(
            select(MerchantRole).where(MerchantRole.code == "owner")
        ).first()
        
        permissions = json.loads(role.permissions)
        assert "product:read" in permissions
        assert "product:delete" in permissions
        assert "revenue:read" in permissions
    
    def test_role_unique_code(self, session: Session):
        """测试角色代码唯一性"""
        # 创建第一个角色
        role1 = MerchantRole(
            name="角色1",
            code="unique_code",
            permissions=json.dumps(["perm:read"]),
            is_active=True
        )
        session.add(role1)
        session.commit()
        
        # 尝试创建重复code的角色应该失败
        role2 = MerchantRole(
            name="角色2",
            code="unique_code",  # 重复的code
            permissions=json.dumps(["perm:write"]),
            is_active=True
        )
        session.add(role2)
        
        # SQLite会抛出IntegrityError
        from sqlalchemy.exc import IntegrityError
        with pytest.raises(IntegrityError):
            session.commit()
    
    def test_get_permissions_list_method(self, session: Session):
        """测试 get_permissions_list 方法"""
        role = session.exec(
            select(MerchantRole).where(MerchantRole.code == "owner")
        ).first()
        
        permissions = role.get_permissions_list()
        assert isinstance(permissions, list)
        assert len(permissions) > 0
        assert "product:read" in permissions
    
    def test_has_permission_method(self, session: Session):
        """测试 has_permission 方法"""
        role = session.exec(
            select(MerchantRole).where(MerchantRole.code == "owner")
        ).first()
        
        assert role.has_permission("product:read") == True
        assert role.has_permission("revenue:read") == True
    
    def test_set_permissions_list_method(self, session: Session):
        """测试 set_permissions_list 方法"""
        role = MerchantRole(
            name="权限设置测试",
            code="perm_test",
            permissions="",
            is_active=True
        )
        session.add(role)
        session.commit()
        
        role.set_permissions_list(["new:read", "new:write"])
        session.add(role)
        session.commit()
        session.refresh(role)
        
        permissions = role.get_permissions_list()
        assert "new:read" in permissions
        assert "new:write" in permissions


# ============== JWT Token 扩展测试 ==============

class TestJWTTokenWithRole:
    """JWT Token 包含角色信息测试"""
    
    def test_create_token_with_role_info(self):
        """测试创建包含角色信息的 Token"""
        merchant_id = 1
        role_code = "owner"
        permissions = ["product:read", "product:create"]
        
        token = create_access_token(
            merchant_id=merchant_id,
            role_code=role_code,
            permissions=permissions
        )
        
        # 解码验证
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        assert payload["merchant_id"] == merchant_id
        assert payload["role_code"] == role_code
        assert payload["permissions"] == permissions
        assert "exp" in payload
        assert "iat" in payload
    
    def test_verify_token_returns_role_info(self):
        """测试验证 Token 返回角色信息"""
        merchant_id = 1
        role_code = "admin"
        permissions = ["product:read", "order:read"]
        
        token = create_access_token(
            merchant_id=merchant_id,
            role_code=role_code,
            permissions=permissions
        )
        
        payload = verify_token(token)
        
        assert payload["merchant_id"] == merchant_id
        assert payload["role_code"] == role_code
        assert payload["permissions"] == permissions
    
    def test_token_without_role_still_valid(self):
        """测试不含角色信息的旧 Token 仍然有效（向后兼容）"""
        merchant_id = 1
        
        # 创建旧版本 Token（不含角色）
        token = create_access_token(merchant_id=merchant_id)
        
        payload = verify_token(token)
        
        assert payload["merchant_id"] == merchant_id
        # 新字段可能不存在，但不应报错
        assert payload.get("role_code") is None
        assert payload.get("permissions") is None
    
    def test_different_roles_create_different_tokens(self):
        """测试不同角色生成不同的 Token"""
        token_owner = create_access_token(
            merchant_id=1,
            role_code="owner",
            permissions=["product:read", "product:delete"]
        )
        token_staff = create_access_token(
            merchant_id=1,
            role_code="staff",
            permissions=["product:read"]
        )
        
        payload_owner = jwt.decode(token_owner, SECRET_KEY, algorithms=[ALGORITHM])
        payload_staff = jwt.decode(token_staff, SECRET_KEY, algorithms=[ALGORITHM])
        
        assert payload_owner["role_code"] == "owner"
        assert payload_staff["role_code"] == "staff"
        assert len(payload_owner["permissions"]) > len(payload_staff["permissions"])


# ============== 权限校验中间件测试 ==============

class TestPermissionMiddleware:
    """权限校验中间件测试"""
    
    def test_check_permission_with_valid_permission(self):
        """测试拥有权限时通过校验"""
        payload = {
            "merchant_id": 1,
            "role_code": "owner",
            "permissions": ["product:read", "product:delete"]
        }
        
        result = check_permission(payload, "product:read")
        assert result == True
        
        result2 = check_permission(payload, "product:delete")
        assert result2 == True
    
    def test_check_permission_without_permission(self):
        """测试缺少权限时返回 False"""
        payload = {
            "merchant_id": 1,
            "role_code": "staff",
            "permissions": ["product:read", "order:read"]
        }
        
        result = check_permission(payload, "product:delete")
        assert result == False
    
    def test_check_permission_with_empty_permissions_defaults_to_owner(self):
        """测试空权限默认为 owner（向后兼容）"""
        payload = {
            "merchant_id": 1,
            "role_code": None,
            "permissions": []
        }
        
        # 空权限列表默认返回 True（向后兼容）
        result = check_permission(payload, "product:delete")
        assert result == True
    
    def test_require_permission_with_valid_permission(self):
        """测试 require_permission 拥有权限时通过"""
        token = create_access_token(
            merchant_id=1,
            role_code="owner",
            permissions=["product:read", "product:delete"]
        )
        
        from fastapi.security import HTTPAuthorizationCredentials
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        
        # 验证权限
        permission_checker = require_permission("product:read")
        result = permission_checker(credentials)
        
        assert result["merchant_id"] == 1
        assert "product:read" in result["permissions"]
    
    def test_require_permission_without_permission_raises_403(self):
        """测试缺少权限时抛出 403"""
        # 创建无删除权限的 Token
        token = create_access_token(
            merchant_id=1,
            role_code="staff",
            permissions=["product:read", "order:read"]
        )
        
        from fastapi.security import HTTPAuthorizationCredentials
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        
        from fastapi import HTTPException
        permission_checker = require_permission("product:delete")
        
        with pytest.raises(HTTPException) as exc_info:
            permission_checker(credentials)
        
        assert exc_info.value.status_code == 403
        assert "权限不足" in exc_info.value.detail or "product:delete" in exc_info.value.detail
    
    def test_require_permission_with_expired_token_raises_401(self):
        """测试过期 Token 抛出 401"""
        # 创建过期 Token
        expired_payload = {
            "merchant_id": 1,
            "role_code": "owner",
            "permissions": ["product:read"],
            "exp": datetime.utcnow() - timedelta(seconds=1),
            "iat": datetime.utcnow() - timedelta(seconds=10)
        }
        expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
        
        from fastapi.security import HTTPAuthorizationCredentials
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=expired_token
        )
        
        from fastapi import HTTPException
        permission_checker = require_permission("product:read")
        
        with pytest.raises(HTTPException) as exc_info:
            permission_checker(credentials)
        
        assert exc_info.value.status_code == 401
    
    def test_require_permission_with_invalid_token_raises_401(self):
        """测试无效 Token 抛出 401"""
        from fastapi.security import HTTPAuthorizationCredentials
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid.token.here"
        )
        
        from fastapi import HTTPException
        permission_checker = require_permission("product:read")
        
        with pytest.raises(HTTPException) as exc_info:
            permission_checker(credentials)
        
        assert exc_info.value.status_code == 401


# ============== 角色权限边界测试 ==============

class TestRolePermissionBoundaries:
    """角色权限边界测试"""
    
    def test_owner_has_all_permissions(self, session: Session):
        """测试 owner 角色拥有所有权限"""
        role = session.exec(
            select(MerchantRole).where(MerchantRole.code == "owner")
        ).first()
        
        permissions = json.loads(role.permissions)
        
        # 验证关键权限
        assert "product:delete" in permissions
        assert "revenue:read" in permissions
        assert "merchant:update" in permissions
    
    def test_admin_missing_merchant_update(self, session: Session):
        """测试 admin 角色缺少 merchant:update 权限"""
        role = session.exec(
            select(MerchantRole).where(MerchantRole.code == "admin")
        ).first()
        
        permissions = json.loads(role.permissions)
        
        assert "merchant:update" not in permissions
        assert "product:delete" in permissions  # 但有商品删除权限
    
    def test_staff_has_only_basic_permissions(self, session: Session):
        """测试 staff 角色只有基础权限"""
        role = session.exec(
            select(MerchantRole).where(MerchantRole.code == "staff")
        ).first()
        
        permissions = json.loads(role.permissions)
        
        # 只能读商品、读写订单
        assert "product:read" in permissions
        assert "order:read" in permissions
        assert "order:update" in permissions
        
        # 不能删除商品
        assert "product:delete" not in permissions
        assert "product:create" not in permissions
        
        # 不能看收益
        assert "revenue:read" not in permissions
    
    def test_inactive_role_cannot_be_used(self, session: Session):
        """测试禁用的角色不能使用"""
        # 创建禁用的角色
        inactive_role = MerchantRole(
            name="禁用角色",
            code="inactive",
            permissions=json.dumps(["test:read"]),
            is_active=False
        )
        session.add(inactive_role)
        session.commit()
        
        role = session.exec(
            select(MerchantRole).where(MerchantRole.code == "inactive")
        ).first()
        
        assert role.is_active == False


# ============== Merchant 关联角色测试 ==============

class TestMerchantRoleAssociation:
    """商家关联角色测试"""
    
    def test_merchant_can_have_role(self, session: Session):
        """测试商家可以关联角色"""
        role = session.exec(
            select(MerchantRole).where(MerchantRole.code == "owner")
        ).first()
        
        merchant = Merchant(
            name="测试商家",
            phone="13800138000",
            wechat_openid="test_openid",
            shop_name="测试店铺",
            role_id=role.id
        )
        session.add(merchant)
        session.commit()
        session.refresh(merchant)
        
        assert merchant.role_id == role.id
    
    def test_merchant_default_role_is_owner(self, session: Session):
        """测试商家默认角色是 owner"""
        merchant = Merchant(
            name="新商家",
            phone="13900139000",
            wechat_openid="new_openid",
            shop_name="新店铺"
        )
        session.add(merchant)
        session.commit()
        session.refresh(merchant)
        
        # 默认 role_id 应为 1（owner）
        assert merchant.role_id == 1
    
    def test_merchant_role_change(self, session: Session):
        """测试商家角色变更"""
        owner_role = session.exec(
            select(MerchantRole).where(MerchantRole.code == "owner")
        ).first()
        staff_role = session.exec(
            select(MerchantRole).where(MerchantRole.code == "staff")
        ).first()
        
        merchant = Merchant(
            name="角色变更测试",
            phone="13700137000",
            wechat_openid="change_openid",
            shop_name="变更店铺",
            role_id=owner_role.id
        )
        session.add(merchant)
        session.commit()
        session.refresh(merchant)
        
        # 变更角色
        merchant.role_id = staff_role.id
        session.add(merchant)
        session.commit()
        session.refresh(merchant)
        
        assert merchant.role_id == staff_role.id


# ============== 登录响应扩展测试 ==============

class TestLoginResponseWithRole:
    """登录响应包含角色信息测试"""
    
    def test_login_response_contains_role_info(self, session: Session):
        """测试登录响应包含角色信息"""
        from services.merchant_service import AuthService
        
        service = AuthService(session)
        result = service.login(code="test_login_code", client_ip="127.0.0.1")
        
        assert "token" in result
        assert "merchant" in result
        
        # 验证 merchant 包含 role 信息
        merchant_data = result["merchant"]
        assert "role" in merchant_data
        assert "code" in merchant_data["role"]
        assert "name" in merchant_data["role"]
        assert "permissions" in merchant_data["role"]
    
    def test_token_from_login_has_role_info(self, session: Session):
        """测试登录生成的 Token 包含角色信息"""
        from services.merchant_service import AuthService
        
        service = AuthService(session)
        result = service.login(code="test_token_role", client_ip="127.0.0.1")
        
        token = result["token"]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        assert "role_code" in payload
        assert "permissions" in payload
    
    def test_login_new_merchant_gets_owner_role(self, session: Session):
        """测试新注册商家默认获得 owner 角色"""
        from services.merchant_service import AuthService
        
        service = AuthService(session)
        result = service.login(code="new_merchant_test", client_ip="127.0.0.1")
        
        merchant_data = result["merchant"]
        assert merchant_data["role"]["code"] == "owner"


# ============== 初始化角色测试 ==============

class TestRoleInitialization:
    """角色初始化测试"""
    
    def test_init_default_roles_creates_three_roles(self, session: Session):
        """测试初始化创建三个默认角色"""
        roles = session.exec(select(MerchantRole)).all()
        
        assert len(roles) == 3
        
        role_codes = [r.code for r in roles]
        assert "owner" in role_codes
        assert "admin" in role_codes
        assert "staff" in role_codes
    
    def test_init_default_roles_only_once(self, session: Session):
        """测试初始化只执行一次"""
        # 第一次初始化
        result1 = MerchantRole.init_default_roles(session)
        assert result1 == False  # 已存在
        
        # 第二次调用不应再创建
        roles = session.exec(select(MerchantRole)).all()
        assert len(roles) == 3  # 仍然是3个


# ============== 运行测试入口 ==============

if __name__ == "__main__":
    pytest.main([__file__, "-v"])