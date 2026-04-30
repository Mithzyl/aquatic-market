"""
Import Tests - 导入测试
验证所有共享模块可正常导入

运行方式：
cd backend && source venv/bin/activate && python -m pytest ../tests/test_shared_imports.py -v
"""
import sys
import pytest


# 在测试开始前设置 Python 路径
BACKEND_PATH = "/Users/mith/Desktop/project/sales/backend"


def setup_module(module):
    """模块级别设置：添加 backend 到 Python 路径"""
    if BACKEND_PATH not in sys.path:
        sys.path.insert(0, BACKEND_PATH)


class TestSharedModuleImports:
    """共享模块导入测试类"""
    
    def test_shared_module_import(self):
        """测试 shared 模块可以导入"""
        import shared
        assert shared is not None
    
    def test_models_import(self):
        """测试 models 模块可以导入"""
        from shared.models import (
            Merchant,
            MerchantRole,
            Product,
            Order,
            OrderItem,
            Category,
            PlatformAdmin,
            User,
        )
        
        # 验证所有模型类存在
        assert Merchant is not None
        assert MerchantRole is not None
        assert Product is not None
        assert Order is not None
        assert OrderItem is not None
        assert Category is not None
        assert PlatformAdmin is not None
        assert User is not None
    
    def test_database_import(self):
        """测试 database 模块可以导入"""
        from shared.database import (
            engine,
            get_session,
            create_db_and_tables,
            DATABASE_URL,
        )
        
        # 验证所有数据库组件存在
        assert engine is not None
        assert get_session is not None
        assert create_db_and_tables is not None
        assert DATABASE_URL is not None
    
    def test_auth_import(self):
        """测试 auth 模块可以导入"""
        from shared.auth import (
            create_access_token,
            create_token,
            verify_token,
            get_current_merchant,
            get_merchant_id,
            get_current_user,
            get_user_id,
            get_current_admin,
            get_admin_id,
            require_permission,
            require_permissions,
            SECRET_KEY,
            ALGORITHM,
        )
        
        # 验证所有认证组件存在
        assert create_access_token is not None
        assert create_token is not None
        assert verify_token is not None
        assert get_current_merchant is not None
        assert get_merchant_id is not None
        assert get_current_user is not None
        assert get_user_id is not None
        assert get_current_admin is not None
        assert require_permission is not None
        assert require_permissions is not None
        assert SECRET_KEY is not None
        assert ALGORITHM is not None
    
    def test_schemas_import(self):
        """测试 schemas 模块可以导入"""
        from shared.schemas import (
            BaseResponse,
            SuccessResponse,
            ErrorResponse,
            PaginationMeta,
            PaginatedResponse,
            PaginationParams,
            PaginationRequest,
            SortParams,
            FilterParams,
        )
        
        # 验证所有 schema 类存在
        assert BaseResponse is not None
        assert SuccessResponse is not None
        assert ErrorResponse is not None
        assert PaginationMeta is not None
        assert PaginatedResponse is not None
        assert PaginationParams is not None
        assert PaginationRequest is not None
        assert SortParams is not None
        assert FilterParams is not None
    
    def test_base_schemas_import(self):
        """测试 base schemas 模块可以导入"""
        from shared.schemas.base import (
            BaseResponse,
            SuccessResponse,
            ErrorResponse,
            PaginationMeta,
            PaginatedResponse,
            ErrorCode,
        )
        
        # 验证所有组件存在
        assert BaseResponse is not None
        assert SuccessResponse is not None
        assert ErrorResponse is not None
        assert PaginationMeta is not None
        assert PaginatedResponse is not None
        assert ErrorCode is not None
    
    def test_pagination_schemas_import(self):
        """测试 pagination schemas 模块可以导入"""
        from shared.schemas.pagination import (
            PaginationParams,
            PaginationRequest,
            SortParams,
            FilterParams,
            SearchParams,
            QueryParams,
        )
        
        # 验证所有组件存在
        assert PaginationParams is not None
        assert PaginationRequest is not None
        assert SortParams is not None
        assert FilterParams is not None
        assert SearchParams is not None
        assert QueryParams is not None
    
    def test_direct_import_from_shared(self):
        """测试从 shared 直接导入"""
        from shared import (
            Merchant,
            MerchantRole,
            Product,
            Order,
            OrderItem,
            Category,
            PlatformAdmin,
            User,
            engine,
            get_session,
            create_db_and_tables,
            create_access_token,
            create_token,
            verify_token,
            get_current_merchant,
            get_merchant_id,
            get_current_user,
            get_user_id,
            get_current_admin,
            get_admin_id,
            require_permission,
            require_permissions,
        )
        
        # 验证所有导入成功
        assert Merchant is not None
        assert engine is not None
        assert create_access_token is not None
    
    def test_model_classes_are_sqlmodel(self):
        """测试模型类是 SQLModel 类型"""
        from sqlmodel import SQLModel
        from shared.models import (
            Merchant,
            MerchantRole,
            Product,
            Order,
            OrderItem,
            Category,
            PlatformAdmin,
            User,
        )
        
        # 验证模型类继承自 SQLModel
        assert issubclass(Merchant, SQLModel)
        assert issubclass(MerchantRole, SQLModel)
        assert issubclass(Product, SQLModel)
        assert issubclass(Order, SQLModel)
        assert issubclass(OrderItem, SQLModel)
        assert issubclass(Category, SQLModel)
        assert issubclass(PlatformAdmin, SQLModel)
        assert issubclass(User, SQLModel)
    
    def test_schema_classes_are_pydantic(self):
        """测试 schema 类是 Pydantic 类型"""
        from pydantic import BaseModel
        from shared.schemas import (
            BaseResponse,
            SuccessResponse,
            ErrorResponse,
            PaginationMeta,
            PaginatedResponse,
            PaginationParams,
        )
        
        # 验证 schema 类继承自 BaseModel
        assert issubclass(BaseResponse, BaseModel)
        assert issubclass(SuccessResponse, BaseModel)
        assert issubclass(ErrorResponse, BaseModel)
        assert issubclass(PaginationMeta, BaseModel)
        assert issubclass(PaginatedResponse, BaseModel)
        assert issubclass(PaginationParams, BaseModel)
    
    def test_pagination_params_methods(self):
        """测试分页参数方法"""
        from shared.schemas.pagination import PaginationParams
        
        # 创建分页参数实例
        params = PaginationParams(page=2, page_size=10)
        
        # 测试方法
        assert params.get_offset() == 10
        assert params.get_limit() == 10
        
        # 测试默认值
        default_params = PaginationParams()
        assert default_params.page == 1
        assert default_params.page_size == 20
        assert default_params.get_offset() == 0
        assert default_params.get_limit() == 20
    
    def test_pagination_meta_create(self):
        """测试分页元数据创建"""
        from shared.schemas.base import PaginationMeta
        
        # 创建分页元数据
        meta = PaginationMeta.create(page=1, page_size=10, total=95)
        
        # 验证计算结果
        assert meta.page == 1
        assert meta.page_size == 10
        assert meta.total == 95
        assert meta.total_pages == 10
        assert meta.has_next == True
        assert meta.has_prev == False
        
        # 测试最后一页
        last_page = PaginationMeta.create(page=10, page_size=10, total=95)
        assert last_page.has_next == False
        assert last_page.has_prev == True
    
    def test_success_response_create(self):
        """测试成功响应创建"""
        from shared.schemas.base import SuccessResponse
        
        # 创建成功响应
        response = SuccessResponse.create(data={"id": 1, "name": "test"}, message="创建成功")
        
        # 验证响应结构
        assert response.success == True
        assert response.message == "创建成功"
        assert response.data == {"id": 1, "name": "test"}
    
    def test_error_response_create(self):
        """测试错误响应创建"""
        from shared.schemas.base import ErrorResponse, ErrorCode
        
        # 创建错误响应
        response = ErrorResponse.create(
            message="资源不存在",
            error_code=ErrorCode.RESOURCE_NOT_FOUND,
            error_details=["ID: 999 不存在"]
        )
        
        # 验证响应结构
        assert response.success == False
        assert response.message == "资源不存在"
        assert response.error_code == ErrorCode.RESOURCE_NOT_FOUND
        assert response.error_details == ["ID: 999 不存在"]
    
    def test_paginated_response_create(self):
        """测试分页响应创建"""
        from shared.schemas.base import PaginatedResponse
        
        # 创建分页响应
        data = [{"id": 1}, {"id": 2}, {"id": 3}]
        response = PaginatedResponse.create(
            data=data,
            page=1,
            page_size=10,
            total=25
        )
        
        # 验证响应结构
        assert response.success == True
        assert response.data == data
        assert response.pagination.page == 1
        assert response.pagination.total == 25
        assert response.pagination.total_pages == 3
    
    def test_error_code_constants(self):
        """测试错误代码常量"""
        from shared.schemas.base import ErrorCode
        
        # 验证错误代码存在
        assert ErrorCode.UNKNOWN_ERROR == "UNKNOWN_ERROR"
        assert ErrorCode.AUTH_FAILED == "AUTH_FAILED"
        assert ErrorCode.TOKEN_EXPIRED == "TOKEN_EXPIRED"
        assert ErrorCode.PERMISSION_DENIED == "PERMISSION_DENIED"
        assert ErrorCode.RESOURCE_NOT_FOUND == "RESOURCE_NOT_FOUND"
        assert ErrorCode.VALIDATION_ERROR == "VALIDATION_ERROR"


class TestNewModels:
    """新增模型测试类"""
    
    def test_platform_admin_model_fields(self):
        """测试 PlatformAdmin 模型字段"""
        from shared.models import PlatformAdmin
        
        # 验证模型有预期的字段
        admin = PlatformAdmin(
            username="test_admin",
            password_hash="hashed_password",
            email="admin@test.com",
            role="admin"
        )
        
        assert admin.username == "test_admin"
        assert admin.password_hash == "hashed_password"
        assert admin.email == "admin@test.com"
        assert admin.role == "admin"
        assert admin.is_active == True  # 默认值
    
    def test_user_model_fields(self):
        """测试 User 模型字段"""
        from shared.models import User
        
        # 验证模型有预期的字段
        user = User(
            phone="13800138000",
            nickname="测试用户",
            avatar_url="https://example.com/avatar.png"
        )
        
        assert user.phone == "13800138000"
        assert user.nickname == "测试用户"
        assert user.avatar_url == "https://example.com/avatar.png"
        assert user.is_active == True  # 默认值
    
    def test_platform_admin_permissions_methods(self):
        """测试 PlatformAdmin 权限方法"""
        from shared.models import PlatformAdmin
        
        # 创建管理员并设置权限
        admin = PlatformAdmin(
            username="test_admin",
            password_hash="hashed",
            permissions='["merchant:read", "merchant:update"]'
        )
        
        # 测试权限方法
        permissions_list = admin.get_permissions_list()
        assert "merchant:read" in permissions_list
        assert "merchant:update" in permissions_list
        
        # 测试权限检查
        assert admin.has_permission("merchant:read") == True
        assert admin.has_permission("merchant:delete") == False
        
        # 测试设置权限
        admin.set_permissions_list(["admin:read", "admin:create"])
        assert "admin:read" in admin.get_permissions_list()
    
    def test_platform_admin_default_data(self):
        """测试 PlatformAdmin 默认数据"""
        from shared.models import PlatformAdmin
        
        # 获取默认管理员数据
        default_data = PlatformAdmin.get_default_admin_data()
        
        # 验证默认数据存在
        assert len(default_data) >= 2
        assert default_data[0]["username"] == "super_admin"
        assert default_data[0]["role"] == "super_admin"
        assert default_data[1]["username"] == "operator"


class TestAuthFunctions:
    """认证函数测试类"""
    
    def test_create_access_token(self):
        """测试创建商家 Token"""
        from shared.auth import create_access_token, verify_token
        
        # 创建 Token
        token = create_access_token(
            merchant_id=1,
            role_code="owner",
            permissions=["product:read", "product:delete"]
        )
        
        # 验证 Token 可以解码
        assert token is not None
        assert len(token) > 0
        
        # 解码验证
        payload = verify_token(token)
        assert payload["merchant_id"] == 1
        assert payload["role_code"] == "owner"
        assert "product:read" in payload["permissions"]
    
    def test_create_user_token(self):
        """测试创建用户 Token"""
        from shared.auth import create_user_token, verify_user_token
        
        # 创建用户 Token
        token = create_user_token(user_id=100, phone="13800138000")
        
        # 验证 Token
        assert token is not None
        
        # 解码验证
        payload = verify_user_token(token)
        assert payload["user_id"] == 100
        assert payload["phone"] == "13800138000"
        assert payload["token_type"] == "user"
    
    def test_create_admin_token(self):
        """测试创建管理员 Token"""
        from shared.auth import create_admin_token, verify_admin_token
        
        # 创建管理员 Token
        token = create_admin_token(
            admin_id=1,
            username="super_admin",
            role="super_admin",
            permissions=["platform:read", "platform:write"]
        )
        
        # 验证 Token
        assert token is not None
        
        # 解码验证
        payload = verify_admin_token(token)
        assert payload["admin_id"] == 1
        assert payload["username"] == "super_admin"
        assert payload["role"] == "super_admin"
        assert payload["token_type"] == "admin"
    
    def test_create_token_alias(self):
        """测试 create_token 别名"""
        from shared.auth import create_token, create_access_token
        
        # 验证别名指向同一函数
        assert create_token == create_access_token


# 运行测试
if __name__ == "__main__":
    pytest.main([__file__, "-v"])