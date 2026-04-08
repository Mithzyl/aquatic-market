from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, create_engine, Session, select
from models import Product, Order, OrderItem, Merchant, Category
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field as PydanticField
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

# 配置 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 启动时创建数据库表
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# 注册商家端路由
from admin_routes import router as admin_router
app.include_router(admin_router)

# 依赖项：获取数据库会话
def get_session():
    with Session(engine) as session:
        yield session


# ============== 用户端请求/响应模型 ==============

class OrderCreateRequest(BaseModel):
    """用户端创建订单请求"""
    merchant_id: int = PydanticField(default=1, description="商家ID")
    customer_name: str = PydanticField(..., max_length=100)
    customer_phone: str = PydanticField(..., max_length=20)
    pickup_time: datetime
    items: List["OrderItemRequest"] = []


class OrderItemRequest(BaseModel):
    """订单明细请求"""
    product_id: int
    quantity: int = PydanticField(..., gt=0)


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
    items: List[dict] = []


# ============== 用户端商品接口 ==============

@app.get("/products", tags=["商品"])
def get_products(
    merchant_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """获取商品列表，支持按商家筛选"""
    if merchant_id:
        products = session.exec(
            select(Product).where(Product.merchant_id == merchant_id, Product.is_active == True)
        ).all()
    else:
        # 默认返回所有上架商品
        products = session.exec(
            select(Product).where(Product.is_active == True)
        ).all()
    return products


@app.get("/products/{product_id}", tags=["商品"])
def get_product(product_id: int, session: Session = Depends(get_session)):
    """获取单个商品详情"""
    product = session.exec(
        select(Product).where(Product.id == product_id)
    ).first()
    if not product:
        return {"error": "商品不存在"}
    return product


# ============== 用户端价格查询接口 ==============

@app.get("/products/price/search", tags=["价格查询"])
def search_products_by_price(
    min_price: float = 0,
    max_price: float = 1000,
    merchant_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """按价格范围搜索商品"""
    query = select(Product).where(
        Product.price >= min_price,
        Product.price <= max_price,
        Product.is_active == True
    )
    if merchant_id:
        query = query.where(Product.merchant_id == merchant_id)
    
    products = session.exec(query).all()
    return products


@app.get("/products/price/category", tags=["价格查询"])
def get_products_by_category(
    category: str,
    merchant_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """按品类获取商品"""
    query = select(Product).where(
        Product.category == category,
        Product.is_active == True
    )
    if merchant_id:
        query = query.where(Product.merchant_id == merchant_id)
    
    products = session.exec(query).all()
    return products


# ============== 用户端订单接口 ==============

@app.get("/orders", tags=["订单"])
def get_orders(
    merchant_id: int,
    session: Session = Depends(get_session)
):
    """获取订单列表，必须指定商家ID（防止数据泄露）"""
    # 安全要求：强制要求 merchant_id 参数，防止跨商家数据泄露
    orders = session.exec(
        select(Order).where(Order.merchant_id == merchant_id)
    ).all()
    return orders


@app.get("/orders/{order_id}", tags=["订单"])
def get_order(order_id: int, session: Session = Depends(get_session)):
    """获取单个订单详情"""
    order = session.exec(
        select(Order).where(Order.id == order_id)
    ).first()
    if not order:
        return {"error": "订单不存在"}
    
    # 获取订单明细
    items = session.exec(
        select(OrderItem).where(OrderItem.order_id == order_id)
    ).all()
    
    return {
        "id": order.id,
        "merchant_id": order.merchant_id,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "pickup_time": order.pickup_time,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal
            }
            for item in items
        ]
    }


@app.post("/orders", tags=["订单"])
def create_order(order_data: OrderCreateRequest, session: Session = Depends(get_session)):
    """创建订单（包含订单明细）- 事务性操作
    
    整个订单创建流程在一个事务中完成：
    1. 验证商品存在性和库存
    2. 创建订单主表
    3. 创建订单明细
    4. 扣减库存
    5. 统一提交事务
    
    任何步骤失败都会回滚，确保数据一致性。
    """
    now = datetime.utcnow()
    
    # 计算订单总金额并预验证
    total_amount = 0.0
    order_items_data = []
    
    for item_req in order_data.items:
        # 获取商品信息
        product = session.exec(
            select(Product).where(Product.id == item_req.product_id)
        ).first()
        
        if not product:
            # 商品不存在，返回错误（此时还没有任何数据库修改，无需回滚）
            return {"error": f"商品 {item_req.product_id} 不存在"}
        
        if not product.is_active:
            return {"error": f"商品 {item_req.product_id} 已下架"}
        
        if product.stock < item_req.quantity:
            return {"error": f"商品 {item_req.product_id} 库存不足"}
        
        subtotal = product.price * item_req.quantity
        total_amount += subtotal
        
        order_items_data.append({
            "product_id": product.id,
            "quantity": item_req.quantity,
            "unit_price": product.price,
            "subtotal": subtotal
        })
    
    try:
        # 创建订单主表
        order = Order(
            merchant_id=order_data.merchant_id,
            customer_name=order_data.customer_name,
            customer_phone=order_data.customer_phone,
            pickup_time=order_data.pickup_time,
            total_amount=total_amount,
            status="pending",
            created_at=now,
            updated_at=now
        )
        session.add(order)
        # 刷新以获取 order.id，但不提交事务
        session.flush()
        
        # 创建订单明细并更新库存
        for item_data in order_items_data:
            # 创建订单明细
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                subtotal=item_data["subtotal"]
            )
            session.add(order_item)
            
            # 更新库存
            product = session.exec(
                select(Product).where(Product.id == item_data["product_id"])
            ).first()
            product.stock -= item_data["quantity"]
            session.add(product)
        
        # 统一提交事务：Order、OrderItem 和库存更新要么全部成功，要么全部回滚
        session.commit()
        session.refresh(order)
        
        # 返回完整订单信息
        return {
            "id": order.id,
            "merchant_id": order.merchant_id,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "pickup_time": order.pickup_time,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "items": order_items_data
        }
    except Exception as e:
        # 发生异常时回滚事务
        session.rollback()
        return {"error": f"订单创建失败: {str(e)}"}


# ============== 根路径 ==============

@app.get("/")
def read_root():
    return {"message": "海鲜零售预订系统 API"}