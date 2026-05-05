"""
Carousel Routes - 轮播图路由定义（商家端）

提供商家端轮播图 CRUD：创建、查询、更新、删除、启用/禁用。
所有接口需要 JWT 认证，仅能操作自己商家的轮播图。
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from config.database import get_session
from config.dependencies import get_current_merchant_id_from_token
from shared.models import Carousel
from shared.qiniu_storage import delete_file as qiniu_delete_file
from shared.schemas.carousel import CarouselCreate, CarouselUpdate, CarouselResponse

router = APIRouter(prefix="/api/merchant", tags=["轮播图管理"])


@router.get("/carousels", response_model=list[CarouselResponse])
def list_carousels(
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session),
):
    """
    获取当前商家的所有轮播图，按 sort_order 升序排列。
    """
    carousels = session.exec(
        select(Carousel)
        .where(Carousel.merchant_id == merchant_id)
        .order_by(Carousel.sort_order.asc())
    ).all()
    return [CarouselResponse.model_validate(c) for c in carousels]


@router.post("/carousels", status_code=status.HTTP_201_CREATED, response_model=CarouselResponse)
def create_carousel(
    data: CarouselCreate,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session),
):
    """
    创建轮播图。
    """
    carousel = Carousel(
        merchant_id=merchant_id,
        title=data.title,
        image_url=data.image_url,
        link_url=data.link_url,
        sort_order=data.sort_order,
        is_active=True,
    )
    session.add(carousel)
    session.commit()
    session.refresh(carousel)
    return CarouselResponse.model_validate(carousel)


@router.put("/carousels/{carousel_id}", response_model=CarouselResponse)
def update_carousel(
    carousel_id: int,
    data: CarouselUpdate,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session),
):
    """
    更新轮播图（仅更新提供的字段）。
    """
    carousel = session.exec(
        select(Carousel).where(
            Carousel.id == carousel_id,
            Carousel.merchant_id == merchant_id,
        )
    ).first()

    if not carousel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="轮播图不存在或不属于当前商家",
        )

    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(carousel, key, value)

    carousel.updated_at = datetime.utcnow()
    session.add(carousel)
    session.commit()
    session.refresh(carousel)
    return CarouselResponse.model_validate(carousel)


@router.delete("/carousels/{carousel_id}")
def delete_carousel(
    carousel_id: int,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session),
):
    """
    删除轮播图，同时删除七牛云上的文件。
    """
    carousel = session.exec(
        select(Carousel).where(
            Carousel.id == carousel_id,
            Carousel.merchant_id == merchant_id,
        )
    ).first()

    if not carousel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="轮播图不存在或不属于当前商家",
        )

    # 从 image_url 提取七牛云 key
    # image_url 格式：https://{domain}/{key}
    if carousel.image_url:
        # 提取 key 部分（域名后的路径）
        try:
            key = carousel.image_url.split("://", 1)[1].split("/", 1)[1] if "://" in carousel.image_url else ""
            if key:
                qiniu_delete_file(key)
        except Exception:
            pass  # 删除文件失败不阻塞数据库操作

    session.delete(carousel)
    session.commit()
    return {"success": True}


@router.patch("/carousels/{carousel_id}/toggle", response_model=CarouselResponse)
def toggle_carousel(
    carousel_id: int,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session),
):
    """
    启用/禁用轮播图（切换 is_active 状态）。
    """
    carousel = session.exec(
        select(Carousel).where(
            Carousel.id == carousel_id,
            Carousel.merchant_id == merchant_id,
        )
    ).first()

    if not carousel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="轮播图不存在或不属于当前商家",
        )

    carousel.is_active = not carousel.is_active
    carousel.updated_at = datetime.utcnow()
    session.add(carousel)
    session.commit()
    session.refresh(carousel)
    return CarouselResponse.model_validate(carousel)
