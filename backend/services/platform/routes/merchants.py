"""
Merchant Management Routes - 商家管理路由

提供商家管理功能：
- GET /merchants: 获取商家列表
- GET /merchants/{id}: 获取商家详情
- PUT /merchants/{id}/status: 更新商家状态（启用/禁用）
- GET /merchants/{id}/orders: 获取商家订单
- GET /merchants/{id}/products: 获取商家商品
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlmodel import Session, select

# 导入共享模块
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from shared.database import get_session
from shared.models import Merchant, Product, Order, OrderItem
from shared.auth import get_current_admin, require_admin_permission
from shared.schemas.base import PaginatedResponse, PaginationMeta

router = APIRouter()


# ============== 请求/响应模型 ==============

class MerchantResponse(BaseModel):
    """商家信息响应"""
    id: int
    name: str
    phone: str
    wechat_openid: str
    shop_name: str
    role_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MerchantListResponse(BaseModel):
    """商家列表响应"""
    merchants: List[MerchantResponse]
    total: int


class MerchantStatusUpdate(BaseModel):
    """商家状态更新请求"""
    is_active: bool = Field(..., description="是否启用")
    reason: Optional[str] = Field(default=None, description="操作原因")


class MerchantDetailResponse(BaseModel):
    """商家详情响应"""
    id: int
    name: str
    phone: str
    wechat_openid: str
    shop_name: str
    role_id: int
    created_at: datetime
    updated_at: datetime
    # 统计信息
    product_count: int = Field(default=0, description="商品数量")
    order_count: int = Field(default=0, description="订单数量")
    
    class Config:
        from_attributes = True


# ============== API 端点 ==============

@router.get("/merchants", response_model=MerchantListResponse)
def get_merchants(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(default=None, description="搜索关键词"),
    is_active: Optional[bool] = Query(default=None, description="状态筛选"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取商家列表（分页）
    
    支持按关键词搜索和状态筛选
    """
    # 构建查询
    statement = select(Merchant)
    count_statement = select(Merchant)
    
    # 关键词搜索
    if keyword:
        statement = statement.where(
            (Merchant.name.contains(keyword)) |
            (Merchant.shop_name.contains(keyword)) |
            (Merchant.phone.contains(keyword))
        )
        count_statement = count_statement.where(
            (Merchant.name.contains(keyword)) |
            (Merchant.shop_name.contains(keyword)) |
            (Merchant.phone.contains(keyword))
        )
    
    # 状态筛选
    if is_active is not None:
        # 注意：当前 Merchant 模型没有 is_active 字段
        # 这里预留接口，后续可扩展
        pass
    
    # 统计总数
    merchants = session.exec(statement).all()
    total = len(merchants)
    
    # 分页
    offset = (page - 1) * page_size
    paginated_statement = statement.offset(offset).limit(page_size)
    merchants = session.exec(paginated_statement).all()
    
    return MerchantListResponse(
        merchants=[MerchantResponse.model_validate(m) for m in merchants],
        total=total
    )


@router.get("/merchants/{merchant_id}", response_model=MerchantDetailResponse)
def get_merchant(
    merchant_id: int,
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取商家详情
    
    包含商品数量、订单数量等统计信息
    """
    # 查询商家
    merchant = session.get(Merchant, merchant_id)
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # 统计商品数量
    product_count = len(session.exec(
        select(Product).where(Product.merchant_id == merchant_id)
    ).all())
    
    # 统计订单数量
    order_count = len(session.exec(
        select(Order).where(Order.merchant_id == merchant_id)
    ).all())
    
    return MerchantDetailResponse(
        id=merchant.id,
        name=merchant.name,
        phone=merchant.phone,
        wechat_openid=merchant.wechat_openid,
        shop_name=merchant.shop_name,
        role_id=merchant.role_id,
        created_at=merchant.created_at,
        updated_at=merchant.updated_at,
        product_count=product_count,
        order_count=order_count
    )


@router.put("/merchants/{merchant_id}/status")
def update_merchant_status(
    merchant_id: int,
    request: MerchantStatusUpdate,
    admin: dict = Depends(require_admin_permission("merchant:update")),
    session: Session = Depends(get_session)
):
    """
    更新商家状态（启用/禁用）
    
    需要权限：merchant:update
    
    注意：当前 Merchant 模型没有 is_active 字段
    此接口为预留接口，后续可扩展
    """
    merchant = session.get(Merchant, merchant_id)
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # TODO: 实现 Merchant 的 is_active 字段后启用此功能
    # merchant.is_active = request.is_active
    # merchant.updated_at = datetime.utcnow()
    # session.add(merchant)
    # session.commit()
    
    return {
        "success": True,
        "message": f"商家状态已{'启用' if request.is_active else '禁用'}",
        "note": "当前版本 Merchant 模型未实现 is_active 字段，此操作为预留接口"
    }


@router.get("/merchants/{merchant_id}/orders")
def get_merchant_orders(
    merchant_id: int,
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(default=None, description="订单状态筛选"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取商家订单列表
    
    支持按状态筛选
    """
    merchant = session.get(Merchant, merchant_id)
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # 构建查询
    statement = select(Order).where(Order.merchant_id == merchant_id)
    
    if status:
        statement = statement.where(Order.status == status)
    
    # 按创建时间倒序
    statement = statement.order_by(Order.created_at.desc())
    
    # 统计总数
    orders = session.exec(statement).all()
    total = len(orders)
    
    # 分页
    offset = (page - 1) * page_size
    paginated_statement = statement.offset(offset).limit(page_size)
    orders = session.exec(paginated_statement).all()
    
    return {
        "orders": [
            {
                "id": o.id,
                "customer_name": o.customer_name,
                "customer_phone": o.customer_phone,
                "pickup_time": o.pickup_time.isoformat(),
                "total_amount": o.total_amount,
                "status": o.status,
                "created_at": o.created_at.isoformat()
            }
            for o in orders
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/merchants/{merchant_id}/products")
def get_merchant_products(
    merchant_id: int,
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    is_active: Optional[bool] = Query(default=None, description="状态筛选"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取商家商品列表
    
    支持按状态筛选
    """
    merchant = session.get(Merchant, merchant_id)
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # 构建查询
    statement = select(Product).where(Product.merchant_id == merchant_id)
    
    if is_active is not None:
        statement = statement.where(Product.is_active == is_active)
    
    # 按创建时间倒序
    statement = statement.order_by(Product.created_at.desc())
    
    # 统计总数
    products = session.exec(statement).all()
    total = len(products)
    
    # 分页
    offset = (page - 1) * page_size
    paginated_statement = statement.offset(offset).limit(page_size)
    products = session.exec(paginated_statement).all()
    
    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "stock": p.stock,
                "sales": p.sales,
                "category": p.category,
                "is_active": p.is_active,
                "created_at": p.created_at.isoformat()
            }
            for p in products
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }