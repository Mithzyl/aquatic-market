"""
Statistics Routes - 统计分析路由

提供平台级统计功能：
- GET /statistics/overview: 平台概览统计
- GET /statistics/merchants: 商家统计
- GET /statistics/orders: 订单统计
- GET /statistics/revenue: 收益统计
- GET /statistics/users: 用户统计
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlmodel import Session, select, func

# 导入共享模块
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from shared.database import get_session
from shared.models import Merchant, Product, Order, OrderItem, User
from shared.auth import get_current_admin

router = APIRouter()


# ============== 响应模型 ==============

class PlatformOverview(BaseModel):
    """平台概览统计"""
    merchant_count: int = Field(..., description="商家总数")
    user_count: int = Field(..., description="用户总数")
    product_count: int = Field(..., description="商品总数")
    order_count: int = Field(..., description="订单总数")
    total_revenue: float = Field(..., description="总收益")
    today_order_count: int = Field(default=0, description="今日订单数")
    today_revenue: float = Field(default=0, description="今日收益")


class MerchantStatistics(BaseModel):
    """商家统计"""
    total_merchants: int = Field(..., description="商家总数")
    active_merchants: int = Field(default=0, description="活跃商家数")
    new_merchants_today: int = Field(default=0, description="今日新增商家")
    merchants_by_role: dict = Field(default={}, description="按角色分布")


class OrderStatistics(BaseModel):
    """订单统计"""
    total_orders: int = Field(..., description="订单总数")
    pending_orders: int = Field(default=0, description="待处理订单")
    completed_orders: int = Field(default=0, description="已完成订单")
    cancelled_orders: int = Field(default=0, description="已取消订单")
    orders_by_status: dict = Field(default={}, description="按状态分布")
    average_order_value: float = Field(default=0, description="平均订单金额")


class RevenueStatistics(BaseModel):
    """收益统计"""
    total_revenue: float = Field(..., description="总收益")
    today_revenue: float = Field(default=0, description="今日收益")
    week_revenue: float = Field(default=0, description="本周收益")
    month_revenue: float = Field(default=0, description="本月收益")
    revenue_by_merchant: list = Field(default=[], description="按商家收益排名")


class UserStatistics(BaseModel):
    """用户统计"""
    total_users: int = Field(..., description="用户总数")
    active_users: int = Field(default=0, description="活跃用户数")
    new_users_today: int = Field(default=0, description="今日新增用户")
    users_by_gender: dict = Field(default={}, description="按性别分布")


# ============== API 端点 ==============

@router.get("/statistics/overview", response_model=PlatformOverview)
def get_overview(
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    平台概览统计
    
    返回平台整体数据概览
    """
    # 商家总数
    merchants = session.exec(select(Merchant)).all()
    merchant_count = len(merchants)
    
    # 用户总数
    users = session.exec(select(User)).all()
    user_count = len(users)
    
    # 商品总数
    products = session.exec(select(Product)).all()
    product_count = len(products)
    
    # 订单总数和总收益
    orders = session.exec(select(Order)).all()
    order_count = len(orders)
    total_revenue = sum(o.total_amount for o in orders)
    
    # 今日统计
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    today_orders = [o for o in orders if o.created_at >= today_start]
    today_order_count = len(today_orders)
    today_revenue = sum(o.total_amount for o in today_orders)
    
    return PlatformOverview(
        merchant_count=merchant_count,
        user_count=user_count,
        product_count=product_count,
        order_count=order_count,
        total_revenue=round(total_revenue, 2),
        today_order_count=today_order_count,
        today_revenue=round(today_revenue, 2)
    )


@router.get("/statistics/merchants", response_model=MerchantStatistics)
def get_merchant_statistics(
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    商家统计
    
    返回商家相关统计数据
    """
    # 商家总数
    merchants = session.exec(select(Merchant)).all()
    total_merchants = len(merchants)
    
    # 按角色分布
    merchants_by_role = {}
    for m in merchants:
        role_key = str(m.role_id)
        merchants_by_role[role_key] = merchants_by_role.get(role_key, 0) + 1
    
    # 今日新增商家
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    new_merchants_today = len([m for m in merchants if m.created_at >= today_start])
    
    # 活跃商家（有订单的商家）
    orders = session.exec(select(Order)).all()
    active_merchant_ids = set(o.merchant_id for o in orders)
    active_merchants = len(active_merchant_ids)
    
    return MerchantStatistics(
        total_merchants=total_merchants,
        active_merchants=active_merchants,
        new_merchants_today=new_merchants_today,
        merchants_by_role=merchants_by_role
    )


@router.get("/statistics/orders", response_model=OrderStatistics)
def get_order_statistics(
    start_date: Optional[str] = Query(default=None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(default=None, description="结束日期 YYYY-MM-DD"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    订单统计
    
    支持按日期范围筛选
    """
    # 构建查询
    statement = select(Order)
    
    # 日期筛选
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            statement = statement.where(Order.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            # 包含当天
            end_dt = end_dt + timedelta(days=1)
            statement = statement.where(Order.created_at < end_dt)
        except ValueError:
            pass
    
    orders = session.exec(statement).all()
    
    # 统计
    total_orders = len(orders)
    
    # 按状态分布
    orders_by_status = {}
    for o in orders:
        orders_by_status[o.status] = orders_by_status.get(o.status, 0) + 1
    
    pending_orders = orders_by_status.get("pending", 0)
    completed_orders = orders_by_status.get("completed", 0)
    cancelled_orders = orders_by_status.get("cancelled", 0)
    
    # 平均订单金额
    total_amount = sum(o.total_amount for o in orders)
    average_order_value = total_amount / total_orders if total_orders > 0 else 0
    
    return OrderStatistics(
        total_orders=total_orders,
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        orders_by_status=orders_by_status,
        average_order_value=round(average_order_value, 2)
    )


@router.get("/statistics/revenue", response_model=RevenueStatistics)
def get_revenue_statistics(
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    收益统计
    
    返回平台收益相关数据
    """
    orders = session.exec(select(Order)).all()
    
    # 总收益
    total_revenue = sum(o.total_amount for o in orders)
    
    # 今日收益
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_orders = [o for o in orders if o.created_at >= today_start]
    today_revenue = sum(o.total_amount for o in today_orders)
    
    # 本周收益
    week_start = today_start - timedelta(days=today.weekday())
    week_orders = [o for o in orders if o.created_at >= week_start]
    week_revenue = sum(o.total_amount for o in week_orders)
    
    # 本月收益
    month_start = datetime.combine(today.replace(day=1), datetime.min.time())
    month_orders = [o for o in orders if o.created_at >= month_start]
    month_revenue = sum(o.total_amount for o in month_orders)
    
    # 按商家收益排名
    merchant_revenue = {}
    for o in orders:
        merchant_revenue[o.merchant_id] = merchant_revenue.get(o.merchant_id, 0) + o.total_amount
    
    # 获取商家名称
    merchants = session.exec(select(Merchant)).all()
    merchant_names = {m.id: m.shop_name for m in merchants}
    
    revenue_by_merchant = [
        {
            "merchant_id": mid,
            "merchant_name": merchant_names.get(mid, f"商家{mid}"),
            "revenue": round(rev, 2)
        }
        for mid, rev in sorted(merchant_revenue.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    return RevenueStatistics(
        total_revenue=round(total_revenue, 2),
        today_revenue=round(today_revenue, 2),
        week_revenue=round(week_revenue, 2),
        month_revenue=round(month_revenue, 2),
        revenue_by_merchant=revenue_by_merchant
    )


@router.get("/statistics/users", response_model=UserStatistics)
def get_user_statistics(
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    用户统计
    
    返回用户相关统计数据
    """
    users = session.exec(select(User)).all()
    
    # 用户总数
    total_users = len(users)
    
    # 活跃用户
    active_users = len([u for u in users if u.is_active])
    
    # 今日新增用户
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    new_users_today = len([u for u in users if u.created_at >= today_start])
    
    # 按性别分布
    users_by_gender = {}
    for u in users:
        gender = u.gender if u.gender else "unknown"
        users_by_gender[gender] = users_by_gender.get(gender, 0) + 1
    
    return UserStatistics(
        total_users=total_users,
        active_users=active_users,
        new_users_today=new_users_today,
        users_by_gender=users_by_gender
    )