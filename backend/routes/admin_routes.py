"""
Admin Routes - 管理端路由别名定义

本模块提供 /api/admin/* 路径别名，与 /api/merchant/* 路径功能完全相同。
支持前端使用更语义化的 /api/admin 路径调用。

路径别名：
- /api/admin/login        -> merchant/login
- /api/admin/products     -> merchant/products 管理
- /api/admin/categories   -> merchant/categories
- /api/admin/revenue/stats -> merchant/revenue/stats
- /api/admin/orders       -> merchant/orders 管理
- /api/admin/profile      -> merchant/profile
- /api/admin/merchant/info -> merchant/merchant/info

认证兼容：
- JWT 认证在两个路径下都能工作
- 使用相同的依赖注入 get_current_merchant_id_from_token
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session

from config.database import get_session
from config.dependencies import get_current_merchant_id_from_token
from services.merchant_service import (
    AuthService,
    ProductService as MerchantProductService,
    CategoryService,
    RevenueService,
    OrderService as MerchantOrderService,
    MerchantService,
)
from schemas.merchant import (
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

router = APIRouter(prefix="/api/admin", tags=["管理端（路径别名）"])


# ============== 认证相关 API ==============

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, http_request: Request, session: Session = Depends(get_session)):
    """
    管理端登录（路径别名）
    
    与 /api/merchant/login 功能完全相同。
    支持两种登录方式：
    1. 微信授权登录：提供 code 参数
    2. 手机号+验证码登录：提供 phone 和 verify_code 参数
    """
    # 获取客户端 IP（支持代理场景）
    client_ip = http_request.headers.get("X-Forwarded-For", "")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    else:
        client_ip = http_request.client.host if http_request.client else "unknown"
    
    service = AuthService(session)
    try:
        result = service.login(
            code=request.code,
            phone=request.phone,
            verify_code=request.verify_code,
            client_ip=client_ip
        )
        return LoginResponse(
            token=result["token"],
            merchant=MerchantInfo(**result["merchant"])
        )
    except ValueError as e:
        error_msg = str(e)
        if "暂未开放" in error_msg or "暂未配置" in error_msg or "生产环境必须" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_msg
            )
        if "过于频繁" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_msg
            )
        if "商家账号不存在" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )


# ============== 商品管理 API ==============

@router.get("/products")
def get_products(
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """获取当前商家的商品列表"""
    service = MerchantProductService(session)
    products = service.get_products(merchant_id)
    return [MerchantProductService.to_response(p) for p in products]


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """创建商品"""
    service = MerchantProductService(session)
    product = service.create_product(merchant_id, product_data.model_dump())
    return MerchantProductService.to_response(product)


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """更新商品"""
    service = MerchantProductService(session)
    product = service.update_product(merchant_id, product_id, product_data.model_dump(exclude_unset=True))
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商品不存在"
        )
    
    return MerchantProductService.to_response(product)


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """删除商品"""
    service = MerchantProductService(session)
    success = service.delete_product(merchant_id, product_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商品不存在"
        )
    
    return {"success": True}


@router.patch("/products/{product_id}/status")
def update_product_status(
    product_id: int,
    status_data: ProductStatusUpdate,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """上架/下架商品"""
    service = MerchantProductService(session)
    product = service.update_product_status(merchant_id, product_id, status_data.is_active)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商品不存在"
        )
    
    return MerchantProductService.to_response(product)


# ============== 品类管理 API ==============

@router.get("/categories", response_model=list[CategoryResponse])
def get_categories(
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """获取当前商家的品类列表"""
    service = CategoryService(session)
    categories = service.get_categories(merchant_id)
    return categories


# ============== 收益统计 API ==============

@router.get("/revenue/stats", response_model=RevenueStats)
def get_revenue_stats(
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """获取收益统计"""
    service = RevenueService(session)
    return service.get_stats(merchant_id)


# ============== 订单管理 API ==============

@router.get("/orders")
def get_orders(
    date: Optional[str] = None,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """获取订单列表"""
    service = MerchantOrderService(session)
    try:
        orders = service.get_orders(merchant_id, date)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    return {"orders": orders}


@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """更新订单状态"""
    service = MerchantOrderService(session)
    try:
        order = service.update_order_status(merchant_id, order_id, status_data.status)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在或不属于当前商家"
        )
    
    return order


# ============== 商家信息 API ==============

@router.get("/profile")
def get_merchant_profile(
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """获取商家信息（profile 别名）"""
    service = MerchantService(session)
    profile = service.get_profile(merchant_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    return profile


@router.get("/merchant/info")
def get_merchant_info(
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """获取商家信息"""
    service = MerchantService(session)
    info = service.get_info(merchant_id)
    
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    return info


@router.put("/merchant/info")
def update_merchant_info(
    update_data: MerchantUpdate,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """更新商家信息"""
    service = MerchantService(session)
    info = service.update_info(merchant_id, update_data.model_dump(exclude_unset=True))
    
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    return info