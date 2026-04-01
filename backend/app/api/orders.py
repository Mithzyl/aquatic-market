from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import json

from ..database import get_db
from ..models import Order
from ..schemas import OrderCreate, OrderResponse

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/", response_model=List[OrderResponse])
def get_orders(user_id: str, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.user_id == user_id).all()
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = Order(
        id=str(uuid.uuid4()),
        user_id=order.user_id,
        items_json=json.dumps([item.dict() for item in order.items]),
        total_amount=order.total_amount,
        status="pending",
        delivery_type=order.delivery_type,
        pickup_time=order.pickup_time,
        address=order.address
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.post("/{order_id}/pay")
def pay_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Order cannot be paid")
    
    order.status = "paid"
    db.commit()
    db.refresh(order)
    return {"message": "Payment successful", "order": order}

@router.post("/{order_id}/cancel")
def cancel_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status not in ["pending", "paid"]:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")
    
    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return {"message": "Order cancelled", "order": order}
