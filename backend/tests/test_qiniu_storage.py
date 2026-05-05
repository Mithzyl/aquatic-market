"""
Tests for Qiniu Storage Module
"""
import os
import pytest
from shared.qiniu_storage import (
    get_qiniu_config,
    generate_upload_token,
    delete_file,
    get_file_url,
)


class TestGetQiniuConfig:
    """测试 get_qiniu_config"""

    def test_default_config(self):
        """默认配置：未设置环境变量时使用默认值"""
        # 保存原环境变量
        old_access = os.environ.pop("QINIU_ACCESS_KEY", None)
        old_secret = os.environ.pop("QINIU_SECRET_KEY", None)
        old_bucket = os.environ.pop("QINIU_BUCKET", None)
        old_domain = os.environ.pop("QINIU_DOMAIN", None)
        old_region = os.environ.pop("QINIU_REGION", None)

        try:
            config = get_qiniu_config()
            assert config["access_key"] == ""
            assert config["secret_key"] == ""
            assert config["bucket"] == ""
            assert config["domain"] == ""
            assert config["region"] == "z2"
            assert config["upload_url"] == "https://up-z2.qiniup.com"
        finally:
            # 恢复环境变量
            if old_access is not None:
                os.environ["QINIU_ACCESS_KEY"] = old_access
            if old_secret is not None:
                os.environ["QINIU_SECRET_KEY"] = old_secret
            if old_bucket is not None:
                os.environ["QINIU_BUCKET"] = old_bucket
            if old_domain is not None:
                os.environ["QINIU_DOMAIN"] = old_domain
            if old_region is not None:
                os.environ["QINIU_REGION"] = old_region

    def test_custom_region(self):
        """自定义 region"""
        old_region = os.environ.pop("QINIU_REGION", None)
        try:
            os.environ["QINIU_REGION"] = "z0"
            config = get_qiniu_config()
            assert config["region"] == "z0"
            assert config["upload_url"] == "https://up-z0.qiniup.com"
        finally:
            if old_region is not None:
                os.environ["QINIU_REGION"] = old_region
            else:
                os.environ.pop("QINIU_REGION", None)


class TestGetFileUrl:
    """测试 get_file_url"""

    def test_normal_url(self):
        """正常 URL 拼接"""
        old_domain = os.environ.pop("QINIU_DOMAIN", None)
        try:
            os.environ["QINIU_DOMAIN"] = "cdn.example.com"
            url = get_file_url("products/2026/01/01/abc_test.jpg")
            assert url == "https://cdn.example.com/products/2026/01/01/abc_test.jpg"
        finally:
            if old_domain is not None:
                os.environ["QINIU_DOMAIN"] = old_domain
            else:
                os.environ.pop("QINIU_DOMAIN", None)

    def test_empty_key(self):
        """空 key 返回空字符串"""
        assert get_file_url("") == ""

    def test_trailing_slash_domain(self):
        """domain 末尾带斜杠"""
        old_domain = os.environ.pop("QINIU_DOMAIN", None)
        try:
            os.environ["QINIU_DOMAIN"] = "cdn.example.com/"
            url = get_file_url("test.jpg")
            assert url == "https://cdn.example.com/test.jpg"
        finally:
            if old_domain is not None:
                os.environ["QINIU_DOMAIN"] = old_domain
            else:
                os.environ.pop("QINIU_DOMAIN", None)


class TestDeleteFile:
    """测试 delete_file"""

    def test_delete_empty_key(self):
        """空 key 返回 False"""
        assert delete_file("") is False

    def test_delete_none_key(self):
        """None key 返回 False"""
        assert delete_file(None) is False


class TestGenerateUploadToken:
    """测试 generate_upload_token"""

    def test_token_structure(self):
        """生成的上传凭证结构正确"""
        old_access = os.environ.pop("QINIU_ACCESS_KEY", None)
        old_secret = os.environ.pop("QINIU_SECRET_KEY", None)
        old_bucket = os.environ.pop("QINIU_BUCKET", None)
        old_domain = os.environ.pop("QINIU_DOMAIN", None)

        try:
            os.environ["QINIU_ACCESS_KEY"] = "test_ak"
            os.environ["QINIU_SECRET_KEY"] = "test_sk"
            os.environ["QINIU_BUCKET"] = "test-bucket"
            os.environ["QINIU_DOMAIN"] = "cdn.test.com"

            result = generate_upload_token("products", "photo.jpg")

            assert "token" in result
            assert "key" in result
            assert "upload_url" in result
            assert "file_url" in result
            assert result["upload_url"] == "https://up-z2.qiniup.com"
            assert result["key"].startswith("products/")
            assert result["key"].endswith("_photo.jpg")
            assert result["file_url"].startswith("https://cdn.test.com/products/")
            assert result["token"] != ""  # token 不为空
        finally:
            if old_access is not None:
                os.environ["QINIU_ACCESS_KEY"] = old_access
            else:
                os.environ.pop("QINIU_ACCESS_KEY", None)
            if old_secret is not None:
                os.environ["QINIU_SECRET_KEY"] = old_secret
            else:
                os.environ.pop("QINIU_SECRET_KEY", None)
            if old_bucket is not None:
                os.environ["QINIU_BUCKET"] = old_bucket
            else:
                os.environ.pop("QINIU_BUCKET", None)
            if old_domain is not None:
                os.environ["QINIU_DOMAIN"] = old_domain
            else:
                os.environ.pop("QINIU_DOMAIN", None)

    def test_different_folders(self):
        """不同 folder 生成不同路径"""
        old_access = os.environ.pop("QINIU_ACCESS_KEY", None)
        old_secret = os.environ.pop("QINIU_SECRET_KEY", None)
        old_bucket = os.environ.pop("QINIU_BUCKET", None)
        old_domain = os.environ.pop("QINIU_DOMAIN", None)

        try:
            os.environ["QINIU_ACCESS_KEY"] = "test_ak"
            os.environ["QINIU_SECRET_KEY"] = "test_sk"
            os.environ["QINIU_BUCKET"] = "test-bucket"
            os.environ["QINIU_DOMAIN"] = "cdn.test.com"

            for folder in ["products", "avatars", "logos", "carousels"]:
                result = generate_upload_token(folder, "img.jpg")
                assert result["key"].startswith(f"{folder}/")
                assert f"_{'img.jpg'}" in result["key"]
        finally:
            if old_access is not None:
                os.environ["QINIU_ACCESS_KEY"] = old_access
            else:
                os.environ.pop("QINIU_ACCESS_KEY", None)
            if old_secret is not None:
                os.environ["QINIU_SECRET_KEY"] = old_secret
            else:
                os.environ.pop("QINIU_SECRET_KEY", None)
            if old_bucket is not None:
                os.environ["QINIU_BUCKET"] = old_bucket
            else:
                os.environ.pop("QINIU_BUCKET", None)
            if old_domain is not None:
                os.environ["QINIU_DOMAIN"] = old_domain
            else:
                os.environ.pop("QINIU_DOMAIN", None)
