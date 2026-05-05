"""
Customer Carousel Routes - 用户端轮播图路由（公开接口）

无需认证，返回当前启用的轮播图，按 sort_order 排序。
"""
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from shared.database import get_session
from shared.models import Carousel
from shared.schemas.carousel import CarouselResponse

router = APIRouter()


@router.get("/carousels", response_model=list[CarouselResponse])
def list_active_carousels(
    merchant_id: int = Query(default=1, ge=1, description="商家ID，默认为1"),
    session: Session = Depends(get_session),
):
    """
    获取指定商家的启用轮播图（公开接口，无需认证）。

    仅返回 is_active=True 的轮播图，按 sort_order 升序排列。
    """
    carousels = session.exec(
        select(Carousel)
        .where(
            Carousel.merchant_id == merchant_id,
            Carousel.is_active == True,
        )
        .order_by(Carousel.sort_order.asc())
    ).all()
    return [CarouselResponse.model_validate(c) for c in carousels]
