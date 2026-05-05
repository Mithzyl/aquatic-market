"""
Merchant Service Routes - 商家端路由模块
"""
from .merchant_routes import router, admin_router
from .carousel_routes import router as carousel_router

__all__ = ["router", "admin_router", "carousel_router"]