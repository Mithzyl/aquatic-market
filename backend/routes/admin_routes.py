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
- /api/admin/config       -> 商家配置管理

认证兼容：
- JWT 认证在两个路径下都能工作
- 使用相同的依赖注入 get_current_merchant_id_from_token
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from pydantic import BaseModel, Field as PydanticField

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
    CategoryCreate,
    CategoryUpdate,
    RevenueStats,
    MerchantUpdate,
    OrderStatusUpdate,
)

# 导入商家配置模型
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
from shared.models import MerchantConfig, Merchant

router = APIRouter(prefix="/api/admin", tags=["管理端（路径别名）"])


# ============== 认证相关 API ==============

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, http_request: Request, session: Session = Depends(get_session)):
    """
    管理端登录（路径别名 - 用户名 + 密码 + bcrypt）
    
    与 /api/merchant/login 功能完全相同。
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
            username=request.username,
            password=request.password,
            client_ip=client_ip
        )
        return LoginResponse(
            token=result["token"],
            merchant=MerchantInfo(**result["merchant"])
        )
    except ValueError as e:
        error_msg = str(e)
        # 限流返回 429
        if "过于频繁" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_msg
            )
        # 禁用返回 403
        if "已被禁用" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )
        # 其他业务错误返回 400
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


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    request: CategoryCreate,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """
    创建品类

    权限：商家登录即可（通过 JWT Token 自动识别商家）
    """
    service = CategoryService(session)
    category = service.create_category(merchant_id, request.model_dump())
    return category


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    request: CategoryUpdate,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """
    更新品类

    只更新传入的非 None 字段
    """
    service = CategoryService(session)
    category = service.update_category(merchant_id, category_id, request.model_dump(exclude_unset=True, exclude_none=True))
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="品类不存在或不属于当前商家"
        )
    return category


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """
    删除品类

    检查是否有关联商品，有则拒绝删除
    """
    service = CategoryService(session)
    result = service.delete_category(merchant_id, category_id)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    return {"success": True, "message": result["message"]}


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


# ============== 配置管理 API ==============

class ConfigResponse(BaseModel):
    """商家配置响应"""
    id: int = PydanticField(..., description="配置ID")
    merchant_id: int = PydanticField(..., description="商家ID")
    shop_name: str = PydanticField(..., description="店铺名称")
    shop_logo: str = PydanticField(default="", description="店铺Logo URL")
    contact_phone: str = PydanticField(default="", description="联系电话")
    contact_wechat: str = PydanticField(default="", description="联系微信")
    address: str = PydanticField(default="", description="店铺地址")
    business_hours: str = PydanticField(default="", description="营业时间")
    announcement: str = PydanticField(default="", description="店铺公告")
    theme_color: str = PydanticField(default="#1890ff", description="主题色")
    enable_ordering: bool = PydanticField(default=True, description="是否开启下单功能")
    enable_pickup: bool = PydanticField(default=True, description="是否开启自提功能")
    min_order_amount: float = PydanticField(default=0, description="最低订单金额")
    created_at: datetime = PydanticField(..., description="创建时间")
    updated_at: datetime = PydanticField(..., description="更新时间")


class ConfigUpdate(BaseModel):
    """更新商家配置请求"""
    shop_name: Optional[str] = PydanticField(None, max_length=100, description="店铺名称")
    shop_logo: Optional[str] = PydanticField(None, max_length=500, description="店铺Logo URL")
    contact_phone: Optional[str] = PydanticField(None, max_length=20, description="联系电话")
    contact_wechat: Optional[str] = PydanticField(None, max_length=50, description="联系微信")
    address: Optional[str] = PydanticField(None, max_length=200, description="店铺地址")
    business_hours: Optional[str] = PydanticField(None, max_length=100, description="营业时间")
    announcement: Optional[str] = PydanticField(None, max_length=500, description="店铺公告")
    theme_color: Optional[str] = PydanticField(None, max_length=20, description="主题色")
    enable_ordering: Optional[bool] = PydanticField(None, description="是否开启下单功能")
    enable_pickup: Optional[bool] = PydanticField(None, description="是否开启自提功能")
    min_order_amount: Optional[float] = PydanticField(None, ge=0, description="最低订单金额")


@router.get("/config", response_model=ConfigResponse)
def get_config(
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """
    获取商家配置
    
    返回当前商家的店铺配置信息，包括店铺名称、Logo、联系方式、营业时间等。
    如果配置不存在，会自动创建默认配置。
    """
    # 查询商家配置
    config = session.exec(
        select(MerchantConfig).where(MerchantConfig.merchant_id == merchant_id)
    ).first()
    
    # 如果配置不存在，创建默认配置
    if not config:
        config = MerchantConfig.get_default_config(merchant_id)
        session.add(config)
        session.commit()
        session.refresh(config)
    
    return ConfigResponse(
        id=config.id,
        merchant_id=config.merchant_id,
        shop_name=config.shop_name,
        shop_logo=config.shop_logo,
        contact_phone=config.contact_phone,
        contact_wechat=config.contact_wechat,
        address=config.address,
        business_hours=config.business_hours,
        announcement=config.announcement,
        theme_color=config.theme_color,
        enable_ordering=config.enable_ordering,
        enable_pickup=config.enable_pickup,
        min_order_amount=config.min_order_amount,
        created_at=config.created_at,
        updated_at=config.updated_at
    )


@router.put("/config", response_model=ConfigResponse)
def update_config(
    update_data: ConfigUpdate,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """
    更新商家配置
    
    更新当前商家的店铺配置信息。只更新请求中提供的字段，其他字段保持不变。
    如果配置不存在，会自动创建默认配置后再更新。
    """
    # 查询商家配置
    config = session.exec(
        select(MerchantConfig).where(MerchantConfig.merchant_id == merchant_id)
    ).first()
    
    # 如果配置不存在，创建默认配置
    if not config:
        config = MerchantConfig.get_default_config(merchant_id)
        session.add(config)
        session.commit()
        session.refresh(config)
    
    # 更新配置字段
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(config, key, value)
    
    # 更新时间戳
    config.updated_at = datetime.utcnow()
    
    session.add(config)
    session.commit()
    session.refresh(config)
    
    return ConfigResponse(
        id=config.id,
        merchant_id=config.merchant_id,
        shop_name=config.shop_name,
        shop_logo=config.shop_logo,
        contact_phone=config.contact_phone,
        contact_wechat=config.contact_wechat,
        address=config.address,
        business_hours=config.business_hours,
        announcement=config.announcement,
        theme_color=config.theme_color,
        enable_ordering=config.enable_ordering,
        enable_pickup=config.enable_pickup,
        min_order_amount=config.min_order_amount,
        created_at=config.created_at,
        updated_at=config.updated_at
    )