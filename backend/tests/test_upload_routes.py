"""
Tests for Upload Token API
"""
import os
import pytest
from fastapi.testclient import TestClient


class TestUploadTokenAuth:
    """测试上传凭证接口认证"""

    def test_missing_auth(self, client: TestClient):
        """缺少认证返回 401 / 403"""
        response = client.post("/api/upload/token", json={
            "file_name": "test.jpg",
            "file_type": "image/jpeg",
            "folder": "products",
        })
        # HTTPBearer 使用 auto_error=True 时返回 403
        # 取决于实现，可能是 401 或 403
        assert response.status_code in (401, 403)

    def test_invalid_token(self, client: TestClient):
        """无效 Token 返回 401 / 403"""
        response = client.post(
            "/api/upload/token",
            json={
                "file_name": "test.jpg",
                "file_type": "image/jpeg",
                "folder": "products",
            },
            headers={"Authorization": "Bearer invalid_token_here"},
        )
        assert response.status_code in (401, 403)


class TestUploadTokenValidation:
    """测试上传凭证请求参数校验"""

    def test_invalid_folder(self, client: TestClient, auth_headers: dict):
        """无效的 folder 参数返回 400"""
        response = client.post(
            "/api/upload/token",
            json={
                "file_name": "test.jpg",
                "file_type": "image/jpeg",
                "folder": "invalid_folder",
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        data = response.json()
        assert "无效的文件夹名称" in data["detail"]

    def test_empty_filename(self, client: TestClient, auth_headers: dict):
        """空文件名返回 422（Pydantic 校验）"""
        response = client.post(
            "/api/upload/token",
            json={
                "file_name": "",
                "file_type": "image/jpeg",
                "folder": "products",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_missing_fields(self, client: TestClient, auth_headers: dict):
        """缺少必填字段返回 422"""
        response = client.post(
            "/api/upload/token",
            json={"file_name": "test.jpg"},
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestUploadTokenSuccess:
    """测试上传凭证正常生成"""

    def test_valid_upload_token_products(self, client: TestClient, auth_headers: dict):
        """正常请求 products folder 返回凭证"""
        old_access = os.environ.pop("QINIU_ACCESS_KEY", None)
        old_secret = os.environ.pop("QINIU_SECRET_KEY", None)
        old_bucket = os.environ.pop("QINIU_BUCKET", None)
        old_domain = os.environ.pop("QINIU_DOMAIN", None)

        try:
            os.environ["QINIU_ACCESS_KEY"] = "test_ak"
            os.environ["QINIU_SECRET_KEY"] = "test_sk"
            os.environ["QINIU_BUCKET"] = "test-bucket"
            os.environ["QINIU_DOMAIN"] = "cdn.test.com"

            response = client.post(
                "/api/upload/token",
                json={
                    "file_name": "product_photo.jpg",
                    "file_type": "image/jpeg",
                    "folder": "products",
                },
                headers=auth_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert "token" in data
            assert "key" in data
            assert "upload_url" in data
            assert "file_url" in data
            assert data["upload_url"] == "https://up-z2.qiniup.com"
            assert data["key"].startswith("products/")
            assert data["key"].endswith("_product_photo.jpg")
            assert data["token"] != ""
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

    def test_valid_upload_token_all_folders(self, client: TestClient, auth_headers: dict):
        """所有合法 folder 都能正常返回"""
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
                response = client.post(
                    "/api/upload/token",
                    json={
                        "file_name": "test.jpg",
                        "file_type": "image/jpeg",
                        "folder": folder,
                    },
                    headers=auth_headers,
                )
                assert response.status_code == 200, f"Folder {folder} failed"
                data = response.json()
                assert data["key"].startswith(f"{folder}/")
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
