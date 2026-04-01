from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Product schemas
class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    unit: str
    description: str
    image: str
    stock: int = 0
    is_new: bool = False
    freshness: str
    promotion_id: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: str
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Promotion schemas
class PromotionBase(BaseModel):
    product_id: str
    type: str
    discount: Optional[float] = None
    promotion_price: Optional[float] = None
    title: str
    description: Optional[str] = None
    start_date: str
    end_date: str

class PromotionCreate(PromotionBase):
    pass

class PromotionResponse(PromotionBase):
    id: str
    
    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    name: str
    phone: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    points: int = 0
    level: str = "normal"
    
    class Config:
        from_attributes = True

# Order item schemas
class OrderItemBase(BaseModel):
    product_id: str
    product_name: str
    price: float
    quantity: int
    unit: str

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    pass

# Order schemas
class OrderBase(BaseModel):
    items: List[OrderItemCreate]
    total_amount: float
    delivery_type: str
    pickup_time: Optional[str] = None
    address: Optional[str] = None

class OrderCreate(OrderBase):
    user_id: str

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: str  # JSON string
    total_amount: float
    status: str
    delivery_type: str
    pickup_time: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Cart schemas
class CartItemBase(BaseModel):
    product_id: str
    quantity: int

class CartItemCreate(CartItemBase):
    user_id: str

class CartItemResponse(CartItemBase):
    id: int
    user_id: str
    
    class Config:
        from_attributes = True
