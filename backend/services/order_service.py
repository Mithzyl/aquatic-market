"""
Order Service - 订单业务逻辑层
支持库存扣减与恢复（F06）、订单取消（F05）、商家禁用时批量取消订单（F02）
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import text
from shared.models import Order, OrderItem, Product

from schemas.order import OrderCreateRequest


class OrderService:
    """订单服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_orders_by_user(self, user_id: int) -> List[Order]:
        """获取用户的所有订单"""
        return self.session.exec(
            select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
        ).all()
    
    def get_orders_by_merchant(self, merchant_id: int) -> List[Order]:
        """获取商家的所有订单"""
        return self.session.exec(
            select(Order).where(Order.merchant_id == merchant_id)
        ).all()
    
    def get_order_by_id(self, order_id: int) -> Optional[Order]:
        """根据ID获取订单"""
        return self.session.exec(
            select(Order).where(Order.id == order_id)
        ).first()
    
    def get_order_items(self, order_id: int) -> List[OrderItem]:
        """获取订单的所有明细"""
        return self.session.exec(
            select(OrderItem).where(OrderItem.order_id == order_id)
        ).all()
    
    def restore_stock(self, order_id: int) -> int:
        """
        恢复订单库存（F06: 库存恢复）
        
        Args:
            order_id: 订单ID
            
        Returns:
            int: 恢复的商品数量
        """
        items = self.get_order_items(order_id)
        restored_count = 0
        
        for item in items:
            product = self.session.exec(
                select(Product).where(Product.id == item.product_id)
            ).first()
            
            if product:
                product.stock += item.quantity
                self.session.add(product)
                restored_count += 1
        
        return restored_count
    
    def cancel_order(self, order_id: int, user_id: Optional[int] = None) -> dict:
        """
        取消订单（F05: 订单取消功能）
        
        验证规则：
        - 用户认证：user_id必须匹配订单归属
        - 订单状态：必须为pending
        - 时间限制：创建时间在5分钟内
        
        取消成功后：
        - 更新订单状态为cancelled
        - 恢复库存
        
        Args:
            order_id: 订单ID
            user_id: 用户ID（可选，用于验证归属）
            
        Returns:
            dict: 取消结果
            
        Raises:
            HTTPException: 订单不存在、无权操作、状态不允许、超时
        """
        order = self.get_order_by_id(order_id)
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="订单不存在"
            )
        
        # 验证订单归属
        if user_id and order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权取消此订单"
            )
        
        # 验证订单状态
        if order.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"订单状态为{order.status}，无法取消"
            )
        
        # 验证时间限制（5分钟内）
        now = datetime.utcnow()
        time_diff = now - order.created_at
        if time_diff > timedelta(minutes=5):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="订单创建超过5分钟，无法取消"
            )
        
        try:
            # 更新订单状态
            order.status = "cancelled"
            order.updated_at = now
            self.session.add(order)
            
            # 恢复库存
            restored_count = self.restore_stock(order_id)
            
            self.session.commit()
            self.session.refresh(order)
            
            return {
                "success": True,
                "order_id": order_id,
                "status": order.status,
                "restored_items": restored_count,
                "message": "订单已取消，库存已恢复"
            }
        except Exception as e:
            self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"订单取消失败: {str(e)}"
            )
    
    def batch_cancel_pending_orders(self, merchant_id: int) -> int:
        """
        批量取消商家所有pending状态订单（F02: 商家状态管理）
        
        Args:
            merchant_id: 商家ID
            
        Returns:
            int: 取消的订单数量
        """
        pending_orders = self.session.exec(
            select(Order).where(
                Order.merchant_id == merchant_id,
                Order.status == "pending"
            )
        ).all()
        
        cancelled_count = 0
        
        for order in pending_orders:
            try:
                order.status = "cancelled"
                order.updated_at = datetime.utcnow()
                self.session.add(order)
                
                # 恢复库存
                self.restore_stock(order.id)
                
                cancelled_count += 1
            except Exception:
                # 单个订单失败不影响其他订单
                continue
        
        return cancelled_count
    
    def create_order(self, order_data: OrderCreateRequest, user_id: Optional[int] = None) -> dict:
        """
        创建订单（包含订单明细）- 事务性操作
        
        F06: 使用数据库锁保护库存（SELECT FOR UPDATE）
        
        Args:
            order_data: 订单创建请求
            user_id: 用户ID（从认证Token获取）
        """
        now = datetime.utcnow()
        
        # 计算订单总金额并预验证
        total_amount = 0.0
        order_items_data = []
        
        # F06: 使用数据库锁保护库存
        # 先收集所有商品ID，然后一次性锁定
        product_ids = [item_req.product_id for item_req in order_data.items]
        
        # 使用 SELECT FOR UPDATE 锁定所有商品（防止并发扣减）
        # SQLite不支持FOR UPDATE，MySQL支持
        locked_products = {}
        for product_id in product_ids:
            # 尝试使用 FOR UPDATE 锁定（MySQL）
            try:
                result = self.session.exec(
                    text(f"SELECT * FROM product WHERE id = {product_id} FOR UPDATE")
                )
                product = self.session.exec(
                    select(Product).where(Product.id == product_id)
                ).first()
            except Exception:
                # SQLite不支持FOR UPDATE，使用普通查询
                product = self.session.exec(
                    select(Product).where(Product.id == product_id)
                ).first()
            
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"商品 {product_id} 不存在"
                )
            
            locked_products[product_id] = product
        
        # 验证库存和计算金额
        for item_req in order_data.items:
            product = locked_products.get(item_req.product_id)
            
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"商品 {item_req.product_id} 不存在"
                )
            
            if not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"商品 {item_req.product_id} 已下架"
                )
            
            # F06: 库存不足时返回400错误
            if product.stock < item_req.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"商品 {product.name} 库存不足，当前库存: {product.stock}"
                )
            
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
                user_id=user_id or order_data.user_id,  # 优先使用Token中的user_id
                customer_name=order_data.customer_name,
                customer_phone=order_data.customer_phone,
                pickup_time=order_data.pickup_time,
                total_amount=total_amount,
                status="pending",
                created_at=now,
                updated_at=now
            )
            self.session.add(order)
            self.session.flush()
            
            # 创建订单明细并更新库存
            for item_data in order_items_data:
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=item_data["product_id"],
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    subtotal=item_data["subtotal"]
                )
                self.session.add(order_item)
                
                # F06: 扣减库存（已锁定）
                product = locked_products.get(item_data["product_id"])
                product.stock -= item_data["quantity"]
                self.session.add(product)
            
            # 统一提交事务
            self.session.commit()
            self.session.refresh(order)
            
            return {
                "id": order.id,
                "merchant_id": order.merchant_id,
                "user_id": order.user_id,
                "customer_name": order.customer_name,
                "customer_phone": order.customer_phone,
                "pickup_time": order.pickup_time,
                "total_amount": order.total_amount,
                "status": order.status,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
                "items": order_items_data
            }
        except HTTPException:
            self.session.rollback()
            raise
        except Exception as e:
            self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"订单创建失败: {str(e)}"
            )
    
    def get_orders_with_items_by_user(self, user_id: int) -> List[dict]:
        """获取用户订单列表，包含完整的订单明细"""
        orders = self.session.exec(
            select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
        ).all()
        
        return self._build_orders_response(orders)
    
    def get_orders_with_items(self, merchant_id: int) -> List[dict]:
        """获取商家订单列表，包含完整的订单明细"""
        orders = self.session.exec(
            select(Order).where(Order.merchant_id == merchant_id).order_by(Order.created_at.desc())
        ).all()
        
        return self._build_orders_response(orders)
    
    def _build_orders_response(self, orders: List[Order]) -> List[dict]:
        """构建订单响应数据（内部方法）"""
        if not orders:
            return []
        
        # 批量查询优化 N+1 问题
        order_ids = [o.id for o in orders]
        all_items = self.session.exec(
            select(OrderItem).where(OrderItem.order_id.in_(order_ids))
        ).all()
        
        product_ids = [item.product_id for item in all_items]
        products = self.session.exec(
            select(Product).where(Product.id.in_(product_ids))
        ).all()
        product_map = {p.id: p for p in products}
        
        items_by_order = {}
        for item in all_items:
            if item.order_id not in items_by_order:
                items_by_order[item.order_id] = []
            items_by_order[item.order_id].append(item)
        
        result = []
        for order in orders:
            items = items_by_order.get(order.id, [])
            items_with_product_info = []
            for item in items:
                product = product_map.get(item.product_id)
                items_with_product_info.append({
                    "id": item.id,
                    "product_id": item.product_id,
                    "name": product.name if product else f"商品{item.product_id}",
                    "quantity": item.quantity,
                    "price": item.unit_price,
                    "unit_price": item.unit_price,
                    "subtotal": item.subtotal
                })
            
            result.append({
                "id": order.id,
                "merchant_id": order.merchant_id,
                "user_id": order.user_id,
                "customer_name": order.customer_name,
                "customer_phone": order.customer_phone,
                "pickup_time": order.pickup_time,
                "total_amount": order.total_amount,
                "status": order.status,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
                "items": items_with_product_info
            })
        
        return result