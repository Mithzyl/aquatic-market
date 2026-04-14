"""
Order Routes - 订单路由定义（用户端）
支持用户认证，从Token获取user_id
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

# 导入共享模块
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from shared.database import get_session
from shared.models import Order
from shared.auth import get_user_id, get_current_user

# 导入服务层和 schema
from services.order_service import OrderService
from schemas.order import OrderCreateRequest, OrderResponse

router = APIRouter()


@router.get("/orders")
def get_orders(
    merchant_id: int,
    session: Session = Depends(get_session)
):
    """获取订单列表（按商家）- 无需认证"""
    orders = session.exec(
        select(Order).where(Order.merchant_id == merchant_id)
    ).all()
    return orders


@router.get("/orders/me", response_model=list[OrderResponse])
def get_my_orders(
    user_id: int = Depends(get_user_id),
    session: Session = Depends(get_session)
):
    """获取当前用户的订单列表 - 需要认证"""
    service = OrderService(session)
    orders = service.get_orders_with_items_by_user(user_id)
    return orders


@router.get("/orders/{order_id}")
def get_order(
    order_id: int,
    user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """获取单个订单详情 - 需要认证"""
    service = OrderService(session)
    order = service.get_order_by_id(order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )
    
    # 验证订单归属（用户只能查看自己的订单）
    if order.user_id and order.user_id != user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查看此订单"
        )
    
    # 获取订单明细
    items = service.get_order_items(order_id)
    
    return {
        "id": order.id,
        "merchant_id": order.merchant_id,
        "user_id": order.user_id,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "pickup_time": order.pickup_time,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal
            }
            for item in items
        ]
    }


@router.post("/orders")
def create_order(
    order_data: OrderCreateRequest,
    user_id: int = Depends(get_user_id),
    session: Session = Depends(get_session)
):
    """创建订单（包含订单明细）- 需要认证，user_id从Token获取"""
    service = OrderService(session)
    return service.create_order(order_data, user_id=user_id)