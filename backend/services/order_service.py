"""
Order Service - 订单业务逻辑层
"""
from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status
from sqlmodel import Session, select
from models import Order, OrderItem, Product

from schemas.order import OrderCreateRequest


class OrderService:
    """订单服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
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
    
    def create_order(self, order_data: OrderCreateRequest) -> dict:
        """
        创建订单（包含订单明细）- 事务性操作
        
        整个订单创建流程在一个事务中完成：
        1. 验证商品存在性和库存
        2. 创建订单主表
        3. 创建订单明细
        4. 扣减库存
        5. 统一提交事务
        """
        now = datetime.utcnow()
        
        # 计算订单总金额并预验证
        total_amount = 0.0
        order_items_data = []
        
        for item_req in order_data.items:
            product = self.session.exec(
                select(Product).where(Product.id == item_req.product_id)
            ).first()
            
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
            
            if product.stock < item_req.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"商品 {item_req.product_id} 库存不足"
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
                
                product = self.session.exec(
                    select(Product).where(Product.id == item_data["product_id"])
                ).first()
                product.stock -= item_data["quantity"]
                self.session.add(product)
            
            # 统一提交事务
            self.session.commit()
            self.session.refresh(order)
            
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
        except HTTPException:
            self.session.rollback()
            raise
        except Exception as e:
            self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"订单创建失败: {str(e)}"
            )
    
    def get_orders_with_items(self, merchant_id: int) -> List[dict]:
        """获取订单列表，包含完整的订单明细"""
        orders = self.session.exec(
            select(Order).where(Order.merchant_id == merchant_id).order_by(Order.created_at.desc())
        ).all()
        
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
