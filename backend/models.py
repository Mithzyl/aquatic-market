from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Merchant(SQLModel, table=True):
    """商家模型"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="", max_length=100)
    phone: str = Field(default="", max_length=20)
    wechat_openid: str = Field(default="", max_length=100, unique=True)
    shop_name: str = Field(default="", max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Product(SQLModel, table=True):
    """商品模型 - 支持商家数据隔离"""
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    merchant_id: int = Field(default=1, foreign_key="merchant.id", index=True)
    name: str = Field(..., index=True, max_length=100)
    description: str = Field(default="", max_length=500)
    price: float = Field(..., gt=0)
    image_url: str = Field(default="", max_length=500)
    category: str = Field(default="", max_length=50)
    stock: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Order(SQLModel, table=True):
    """订单模型 - 支持商家数据隔离"""
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    merchant_id: int = Field(default=1, foreign_key="merchant.id", index=True)
    customer_name: str = Field(..., max_length=100)
    customer_phone: str = Field(..., max_length=20)
    pickup_time: datetime = Field(...)
    total_amount: float = Field(..., gt=0)
    status: str = Field(default="pending", max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderItem(SQLModel, table=True):
    """订单明细模型"""
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    order_id: int = Field(..., foreign_key="order.id")
    product_id: int = Field(..., foreign_key="product.id")
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    subtotal: float = Field(..., gt=0)

class Category(SQLModel, table=True):
    """品类模型 - 支持商家数据隔离"""
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    merchant_id: int = Field(default=1, foreign_key="merchant.id", index=True)
    name: str = Field(..., max_length=50)
    icon: str = Field(default="", max_length=100)
    order: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)