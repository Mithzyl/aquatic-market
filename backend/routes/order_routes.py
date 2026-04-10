"""
Order Routes - 订单路由定义
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from config.database import get_session
from config.dependencies import get_current_merchant_id_from_token
from services.order_service import OrderService
from schemas.order import OrderCreateRequest, OrderResponse, OrderItemResponse

router = APIRouter(prefix="/orders", tags=["订单"])


@router.get("")
def get_orders(
    merchant_id: int,
    session: Session = Depends(get_session)
):
    """获取订单列表，必须指定商家ID（防止数据泄露）"""
    from models import Order
    orders = session.exec(
        select(Order).where(Order.merchant_id == merchant_id)
    ).all()
    return orders


@router.get("/user/{user_id}")
def get_orders_by_user_id(
    user_id: int,
    merchant_id: int = Depends(get_current_merchant_id_from_token),
    session: Session = Depends(get_session)
):
    """
    获取当前商家的所有订单，包含完整订单明细
    
    安全要求：
    - 必须携带有效的 JWT Token
    - 只能访问自己的订单（user_id 必须等于认证的 merchant_id）
    """
    if merchant_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问该商家的订单"
        )
    
    service = OrderService(session)
    return service.get_orders_with_items(user_id)


@router.get("/{order_id}")
def get_order(
    order_id: int,
    session: Session = Depends(get_session)
):
    """获取单个订单详情"""
    service = OrderService(session)
    order = service.get_order_by_id(order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )
    
    # 获取订单明细
    items = service.get_order_items(order_id)
    
    return {
        "id": order.id,
        "merchant_id": order.merchant_id,
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


@router.post("")
def create_order(
    order_data: OrderCreateRequest,
    session: Session = Depends(get_session)
):
    """创建订单（包含订单明细）- 事务性操作"""
    service = OrderService(session)
    return service.create_order(order_data)
