"""
Routes 模块 - 路由定义
"""
from .product_routes import router as product_router
from .order_routes import router as order_router

__all__ = [
    "product_router",
    "order_router",
]
