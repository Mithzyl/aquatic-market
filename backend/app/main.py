from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uuid

from .database import engine, Base, SessionLocal
from .models import Product, Promotion
from .api import products, users, orders, cart

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="水产菜市 API",
    description="水产菜市Web应用后端API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(cart.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "水产菜市 API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Initialize sample data
@app.on_event("startup")
def init_sample_data():
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(Product).count() > 0:
        db.close()
        return
    
    # Create sample products
    sample_products = [
        Product(
            id="1",
            name="新鲜海虾",
            category="虾类",
            price=68.8,
            unit="斤",
            description="今日上岸，新鲜直达",
            image="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20sea%20shrimp%20in%20ice%20at%20market&image_size=landscape_4_3",
            stock=50,
            is_new=True,
            freshness="今日上岸",
            promotion_id="promo-1"
        ),
        Product(
            id="2",
            name="大闸蟹",
            category="蟹类",
            price=128.0,
            unit="只",
            description="阳澄湖大闸蟹，肉质鲜美",
            image="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yangcheng%20lake%20crabs%20on%20ice&image_size=landscape_4_3",
            stock=30,
            is_new=False,
            freshness="暂养3天内",
            promotion_id="promo-2"
        ),
        Product(
            id="3",
            name="基围虾",
            category="虾类",
            price=48.8,
            unit="斤",
            description="肉质Q弹，适合白灼",
            image="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=jiwei%20shrimp%20in%20market&image_size=landscape_4_3",
            stock=45,
            is_new=False,
            freshness="今日上岸",
            promotion_id="promo-3"
        ),
        Product(
            id="4",
            name="帝王蟹",
            category="蟹类",
            price=398.0,
            unit="只",
            description="阿拉斯加帝王蟹，深海美味",
            image="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=alaskan%20king%20crab&image_size=landscape_4_3",
            stock=10,
            is_new=True,
            freshness="今日上岸",
            promotion_id="promo-4"
        )
    ]
    
    # Create sample promotions
    sample_promotions = [
        Promotion(
            id="promo-1",
            product_id="1",
            type="discount",
            discount=8.8,
            title="限时88折",
            description="新鲜海虾限时优惠",
            start_date="2026-01-01",
            end_date="2026-12-31"
        ),
        Promotion(
            id="promo-2",
            product_id="2",
            type="special",
            promotion_price=99.0,
            title="特价",
            description="大闸蟹限时特价",
            start_date="2026-01-01",
            end_date="2026-12-31"
        ),
        Promotion(
            id="promo-3",
            product_id="3",
            type="discount",
            discount=9.5,
            title="95折",
            description="基围虾专属优惠",
            start_date="2026-01-01",
            end_date="2026-12-31"
        ),
        Promotion(
            id="promo-4",
            product_id="4",
            type="special",
            promotion_price=358.0,
            title="直降40元",
            description="帝王蟹限时特惠",
            start_date="2026-01-01",
            end_date="2026-12-31"
        )
    ]
    
    # Add to database
    for product in sample_products:
        db.add(product)
    
    for promotion in sample_promotions:
        db.add(promotion)
    
    db.commit()
    db.close()
