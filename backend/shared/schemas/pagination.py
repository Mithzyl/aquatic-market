"""
Pagination Schemas - 分页请求参数
提供统一的分页、排序、筛选参数结构
"""
from typing import Optional, List, Any
from pydantic import BaseModel, Field as PydanticField


class PaginationParams(BaseModel):
    """
    分页参数
    
    用于请求分页数据的基本参数
    """
    page: int = PydanticField(default=1, ge=1, description="页码，从1开始")
    page_size: int = PydanticField(default=20, ge=1, le=100, description="每页数量，最大100")
    
    def get_offset(self) -> int:
        """获取数据库查询的 offset 值"""
        return (self.page - 1) * self.page_size
    
    def get_limit(self) -> int:
        """获取数据库查询的 limit 值"""
        return self.page_size


class PaginationRequest(BaseModel):
    """
    分页请求
    
    包含分页参数的完整请求结构
    """
    page: int = PydanticField(default=1, ge=1, description="页码")
    page_size: int = PydanticField(default=20, ge=1, le=100, description="每页数量")
    
    def get_offset(self) -> int:
        """获取数据库查询的 offset 值"""
        return (self.page - 1) * self.page_size
    
    def get_limit(self) -> int:
        """获取数据库查询的 limit 值"""
        return self.page_size


class SortParams(BaseModel):
    """
    排序参数
    
    用于指定排序字段和方向
    """
    sort_by: Optional[str] = PydanticField(default=None, description="排序字段")
    sort_order: str = PydanticField(default="desc", description="排序方向：asc/desc")
    
    def is_asc(self) -> bool:
        """是否升序"""
        return self.sort_order.lower() == "asc"
    
    def is_desc(self) -> bool:
        """是否降序"""
        return self.sort_order.lower() == "desc"


class FilterParams(BaseModel):
    """
    筛选参数
    
    用于指定筛选条件
    """
    field: str = PydanticField(..., description="筛选字段")
    operator: str = PydanticField(default="eq", description="操作符：eq/ne/gt/lt/gte/lte/like/in")
    value: Any = PydanticField(..., description="筛选值")
    
    def get_sql_operator(self) -> str:
        """获取 SQL 操作符"""
        operator_map = {
            "eq": "=",
            "ne": "!=",
            "gt": ">",
            "lt": "<",
            "gte": ">=",
            "lte": "<=",
            "like": "LIKE",
            "in": "IN"
        }
        return operator_map.get(self.operator.lower(), "=")


class SearchParams(BaseModel):
    """
    搜索参数
    
    用于全文搜索
    """
    keyword: Optional[str] = PydanticField(default=None, description="搜索关键词")
    fields: Optional[List[str]] = PydanticField(default=None, description="搜索字段列表")


class QueryParams(BaseModel):
    """
    综合查询参数
    
    包含分页、排序、筛选、搜索的完整参数
    """
    pagination: PaginationParams = PydanticField(default_factory=PaginationParams)
    sort: Optional[SortParams] = PydanticField(default=None)
    filters: Optional[List[FilterParams]] = PydanticField(default=None)
    search: Optional[SearchParams] = PydanticField(default=None)
    
    def get_offset(self) -> int:
        """获取 offset"""
        return self.pagination.get_offset()
    
    def get_limit(self) -> int:
        """获取 limit"""
        return self.pagination.get_limit()