from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..database import get_db
from ..models import Product, Promotion
from ..schemas import ProductCreate, ProductResponse, PromotionCreate, PromotionResponse

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=List[ProductResponse])
def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    
    if category:
        query = query.filter(Product.category == category)
    
    if search:
        query = query.filter(
            (Product.name.contains(search)) | 
            (Product.description.contains(search))
        )
    
    return query.all()

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(
        id=str(uuid.uuid4()),
        name=product.name,
        category=product.category,
        price=product.price,
        unit=product.unit,
        description=product.description,
        image=product.image,
        stock=product.stock,
        is_new=product.is_new,
        freshness=product.freshness,
        promotion_id=product.promotion_id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# Promotion endpoints
@router.get("/promotions/", response_model=List[PromotionResponse])
def get_promotions(db: Session = Depends(get_db)):
    return db.query(Promotion).all()

@router.post("/promotions/", response_model=PromotionResponse)
def create_promotion(promotion: PromotionCreate, db: Session = Depends(get_db)):
    db_promotion = Promotion(
        id=f"promo-{uuid.uuid4().hex[:8]}",
        product_id=promotion.product_id,
        type=promotion.type,
        discount=promotion.discount,
        promotion_price=promotion.promotion_price,
        title=promotion.title,
        description=promotion.description,
        start_date=promotion.start_date,
        end_date=promotion.end_date
    )
    db.add(db_promotion)
    db.commit()
    db.refresh(db_promotion)
    return db_promotion
