"""
Product Routes - 商品路由定义
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from config.database import get_session
from config.dependencies import get_current_merchant_id_from_token
from services.product_service import ProductService
from schemas.product import ProductResponse

router = APIRouter(prefix="/products", tags=["商品"])


@router.get("", response_model=list[ProductResponse])
def get_products(
    merchant_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """获取商品列表，支持按商家筛选"""
    service = ProductService(session)
    products = service.get_all_products(merchant_id)
    return [ProductService.to_response(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    session: Session = Depends(get_session)
):
    """获取单个商品详情"""
    service = ProductService(session)
    product = service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商品不存在"
        )
    return ProductService.to_response(product)


@router.get("/price/search", response_model=list[ProductResponse])
def search_products_by_price(
    min_price: float = 0,
    max_price: float = 1000,
    merchant_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """按价格范围搜索商品"""
    service = ProductService(session)
    products = service.search_by_price(min_price, max_price, merchant_id)
    return [ProductService.to_response(p) for p in products]


@router.get("/price/category", response_model=list[ProductResponse])
def get_products_by_category(
    category: str,
    merchant_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """按品类获取商品"""
    service = ProductService(session)
    products = service.search_by_category(category, merchant_id)
    return [ProductService.to_response(p) for p in products]
