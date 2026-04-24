"""
Merchant Schema - 商家端请求/响应数据结构
支持 RBAC 权限管理：角色信息响应结构
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field as PydanticField


class LoginRequest(BaseModel):
    """登录请求"""
    code: Optional[str] = None
    phone: Optional[str] = None
    verify_code: Optional[str] = None


class RoleInfo(BaseModel):
    """角色信息"""
    code: str = PydanticField(..., description="角色代码：owner/admin/staff")
    name: str = PydanticField(..., description="角色名称")
    permissions: List[str] = PydanticField(default=[], description="权限列表")


class LoginResponse(BaseModel):
    """登录响应"""
    token: str
    merchant: "MerchantInfo"


class MerchantInfo(BaseModel):
    """商家信息"""
    id: int
    name: str
    phone: str
    shop_name: str
    role: Optional[RoleInfo] = None


class ProductCreate(BaseModel):
    """创建商品请求"""
    name: str = PydanticField(..., max_length=100)
    description: str = PydanticField(default="", max_length=500)
    price: float = PydanticField(..., gt=0)
    original_price: float = PydanticField(default=0, ge=0)
    image: str = PydanticField(default="", max_length=500)
    category: str = PydanticField(default="", max_length=50)
    category_name: str = PydanticField(default="", max_length=50)
    stock: int = PydanticField(default=0, ge=0)
    sales: int = PydanticField(default=0, ge=0)
    unit: str = PydanticField(default="", max_length=50)
    tag: str = PydanticField(default="", max_length=50)
    tag_type: str = PydanticField(default="", max_length=20)
    badges: List[str] = PydanticField(default=[])


class ProductUpdate(BaseModel):
    """更新商品请求"""
    name: Optional[str] = PydanticField(None, max_length=100)
    description: Optional[str] = PydanticField(None, max_length=500)
    price: Optional[float] = PydanticField(None, gt=0)
    original_price: Optional[float] = PydanticField(None, ge=0)
    image: Optional[str] = PydanticField(None, max_length=500)
    category: Optional[str] = PydanticField(None, max_length=50)
    category_name: Optional[str] = PydanticField(None, max_length=50)
    stock: Optional[int] = PydanticField(None, ge=0)
    sales: Optional[int] = PydanticField(None, ge=0)
    unit: Optional[str] = PydanticField(None, max_length=50)
    tag: Optional[str] = PydanticField(None, max_length=50)
    tag_type: Optional[str] = PydanticField(None, max_length=20)
    badges: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ProductStatusUpdate(BaseModel):
    """商品状态更新请求"""
    is_active: bool


class ProductResponse(BaseModel):
    """商品响应"""
    id: int
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
    created_at: datetime
    updated_at: datetime


class CategoryResponse(BaseModel):
    """品类响应 - 商家端"""
    id: int
    slug: str
    name: str
    icon: str
    order: int


class CategoryCreate(BaseModel):
    """创建品类请求（F04: 品类管理）"""
    slug: str = PydanticField(..., max_length=50, description="品类标识符，如 'shrimp'")
    name: str = PydanticField(..., max_length=50, description="品类名称")
    icon: str = PydanticField(default="", max_length=100, description="品类图标URL")
    order: int = PydanticField(default=0, ge=0, description="排序顺序")


class CategoryUpdate(BaseModel):
    """更新品类请求（F04: 品类管理）"""
    slug: Optional[str] = PydanticField(None, max_length=50, description="品类标识符")
    name: Optional[str] = PydanticField(None, max_length=50, description="品类名称")
    icon: Optional[str] = PydanticField(None, max_length=100, description="品类图标URL")
    order: Optional[int] = PydanticField(None, ge=0, description="排序顺序")


class RevenueStats(BaseModel):
    """收益统计"""
    today: dict
    week: dict
    month: dict


class MerchantUpdate(BaseModel):
    """更新商家信息请求"""
    name: Optional[str] = PydanticField(None, max_length=100)
    phone: Optional[str] = PydanticField(None, max_length=20)
    shop_name: Optional[str] = PydanticField(None, max_length=100)


class OrderStatusUpdate(BaseModel):
    """订单状态更新请求"""
    status: str = PydanticField(..., description="订单状态：pending/confirmed/ready/completed/cancelled")
