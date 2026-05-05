"""
Qiniu Cloud Storage Module - 七牛云对象存储工具模块

提供上传凭证生成、文件删除、CDN URL 拼接等功能。
配置通过环境变量读取，支持多区域。
"""
import os
import uuid
from datetime import datetime
from typing import Optional

import qiniu
from dotenv import load_dotenv

load_dotenv()


def get_qiniu_config() -> dict:
    """
    从环境变量读取七牛云配置。

    Returns:
        dict: 包含 access_key, secret_key, bucket, domain, region, upload_url
    """
    access_key = os.getenv("QINIU_ACCESS_KEY", "")
    secret_key = os.getenv("QINIU_SECRET_KEY", "")
    bucket = os.getenv("QINIU_BUCKET", "")
    domain = os.getenv("QINIU_DOMAIN", "")
    region = os.getenv("QINIU_REGION", "z2")

    return {
        "access_key": access_key,
        "secret_key": secret_key,
        "bucket": bucket,
        "domain": domain,
        "region": region,
        "upload_url": f"https://up-{region}.qiniup.com",
    }


def _get_auth():
    """获取七牛云 Auth 实例"""
    config = get_qiniu_config()
    return qiniu.Auth(config["access_key"], config["secret_key"])


def _get_bucket_manager():
    """获取七牛云 BucketManager 实例"""
    auth = _get_auth()
    return qiniu.BucketManager(auth)


# 各用途的命名策略
FOLDER_NAMING = {
    "products":  {"date_fmt": "%Y-%m",    "prefix": "prod"},    # 商品图片：按月分组
    "avatars":   {"date_fmt": "%Y",       "prefix": "avatar"},  # 用户头像：按年分组
    "logos":     {"date_fmt": "%Y",       "prefix": "logo"},    # 店铺Logo：按年分组
    "carousels": {"date_fmt": "%Y-%m",    "prefix": "banner"},  # 轮播图：按月分组
}


def generate_upload_token(folder: str, file_name: str, merchant_id: int = 0) -> dict:
    """
    生成七牛云上传凭证。

    根据 folder 类型采用不同的命名策略：

    | folder     | key 示例                                        |
    |------------|------------------------------------------------|
    | products   | products/2026-05/prod_a1b2_鲜活大虾.jpg           |
    | avatars    | avatars/2026/avatar_f3e4_smile.jpg             |
    | logos      | logos/2026/logo_m1_b1a2_logo.png               |
    | carousels  | carousels/2026-05/banner_c3d4_新品促销.jpg        |

    Args:
        folder: 文件夹名称（products | avatars | logos | carousels）
        file_name: 原始文件名
        merchant_id: 商家ID（用于 logos 命名，可选）

    Returns:
        dict: {"token": "...", "key": "...", "upload_url": "...", "file_url": "..."}
    """
    config = get_qiniu_config()
    auth = _get_auth()

    naming = FOLDER_NAMING.get(folder, {"date_fmt": "%Y/%m/%d", "prefix": "file"})

    # 按不同粒度生成日期路径
    now = datetime.now()
    date_path = now.strftime(naming["date_fmt"])
    unique_prefix = uuid.uuid4().hex[:8]

    # 构造语义化 key
    if folder == "logos" and merchant_id > 0:
        key = f"{folder}/{date_path}/{naming['prefix']}_m{merchant_id}_{unique_prefix}_{file_name}"
    else:
        key = f"{folder}/{date_path}/{naming['prefix']}_{unique_prefix}_{file_name}"

    # 生成上传凭证（1 小时有效）
    token = auth.upload_token(config["bucket"], key, 3600)

    file_url = get_file_url(key)

    return {
        "token": token,
        "key": key,
        "upload_url": config["upload_url"],
        "file_url": file_url,
    }


def delete_file(key: str) -> bool:
    """
    删除七牛云上的文件。

    Args:
        key: 文件的存储 key

    Returns:
        bool: 删除成功返回 True，否则返回 False
    """
    if not key:
        return False

    try:
        config = get_qiniu_config()
        bucket_manager = _get_bucket_manager()
        ret, info = bucket_manager.delete(config["bucket"], key)
        # info.status_code == 200 或 612（文件不存在）都视为成功
        return info.status_code in (200, 612)
    except Exception:
        return False


def get_file_url(key: str) -> str:
    """
    根据 key 拼接完整 CDN URL。

    Args:
        key: 文件的存储 key

    Returns:
        str: 完整的 CDN URL
    """
    if not key:
        return ""

    config = get_qiniu_config()
    domain = config["domain"].rstrip("/")
    return f"https://{domain}/{key}"
