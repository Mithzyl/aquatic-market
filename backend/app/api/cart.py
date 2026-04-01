from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import CartItem, Product
from ..schemas import CartItemCreate, CartItemResponse

router = APIRouter(prefix="/cart", tags=["cart"])

@router.get("/", response_model=List[CartItemResponse])
def get_cart(user_id: str, db: Session = Depends(get_db)):
    return db.query(CartItem).filter(CartItem.user_id == user_id).all()

@router.post("/add")
def add_to_cart(item: CartItemCreate, db: Session = Depends(get_db)):
    # Check if item already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.user_id == item.user_id,
        CartItem.product_id == item.product_id
    ).first()
    
    if existing_item:
        existing_item.quantity += item.quantity
        db.commit()
        db.refresh(existing_item)
        return {"message": "Quantity updated", "item": existing_item}
    
    # Create new cart item
    db_item = CartItem(
        user_id=item.user_id,
        product_id=item.product_id,
        quantity=item.quantity
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return {"message": "Item added to cart", "item": db_item}

@router.put("/{item_id}")
def update_cart_item(item_id: int, quantity: int, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if quantity <= 0:
        db.delete(item)
        db.commit()
        return {"message": "Item removed from cart"}
    
    item.quantity = quantity
    db.commit()
    db.refresh(item)
    return {"message": "Cart updated", "item": item}

@router.delete("/{item_id}")
def remove_from_cart(item_id: int, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Item removed from cart"}

@router.delete("/clear")
def clear_cart(user_id: str, db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()
    return {"message": "Cart cleared"}
