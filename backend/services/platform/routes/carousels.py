"""
Platform Carousel Routes - 平台端轮播图管理

提供平台管理员查看所有商家的轮播图：
- GET /carousels: 获取所有商家轮播图列表
- DELETE /carousels/{id}: 删除指定轮播图
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
from shared.models import Carousel, Merchant
from shared.auth import get_current_admin
from shared.qiniu_storage import delete_file as qiniu_delete_file

router = APIRouter()


# ============== 请求/响应模型 ==============

class CarouselPlatformResponse(BaseModel):
    """轮播图响应（含商家信息）"""
    id: int
    merchant_id: int
    shop_name: str = ""
    title: str
    image_url: str
    link_url: str = ""
    sort_order: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== API 端点 ==============

@router.get("/carousels")
def list_all_carousels(
    merchant_id: Optional[int] = Query(None, ge=1, description="按商家筛选"),
    is_active: Optional[bool] = Query(None, description="按启用状态筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    """
    获取所有商家的轮播图列表（平台管理员视角）。

    支持按商家ID和启用状态筛选，分页返回。
    """
    # 构建查询
    conditions = []
    if merchant_id is not None:
        conditions.append(Carousel.merchant_id == merchant_id)
    if is_active is not None:
        conditions.append(Carousel.is_active == is_active)

    # 总数
    total_query = select(func.count(Carousel.id))
    if conditions:
        total_query = total_query.where(*conditions)
    total = session.exec(total_query).one()

    # 分页查询
    query = select(Carousel).order_by(Carousel.merchant_id, Carousel.sort_order)
    if conditions:
        query = query.where(*conditions)
    query = query.offset((page - 1) * page_size).limit(page_size)
    carousels = session.exec(query).all()

    # 批量获取商家名称
    merchant_ids = list(set(c.merchant_id for c in carousels))
    merchants = {}
    if merchant_ids:
        merchant_list = session.exec(
            select(Merchant).where(Merchant.id.in_(merchant_ids))
        ).all()
        merchants = {m.id: m.shop_name or m.name for m in merchant_list}

    items = []
    for c in carousels:
        items.append(CarouselPlatformResponse(
            id=c.id,
            merchant_id=c.merchant_id,
            shop_name=merchants.get(c.merchant_id, f"商家{c.merchant_id}"),
            title=c.title,
            image_url=c.image_url,
            link_url=c.link_url,
            sort_order=c.sort_order,
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at,
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.delete("/carousels/{carousel_id}")
def delete_carousel_by_admin(
    carousel_id: int,
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    """
    删除指定轮播图（平台管理员可删除任意商家的轮播图）。

    同时删除七牛云上的文件。
    """
    carousel = session.get(Carousel, carousel_id)
    if not carousel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="轮播图不存在",
        )

    # 删除七牛云文件
    if carousel.image_url:
        try:
            key = carousel.image_url.split("://", 1)[1].split("/", 1)[1] if "://" in carousel.image_url else ""
            if key:
                qiniu_delete_file(key)
        except Exception:
            pass

    session.delete(carousel)
    session.commit()
    return {"success": True}
