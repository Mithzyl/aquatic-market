"""
Category Routes - 分类路由定义（用户端）
"""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session

from config.database import get_session
from services.product_service import CategoryService
from schemas.product import CategoryResponse

router = APIRouter(tags=["分类"])


@router.get("/categories", response_model=list[CategoryResponse])
def get_categories(
    merchant_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """
    获取分类列表
    
    返回字段：id（字符串 slug）、name、icon、order
    与前端 retailCategories 结构兼容
    
    示例响应：
    [
        {"id": "shrimp", "name": "虾类", "icon": "🦐", "order": 1},
        {"id": "crab", "name": "蟹类", "icon": "🦀", "order": 2},
        {"id": "fish", "name": "鱼类", "icon": "🐟", "order": 3},
        {"id": "shell", "name": "贝类", "icon": "🦪", "order": 4},
        {"id": "lobster", "name": "龙虾", "icon": "🦞", "order": 5}
    ]
    """
    service = CategoryService(session)
    return service.get_categories(merchant_id)