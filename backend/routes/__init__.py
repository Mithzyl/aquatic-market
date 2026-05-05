"""
Routes 模块 - 路由定义
"""
from .product_routes import router as product_router
from .order_routes import router as order_router
from .merchant_routes import router as merchant_router
from .carousel_routes import router as carousel_router

__all__ = [
    "product_router",
    "order_router",
    "merchant_router",
    "carousel_router",
]
