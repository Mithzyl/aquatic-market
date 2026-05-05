"""
Upload Routes - 上传凭证 API（共享模块，供三端挂载）

提供七牛云上传凭证生成接口，需要 JWT 认证。
"""
from fastapi import APIRouter, Depends, HTTPException, status
from .auth import get_current_merchant
from .qiniu_storage import generate_upload_token
from .schemas.upload import UploadTokenRequest, UploadTokenResponse

# 允许的文件夹名称
ALLOWED_FOLDERS = {"products", "avatars", "logos", "carousels"}

router = APIRouter(prefix="/api/upload", tags=["文件上传"])


@router.post("/token", response_model=UploadTokenResponse)
def create_upload_token(
    request: UploadTokenRequest,
    merchant: dict = Depends(get_current_merchant),
):
    """
    获取七牛云上传凭证。

    需要 JWT 认证。返回一次性上传凭证，前端可使用该凭证直接上传文件到七牛云。

    folder 可选值：
    - products：商品图片
    - avatars：头像
    - logos：Logo
    - carousels：轮播图
    """
    # 校验 folder 参数
    if request.folder not in ALLOWED_FOLDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的文件夹名称，可选值：{', '.join(sorted(ALLOWED_FOLDERS))}",
        )

    try:
        mid = merchant.get("merchant_id", 0)
        result = generate_upload_token(request.folder, request.file_name, merchant_id=mid)
        return UploadTokenResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成上传凭证失败：{str(e)}",
        )
