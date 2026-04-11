"""
Shared Module - 共享模块
提供所有服务复用的基础组件：models、auth、database、schemas
"""
from .models import (
    Merchant,
    MerchantRole,
    Product,
    Order,
    OrderItem,
    Category,
    PlatformAdmin,
    User,
)
from .database import (
    engine,
    get_session,
    create_db_and_tables,
)
from .auth import (
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

__all__ = [
    # Models
    "Merchant",
    "MerchantRole",
    "Product",
    "Order",
    "OrderItem",
    "Category",
    "PlatformAdmin",
    "User",
    # Database
    "engine",
    "get_session",
    "create_db_and_tables",
    # Auth
    "create_access_token",
    "create_token",
    "verify_token",
    "get_current_merchant",
    "get_merchant_id",
    "get_current_user",
    "get_user_id",
    "get_current_admin",
    "get_admin_id",
    "require_permission",
    "require_permissions",
]