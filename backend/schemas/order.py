"""
Order Schema - 订单请求/响应数据结构
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field as PydanticField


class OrderItemRequest(BaseModel):
    """订单明细请求"""
    product_id: int
    quantity: int = PydanticField(..., gt=0, description="数量必须大于0")


class OrderCreateRequest(BaseModel):
    """用户端创建订单请求"""
    merchant_id: int = PydanticField(default=1, description="商家ID")
    customer_name: str = PydanticField(..., max_length=100, description="客户姓名")
    customer_phone: str = PydanticField(..., max_length=20, description="客户电话")
    pickup_time: datetime = PydanticField(..., description="取货时间")
    items: List[OrderItemRequest] = PydanticField(default=[], description="订单明细")


class OrderItemResponse(BaseModel):
    """订单明细响应"""
    id: int
    product_id: int
    name: Optional[str] = None
    quantity: int
    price: float
    unit_price: float
    subtotal: float
    
    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    """订单响应"""
    id: int
    merchant_id: int
    customer_name: str
    customer_phone: str
    pickup_time: datetime
    total_amount: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []
    
    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    """订单状态更新请求"""
    status: str = PydanticField(
        ...,
        description="订单状态: pending/confirmed/preparing/ready/completed/cancelled"
    )
