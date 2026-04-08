"""
JWT 认证模块
提供 JWT Token 创建、验证和商家鉴权功能
"""
import os
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# JWT 配置
# 从环境变量 JWT_SECRET 读取密钥
# 安全要求：生产环境必须设置 JWT_SECRET 环境变量
_jwt_secret = os.getenv("JWT_SECRET")
if not _jwt_secret:
    import warnings
    warnings.warn(
        "JWT_SECRET 环境变量未设置。使用临时密钥，仅限开发环境使用！"
        "生产环境必须设置 JWT_SECRET 环境变量。",
        UserWarning
    )
    # 开发环境生成临时密钥（每次启动不同）
    import secrets
    _jwt_secret = secrets.token_urlsafe(32)
SECRET_KEY = _jwt_secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7  # Token 有效期：7天

# HTTP Bearer 认证方案
security = HTTPBearer()


def create_access_token(merchant_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """
    创建 JWT Token
    
    Args:
        merchant_id: 商家ID
        expires_delta: 可选的过期时间增量，默认为7天
    
    Returns:
        str: 编码后的 JWT Token
    """
    if expires_delta is None:
        expires_delta = timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    expire = datetime.utcnow() + expires_delta
    
    # 构建载荷
    payload = {
        "merchant_id": merchant_id,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    # 编码生成 token
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# 别名，满足任务要求的函数名
create_token = create_access_token


def verify_token(token: str) -> Optional[dict]:
    """
    验证 JWT Token
    
    Args:
        token: 要验证的 JWT Token
    
    Returns:
        dict: 解码后的载荷，包含 merchant_id
        None: 如果验证失败
    
    Raises:
        HTTPException: Token 无效或已过期
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        merchant_id: int = payload.get("merchant_id")
        
        if merchant_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证凭证：缺少 merchant_id",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 已过期，请重新登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的 Token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_merchant(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    商家鉴权中间件
    
    用于 FastAPI 依赖注入，验证请求头中的 JWT Token 并返回商家信息
    
    Args:
        credentials: HTTP Bearer 认证凭证
    
    Returns:
        dict: 包含 merchant_id 的载荷信息
    
    Raises:
        HTTPException: 认证失败
    """
    token = credentials.credentials
    payload = verify_token(token)
    return payload


def get_merchant_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """
    获取当前商家ID的便捷方法
    
    Args:
        credentials: HTTP Bearer 认证凭证
    
    Returns:
        int: 商家ID
    """
    payload = get_current_merchant(credentials)
    return payload.get("merchant_id")