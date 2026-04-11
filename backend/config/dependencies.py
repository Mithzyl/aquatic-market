"""
依赖注入模块
统一管理认证和授权相关的依赖项
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from .database import get_session
from shared.auth import verify_token

# HTTP Bearer 认证方案
user_security = HTTPBearer(auto_error=False)


def get_current_merchant_id_from_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(user_security)
) -> int:
    """
    获取当前商家ID（从JWT Token）
    
    用于需要认证的端点，验证请求携带的 JWT Token 并提取商家ID
    
    Raises:
        HTTPException: 401 - 缺少认证凭证或凭证无效
    
    Returns:
        int: 商家ID
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = verify_token(token)
    merchant_id = payload.get("merchant_id")
    
    if merchant_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return merchant_id


def get_optional_merchant_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(user_security)
) -> Optional[int]:
    """
    可选的商家ID获取（不强制认证）
    
    用于某些可选认证的场景
    
    Returns:
        Optional[int]: 商家ID，如果未提供认证则返回 None
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = verify_token(token)
        return payload.get("merchant_id")
    except Exception:
        return None
