"""
Merchant Management Routes - 商家管理路由

提供商家管理功能：
- GET /merchants: 获取商家列表
- GET /merchants/{id}: 获取商家详情
- PUT /merchants/{id}/status: 更新商家状态（启用/禁用）
- GET /merchants/{id}/orders: 获取商家订单
- GET /merchants/{id}/products: 获取商家商品

F02: 商家状态管理补全
- 禁用商家时自动取消pending订单
- 记录操作日志
- 恢复库存
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlmodel import Session, select

# 导入共享模块
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from shared.database import get_session
from shared.models import (
    Merchant, Product, Order, OrderItem, MerchantOperationLog, PlatformAdmin,
    MerchantConfig, hash_password
)
from shared.auth import get_current_admin, require_admin_permission
from shared.schemas.base import PaginatedResponse, PaginationMeta

# 导入订单服务
from services.order_service import OrderService

router = APIRouter()


# ============== 请求/响应模型 ==============

class MerchantResponse(BaseModel):
    """商家信息响应"""
    id: int
    name: str
    phone: str
    wechat_openid: Optional[str] = None
    shop_name: str
    role_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MerchantListResponse(BaseModel):
    """商家列表响应"""
    merchants: List[MerchantResponse]
    total: int


class MerchantStatusUpdate(BaseModel):
    """商家状态更新请求"""
    is_active: bool = Field(..., description="是否启用")
    reason: Optional[str] = Field(default=None, description="操作原因")


class MerchantDetailResponse(BaseModel):
    """商家详情响应"""
    id: int
    name: str
    phone: str
    wechat_openid: Optional[str] = None
    shop_name: str
    role_id: int
    created_at: datetime
    updated_at: datetime
    # 统计信息
    product_count: int = Field(default=0, description="商品数量")
    order_count: int = Field(default=0, description="订单数量")
    
    class Config:
        from_attributes = True


# ============== 新增端点请求模型 ==============

class MerchantCreateRequest(BaseModel):
    """新增商家请求 (N01)"""
    username: str = Field(..., min_length=3, max_length=50, description="登录用户名")
    password: str = Field(..., min_length=6, max_length=50, description="登录密码")
    shop_name: str = Field(..., min_length=1, max_length=100, description="店铺名称")
    name: str = Field(default="", max_length=100, description="联系人姓名")
    phone: str = Field(default="", max_length=20, description="手机号")


class MerchantUpdateRequest(BaseModel):
    """修改商家信息请求 (N02) — 所有字段选填"""
    # merchant 表字段
    shop_name: Optional[str] = Field(default=None, max_length=100, description="店铺名称")
    name: Optional[str] = Field(default=None, max_length=100, description="联系人姓名")
    phone: Optional[str] = Field(default=None, max_length=20, description="手机号")
    password: Optional[str] = Field(default=None, min_length=6, max_length=50, description="登录密码（选填，填写则更新）")
    # merchant_config 表字段
    address: Optional[str] = Field(default=None, max_length=200, description="店铺地址")
    business_hours: Optional[str] = Field(default=None, max_length=100, description="营业时间")
    contact_phone: Optional[str] = Field(default=None, max_length=20, description="联系电话")
    announcement: Optional[str] = Field(default=None, max_length=500, description="店铺公告")
    theme_color: Optional[str] = Field(default=None, max_length=20, description="主题色")
    enable_ordering: Optional[bool] = Field(default=None, description="是否开启下单")
    enable_pickup: Optional[bool] = Field(default=None, description="是否开启自提")
    min_order_amount: Optional[float] = Field(default=None, ge=0, description="最低订单金额")


class MerchantDeleteRequest(BaseModel):
    """删除商家请求 (N03)"""
    force: bool = Field(default=False, description="是否强制删除（跳过订单保护）")


# ============== API 端点 ==============

@router.get("/merchants", response_model=MerchantListResponse)
def get_merchants(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(default=None, description="搜索关键词"),
    is_active: Optional[bool] = Query(default=None, description="状态筛选"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取商家列表（分页）
    
    支持按关键词搜索和状态筛选
    """
    # 构建查询
    statement = select(Merchant)
    count_statement = select(Merchant)
    
    # 关键词搜索
    if keyword:
        statement = statement.where(
            (Merchant.name.contains(keyword)) |
            (Merchant.shop_name.contains(keyword)) |
            (Merchant.phone.contains(keyword))
        )
        count_statement = count_statement.where(
            (Merchant.name.contains(keyword)) |
            (Merchant.shop_name.contains(keyword)) |
            (Merchant.phone.contains(keyword))
        )
    
    # 状态筛选
    if is_active is not None:
        # 注意：当前 Merchant 模型没有 is_active 字段
        # 这里预留接口，后续可扩展
        pass
    
    # 统计总数
    merchants = session.exec(statement).all()
    total = len(merchants)
    
    # 分页
    offset = (page - 1) * page_size
    paginated_statement = statement.offset(offset).limit(page_size)
    merchants = session.exec(paginated_statement).all()
    
    return MerchantListResponse(
        merchants=[MerchantResponse.model_validate(m) for m in merchants],
        total=total
    )


@router.get("/merchants/{merchant_id}", response_model=MerchantDetailResponse)
def get_merchant(
    merchant_id: int,
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取商家详情
    
    包含商品数量、订单数量等统计信息
    """
    # 查询商家
    merchant = session.get(Merchant, merchant_id)
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # 统计商品数量
    product_count = len(session.exec(
        select(Product).where(Product.merchant_id == merchant_id)
    ).all())
    
    # 统计订单数量
    order_count = len(session.exec(
        select(Order).where(Order.merchant_id == merchant_id)
    ).all())
    
    return MerchantDetailResponse(
        id=merchant.id,
        name=merchant.name,
        phone=merchant.phone,
        wechat_openid=merchant.wechat_openid,
        shop_name=merchant.shop_name,
        role_id=merchant.role_id,
        created_at=merchant.created_at,
        updated_at=merchant.updated_at,
        product_count=product_count,
        order_count=order_count
    )


@router.put("/merchants/{merchant_id}/status")
def update_merchant_status(
    merchant_id: int,
    request: MerchantStatusUpdate,
    admin: dict = Depends(require_admin_permission("merchant:update")),
    session: Session = Depends(get_session)
):
    """
    更新商家状态（启用/禁用）
    
    需要权限：merchant:update
    
    F02: 商家状态管理补全
    - 禁用商家后，自动取消该商家的所有pending状态订单
    - 记录商家启用/禁用操作日志（MerchantOperationLog模型）
    - 库存恢复（取消订单时恢复库存）
    
    - 禁用商家后，商家无法登录和操作
    - 启用商家后，恢复正常使用
    """
    merchant = session.get(Merchant, merchant_id)
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # 记录操作前状态
    previous_status = merchant.is_active
    
    # 如果是禁用操作，需要取消pending订单
    cancelled_orders_count = 0
    if not request.is_active and previous_status:
        # F02: 批量取消pending订单并恢复库存
        order_service = OrderService(session)
        cancelled_orders_count = order_service.batch_cancel_pending_orders(merchant_id)
    
    try:
        # 更新商家状态
        merchant.is_active = request.is_active
        merchant.updated_at = datetime.utcnow()
        session.add(merchant)
        
        # F02: 记录操作日志
        operation_log = MerchantOperationLog(
            merchant_id=merchant_id,
            admin_id=admin.get("admin_id"),
            operation_type="disable" if not request.is_active else "enable",
            previous_status=previous_status,
            new_status=request.is_active,
            reason=request.reason or "",
            cancelled_orders_count=cancelled_orders_count,
            created_at=datetime.utcnow()
        )
        session.add(operation_log)
        
        session.commit()
        session.refresh(merchant)
        
        return {
            "success": True,
            "message": f"商家状态已{'启用' if request.is_active else '禁用'}",
            "merchant_id": merchant_id,
            "is_active": merchant.is_active,
            "reason": request.reason,
            "cancelled_orders_count": cancelled_orders_count,
            "operation_logged": True
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"商家状态更新失败: {str(e)}"
        )


@router.get("/merchants/{merchant_id}/orders")
def get_merchant_orders(
    merchant_id: int,
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(default=None, description="订单状态筛选"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取商家订单列表
    
    支持按状态筛选
    """
    merchant = session.get(Merchant, merchant_id)
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # 构建查询
    statement = select(Order).where(Order.merchant_id == merchant_id)
    
    if status:
        statement = statement.where(Order.status == status)
    
    # 按创建时间倒序
    statement = statement.order_by(Order.created_at.desc())
    
    # 统计总数
    orders = session.exec(statement).all()
    total = len(orders)
    
    # 分页
    offset = (page - 1) * page_size
    paginated_statement = statement.offset(offset).limit(page_size)
    orders = session.exec(paginated_statement).all()
    
    return {
        "orders": [
            {
                "id": o.id,
                "customer_name": o.customer_name,
                "customer_phone": o.customer_phone,
                "pickup_time": o.pickup_time.isoformat(),
                "total_amount": o.total_amount,
                "status": o.status,
                "created_at": o.created_at.isoformat()
            }
            for o in orders
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/merchants/{merchant_id}/products")
def get_merchant_products(
    merchant_id: int,
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    is_active: Optional[bool] = Query(default=None, description="状态筛选"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取商家商品列表
    
    支持按状态筛选
    """
    merchant = session.get(Merchant, merchant_id)
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # 构建查询
    statement = select(Product).where(Product.merchant_id == merchant_id)
    
    if is_active is not None:
        statement = statement.where(Product.is_active == is_active)
    
    # 按创建时间倒序
    statement = statement.order_by(Product.created_at.desc())
    
    # 统计总数
    products = session.exec(statement).all()
    total = len(products)
    
    # 分页
    offset = (page - 1) * page_size
    paginated_statement = statement.offset(offset).limit(page_size)
    products = session.exec(paginated_statement).all()
    
    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "stock": p.stock,
                "sales": p.sales,
                "category": p.category,
                "is_active": p.is_active,
                "created_at": p.created_at.isoformat()
            }
            for p in products
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }


# ============== N01: 新增商家 ==============

@router.post("/merchants", status_code=201)
def create_merchant(
    request: MerchantCreateRequest,
    admin: dict = Depends(require_admin_permission("merchant:create")),
    session: Session = Depends(get_session)
):
    """
    新增商家 (N01)
    
    权限：merchant:create
    
    业务逻辑：
    1. 校验 username 唯一性
    2. bcrypt 加密密码
    3. 创建 Merchant 记录（role_id=1, is_active=True）
    4. 自动创建 MerchantConfig 默认配置
    5. 返回 201 + 完整商家信息
    """
    # 校验 username 唯一性
    existing = session.exec(
        select(Merchant).where(Merchant.username == request.username)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被占用"
        )
    
    now = datetime.utcnow()
    
    try:
        # 创建 Merchant
        merchant = Merchant(
            username=request.username,
            password_hash=hash_password(request.password),
            shop_name=request.shop_name,
            name=request.name,
            phone=request.phone,
            role_id=1,
            is_active=True,
            created_at=now,
            updated_at=now
        )
        session.add(merchant)
        session.flush()  # 获取 merchant.id
        
        # 自动创建 MerchantConfig 默认配置
        config = MerchantConfig.get_default_config(merchant.id)
        config.shop_name = request.shop_name  # 同步店铺名称
        session.add(config)
        
        session.commit()
        session.refresh(merchant)
        
        return {
            "id": merchant.id,
            "username": merchant.username,
            "shop_name": merchant.shop_name,
            "name": merchant.name,
            "phone": merchant.phone,
            "role_id": merchant.role_id,
            "is_active": merchant.is_active,
            "created_at": merchant.created_at.isoformat(),
            "message": "商家创建成功"
        }
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"商家创建失败: {str(e)}"
        )


# ============== N02: 修改商家信息 ==============

@router.put("/merchants/{merchant_id}")
def update_merchant(
    merchant_id: int,
    request: MerchantUpdateRequest,
    admin: dict = Depends(require_admin_permission("merchant:update")),
    session: Session = Depends(get_session)
):
    """
    修改商家信息 (N02)
    
    权限：merchant:update
    
    业务逻辑：
    1. 查找商家（不存在 → 404）
    2. 只更新传入的非 None 字段
    3. merchant_config 字段 → upsert
    4. 修改 shop_name 时同步 merchant_config.shop_name
    5. 请求体全为空 → 400
    """
    merchant = session.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # 检查是否至少有一个非 None 字段
    update_data = request.model_dump(exclude_unset=True, exclude_none=True) if hasattr(request, 'model_dump') else request.dict(exclude_unset=True, exclude_none=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="至少需要提供一个修改字段"
        )
    
    # 分离 merchant 表字段和 merchant_config 表字段
    merchant_fields = {"shop_name", "name", "phone", "password"}
    config_fields = {"address", "business_hours", "contact_phone", "announcement",
                     "theme_color", "enable_ordering", "enable_pickup", "min_order_amount"}
    
    merchant_updates = {k: v for k, v in update_data.items() if k in merchant_fields}
    config_updates = {k: v for k, v in update_data.items() if k in config_fields}
    
    try:
        now = datetime.utcnow()
        shop_name_changed = False
        
        # 更新 merchant 表字段
        if "shop_name" in merchant_updates:
            merchant.shop_name = merchant_updates["shop_name"]
            shop_name_changed = True
        if "name" in merchant_updates:
            merchant.name = merchant_updates["name"]
        if "phone" in merchant_updates:
            merchant.phone = merchant_updates["phone"]
        if "password" in merchant_updates:
            merchant.password_hash = hash_password(merchant_updates["password"])
        
        merchant.updated_at = now
        session.add(merchant)
        
        # upsert merchant_config
        if config_updates or shop_name_changed:
            config = session.exec(
                select(MerchantConfig).where(MerchantConfig.merchant_id == merchant_id)
            ).first()
            
            if not config:
                # 不存在则创建
                config = MerchantConfig.get_default_config(merchant_id)
                session.add(config)
                session.flush()
            
            # 更新 config 字段
            if "address" in config_updates:
                config.address = config_updates["address"]
            if "business_hours" in config_updates:
                config.business_hours = config_updates["business_hours"]
            if "contact_phone" in config_updates:
                config.contact_phone = config_updates["contact_phone"]
            if "announcement" in config_updates:
                config.announcement = config_updates["announcement"]
            if "theme_color" in config_updates:
                config.theme_color = config_updates["theme_color"]
            if "enable_ordering" in config_updates:
                config.enable_ordering = config_updates["enable_ordering"]
            if "enable_pickup" in config_updates:
                config.enable_pickup = config_updates["enable_pickup"]
            if "min_order_amount" in config_updates:
                config.min_order_amount = config_updates["min_order_amount"]
            
            # Q1: 同步 shop_name
            if shop_name_changed:
                config.shop_name = merchant_updates["shop_name"]
            
            config.updated_at = now
            session.add(config)
        
        session.commit()
        session.refresh(merchant)
        
        # 重新获取 config 用于响应
        final_config = session.exec(
            select(MerchantConfig).where(MerchantConfig.merchant_id == merchant_id)
        ).first()
        
        config_response = None
        if final_config:
            config_response = {
                "id": final_config.id,
                "merchant_id": final_config.merchant_id,
                "shop_name": final_config.shop_name,
                "address": final_config.address,
                "business_hours": final_config.business_hours,
                "contact_phone": final_config.contact_phone,
                "announcement": final_config.announcement,
                "theme_color": final_config.theme_color,
                "enable_ordering": final_config.enable_ordering,
                "enable_pickup": final_config.enable_pickup,
                "min_order_amount": final_config.min_order_amount
            }
        
        return {
            "success": True,
            "message": "商家信息已更新",
            "merchant": {
                "id": merchant.id,
                "username": merchant.username,
                "shop_name": merchant.shop_name,
                "name": merchant.name,
                "phone": merchant.phone,
                "role_id": merchant.role_id,
                "is_active": merchant.is_active,
                "created_at": merchant.created_at.isoformat(),
                "updated_at": merchant.updated_at.isoformat()
            },
            "config": config_response
        }
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"商家信息更新失败: {str(e)}"
        )


# ============== N03: 删除商家 ==============

@router.delete("/merchants/{merchant_id}")
def delete_merchant(
    merchant_id: int,
    request: MerchantDeleteRequest = MerchantDeleteRequest(),
    admin: dict = Depends(require_admin_permission("merchant:delete")),
    session: Session = Depends(get_session)
):
    """
    删除商家 (N03)
    
    权限：merchant:delete
    
    业务逻辑：
    1. 查找商家（不存在 → 404）
    2. force=false：检查活跃订单 → 有则 409
    3. force=true：先取消所有 pending 订单 + 恢复库存
    4. 级联删除：OrderItem → Order → Product → MerchantConfig → MerchantOperationLog → Merchant
    5. Q2: 保留 C端 user 记录
    6. 使用数据库事务，失败 rollback
    """
    merchant = session.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # 统计活跃订单 (pending/confirmed/ready)
    active_orders = session.exec(
        select(Order).where(
            Order.merchant_id == merchant_id,
            Order.status.in_(["pending", "confirmed", "ready"])
        )
    ).all()
    active_order_count = len(active_orders)
    
    cancelled_orders_count = 0
    
    if not request.force:
        # 有活跃订单 → 拒绝删除
        if active_order_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"商家有 {active_order_count} 个未完成订单，无法删除。请先处理订单或使用 force=true"
            )
    else:
        # force=true: 取消所有 pending 订单 + 恢复库存
        order_service = OrderService(session)
        cancelled_orders_count = order_service.batch_cancel_pending_orders(merchant_id)
    
    # 统计数据用于响应
    products_count = len(session.exec(
        select(Product).where(Product.merchant_id == merchant_id)
    ).all())
    
    all_order_ids = [o.id for o in session.exec(
        select(Order).where(Order.merchant_id == merchant_id)
    ).all()]
    orders_count = len(all_order_ids)
    
    try:
        # 级联删除（按 FK 依赖顺序）
        # 1. 删除 OrderItem（先删除子记录）
        if all_order_ids:
            for oid in all_order_ids:
                items = session.exec(
                    select(OrderItem).where(OrderItem.order_id == oid)
                ).all()
                for item in items:
                    session.delete(item)
        
        # 2. 删除 Order
        orders_to_delete = session.exec(
            select(Order).where(Order.merchant_id == merchant_id)
        ).all()
        for order in orders_to_delete:
            session.delete(order)
        
        # 3. 删除 Product
        products_to_delete = session.exec(
            select(Product).where(Product.merchant_id == merchant_id)
        ).all()
        for product in products_to_delete:
            session.delete(product)
        
        # 4. 删除 MerchantConfig
        config = session.exec(
            select(MerchantConfig).where(MerchantConfig.merchant_id == merchant_id)
        ).first()
        config_deleted = config is not None
        if config:
            session.delete(config)
        
        # 5. 删除 MerchantOperationLog
        logs = session.exec(
            select(MerchantOperationLog).where(MerchantOperationLog.merchant_id == merchant_id)
        ).all()
        for log in logs:
            session.delete(log)
        
        # 6. 删除 Merchant
        session.delete(merchant)
        
        session.commit()
        
        return {
            "success": True,
            "message": "商家及关联数据已删除",
            "deleted": {
                "merchant_id": merchant_id,
                "products_count": products_count,
                "orders_count": orders_count,
                "cancelled_orders_count": cancelled_orders_count,
                "config_deleted": config_deleted
            }
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除商家失败: {str(e)}"
        )