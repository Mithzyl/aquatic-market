"""
Upload Schemas - 上传相关请求/响应数据结构
"""
from typing import Optional
from pydantic import BaseModel, Field


class UploadTokenRequest(BaseModel):
    """
    上传凭证请求体
    """
    file_name: str = Field(..., min_length=1, max_length=255, description="文件名")
    file_type: str = Field(..., min_length=1, max_length=100, description="文件 MIME 类型")
    folder: str = Field(..., min_length=1, max_length=50, description="文件夹名称")

    class Config:
        json_schema_extra = {
            "example": {
                "file_name": "product_photo.jpg",
                "file_type": "image/jpeg",
                "folder": "products",
            }
        }


class UploadTokenResponse(BaseModel):
    """
    上传凭证响应体
    """
    token: str = Field(..., description="七牛云上传凭证")
    key: str = Field(..., description="文件存储 key")
    upload_url: str = Field(..., description="七牛云上传地址")
    file_url: str = Field(..., description="文件 CDN 访问 URL")

    class Config:
        json_schema_extra = {
            "example": {
                "token": "QWYn5TFQs...",
                "key": "products/2026/05/05/a1b2c3d4_product_photo.jpg",
                "upload_url": "https://up-z2.qiniup.com",
                "file_url": "https://cdn.example.com/products/2026/05/05/a1b2c3d4_product_photo.jpg",
            }
        }
