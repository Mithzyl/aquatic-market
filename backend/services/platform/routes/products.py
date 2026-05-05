"""
Platform Product Routes - 平台端商品管理

提供平台管理员查看所有商家的商品：
- GET /products: 获取所有商家商品列表
- PATCH /products/{id}/status: 上架/下架商品
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlmodel import Session, select, func

import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from shared.database import get_session
from shared.models import Product, Merchant
from shared.auth import get_current_admin

router = APIRouter()


# ============== 请求/响应模型 ==============

class PatchStatusRequest(BaseModel):
    """上架/下架请求"""
    is_active: bool = Field(..., description="是否上架")


class ProductPlatformResponse(BaseModel):
    """商品响应（含商家信息）"""
    id: int
    merchant_id: int
    shop_name: str = ""
    name: str
    description: str = ""
    price: float
    image: str = ""
    category: str = ""
    stock: int = 0
    sales: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== API 端点 ==============

@router.get("/products")
def list_all_products(
    merchant_id: Optional[int] = Query(None, ge=1, description="按商家筛选"),
    is_active: Optional[bool] = Query(None, description="按上架状态筛选"),
    keyword: Optional[str] = Query(None, max_length=50, description="按名称搜索"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    """
    获取所有商家的商品列表（平台管理员视角）。

    支持按商家、上架状态、关键词筛选，分页返回。
    """
    conditions = []
    if merchant_id is not None:
        conditions.append(Product.merchant_id == merchant_id)
    if is_active is not None:
        conditions.append(Product.is_active == is_active)
    if keyword:
        conditions.append(Product.name.contains(keyword))

    # 总数
    total_query = select(func.count(Product.id))
    if conditions:
        total_query = total_query.where(*conditions)
    total = session.exec(total_query).one()

    # 分页查询
    query = select(Product).order_by(Product.merchant_id, Product.created_at.desc())
    if conditions:
        query = query.where(*conditions)
    query = query.offset((page - 1) * page_size).limit(page_size)
    products = session.exec(query).all()

    # 批量获取商家名称
    merchant_ids = list(set(p.merchant_id for p in products))
    merchants = {}
    if merchant_ids:
        merchant_list = session.exec(
            select(Merchant).where(Merchant.id.in_(merchant_ids))
        ).all()
        merchants = {m.id: m.shop_name or m.name for m in merchant_list}

    items = []
    for p in products:
        items.append(ProductPlatformResponse(
            id=p.id,
            merchant_id=p.merchant_id,
            shop_name=merchants.get(p.merchant_id, f"商家{p.merchant_id}"),
            name=p.name,
            description=p.description or "",
            price=p.price,
            image=p.image or "",
            category=p.category or "",
            stock=p.stock or 0,
            sales=p.sales or 0,
            is_active=p.is_active,
            created_at=p.created_at,
            updated_at=p.updated_at,
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/products/{product_id}/status")
def toggle_product_status(
    product_id: int,
    body: PatchStatusRequest,
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    """
    切换商品上架/下架状态（平台管理员可操作任意商家的商品）。
    """
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商品不存在",
        )

    product.is_active = body.is_active
    product.updated_at = datetime.utcnow()
    session.add(product)
    session.commit()
    session.refresh(product)
    return {"success": True, "is_active": product.is_active}
