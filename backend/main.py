from fastapi import FastAPI
from sqlmodel import SQLModel, create_engine, Session
from models import Product, Order, OrderItem
from datetime import datetime
import os
from dotenv import load_dotenv
from fastapi import Depends

# 加载环境变量
load_dotenv()

# 数据库连接
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aquatic_market.db")
# 移除 connect_args，因为 MySQL 连接器不支持 check_same_thread 参数
engine = create_engine(DATABASE_URL)

# 创建数据库表
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# 初始化 FastAPI 应用
app = FastAPI(title="海鲜零售预订系统", description="提供商品查询、价格查询、预订下单、订单管理等功能")

# 启动时创建数据库表
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

from fastapi import Depends

# 依赖项：获取数据库会话
def get_session():
    with Session(engine) as session:
        yield session

# 商品相关接口
@app.get("/products", tags=["商品"])
def get_products(session: Session = Depends(get_session)):
    products = session.query(Product).all()
    return products

@app.get("/products/{product_id}", tags=["商品"])
def get_product(product_id: int, session: Session = Depends(get_session)):
    product = session.query(Product).filter(Product.id == product_id).first()
    return product

@app.post("/products", tags=["商品"])
def create_product(product: Product, session: Session = Depends(get_session)):
    session.add(product)
    session.commit()
    session.refresh(product)
    return product

# 价格查询接口
@app.get("/products/price/search", tags=["价格查询"])
def search_products_by_price(min_price: float = 0, max_price: float = 1000, session: Session = Depends(get_session)):
    products = session.query(Product).filter(Product.price >= min_price, Product.price <= max_price).all()
    return products

@app.get("/products/price/category", tags=["价格查询"])
def get_products_by_category(category: str, session: Session = Depends(get_session)):
    products = session.query(Product).filter(Product.category == category).all()
    return products

# 订单相关接口
@app.get("/orders", tags=["订单"])
def get_orders(session: Session = Depends(get_session)):
    orders = session.query(Order).all()
    return orders

@app.get("/orders/{order_id}", tags=["订单"])
def get_order(order_id: int, session: Session = Depends(get_session)):
    order = session.query(Order).filter(Order.id == order_id).first()
    return order

@app.post("/orders", tags=["订单"])
def create_order(order: Order, session: Session = Depends(get_session)):
    # 确保 pickup_time 是 datetime 对象
    if isinstance(order.pickup_time, str):
        order.pickup_time = datetime.fromisoformat(order.pickup_time)
    session.add(order)
    session.commit()
    session.refresh(order)
    return order

# 根路径
@app.get("/")
def read_root():
    return {"message": "海鲜零售预订系统 API"}