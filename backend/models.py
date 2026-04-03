from sqlmodel import SQLModel, Field
from datetime import datetime

class Product(SQLModel, table=True):
    id: int = Field(primary_key=True, index=True)
    name: str = Field(..., index=True)
    description: str = Field(default="")
    price: float = Field(..., gt=0)
    image_url: str = Field(default="")
    category: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Order(SQLModel, table=True):
    id: int = Field(primary_key=True, index=True)
    customer_name: str = Field(...)
    customer_phone: str = Field(...)
    pickup_time: datetime = Field(...)
    total_amount: float = Field(..., gt=0)
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderItem(SQLModel, table=True):
    id: int = Field(primary_key=True, index=True)
    order_id: int = Field(..., foreign_key="order.id")
    product_id: int = Field(..., foreign_key="product.id")
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    subtotal: float = Field(..., gt=0)