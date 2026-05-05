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


def generate_upload_token(folder: str, file_name: str) -> dict:
    """
    生成七牛云上传凭证。

    根据 folder 和当前日期构造 key：
    {folder}/{YYYY}/{MM}/{DD}/{uuid}_{file_name}

    Args:
        folder: 文件夹名称（如 products, avatars, logos, carousels）
        file_name: 原始文件名

    Returns:
        dict: {"token": "...", "key": "...", "upload_url": "...", "file_url": "..."}
    """
    config = get_qiniu_config()
    auth = _get_auth()

    # 构造存储 key：文件夹/日期/唯一文件名
    now = datetime.now()
    date_path = now.strftime("%Y/%m/%d")
    unique_prefix = uuid.uuid4().hex[:8]
    key = f"{folder}/{date_path}/{unique_prefix}_{file_name}"

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
