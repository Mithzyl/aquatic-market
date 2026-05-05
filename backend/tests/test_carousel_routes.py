"""
Tests for Carousel Routes (Merchant & Customer)
"""
import pytest
from fastapi.testclient import TestClient


# ============== 商家端轮播图 CRUD 测试 ==============

class TestCarouselAuth:
    """测试轮播图接口认证"""

    def test_list_no_auth(self, client: TestClient):
        """无认证获取轮播图列表返回 401 / 403"""
        response = client.get("/api/merchant/carousels")
        assert response.status_code in (401, 403)

    def test_create_no_auth(self, client: TestClient):
        """无认证创建轮播图返回 401 / 403"""
        response = client.post("/api/merchant/carousels", json={
            "title": "测试轮播图",
            "image_url": "https://cdn.example.com/test.jpg",
            "link_url": "",
            "sort_order": 0,
        })
        assert response.status_code in (401, 403)


class TestCarouselCRUD:
    """测试轮播图完整 CRUD 流程"""

    carousel_id: int = None

    def test_create_carousel(self, client: TestClient, auth_headers: dict):
        """创建轮播图成功"""
        response = client.post(
            "/api/merchant/carousels",
            json={
                "title": "新鲜虾类上市",
                "image_url": "https://cdn.example.com/carousels/banner1.jpg",
                "link_url": "/products?category=shrimp",
                "sort_order": 1,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "新鲜虾类上市"
        assert data["image_url"] == "https://cdn.example.com/carousels/banner1.jpg"
        assert data["link_url"] == "/products?category=shrimp"
        assert data["sort_order"] == 1
        assert data["is_active"] is True
        assert data["merchant_id"] == 1
        TestCarouselCRUD.carousel_id = data["id"]

    def test_create_carousel_defaults(self, client: TestClient, auth_headers: dict):
        """创建轮播图使用默认值"""
        response = client.post(
            "/api/merchant/carousels",
            json={
                "title": "简单轮播",
                "image_url": "https://cdn.example.com/simple.jpg",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["link_url"] == ""
        assert data["sort_order"] == 0
        assert data["is_active"] is True

    def test_list_carousels(self, client: TestClient, auth_headers: dict):
        """获取轮播图列表（按 sort_order 排序）"""
        # 先创建几个不同排序的轮播图
        for i, order in enumerate([3, 1, 2]):
            client.post(
                "/api/merchant/carousels",
                json={
                    "title": f"轮播图{order}",
                    "image_url": f"https://cdn.example.com/banner{order}.jpg",
                    "sort_order": order,
                },
                headers=auth_headers,
            )

        response = client.get("/api/merchant/carousels", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # 验证按 sort_order 升序
        orders = [item["sort_order"] for item in data]
        assert orders == sorted(orders)

    def test_get_single_carousel_not_exists(self, client: TestClient, auth_headers: dict):
        """获取不存在的轮播图"""
        # 直接 GET /api/merchant/carousels/99999 可能返回 404 或空结果
        # Carousel CRUD 没有单独 GET /{id}，列表接口返回所有
        # 所以这里测试列表中不存在该 ID
        response = client.get("/api/merchant/carousels", headers=auth_headers)
        data = response.json()
        ids = [item["id"] for item in data]
        assert 99999 not in ids

    def test_update_carousel(self, client: TestClient, auth_headers: dict):
        """更新轮播图"""
        carousel_id = TestCarouselCRUD.carousel_id
        if not carousel_id:
            pytest.skip("No carousel created in test_create_carousel")

        response = client.put(
            f"/api/merchant/carousels/{carousel_id}",
            json={"title": "更新后的标题", "sort_order": 10},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "更新后的标题"
        assert data["sort_order"] == 10

    def test_update_nonexistent_carousel(self, client: TestClient, auth_headers: dict):
        """更新不存在的轮播图返回 404"""
        response = client.put(
            "/api/merchant/carousels/99999",
            json={"title": "不存在"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_toggle_carousel(self, client: TestClient, auth_headers: dict):
        """切换轮播图启用/禁用状态"""
        carousel_id = TestCarouselCRUD.carousel_id
        if not carousel_id:
            pytest.skip("No carousel created in test_create_carousel")

        # 当前是 is_active=True，切换后应为 False
        response = client.patch(
            f"/api/merchant/carousels/{carousel_id}/toggle",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False

        # 再次切换，应为 True
        response = client.patch(
            f"/api/merchant/carousels/{carousel_id}/toggle",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is True

    def test_toggle_nonexistent_carousel(self, client: TestClient, auth_headers: dict):
        """切换不存在的轮播图返回 404"""
        response = client.patch(
            "/api/merchant/carousels/99999/toggle",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_delete_carousel(self, client: TestClient, auth_headers: dict):
        """删除轮播图"""
        # 创建一个新轮播图用于删除
        create_resp = client.post(
            "/api/merchant/carousels",
            json={
                "title": "待删除",
                "image_url": "https://cdn.example.com/to_delete.jpg",
            },
            headers=auth_headers,
        )
        del_id = create_resp.json()["id"]

        response = client.delete(
            f"/api/merchant/carousels/{del_id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == {"success": True}

        # 确认已删除
        list_resp = client.get("/api/merchant/carousels", headers=auth_headers)
        ids = [item["id"] for item in list_resp.json()]
        assert del_id not in ids

    def test_delete_nonexistent_carousel(self, client: TestClient, auth_headers: dict):
        """删除不存在的轮播图返回 404"""
        response = client.delete(
            "/api/merchant/carousels/99999",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestCarouselDataIsolation:
    """测试商家数据隔离"""

    def test_merchant_isolation(self, client: TestClient, auth_headers: dict, auth_headers_2: dict):
        """商家 A 不能看到商家 B 的轮播图"""
        # 商家 1 创建一个轮播图
        resp1 = client.post(
            "/api/merchant/carousels",
            json={
                "title": "商家1的轮播",
                "image_url": "https://cdn.example.com/m1.jpg",
            },
            headers=auth_headers,
        )
        assert resp1.status_code == 201
        m1_id = resp1.json()["id"]

        # 商家 1 能看到这个轮播图
        list1 = client.get("/api/merchant/carousels", headers=auth_headers)
        ids1 = [item["id"] for item in list1.json()]
        assert m1_id in ids1

        # 商家 2 不能操作商家 1 的轮播图
        resp2 = client.put(
            f"/api/merchant/carousels/{m1_id}",
            json={"title": "商家2试图修改"},
            headers=auth_headers_2,
        )
        assert resp2.status_code == 404

        # 商家 2 不能删除商家 1 的轮播图
        resp3 = client.delete(
            f"/api/merchant/carousels/{m1_id}",
            headers=auth_headers_2,
        )
        assert resp3.status_code == 404


class TestCarouselValidation:
    """测试轮播图参数校验"""

    def test_create_missing_title(self, client: TestClient, auth_headers: dict):
        """缺少 title 返回 422"""
        response = client.post(
            "/api/merchant/carousels",
            json={"image_url": "https://cdn.example.com/test.jpg"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_create_missing_image_url(self, client: TestClient, auth_headers: dict):
        """缺少 image_url 返回 422"""
        response = client.post(
            "/api/merchant/carousels",
            json={"title": "无图片"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_create_empty_title(self, client: TestClient, auth_headers: dict):
        """空 title 返回 422"""
        response = client.post(
            "/api/merchant/carousels",
            json={
                "title": "",
                "image_url": "https://cdn.example.com/test.jpg",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_create_negative_sort_order(self, client: TestClient, auth_headers: dict):
        """负 sort_order 返回 422"""
        response = client.post(
            "/api/merchant/carousels",
            json={
                "title": "负排序",
                "image_url": "https://cdn.example.com/test.jpg",
                "sort_order": -1,
            },
            headers=auth_headers,
        )
        assert response.status_code == 422


# ============== 用户端轮播图公开接口测试 ==============
# 注意：用户端测试在 test_customer_carousels.py 中独立运行
# 因为 customer 服务与 merchant 服务的路由模块存在路径冲突
