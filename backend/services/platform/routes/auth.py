"""
Authentication Routes - 认证管理路由

提供管理员认证功能：
- POST /login: 管理员登录
- POST /logout: 管理员登出
- GET /profile: 获取当前管理员信息
- PUT /password: 修改密码
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlmodel import Session, select

# 导入共享模块
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from shared.database import get_session
from shared.models import PlatformAdmin
from shared.auth import (
    create_admin_token,
    verify_admin_token,
    get_current_admin,
    SECRET_KEY,
)

router = APIRouter()
security = HTTPBearer()


# ============== 请求/响应模型 ==============

class AdminLoginRequest(BaseModel):
    """管理员登录请求"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, max_length=100, description="密码")


class AdminLoginResponse(BaseModel):
    """管理员登录响应"""
    token: str = Field(..., description="JWT Token")
    admin_id: int = Field(..., description="管理员ID")
    username: str = Field(..., description="用户名")
    role: str = Field(..., description="角色")
    permissions: list = Field(default=[], description="权限列表")


class AdminProfileResponse(BaseModel):
    """管理员信息响应"""
    id: int
    username: str
    email: str
    phone: str
    real_name: str
    role: str
    permissions: list
    is_active: bool
    last_login_at: Optional[datetime]
    created_at: datetime


class ChangePasswordRequest(BaseModel):
    """修改密码请求"""
    old_password: str = Field(..., min_length=6, description="原密码")
    new_password: str = Field(..., min_length=6, max_length=100, description="新密码")


# ============== 辅助函数 ==============

def hash_password(password: str) -> str:
    """密码哈希"""
    import hashlib
    return hashlib.sha256(f"{password}{SECRET_KEY}".encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return hash_password(plain_password) == hashed_password


# ============== API 端点 ==============

@router.post("/login", response_model=AdminLoginResponse)
def login(
    request: AdminLoginRequest,
    session: Session = Depends(get_session)
):
    """
    管理员登录
    
    - **username**: 管理员用户名
    - **password**: 密码
    """
    # 查询管理员
    statement = select(PlatformAdmin).where(
        PlatformAdmin.username == request.username
    )
    admin = session.exec(statement).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用"
        )
    
    # 验证密码
    if not verify_password(request.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 更新最后登录时间
    admin.last_login_at = datetime.utcnow()
    session.add(admin)
    session.commit()
    
    # 生成 Token
    permissions = admin.get_permissions_list()
    token = create_admin_token(
        admin_id=admin.id,
        username=admin.username,
        role=admin.role,
        permissions=permissions
    )
    
    return AdminLoginResponse(
        token=token,
        admin_id=admin.id,
        username=admin.username,
        role=admin.role,
        permissions=permissions
    )


@router.post("/logout")
def logout(
    admin: dict = Depends(get_current_admin)
):
    """
    管理员登出
    
    客户端需要删除本地存储的 Token
    """
    return {
        "success": True,
        "message": "登出成功"
    }


@router.get("/profile", response_model=AdminProfileResponse)
def get_profile(
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取当前管理员信息
    """
    admin_id = admin.get("admin_id")
    
    statement = select(PlatformAdmin).where(PlatformAdmin.id == admin_id)
    admin_obj = session.exec(statement).first()
    
    if not admin_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="管理员不存在"
        )
    
    return AdminProfileResponse(
        id=admin_obj.id,
        username=admin_obj.username,
        email=admin_obj.email,
        phone=admin_obj.phone,
        real_name=admin_obj.real_name,
        role=admin_obj.role,
        permissions=admin_obj.get_permissions_list(),
        is_active=admin_obj.is_active,
        last_login_at=admin_obj.last_login_at,
        created_at=admin_obj.created_at
    )


@router.put("/password")
def change_password(
    request: ChangePasswordRequest,
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    修改密码
    
    - **old_password**: 原密码
    - **new_password**: 新密码
    """
    admin_id = admin.get("admin_id")
    
    statement = select(PlatformAdmin).where(PlatformAdmin.id == admin_id)
    admin_obj = session.exec(statement).first()
    
    if not admin_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="管理员不存在"
        )
    
    # 验证原密码
    if not verify_password(request.old_password, admin_obj.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="原密码错误"
        )
    
    # 更新密码
    admin_obj.password_hash = hash_password(request.new_password)
    admin_obj.updated_at = datetime.utcnow()
    session.add(admin_obj)
    session.commit()
    
    return {
        "success": True,
        "message": "密码修改成功"
    }