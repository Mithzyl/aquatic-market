"""
Merchant Service - 商家端业务逻辑层
"""
import json
import os
import warnings
from datetime import datetime, timedelta
from typing import List, Optional
from sqlmodel import Session, select, col

from models import Merchant, Product, Order, OrderItem, Category
from auth import create_access_token


# 有效订单状态列表
VALID_ORDER_STATUS = ["pending", "confirmed", "ready", "completed", "cancelled"]


class AuthService:
    """认证服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def login(self, code: Optional[str] = None, phone: Optional[str] = None, verify_code: Optional[str] = None) -> dict:
        """
        商家登录
        
        支持两种登录方式：
        1. 微信授权登录：提供 code 参数
        2. 手机号+验证码登录：提供 phone 和 verify_code 参数
        
        Returns:
            dict: 包含 token 和 merchant 信息
        """
        merchant = None
        
        if code:
            # 微信授权登录 - 演示实现
            merchant = self.session.exec(
                select(Merchant).where(Merchant.wechat_openid == code)
            ).first()
            
            if not merchant:
                # 自动创建新商家（演示用）
                merchant = Merchant(
                    name="新商家",
                    phone="",
                    wechat_openid=code,
                    shop_name="我的店铺"
                )
                self.session.add(merchant)
                self.session.commit()
                self.session.refresh(merchant)
        
        elif phone and verify_code:
            # 手机号+验证码登录
            demo_mode = os.getenv("VERIFY_CODE_DEMO_MODE", "false").lower() == "true"
            
            if demo_mode:
                # 演示模式：仅用于开发测试
                warnings.warn(
                    "演示验证码模式已启用！仅限开发环境使用，生产环境必须禁用 VERIFY_CODE_DEMO_MODE "
                    "并对接真实的短信验证码服务。",
                    UserWarning
                )
                demo_code = os.getenv("DEMO_VERIFY_CODE")
                if not demo_code:
                    raise ValueError("验证码服务暂未配置，请联系管理员")
                if verify_code != demo_code:
                    raise ValueError("验证码错误")
            else:
                # 生产模式：需要对接真实的验证码服务
                raise ValueError("验证码登录服务暂未开放，请使用微信登录")
            
            merchant = self.session.exec(
                select(Merchant).where(Merchant.phone == phone)
            ).first()
            
            if not merchant:
                # 自动创建新商家（演示用）
                merchant = Merchant(
                    name="新商家",
                    phone=phone,
                    wechat_openid=f"phone_{phone}",
                    shop_name="我的店铺"
                )
                self.session.add(merchant)
                self.session.commit()
                self.session.refresh(merchant)
        else:
            raise ValueError("请提供登录凭证（code 或 phone+verify_code）")
        
        # 生成 JWT Token
        token = create_access_token(merchant.id)
        
        return {
            "token": token,
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
                "phone": merchant.phone,
                "shop_name": merchant.shop_name
            }
        }


class ProductService:
    """商品服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_products(self, merchant_id: int) -> List[Product]:
        """获取当前商家的商品列表"""
        return self.session.exec(
            select(Product).where(Product.merchant_id == merchant_id)
        ).all()
    
    def create_product(self, merchant_id: int, product_data: dict) -> Product:
        """创建商品"""
        now = datetime.utcnow()
        badges = product_data.get("badges", [])
        if isinstance(badges, list):
            badges = json.dumps(badges, ensure_ascii=False)
        product = Product(
            merchant_id=merchant_id,
            name=product_data.get("name"),
            description=product_data.get("description", ""),
            price=product_data.get("price", 0),
            original_price=product_data.get("original_price"),
            image=product_data.get("image") or product_data.get("image_url"),
            category=product_data.get("category", ""),
            category_name=product_data.get("category_name", ""),
            stock=product_data.get("stock", 0),
            sales=product_data.get("sales", 0),
            unit=product_data.get("unit", "份"),
            tag=product_data.get("tag"),
            tag_type=product_data.get("tag_type"),
            badges=badges,
            is_active=True,
            created_at=now,
            updated_at=now
        )
        self.session.add(product)
        self.session.commit()
        self.session.refresh(product)
        return product
    
    def update_product(self, merchant_id: int, product_id: int, product_data: dict) -> Optional[Product]:
        """更新商品"""
        product = self.session.exec(
            select(Product).where(
                Product.id == product_id,
                Product.merchant_id == merchant_id
            )
        ).first()
        
        if not product:
            return None
        
        # 更新字段
        update_data = {k: v for k, v in product_data.items() if v is not None}
        for key, value in update_data.items():
            if key == "badges" and value is not None:
                # badges需要转换为JSON字符串
                setattr(product, key, json.dumps(value, ensure_ascii=False))
            else:
                setattr(product, key, value)
        
        product.updated_at = datetime.utcnow()
        self.session.add(product)
        self.session.commit()
        self.session.refresh(product)
        return product
    
    def delete_product(self, merchant_id: int, product_id: int) -> bool:
        """删除商品"""
        product = self.session.exec(
            select(Product).where(
                Product.id == product_id,
                Product.merchant_id == merchant_id
            )
        ).first()
        
        if not product:
            return False
        
        self.session.delete(product)
        self.session.commit()
        return True
    
    def update_product_status(self, merchant_id: int, product_id: int, is_active: bool) -> Optional[Product]:
        """更新上下架状态"""
        product = self.session.exec(
            select(Product).where(
                Product.id == product_id,
                Product.merchant_id == merchant_id
            )
        ).first()
        
        if not product:
            return None
        
        product.is_active = is_active
        product.updated_at = datetime.utcnow()
        self.session.add(product)
        self.session.commit()
        self.session.refresh(product)
        return product
    
    @staticmethod
    def to_response(product: Product) -> dict:
        """将Product模型转换为响应字典"""
        badges_list = []
        if product.badges:
            try:
                badges_list = json.loads(product.badges)
            except (json.JSONDecodeError, Exception):
                badges_list = []
        
        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "original_price": product.original_price,
            "image": product.image,
            "category": product.category,
            "category_name": product.category_name,
            "stock": product.stock,
            "sales": product.sales,
            "unit": product.unit,
            "tag": product.tag,
            "tag_type": product.tag_type,
            "badges": badges_list,
            "is_active": product.is_active,
            "created_at": product.created_at,
            "updated_at": product.updated_at
        }


class CategoryService:
    """品类服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_categories(self, merchant_id: int) -> List[Category]:
        """获取品类列表"""
        return self.session.exec(
            select(Category).where(Category.merchant_id == merchant_id).order_by(Category.order)
        ).all()


class RevenueService:
    """收益统计服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_stats(self, merchant_id: int) -> dict:
        """获取今日/本周/本月收益统计"""
        now = datetime.utcnow()
        
        # 今日统计
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders = self.session.exec(
            select(Order).where(
                Order.merchant_id == merchant_id,
                Order.created_at >= today_start
            )
        ).all()
        today_amount = sum(order.total_amount for order in today_orders)
        today_count = len(today_orders)
        
        # 昨日统计（用于计算同比）
        yesterday_start = today_start - timedelta(days=1)
        yesterday_orders = self.session.exec(
            select(Order).where(
                Order.merchant_id == merchant_id,
                Order.created_at >= yesterday_start,
                Order.created_at < today_start
            )
        ).all()
        yesterday_amount = sum(order.total_amount for order in yesterday_orders)
        
        # 今日同比增长率
        today_growth = 0.0
        if yesterday_amount > 0:
            today_growth = round((today_amount - yesterday_amount) / yesterday_amount * 100, 2)
        elif today_amount > 0:
            today_growth = 100.0
        
        # 本周统计（周一到今天）
        week_start = today_start - timedelta(days=now.weekday())
        week_orders = self.session.exec(
            select(Order).where(
                Order.merchant_id == merchant_id,
                Order.created_at >= week_start
            )
        ).all()
        week_amount = sum(order.total_amount for order in week_orders)
        week_count = len(week_orders)
        
        # 上周统计（用于计算同比）
        last_week_start = week_start - timedelta(days=7)
        last_week_orders = self.session.exec(
            select(Order).where(
                Order.merchant_id == merchant_id,
                Order.created_at >= last_week_start,
                Order.created_at < week_start
            )
        ).all()
        last_week_amount = sum(order.total_amount for order in last_week_orders)
        
        # 本周同比增长率
        week_growth = 0.0
        if last_week_amount > 0:
            week_growth = round((week_amount - last_week_amount) / last_week_amount * 100, 2)
        elif week_amount > 0:
            week_growth = 100.0
        
        # 本月统计
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_orders = self.session.exec(
            select(Order).where(
                Order.merchant_id == merchant_id,
                Order.created_at >= month_start
            )
        ).all()
        month_amount = sum(order.total_amount for order in month_orders)
        month_count = len(month_orders)
        
        # 上月统计（用于计算同比）
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        last_month_orders = self.session.exec(
            select(Order).where(
                Order.merchant_id == merchant_id,
                Order.created_at >= last_month_start,
                Order.created_at < month_start
            )
        ).all()
        last_month_amount = sum(order.total_amount for order in last_month_orders)
        
        # 本月同比增长率
        month_growth = 0.0
        if last_month_amount > 0:
            month_growth = round((month_amount - last_month_amount) / last_month_amount * 100, 2)
        elif month_amount > 0:
            month_growth = 100.0
        
        return {
            "today": {
                "amount": round(today_amount, 2),
                "order_count": today_count,
                "growth": today_growth
            },
            "week": {
                "amount": round(week_amount, 2),
                "order_count": week_count,
                "growth": week_growth
            },
            "month": {
                "amount": round(month_amount, 2),
                "order_count": month_count,
                "growth": month_growth
            }
        }


class OrderService:
    """订单服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_orders(self, merchant_id: int, date: Optional[str] = None) -> List[dict]:
        """获取订单列表"""
        query = select(Order).where(Order.merchant_id == merchant_id)
        
        if date:
            # 按日期筛选
            try:
                filter_date = datetime.strptime(date, "%Y-%m-%d")
            except ValueError:
                raise ValueError("日期格式错误，请使用 YYYY-MM-DD 格式")
            next_day = filter_date + timedelta(days=1)
            query = query.where(
                Order.created_at >= filter_date,
                Order.created_at < next_day
            )
        
        # 按创建时间倒序
        query = query.order_by(col(Order.created_at).desc())
        orders = self.session.exec(query).all()
        
        # 获取订单明细
        result = []
        for order in orders:
            items = self.session.exec(
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
        
        return result
    
    def update_order_status(self, merchant_id: int, order_id: int, status: str) -> Optional[dict]:
        """更新订单状态（仅允许更新自己店铺的订单）"""
        # 查询订单，确保属于当前商家
        order = self.session.exec(
            select(Order).where(
                Order.id == order_id,
                Order.merchant_id == merchant_id
            )
        ).first()
        
        if not order:
            return None
        
        # 验证状态值
        if status not in VALID_ORDER_STATUS:
            raise ValueError(f"无效的订单状态，有效状态：{', '.join(VALID_ORDER_STATUS)}")
        
        # 更新状态
        order.status = status
        order.updated_at = datetime.utcnow()
        self.session.add(order)
        self.session.commit()
        self.session.refresh(order)
        
        # 获取订单明细
        items = self.session.exec(
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


class MerchantService:
    """商家信息服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_profile(self, merchant_id: int) -> Optional[dict]:
        """获取商家信息（profile 别名）"""
        merchant = self.session.exec(
            select(Merchant).where(Merchant.id == merchant_id)
        ).first()
        
        if not merchant:
            return None
        
        return {
            "id": merchant.id,
            "name": merchant.name,
            "phone": merchant.phone,
            "shop_name": merchant.shop_name,
            "created_at": merchant.created_at.isoformat(),
            "updated_at": merchant.updated_at.isoformat()
        }
    
    def get_info(self, merchant_id: int) -> Optional[dict]:
        """获取商家详情"""
        return self.get_profile(merchant_id)
    
    def update_info(self, merchant_id: int, update_data: dict) -> Optional[dict]:
        """更新商家信息"""
        merchant = self.session.exec(
            select(Merchant).where(Merchant.id == merchant_id)
        ).first()
        
        if not merchant:
            return None
        
        # 更新字段
        for key, value in update_data.items():
            if value is not None:
                setattr(merchant, key, value)
        
        merchant.updated_at = datetime.utcnow()
        self.session.add(merchant)
        self.session.commit()
        self.session.refresh(merchant)
        
        return {
            "id": merchant.id,
            "name": merchant.name,
            "phone": merchant.phone,
            "shop_name": merchant.shop_name,
            "created_at": merchant.created_at.isoformat(),
            "updated_at": merchant.updated_at.isoformat()
        }
