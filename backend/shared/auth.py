"""
Auth Module - JWT 认证模块
提供 JWT Token 创建、验证和鉴权功能
支持 RBAC 权限管理：角色信息嵌入 Token、权限校验中间件
支持商家认证、用户认证、管理员认证
"""
import os
from datetime import datetime, timedelta
from typing import Optional, List, Callable
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


# ============== Token 创建函数 ==============

def create_access_token(
    merchant_id: int,
    role_code: Optional[str] = None,
    permissions: Optional[List[str]] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    创建 JWT Token（支持 RBAC 角色信息）
    
    Args:
        merchant_id: 商家ID
        role_code: 角色代码（如 owner, admin, staff）
        permissions: 权限列表（如 ["product:read", "product:delete"]）
        expires_delta: 可选的过期时间增量，默认为7天
    
    Returns:
        str: 编码后的 JWT Token
    """
    if expires_delta is None:
        expires_delta = timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    expire = datetime.utcnow() + expires_delta
    
    # 构建载荷（包含角色和权限信息）
    payload = {
        "merchant_id": merchant_id,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    # 添加角色信息（如果提供）
    if role_code:
        payload["role_code"] = role_code
    
    if permissions:
        payload["permissions"] = permissions
    
    # 编码生成 token
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_user_token(
    user_id: int,
    phone: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    创建用户 JWT Token
    
    Args:
        user_id: 用户ID
        phone: 用户手机号
        expires_delta: 可选的过期时间增量，默认为7天
    
    Returns:
        str: 编码后的 JWT Token
    """
    if expires_delta is None:
        expires_delta = timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    expire = datetime.utcnow() + expires_delta
    
    payload = {
        "user_id": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "token_type": "user"
    }
    
    if phone:
        payload["phone"] = phone
    
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_admin_token(
    admin_id: int,
    username: Optional[str] = None,
    role: Optional[str] = None,
    permissions: Optional[List[str]] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    创建管理员 JWT Token
    
    Args:
        admin_id: 管理员ID
        username: 管理员用户名
        role: 管理员角色（super_admin/admin/operator）
        permissions: 权限列表
        expires_delta: 可选的过期时间增量，默认为7天
    
    Returns:
        str: 编码后的 JWT Token
    """
    if expires_delta is None:
        expires_delta = timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    expire = datetime.utcnow() + expires_delta
    
    payload = {
        "admin_id": admin_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "token_type": "admin"
    }
    
    if username:
        payload["username"] = username
    
    if role:
        payload["role"] = role
    
    if permissions:
        payload["permissions"] = permissions
    
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# 别名，满足任务要求的函数名
create_token = create_access_token


# ============== Token 验证函数 ==============

def verify_token(token: str) -> Optional[dict]:
    """
    验证 JWT Token
    
    Args:
        token: 要验证的 JWT Token
    
    Returns:
        dict: 解码后的载荷，包含 merchant_id, role_code, permissions
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


def verify_user_token(token: str) -> Optional[dict]:
    """
    验证用户 JWT Token
    
    Args:
        token: 要验证的 JWT Token
    
    Returns:
        dict: 解码后的载荷，包含 user_id, phone
        None: 如果验证失败
    
    Raises:
        HTTPException: Token 无效或已过期
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        token_type: str = payload.get("token_type", "")
        
        if user_id is None or token_type != "user":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的用户认证凭证",
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


def verify_admin_token(token: str) -> Optional[dict]:
    """
    验证管理员 JWT Token
    
    Args:
        token: 要验证的 JWT Token
    
    Returns:
        dict: 解码后的载荷，包含 admin_id, role, permissions
        None: 如果验证失败
    
    Raises:
        HTTPException: Token 无效或已过期
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: int = payload.get("admin_id")
        token_type: str = payload.get("token_type", "")
        
        if admin_id is None or token_type != "admin":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的管理员认证凭证",
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


# ============== 商家认证中间件 ==============

def get_current_merchant(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    商家鉴权中间件
    
    用于 FastAPI 依赖注入，验证请求头中的 JWT Token 并返回商家信息
    
    Args:
        credentials: HTTP Bearer 认证凭证
    
    Returns:
        dict: 包含 merchant_id, role_code, permissions 的载荷信息
    
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


def get_current_merchant_with_permissions(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    获取当前商家信息（包含权限）
    
    用于需要权限校验的场景
    
    Returns:
        dict: 包含 merchant_id, role_code, permissions 的字典
    """
    return get_current_merchant(credentials)


# ============== 用户认证中间件 ==============

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    用户鉴权中间件
    
    用于 FastAPI 依赖注入，验证请求头中的用户 JWT Token 并返回用户信息
    
    Args:
        credentials: HTTP Bearer 认证凭证
    
    Returns:
        dict: 包含 user_id, phone 的载荷信息
    
    Raises:
        HTTPException: 认证失败
    """
    token = credentials.credentials
    payload = verify_user_token(token)
    return payload


def get_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """
    获取当前用户ID的便捷方法
    
    Args:
        credentials: HTTP Bearer 认证凭证
    
    Returns:
        int: 用户ID
    """
    payload = get_current_user(credentials)
    return payload.get("user_id")


# ============== 管理员认证中间件 ==============

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    管理员鉴权中间件
    
    用于 FastAPI 依赖注入，验证请求头中的管理员 JWT Token 并返回管理员信息
    
    Args:
        credentials: HTTP Bearer 认证凭证
    
    Returns:
        dict: 包含 admin_id, role, permissions 的载荷信息
    
    Raises:
        HTTPException: 认证失败
    """
    token = credentials.credentials
    payload = verify_admin_token(token)
    return payload


def get_admin_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """
    获取当前管理员ID的便捷方法
    
    Args:
        credentials: HTTP Bearer 认证凭证
    
    Returns:
        int: 管理员ID
    """
    payload = get_current_admin(credentials)
    return payload.get("admin_id")


def require_admin_role(required_role: str) -> Callable:
    """
    管理员角色校验中间件工厂函数
    
    Args:
        required_role: 需要的角色（如 "super_admin", "admin"）
    
    Returns:
        Callable: 依赖注入函数
    
    Usage:
        @router.delete("/merchants/{merchant_id}")
        def delete_merchant(
            admin: dict = Depends(require_admin_role("super_admin")),
            session: Session = Depends(get_session)
        ):
            ...
    """
    def role_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ) -> dict:
        payload = verify_admin_token(credentials.credentials)
        
        admin_role = payload.get("role", "")
        
        # super_admin 拥有所有权限
        if admin_role == "super_admin":
            return payload
        
        if admin_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：需要 {required_role} 角色",
            )
        
        return payload
    
    return role_checker


# ============== 权限校验函数 ==============

def check_permission(payload: dict, required_permission: str) -> bool:
    """
    检查 payload 中是否包含所需权限
    
    Args:
        payload: JWT payload
        required_permission: 需要的权限（如 "product:delete")
    
    Returns:
        bool: 是否拥有权限
    """
    permissions = payload.get("permissions", [])
    
    # 如果没有权限信息，默认为 owner（向后兼容）
    if not permissions:
        return True
    
    return required_permission in permissions


def require_permission(permission: str) -> Callable:
    """
    权限校验中间件工厂函数
    
    用于 FastAPI 路由的权限校验
    
    Args:
        permission: 需要的权限（如 "product:delete", "revenue:read")
    
    Returns:
        Callable: 依赖注入函数
    
    Usage:
        @router.delete("/products/{product_id}")
        def delete_product(
            merchant_id: int = Depends(require_permission("product:delete")),
            session: Session = Depends(get_session)
        ):
            ...
    """
    def permission_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ) -> dict:
        # 验证 Token
        payload = verify_token(credentials.credentials)
        
        # 检查权限
        if not check_permission(payload, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：缺少 {permission} 权限",
            )
        
        return payload
    
    return permission_checker


def require_permissions(permissions: List[str]) -> Callable:
    """
    多权限校验中间件工厂函数（需要同时拥有所有权限）
    
    Args:
        permissions: 需要的权限列表
    
    Returns:
        Callable: 依赖注入函数
    """
    def permissions_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ) -> dict:
        # 验证 Token
        payload = verify_token(credentials.credentials)
        
        # 检查所有权限
        payload_permissions = payload.get("permissions", [])
        
        # 如果没有权限信息，默认为 owner（向后兼容）
        if not payload_permissions:
            return payload
        
        missing_permissions = [p for p in permissions if p not in payload_permissions]
        
        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：缺少 {', '.join(missing_permissions)} 权限",
            )
        
        return payload
    
    return permissions_checker


def require_admin_permission(permission: str) -> Callable:
    """
    管理员权限校验中间件工厂函数
    
    Args:
        permission: 需要的权限（如 "merchant:delete", "admin:create")
    
    Returns:
        Callable: 依赖注入函数
    """
    def permission_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ) -> dict:
        payload = verify_admin_token(credentials.credentials)
        
        # super_admin 拥有所有权限
        admin_role = payload.get("role", "")
        if admin_role == "super_admin":
            return payload
        
        permissions = payload.get("permissions", [])
        
        if permission not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：缺少 {permission} 权限",
            )
        
        return payload
    
    return permission_checker