"""
Carousel Schemas - 轮播图请求/响应数据结构
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CarouselCreate(BaseModel):
    """创建轮播图请求"""
    title: str = Field(..., min_length=1, max_length=100, description="轮播图标题")
    image_url: str = Field(..., min_length=1, max_length=500, description="图片URL")
    link_url: str = Field(default="", max_length=500, description="跳转链接")
    sort_order: int = Field(default=0, ge=0, description="排序序号")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "新鲜虾类上市",
                "image_url": "https://cdn.example.com/carousels/2026/05/05/abc123_banner.jpg",
                "link_url": "/products?category=shrimp",
                "sort_order": 1,
            }
        }


class CarouselUpdate(BaseModel):
    """更新轮播图请求"""
    title: Optional[str] = Field(None, min_length=1, max_length=100, description="轮播图标题")
    image_url: Optional[str] = Field(None, min_length=1, max_length=500, description="图片URL")
    link_url: Optional[str] = Field(None, max_length=500, description="跳转链接")
    sort_order: Optional[int] = Field(None, ge=0, description="排序序号")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "新鲜虾类上市（更新）",
                "sort_order": 2,
            }
        }


class CarouselResponse(BaseModel):
    """轮播图响应"""
    id: int = Field(..., description="轮播图ID")
    merchant_id: int = Field(..., description="商家ID")
    title: str = Field(..., description="轮播图标题")
    image_url: str = Field(..., description="图片URL")
    link_url: str = Field(default="", description="跳转链接")
    sort_order: int = Field(default=0, description="排序序号")
    is_active: bool = Field(default=True, description="是否启用")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "merchant_id": 1,
                "title": "新鲜虾类上市",
                "image_url": "https://cdn.example.com/carousels/2026/05/05/abc123_banner.jpg",
                "link_url": "/products?category=shrimp",
                "sort_order": 1,
                "is_active": True,
                "created_at": "2026-05-05T10:00:00",
                "updated_at": "2026-05-05T10:00:00",
            }
        }
