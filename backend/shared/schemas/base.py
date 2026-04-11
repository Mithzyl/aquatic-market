"""
Base Schemas - 基础响应数据结构
提供统一的 API 响应格式
"""
from typing import Generic, TypeVar, Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field as PydanticField


# 泛型类型变量
T = TypeVar("T")


class BaseResponse(BaseModel, Generic[T]):
    """
    基础响应结构
    
    所有 API 响应的基础模板，包含：
    - success: 操作是否成功
    - message: 提示信息
    - data: 响应数据
    - timestamp: 响应时间戳
    """
    success: bool = PydanticField(..., description="操作是否成功")
    message: str = PydanticField(default="", description="提示信息")
    data: Optional[T] = PydanticField(default=None, description="响应数据")
    timestamp: datetime = PydanticField(
        default_factory=datetime.utcnow,
        description="响应时间戳"
    )
    
    class Config:
        from_attributes = True


class SuccessResponse(BaseResponse[T], Generic[T]):
    """
    成功响应结构
    
    用于成功的 API 响应
    """
    success: bool = PydanticField(default=True, description="操作成功")
    message: str = PydanticField(default="操作成功", description="成功提示")
    
    @classmethod
    def create(cls, data: T, message: str = "操作成功") -> "SuccessResponse[T]":
        """创建成功响应"""
        return cls(success=True, message=message, data=data)


class ErrorResponse(BaseResponse[None]):
    """
    错误响应结构
    
    用于失败的 API 响应
    """
    success: bool = PydanticField(default=False, description="操作失败")
    message: str = PydanticField(..., description="错误信息")
    error_code: Optional[str] = PydanticField(default=None, description="错误代码")
    error_details: Optional[List[str]] = PydanticField(default=None, description="错误详情列表")
    
    @classmethod
    def create(
        cls,
        message: str,
        error_code: Optional[str] = None,
        error_details: Optional[List[str]] = None
    ) -> "ErrorResponse":
        """创建错误响应"""
        return cls(
            success=False,
            message=message,
            error_code=error_code,
            error_details=error_details
        )


class PaginationMeta(BaseModel):
    """
    分页元数据
    
    包含分页信息：
    - page: 当前页码
    - page_size: 每页数量
    - total: 总记录数
    - total_pages: 总页数
    - has_next: 是否有下一页
    - has_prev: 是否有上一页
    """
    page: int = PydanticField(..., ge=1, description="当前页码")
    page_size: int = PydanticField(..., ge=1, le=100, description="每页数量")
    total: int = PydanticField(..., ge=0, description="总记录数")
    total_pages: int = PydanticField(..., ge=0, description="总页数")
    has_next: bool = PydanticField(..., description="是否有下一页")
    has_prev: bool = PydanticField(..., description="是否有上一页")
    
    @classmethod
    def create(cls, page: int, page_size: int, total: int) -> "PaginationMeta":
        """创建分页元数据"""
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        has_next = page < total_pages
        has_prev = page > 1
        
        return cls(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev
        )


class PaginatedResponse(BaseResponse[List[T]], Generic[T]):
    """
    分页响应结构
    
    用于返回分页数据的 API 响应
    """
    success: bool = PydanticField(default=True, description="操作成功")
    message: str = PydanticField(default="查询成功", description="提示信息")
    data: List[T] = PydanticField(default=[], description="数据列表")
    pagination: PaginationMeta = PydanticField(..., description="分页信息")
    
    @classmethod
    def create(
        cls,
        data: List[T],
        page: int,
        page_size: int,
        total: int,
        message: str = "查询成功"
    ) -> "PaginatedResponse[T]":
        """创建分页响应"""
        pagination = PaginationMeta.create(page, page_size, total)
        return cls(
            success=True,
            message=message,
            data=data,
            pagination=pagination
        )


# ============== 常用错误代码定义 ==============

class ErrorCode:
    """错误代码常量"""
    
    # 通用错误
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
    INVALID_REQUEST = "INVALID_REQUEST"
    MISSING_PARAMETER = "MISSING_PARAMETER"
    
    # 认证错误
    AUTH_FAILED = "AUTH_FAILED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    
    # 业务错误
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS"
    OPERATION_FAILED = "OPERATION_FAILED"
    
    # 数据验证错误
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_DATA_FORMAT = "INVALID_DATA_FORMAT"
    
    # 数据库错误
    DATABASE_ERROR = "DATABASE_ERROR"
    TRANSACTION_FAILED = "TRANSACTION_FAILED"