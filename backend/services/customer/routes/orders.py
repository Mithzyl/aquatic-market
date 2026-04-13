"""
Order Routes - 订单路由定义（用户端）
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

# 导入共享模块
from shared.database import get_session
from shared.models import Order

# 导入服务层和 schema（从项目根目录）
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from services.order_service import OrderService
from schemas.order import OrderCreateRequest

router = APIRouter()


@router.get("/orders")
def get_orders(
    merchant_id: int,
    session: Session = Depends(get_session)
):
    """获取订单列表，必须指定商家ID（防止数据泄露）"""
    orders = session.exec(
        select(Order).where(Order.merchant_id == merchant_id)
    ).all()
    return orders


@router.get("/orders/{order_id}")
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


@router.post("/orders")
def create_order(
    order_data: OrderCreateRequest,
    session: Session = Depends(get_session)
):
    """创建订单（包含订单明细）- 事务性操作"""
    service = OrderService(session)
    return service.create_order(order_data)