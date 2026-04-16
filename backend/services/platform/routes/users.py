"""
User Management Routes - 用户管理路由

提供用户管理功能：
- GET /users: 获取用户列表
- GET /users/{id}: 获取用户详情
- PUT /users/{id}/status: 更新用户状态
- GET /users/{id}/orders: 获取用户订单历史
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
from shared.models import User, Merchant, Order
from shared.auth import get_current_admin, require_admin_permission

router = APIRouter()


# ============== 请求/响应模型 ==============

class UserResponse(BaseModel):
    """用户信息响应"""
    id: int
    phone: str
    wechat_openid: str
    nickname: str
    avatar_url: str
    real_name: str
    gender: str
    birthday: Optional[datetime]
    address: str
    is_active: bool
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """用户列表响应"""
    users: List[UserResponse]
    total: int


class UserDetailResponse(BaseModel):
    """用户详情响应"""
    id: int
    phone: str
    wechat_openid: str
    nickname: str
    avatar_url: str
    real_name: str
    gender: str
    birthday: Optional[datetime]
    address: str
    is_active: bool
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    # 统计信息
    order_count: int = Field(default=0, description="订单数量")
    default_merchant_name: Optional[str] = Field(default=None, description="默认商家名称")
    
    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    """用户状态更新请求"""
    is_active: bool = Field(..., description="是否启用")
    reason: Optional[str] = Field(default=None, description="操作原因")


# ============== API 端点 ==============

@router.get("/users", response_model=UserListResponse)
def get_users(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(default=None, description="搜索关键词"),
    is_active: Optional[bool] = Query(default=None, description="状态筛选"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取用户列表（分页）
    
    支持按关键词搜索和状态筛选
    """
    # 构建查询
    statement = select(User)
    count_statement = select(User)
    
    # 关键词搜索
    if keyword:
        statement = statement.where(
            (User.nickname.contains(keyword)) |
            (User.phone.contains(keyword)) |
            (User.real_name.contains(keyword))
        )
        count_statement = count_statement.where(
            (User.nickname.contains(keyword)) |
            (User.phone.contains(keyword)) |
            (User.real_name.contains(keyword))
        )
    
    # 状态筛选
    if is_active is not None:
        statement = statement.where(User.is_active == is_active)
        count_statement = count_statement.where(User.is_active == is_active)
    
    # 统计总数
    users = session.exec(count_statement).all()
    total = len(users)
    
    # 分页
    offset = (page - 1) * page_size
    paginated_statement = statement.offset(offset).limit(page_size)
    users = session.exec(paginated_statement).all()
    
    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total
    )


@router.get("/users/{user_id}", response_model=UserDetailResponse)
def get_user(
    user_id: int,
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取用户详情
    
    包含订单数量等统计信息
    """
    # 查询用户
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 统计订单数量
    # 注意：当前 Order 模型关联的是 merchant_id，没有直接关联 user_id
    # 这里需要通过其他方式统计（如预留 user_id 字段）
    order_count = 0  # TODO: 实现用户订单统计
    
    # 获取默认商家名称
    default_merchant_name = None
    if user.default_merchant_id:
        merchant = session.get(Merchant, user.default_merchant_id)
        if merchant:
            default_merchant_name = merchant.shop_name
    
    return UserDetailResponse(
        id=user.id,
        phone=user.phone,
        wechat_openid=user.wechat_openid,
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        real_name=user.real_name,
        gender=user.gender,
        birthday=user.birthday,
        address=user.address,
        is_active=user.is_active,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
        order_count=order_count,
        default_merchant_name=default_merchant_name
    )


@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    request: UserStatusUpdate,
    admin: dict = Depends(require_admin_permission("merchant:update")),
    session: Session = Depends(get_session)
):
    """
    更新用户状态（启用/禁用）
    
    需要权限：merchant:update（使用商家管理权限）
    """
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 更新状态
    user.is_active = request.is_active
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    
    return {
        "success": True,
        "message": f"用户状态已{'启用' if request.is_active else '禁用'}"
    }


@router.get("/users/{user_id}/orders")
def get_user_orders(
    user_id: int,
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取用户订单历史
    
    注意：当前 Order 模型没有 user_id 字段
    此接口为预留接口
    """
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # TODO: Order 模型添加 user_id 字段后实现
    # statement = select(Order).where(Order.user_id == user_id)
    # orders = session.exec(statement).all()
    
    return {
        "orders": [],
        "total": 0,
        "page": page,
        "page_size": page_size,
        "note": "当前版本 Order 模型未实现 user_id 字段，此接口为预留接口"
    }