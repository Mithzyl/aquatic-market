"""
Merchant Service - 商家端业务逻辑层
支持 RBAC 权限管理：登录返回角色信息、Token 包含权限
"""
import json
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Optional
from sqlmodel import Session, select, col
import threading

from shared.models import Merchant, Product, Order, OrderItem, Category, MerchantRole
from shared.auth import create_access_token


# 有效订单状态列表
VALID_ORDER_STATUS = ["pending", "confirmed", "ready", "completed", "cancelled"]

# 订单状态流转规则（安全建议 #7）
VALID_STATUS_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["ready", "cancelled"],
    "ready": ["completed", "cancelled"],
    "completed": [],
    "cancelled": []
}

# 登录限流器（Critical #3）
_login_attempts = defaultdict(list)
_login_lock = threading.Lock()


def reset_login_rate_limit():
    """重置登录限流器（仅用于测试）"""
    global _login_attempts
    with _login_lock:
        _login_attempts.clear()


class AuthService:
    """认证服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
    @staticmethod
    def check_login_rate_limit(ip: str) -> bool:
        """
        检查登录限流，每IP每分钟最多5次（Critical #3）
        
        Args:
            ip: 客户端IP地址
            
        Returns:
            bool: True 表示允许登录，False 表示被限流
        """
        with _login_lock:
            now = datetime.utcnow()
            # 清理1分钟前的记录
            _login_attempts[ip] = [
                t for t in _login_attempts[ip] 
                if now - t < timedelta(minutes=1)
            ]
            if len(_login_attempts[ip]) >= 5:
                return False
            _login_attempts[ip].append(now)
            return True
    
    def login(self, username: str, password: str, client_ip: Optional[str] = None) -> dict:
        """
        商家登录（用户名 + 密码 + bcrypt）
        
        RBAC 支持：
        - 返回商家角色信息
        - Token 包含角色代码和权限列表
        
        Returns:
            dict: 包含 token 和 merchant 信息（含角色）
        """
        from shared.models import verify_password
        
        # 检查登录限流（Critical #3）
        if client_ip and not self.check_login_rate_limit(client_ip):
            raise ValueError("登录请求过于频繁，请1分钟后重试")
        
        # 查找商户
        merchant = self.session.exec(
            select(Merchant).where(Merchant.username == username)
        ).first()
        
        if not merchant:
            raise ValueError("用户名或密码错误")
        
        # 检查状态
        if not merchant.is_active:
            raise ValueError("商家账号已被禁用，请联系平台管理员")
        
        # 验证密码
        if not verify_password(password, merchant.password_hash):
            raise ValueError("用户名或密码错误")
        
        # 检查商家状态（F02: 商家状态管理）
        if not merchant.is_active:
            raise ValueError("商家账号已被禁用，请联系平台管理员")
        
        # 获取商家角色信息
        role = self.session.exec(
            select(MerchantRole).where(MerchantRole.id == merchant.role_id)
        ).first()
        
        # 如果角色不存在或被禁用，使用默认 owner 角色
        if not role or not role.is_active:
            role = self.session.exec(
                select(MerchantRole).where(MerchantRole.code == "owner")
            ).first()
        
        role_permissions = role.get_permissions_list() if role else []
        role_code = role.code if role else "owner"
        
        # 生成 JWT Token（包含角色信息）
        token = create_access_token(
            merchant_id=merchant.id,
            role_code=role_code,
            permissions=role_permissions
        )
        
        return {
            "token": token,
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
                "phone": merchant.phone,
                "shop_name": merchant.shop_name,
                "role": {
                    "code": role_code,
                    "name": role.name if role else "店主",
                    "permissions": role_permissions
                }
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
    
    def create_category(self, merchant_id: int, category_data: dict) -> Category:
        """
        创建品类（F04: 品类管理）
        
        Args:
            merchant_id: 商家ID
            category_data: 品类数据
            
        Returns:
            Category: 创建的品类
        """
        now = datetime.utcnow()
        category = Category(
            merchant_id=merchant_id,
            slug=category_data.get("slug", ""),
            name=category_data.get("name"),
            icon=category_data.get("icon", ""),
            order=category_data.get("order", 0),
            created_at=now,
            updated_at=now
        )
        self.session.add(category)
        self.session.commit()
        self.session.refresh(category)
        return category
    
    def update_category(self, merchant_id: int, category_id: int, category_data: dict) -> Optional[Category]:
        """
        更新品类（F04: 品类管理）
        
        Args:
            merchant_id: 商家ID
            category_id: 品类ID
            category_data: 更新数据
            
        Returns:
            Category: 更新后的品类，或None（不存在或不属于商家）
        """
        category = self.session.exec(
            select(Category).where(
                Category.id == category_id,
                Category.merchant_id == merchant_id
            )
        ).first()
        
        if not category:
            return None
        
        # 更新字段
        for key, value in category_data.items():
            if value is not None:
                setattr(category, key, value)
        
        category.updated_at = datetime.utcnow()
        self.session.add(category)
        self.session.commit()
        self.session.refresh(category)
        return category
    
    def delete_category(self, merchant_id: int, category_id: int) -> dict:
        """
        删除品类（F04: 品类管理）
        
        删除前检查是否有关联商品
        
        Args:
            merchant_id: 商家ID
            category_id: 品类ID
            
        Returns:
            dict: {"success": bool, "message": str}
        """
        category = self.session.exec(
            select(Category).where(
                Category.id == category_id,
                Category.merchant_id == merchant_id
            )
        ).first()
        
        if not category:
            return {"success": False, "message": "品类不存在或不属于当前商家"}
        
        # 检查是否有关联商品
        products = self.session.exec(
            select(Product).where(
                Product.merchant_id == merchant_id,
                Product.category == category.slug
            )
        ).all()
        
        if products:
            return {"success": False, "message": f"品类下有 {len(products)} 个商品，无法删除"}
        
        # 删除品类
        self.session.delete(category)
        self.session.commit()
        
        return {"success": True, "message": "品类已删除"}


class RevenueService:
    """收益统计服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_stats(self, merchant_id: int) -> dict:
        """
        获取今日/本周/本月收益统计
        
        性能优化（#6）：合并为单次查询，内存分组统计
        原实现执行6次独立查询，现优化为1次查询
        """
        now = datetime.utcnow()
        
        # 计算时间边界
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)
        week_start = today_start - timedelta(days=now.weekday())
        last_week_start = week_start - timedelta(days=7)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        
        # 计算查询起始时间（取最早需要的时间点）
        query_start = min(last_week_start, last_month_start)
        
        # 单次查询：获取最近两个月所有订单
        all_orders = self.session.exec(
            select(Order).where(
                Order.merchant_id == merchant_id,
                Order.created_at >= query_start
            )
        ).all()
        
        # 内存中按时间段分组统计
        today_orders = [o for o in all_orders if o.created_at >= today_start]
        yesterday_orders = [o for o in all_orders if yesterday_start <= o.created_at < today_start]
        week_orders = [o for o in all_orders if o.created_at >= week_start]
        last_week_orders = [o for o in all_orders if last_week_start <= o.created_at < week_start]
        month_orders = [o for o in all_orders if o.created_at >= month_start]
        last_month_orders = [o for o in all_orders if last_month_start <= o.created_at < month_start]
        
        # 计算统计值
        today_amount = sum(order.total_amount for order in today_orders)
        today_count = len(today_orders)
        yesterday_amount = sum(order.total_amount for order in yesterday_orders)
        
        week_amount = sum(order.total_amount for order in week_orders)
        week_count = len(week_orders)
        last_week_amount = sum(order.total_amount for order in last_week_orders)
        
        month_amount = sum(order.total_amount for order in month_orders)
        month_count = len(month_orders)
        last_month_amount = sum(order.total_amount for order in last_month_orders)
        
        # 计算同比增长率
        today_growth = 0.0
        if yesterday_amount > 0:
            today_growth = round((today_amount - yesterday_amount) / yesterday_amount * 100, 2)
        elif today_amount > 0:
            today_growth = 100.0
        
        week_growth = 0.0
        if last_week_amount > 0:
            week_growth = round((week_amount - last_week_amount) / last_week_amount * 100, 2)
        elif week_amount > 0:
            week_growth = 100.0
        
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
        """
        获取订单列表
        
        性能优化（#5）：批量查询订单明细，避免N+1问题
        """
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
        
        # 性能优化：批量查询所有订单的明细，避免N+1问题
        if not orders:
            return []
        
        order_ids = [o.id for o in orders]
        all_items = self.session.exec(
            select(OrderItem).where(col(OrderItem.order_id).in_(order_ids))
        ).all()
        
        # 在内存中组装订单明细
        items_by_order = defaultdict(list)
        for item in all_items:
            items_by_order[item.order_id].append(item)
        
        # 构建响应
        result = []
        for order in orders:
            items = items_by_order.get(order.id, [])
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
        """
        更新订单状态（仅允许更新自己店铺的订单）
        
        安全修复（#7）：添加订单状态流转规则验证
        """
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
        
        # 安全修复：验证状态流转是否合法
        if status not in VALID_STATUS_TRANSITIONS.get(order.status, []):
            raise ValueError(f"订单状态不能从 {order.status} 变为 {status}")
        
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
