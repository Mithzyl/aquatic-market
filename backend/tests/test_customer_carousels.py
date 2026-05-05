"""
Tests for Customer-Facing Carousel Public API

这些测试需要独立运行，因为 customer 服务和 merchant 服务有路由模块路径冲突。
运行方式：
    pytest tests/test_customer_carousels.py -v
"""
import os
import sys
import pytest
from pathlib import Path

# 确保 backend 目录在 Python 路径中
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# 覆盖数据库为 SQLite
test_db_path = backend_dir / "tests" / "test_aquatic_market_customer.db"
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
os.environ.setdefault("ENVIRONMENT", "development")

# 创建测试数据库
if test_db_path.exists():
    test_db_path.unlink()

from shared.database import create_db_and_tables
create_db_and_tables()

# 生成测试用 token
from shared.auth import create_access_token
_test_token = create_access_token(merchant_id=1, role_code="owner")


@pytest.fixture
def customer_client():
    """用户端服务 TestClient"""
    from fastapi.testclient import TestClient
    from services.customer.main import app
    with TestClient(app) as c:
        yield c


class TestCustomerCarousels:
    """测试用户端公开轮播图接口"""

    def test_public_no_auth(self, customer_client):
        """无需认证即可访问"""
        response = customer_client.get("/api/customer/carousels")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_public_only_active(self, customer_client):
        """仅返回启用的轮播图"""
        # 直接通过数据库创建测试数据
        from sqlmodel import Session
        from shared.database import engine
        from shared.models import Carousel
        from datetime import datetime

        now = datetime.utcnow()
        with Session(engine) as session:
            # 创建启用轮播图
            active = Carousel(
                merchant_id=1,
                title="启用的轮播",
                image_url="https://cdn.example.com/active.jpg",
                sort_order=1,
                is_active=True,
                created_at=now,
                updated_at=now,
            )
            # 创建禁用轮播图
            inactive = Carousel(
                merchant_id=1,
                title="禁用的轮播",
                image_url="https://cdn.example.com/inactive.jpg",
                sort_order=2,
                is_active=False,
                created_at=now,
                updated_at=now,
            )
            session.add(active)
            session.add(inactive)
            session.commit()

        # 公开接口只返回启用的
        response = customer_client.get("/api/customer/carousels?merchant_id=1")
        assert response.status_code == 200
        data = response.json()
        ids = [item["id"] for item in data]
        # 启用轮播图应在列表中
        assert any(item["title"] == "启用的轮播" for item in data)
        # 禁用轮播图不应在列表中
        assert not any(item["title"] == "禁用的轮播" for item in data)

    def test_public_sorted(self, customer_client):
        """返回结果按 sort_order 排序"""
        from sqlmodel import Session
        from shared.database import engine
        from shared.models import Carousel
        from datetime import datetime

        now = datetime.utcnow()
        with Session(engine) as session:
            # 创建多个不同排序的轮播图
            for i, order in enumerate([3, 1, 2]):
                c = Carousel(
                    merchant_id=1,
                    title=f"轮播{order}",
                    image_url=f"https://cdn.example.com/sorted{order}.jpg",
                    sort_order=order,
                    is_active=True,
                    created_at=now,
                    updated_at=now,
                )
                session.add(c)
            session.commit()

        response = customer_client.get("/api/customer/carousels?merchant_id=1")
        assert response.status_code == 200
        data = response.json()
        # 过滤出排序测试数据
        sorted_titles = [
            item["sort_order"]
            for item in data
            if item["title"].startswith("轮播")
        ]
        assert sorted_titles == sorted(sorted_titles)
