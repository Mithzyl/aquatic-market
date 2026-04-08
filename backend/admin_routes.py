"""
商家端管理路由
提供商家登录、商品管理、品类管理、收益统计、商家信息等 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select, col
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field as PydanticField
from models import Merchant, Product, Order, OrderItem, Category
from auth import verify_token, get_merchant_id
import os

# 创建数据库引擎
from sqlmodel import create_engine
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aquatic_market.db")
engine = create_engine(DATABASE_URL)

# 创建路由器
router = APIRouter(prefix="/api/admin", tags=["商家端"])

# HTTP Bearer 认证方案
security = HTTPBearer()


# ============== 请求/响应模型 ==============

class LoginRequest(BaseModel):
    """登录请求"""
    code: Optional[str] = None
    phone: Optional[str] = None
    verify_code: Optional[str] = None


class LoginResponse(BaseModel):
    """登录响应"""
    token: str
    merchant: "MerchantInfo"


class MerchantInfo(BaseModel):
    """商家信息"""
    id: int
    name: str
    phone: str
    shop_name: str


class ProductCreate(BaseModel):
    """创建商品请求"""
    name: str = PydanticField(..., max_length=100)
    description: str = PydanticField(default="", max_length=500)
    price: float = PydanticField(..., gt=0)
    image_url: str = PydanticField(default="", max_length=500)
    category: str = PydanticField(default="", max_length=50)
    stock: int = PydanticField(default=0, ge=0)


class ProductUpdate(BaseModel):
    """更新商品请求"""
    name: Optional[str] = PydanticField(None, max_length=100)
    description: Optional[str] = PydanticField(None, max_length=500)
    price: Optional[float] = PydanticField(None, gt=0)
    image_url: Optional[str] = PydanticField(None, max_length=500)
    category: Optional[str] = PydanticField(None, max_length=50)
    stock: Optional[int] = PydanticField(None, ge=0)
    is_active: Optional[bool] = None


class ProductStatusUpdate(BaseModel):
    """商品状态更新请求"""
    is_active: bool


class ProductResponse(BaseModel):
    """商品响应"""
    id: int
    name: str
    description: str
    price: float
    image_url: str
    category: str
    stock: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CategoryResponse(BaseModel):
    """品类响应"""
    id: int
    name: str
    icon: str
    order: int


class RevenueStats(BaseModel):
    """收益统计"""
    today: dict
    week: dict
    month: dict


class MerchantUpdate(BaseModel):
    """更新商家信息请求"""
    name: Optional[str] = PydanticField(None, max_length=100)
    phone: Optional[str] = PydanticField(None, max_length=20)
    shop_name: Optional[str] = PydanticField(None, max_length=100)


# ============== 依赖注入 ==============

def get_session():
    """获取数据库会话"""
    with Session(engine) as session:
        yield session


def get_current_merchant_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> int:
    """获取当前商家ID（需要认证）"""
    token = credentials.credentials
    payload = verify_token(token)
    return payload.get("merchant_id")


# ============== 认证相关 API ==============

@router.post("/login", response_model=LoginResponse)
def admin_login(request: LoginRequest, session: Session = Depends(get_session)):
    """
    商家登录
    
    支持两种登录方式：
    1. 微信授权登录：提供 code 参数
    2. 手机号+验证码登录：提供 phone 和 verify_code 参数
    
    注意：当前为演示实现，实际生产环境需要对接微信API或短信验证服务
    """
    merchant = None
    
    if request.code:
        # 微信授权登录 - 演示实现
        # 实际生产环境需要调用微信API获取openid
        # 这里使用code模拟openid查找或创建商家
        merchant = session.exec(
            select(Merchant).where(Merchant.wechat_openid == request.code)
        ).first()
        
        if not merchant:
            # 自动创建新商家（演示用）
            merchant = Merchant(
                name="新商家",
                phone="",
                wechat_openid=request.code,
                shop_name="我的店铺"
            )
            session.add(merchant)
            session.commit()
            session.refresh(merchant)
    
    elif request.phone and request.verify_code:
        # 手机号+验证码登录 - 演示实现
        # 实际生产环境需要验证验证码
        # 演示：验证码为 "123456" 时允许登录
        if request.verify_code != "123456":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="验证码错误"
            )
        
        merchant = session.exec(
            select(Merchant).where(Merchant.phone == request.phone)
        ).first()
        
        if not merchant:
            # 自动创建新商家（演示用）
            merchant = Merchant(
                name="新商家",
                phone=request.phone,
                wechat_openid=f"phone_{request.phone}",
                shop_name="我的店铺"
            )
            session.add(merchant)
            session.commit()
            session.refresh(merchant)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请提供登录凭证（code 或 phone+verify_code）"
        )
    
    # 生成 JWT Token
    from auth import create_access_token
    token = create_access_token(merchant.id)
    
    return LoginResponse(
        token=token,
        merchant=MerchantInfo(
            id=merchant.id,
            name=merchant.name,
            phone=merchant.phone,
            shop_name=merchant.shop_name
        )
    )


# ============== 商品管理 API ==============

@router.get("/products", response_model=List[ProductResponse])
def get_products(
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """获取当前商家的商品列表"""
    products = session.exec(
        select(Product).where(Product.merchant_id == merchant_id)
    ).all()
    return products


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """创建商品"""
    now = datetime.utcnow()
    product = Product(
        merchant_id=merchant_id,
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        image_url=product_data.image_url,
        category=product_data.category,
        stock=product_data.stock,
        is_active=True,
        created_at=now,
        updated_at=now
    )
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """更新商品"""
    product = session.exec(
        select(Product).where(
            Product.id == product_id,
            Product.merchant_id == merchant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商品不存在"
        )
    
    # 更新字段
    update_data = product_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    product.updated_at = datetime.utcnow()
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """删除商品"""
    product = session.exec(
        select(Product).where(
            Product.id == product_id,
            Product.merchant_id == merchant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商品不存在"
        )
    
    session.delete(product)
    session.commit()
    return {"success": True}


@router.patch("/products/{product_id}/status", response_model=ProductResponse)
def update_product_status(
    product_id: int,
    status_data: ProductStatusUpdate,
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """上架/下架商品"""
    product = session.exec(
        select(Product).where(
            Product.id == product_id,
            Product.merchant_id == merchant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商品不存在"
        )
    
    product.is_active = status_data.is_active
    product.updated_at = datetime.utcnow()
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


# ============== 品类管理 API ==============

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """获取当前商家的品类列表"""
    categories = session.exec(
        select(Category).where(Category.merchant_id == merchant_id).order_by(Category.order)
    ).all()
    return categories


# ============== 收益统计 API ==============

@router.get("/revenue/stats", response_model=RevenueStats)
def get_revenue_stats(
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """获取收益统计"""
    now = datetime.utcnow()
    
    # 今日统计
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = session.exec(
        select(Order).where(
            Order.merchant_id == merchant_id,
            Order.created_at >= today_start
        )
    ).all()
    today_amount = sum(order.total_amount for order in today_orders)
    today_count = len(today_orders)
    
    # 昨日统计（用于计算同比）
    yesterday_start = today_start - timedelta(days=1)
    yesterday_orders = session.exec(
        select(Order).where(
            Order.merchant_id == merchant_id,
            Order.created_at >= yesterday_start,
            Order.created_at < today_start
        )
    ).all()
    yesterday_amount = sum(order.total_amount for order in yesterday_orders)
    yesterday_count = len(yesterday_orders)
    
    # 今日同比增长率
    today_growth = 0.0
    if yesterday_amount > 0:
        today_growth = round((today_amount - yesterday_amount) / yesterday_amount * 100, 2)
    elif today_amount > 0:
        today_growth = 100.0
    
    # 本周统计（周一到今天）
    week_start = today_start - timedelta(days=now.weekday())
    week_orders = session.exec(
        select(Order).where(
            Order.merchant_id == merchant_id,
            Order.created_at >= week_start
        )
    ).all()
    week_amount = sum(order.total_amount for order in week_orders)
    week_count = len(week_orders)
    
    # 上周统计（用于计算同比）
    last_week_start = week_start - timedelta(days=7)
    last_week_orders = session.exec(
        select(Order).where(
            Order.merchant_id == merchant_id,
            Order.created_at >= last_week_start,
            Order.created_at < week_start
        )
    ).all()
    last_week_amount = sum(order.total_amount for order in last_week_orders)
    last_week_count = len(last_week_orders)
    
    # 本周同比增长率
    week_growth = 0.0
    if last_week_amount > 0:
        week_growth = round((week_amount - last_week_amount) / last_week_amount * 100, 2)
    elif week_amount > 0:
        week_growth = 100.0
    
    # 本月统计
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_orders = session.exec(
        select(Order).where(
            Order.merchant_id == merchant_id,
            Order.created_at >= month_start
        )
    ).all()
    month_amount = sum(order.total_amount for order in month_orders)
    month_count = len(month_orders)
    
    # 上月统计（用于计算同比）
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    last_month_orders = session.exec(
        select(Order).where(
            Order.merchant_id == merchant_id,
            Order.created_at >= last_month_start,
            Order.created_at < month_start
        )
    ).all()
    last_month_amount = sum(order.total_amount for order in last_month_orders)
    last_month_count = len(last_month_orders)
    
    # 本月同比增长率
    month_growth = 0.0
    if last_month_amount > 0:
        month_growth = round((month_amount - last_month_amount) / last_month_amount * 100, 2)
    elif month_amount > 0:
        month_growth = 100.0
    
    return RevenueStats(
        today={
            "amount": round(today_amount, 2),
            "order_count": today_count,
            "growth": today_growth
        },
        week={
            "amount": round(week_amount, 2),
            "order_count": week_count,
            "growth": week_growth
        },
        month={
            "amount": round(month_amount, 2),
            "order_count": month_count,
            "growth": month_growth
        }
    )


@router.get("/orders")
def get_orders(
    date: Optional[str] = None,
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """获取订单列表"""
    query = select(Order).where(Order.merchant_id == merchant_id)
    
    if date:
        # 按日期筛选
        try:
            filter_date = datetime.strptime(date, "%Y-%m-%d")
            next_day = filter_date + timedelta(days=1)
            query = query.where(
                Order.created_at >= filter_date,
                Order.created_at < next_day
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="日期格式错误，应为 YYYY-MM-DD"
            )
    
    # 按创建时间倒序
    query = query.order_by(col(Order.created_at).desc())
    orders = session.exec(query).all()
    
    # 获取订单明细
    result = []
    for order in orders:
        items = session.exec(
            select(OrderItem).where(OrderItem.order_id == order.id)
        ).all()
        
        order_dict = {
            "id": order.id,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "pickup_time": order.pickup_time.isoformat(),
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at.isoformat(),
            "updated_at": order.updated_at.isoformat(),
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
        result.append(order_dict)
    
    return {"orders": result}


# ============== 商家信息 API ==============

class OrderStatusUpdate(BaseModel):
    """订单状态更新请求"""
    status: str = PydanticField(..., description="订单状态：pending/confirmed/ready/completed/cancelled")


# 有效订单状态列表
VALID_ORDER_STATUS = ["pending", "confirmed", "ready", "completed", "cancelled"]


@router.get("/profile")
def get_merchant_profile(
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """获取商家信息（profile 别名）"""
    merchant = session.exec(
        select(Merchant).where(Merchant.id == merchant_id)
    ).first()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    return {
        "id": merchant.id,
        "name": merchant.name,
        "phone": merchant.phone,
        "shop_name": merchant.shop_name,
        "created_at": merchant.created_at.isoformat(),
        "updated_at": merchant.updated_at.isoformat()
    }


@router.get("/merchant/info")
def get_merchant_info(
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """获取商家信息"""
    merchant = session.exec(
        select(Merchant).where(Merchant.id == merchant_id)
    ).first()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    return {
        "id": merchant.id,
        "name": merchant.name,
        "phone": merchant.phone,
        "shop_name": merchant.shop_name,
        "created_at": merchant.created_at.isoformat(),
        "updated_at": merchant.updated_at.isoformat()
    }


# ============== 订单状态更新 API ==============

@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """更新订单状态（仅允许更新自己店铺的订单）"""
    # 查询订单，确保属于当前商家
    order = session.exec(
        select(Order).where(
            Order.id == order_id,
            Order.merchant_id == merchant_id
        )
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在或不属于当前商家"
        )
    
    # 验证状态值
    if status_data.status not in VALID_ORDER_STATUS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的订单状态，有效状态：{', '.join(VALID_ORDER_STATUS)}"
        )
    
    # 更新状态
    order.status = status_data.status
    order.updated_at = datetime.utcnow()
    session.add(order)
    session.commit()
    session.refresh(order)
    
    # 获取订单明细
    items = session.exec(
        select(OrderItem).where(OrderItem.order_id == order_id)
    ).all()
    
    return {
        "id": order.id,
        "merchant_id": order.merchant_id,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "pickup_time": order.pickup_time.isoformat(),
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "updated_at": order.updated_at.isoformat(),
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


@router.put("/merchant/info")
def update_merchant_info(
    update_data: MerchantUpdate,
    merchant_id: int = Depends(get_current_merchant_id),
    session: Session = Depends(get_session)
):
    """更新商家信息"""
    merchant = session.exec(
        select(Merchant).where(Merchant.id == merchant_id)
    ).first()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # 更新字段
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(merchant, key, value)
    
    merchant.updated_at = datetime.utcnow()
    session.add(merchant)
    session.commit()
    session.refresh(merchant)
    
    return {
        "id": merchant.id,
        "name": merchant.name,
        "phone": merchant.phone,
        "shop_name": merchant.shop_name,
        "created_at": merchant.created_at.isoformat(),
        "updated_at": merchant.updated_at.isoformat()
    }