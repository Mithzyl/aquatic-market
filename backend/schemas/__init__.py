"""
Schemas 模块 - 请求/响应数据结构定义
"""
from .product import ProductResponse, ProductCreate, ProductUpdate
from .order import OrderCreateRequest, OrderItemRequest, OrderResponse
from .merchant import (
    LoginRequest,
    LoginResponse,
    MerchantInfo,
    ProductCreate,
    ProductUpdate,
    ProductStatusUpdate,
    ProductResponse,
    CategoryResponse,
    RevenueStats,
    MerchantUpdate,
    OrderStatusUpdate,
)

__all__ = [
    # Product
    "ProductResponse",
    "ProductCreate",
    "ProductUpdate",
    # Order
    "OrderCreateRequest",
    "OrderItemRequest",
    "OrderResponse",
    # Merchant
    "LoginRequest",
    "LoginResponse",
    "MerchantInfo",
    "ProductStatusUpdate",
    "CategoryResponse",
    "RevenueStats",
    "MerchantUpdate",
    "OrderStatusUpdate",
]
