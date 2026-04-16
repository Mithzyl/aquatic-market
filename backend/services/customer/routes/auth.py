"""
Auth Routes - 用户认证路由（用户端）

提供用户认证功能：
- POST /auth/login: 微信登录（获取Token）
- POST /auth/register: 用户注册（手机号注册）
- GET /auth/me: 获取当前用户信息
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

# 导入共享模块
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from shared.database import get_session
from shared.models import User, Merchant
from shared.auth import create_user_token, get_current_user, get_user_id

router = APIRouter()


# ============== 请求/响应模型 ==============

class WeChatLoginRequest(BaseModel):
    """微信登录请求"""
    code: str = Field(..., description="微信登录code")
    nickname: Optional[str] = Field(default="", description="昵称")
    avatar_url: Optional[str] = Field(default="", description="头像URL")


class PhoneRegisterRequest(BaseModel):
    """手机号注册请求"""
    phone: str = Field(..., max_length=20, description="手机号")
    nickname: Optional[str] = Field(default="", description="昵称")
    merchant_id: Optional[int] = Field(default=None, description="默认商家ID")


class LoginResponse(BaseModel):
    """登录响应"""
    token: str = Field(..., description="JWT Token")
    user_id: int = Field(..., description="用户ID")
    phone: str = Field(default="", description="手机号")
    nickname: str = Field(default="", description="昵称")
    avatar_url: str = Field(default="", description="头像URL")
    default_merchant_id: Optional[int] = Field(default=None, description="默认商家ID")


class UserInfoResponse(BaseModel):
    """用户信息响应"""
    id: int
    phone: str
    nickname: str
    avatar_url: str
    real_name: str
    default_merchant_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== API 端点 ==============

@router.post("/auth/login", response_model=LoginResponse)
def wechat_login(
    request: WeChatLoginRequest,
    session: Session = Depends(get_session)
):
    """
    微信登录
    
    通过微信code换取openid，创建或获取用户，返回JWT Token
    注意：实际项目中需要调用微信API获取openid，这里简化处理
    """
    # 模拟微信登录（实际项目需要调用微信API）
    # 这里用code作为临时openid（实际应调用 https://api.weixin.qq.com/sns/jscode2session）
    mock_openid = f"wx_{request.code}"
    
    # 查找或创建用户
    user = session.exec(
        select(User).where(User.wechat_openid == mock_openid)
    ).first()
    
    if not user:
        # 创建新用户
        # 为微信用户生成唯一的临时phone值（避免空字符串冲突）
        temp_phone = f"wx_{request.code}"  # 使用wechat_openid作为临时phone
        user = User(
            phone=temp_phone,
            wechat_openid=mock_openid,
            nickname=request.nickname or "微信用户",
            avatar_url=request.avatar_url or "",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        # 更新用户信息
        if request.nickname:
            user.nickname = request.nickname
        if request.avatar_url:
            user.avatar_url = request.avatar_url
        user.last_login_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        session.add(user)
        session.commit()
    
    # 创建Token
    token = create_user_token(user_id=user.id, phone=user.phone)
    
    return LoginResponse(
        token=token,
        user_id=user.id,
        phone=user.phone or "",
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        default_merchant_id=user.default_merchant_id
    )


@router.post("/auth/register", response_model=LoginResponse)
def phone_register(
    request: PhoneRegisterRequest,
    session: Session = Depends(get_session)
):
    """
    手机号注册
    
    通过手机号创建用户，返回JWT Token
    """
    # 检查手机号是否已存在
    existing_user = session.exec(
        select(User).where(User.phone == request.phone)
    ).first()
    
    if existing_user:
        # 已存在，直接返回Token（相当于登录）
        token = create_user_token(user_id=existing_user.id, phone=existing_user.phone)
        return LoginResponse(
            token=token,
            user_id=existing_user.id,
            phone=existing_user.phone,
            nickname=existing_user.nickname,
            avatar_url=existing_user.avatar_url,
            default_merchant_id=existing_user.default_merchant_id
        )
    
    # 创建新用户
    user = User(
        phone=request.phone,
        nickname=request.nickname or f"用户{request.phone[-4:]}",
        default_merchant_id=request.merchant_id,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # 创建Token
    token = create_user_token(user_id=user.id, phone=user.phone)
    
    return LoginResponse(
        token=token,
        user_id=user.id,
        phone=user.phone,
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        default_merchant_id=user.default_merchant_id
    )


@router.get("/auth/me", response_model=UserInfoResponse)
def get_current_user_info(
    user_id: int = Depends(get_user_id),
    session: Session = Depends(get_session)
):
    """
    获取当前用户信息
    
    需要JWT Token认证
    """
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return UserInfoResponse(
        id=user.id,
        phone=user.phone or "",
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        real_name=user.real_name or "",
        default_merchant_id=user.default_merchant_id,
        created_at=user.created_at
    )


@router.put("/auth/me")
def update_current_user(
    nickname: Optional[str] = None,
    avatar_url: Optional[str] = None,
    default_merchant_id: Optional[int] = None,
    user_id: int = Depends(get_user_id),
    session: Session = Depends(get_session)
):
    """
    更新当前用户信息
    
    需要JWT Token认证
    """
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 更新字段
    if nickname:
        user.nickname = nickname
    if avatar_url:
        user.avatar_url = avatar_url
    if default_merchant_id:
        # 验证商家存在
        merchant = session.get(Merchant, default_merchant_id)
        if not merchant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="商家不存在"
            )
        user.default_merchant_id = default_merchant_id
    
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    
    return {
        "success": True,
        "message": "用户信息已更新"
    }