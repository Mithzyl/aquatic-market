from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    price = Column(Float)
    unit = Column(String)
    description = Column(Text)
    image = Column(String)
    stock = Column(Integer, default=0)
    is_new = Column(Boolean, default=False)
    freshness = Column(String)
    promotion_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(String, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.id"))
    type = Column(String)  # 'discount' or 'special'
    discount = Column(Float, nullable=True)
    promotion_price = Column(Float, nullable=True)
    title = Column(String)
    description = Column(String, nullable=True)
    start_date = Column(String)
    end_date = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String, unique=True, index=True)
    points = Column(Integer, default=0)
    level = Column(String, default="normal")  # 'normal', 'vip', 'premium'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    items_json = Column(Text)  # JSON string of order items
    total_amount = Column(Float)
    status = Column(String, default="pending")  # 'pending', 'paid', 'processing', 'completed', 'cancelled'
    delivery_type = Column(String)  # 'self-pickup' or 'delivery'
    pickup_time = Column(String, nullable=True)
    address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    product_id = Column(String, ForeignKey("products.id"))
    quantity = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
