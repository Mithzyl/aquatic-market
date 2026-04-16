"""
Product Schema - 商品请求/响应数据结构
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field as PydanticField


class CategoryResponse(BaseModel):
    """分类响应模型 - 用户端，与前端 retailCategories 结构兼容"""
    id: str  # 使用 slug 作为字符串 id，与前端兼容
    name: str
    icon: str
    order: int
    
    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    """商品响应模型 - 与前端字段命名一致"""
    id: int
    merchant_id: int
    name: str
    description: str
    price: float
    original_price: float
    image: str
    category: str
    category_name: str
    stock: int
    sales: int
    unit: str
    tag: str
    tag_type: str
    badges: List[str]
    is_active: bool
    
    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    """创建商品请求"""
    merchant_id: int = PydanticField(default=1, description="商家ID")
    name: str = PydanticField(..., max_length=200, description="商品名称")
    description: str = PydanticField(default="", description="商品描述")
    price: float = PydanticField(..., gt=0, description="销售价格")
    original_price: float = PydanticField(default=0, ge=0, description="原价")
    image: str = PydanticField(default="", description="商品图片URL")
    category: str = PydanticField(default="", description="品类代码")
    category_name: str = PydanticField(default="", description="品类名称")
    stock: int = PydanticField(default=0, ge=0, description="库存数量")
    unit: str = PydanticField(default="份", description="单位")
    tag: str = PydanticField(default="", description="标签")
    tag_type: str = PydanticField(default="", description="标签类型")
    badges: List[str] = PydanticField(default=[], description="徽章列表")
    is_active: bool = PydanticField(default=True, description="是否上架")


class ProductUpdate(BaseModel):
    """更新商品请求（全部字段可选）"""
    name: Optional[str] = PydanticField(None, max_length=200, description="商品名称")
    description: Optional[str] = PydanticField(None, description="商品描述")
    price: Optional[float] = PydanticField(None, gt=0, description="销售价格")
    original_price: Optional[float] = PydanticField(None, ge=0, description="原价")
    image: Optional[str] = PydanticField(None, description="商品图片URL")
    category: Optional[str] = PydanticField(None, description="品类代码")
    category_name: Optional[str] = PydanticField(None, description="品类名称")
    stock: Optional[int] = PydanticField(None, ge=0, description="库存数量")
    unit: Optional[str] = PydanticField(None, description="单位")
    tag: Optional[str] = PydanticField(None, description="标签")
    tag_type: Optional[str] = PydanticField(None, description="标签类型")
    badges: Optional[List[str]] = PydanticField(None, description="徽章列表")
    is_active: Optional[bool] = PydanticField(None, description="是否上架")
