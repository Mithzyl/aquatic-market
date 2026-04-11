"""
Shared Schemas Module - 共享数据结构定义
提供基础响应、分页、通用数据结构
"""
from .base import (
    BaseResponse,
    SuccessResponse,
    ErrorResponse,
    PaginationMeta,
    PaginatedResponse,
)
from .pagination import (
    PaginationParams,
    PaginationRequest,
    SortParams,
    FilterParams,
)

__all__ = [
    # Base
    "BaseResponse",
    "SuccessResponse",
    "ErrorResponse",
    "PaginationMeta",
    "PaginatedResponse",
    # Pagination
    "PaginationParams",
    "PaginationRequest",
    "SortParams",
    "FilterParams",
]