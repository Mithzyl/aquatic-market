import pytest
from fastapi.testclient import TestClient
from main import app, create_db_and_tables
from datetime import datetime

# 在测试前创建数据库表
create_db_and_tables()

client = TestClient(app)

# 测试商品相关接口
def test_get_products():
    response = client.get("/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_product():
    product_data = {
        "name": "测试商品",
        "price": 99.99,
        "category": "测试分类"
    }
    response = client.post("/products", json=product_data)
    assert response.status_code == 200
    assert response.json()["name"] == "测试商品"
    assert response.json()["price"] == 99.99

# 测试订单相关接口
def test_get_orders():
    response = client.get("/orders")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_order():
    order_data = {
        "customer_name": "测试用户",
        "customer_phone": "13800138000",
        "pickup_time": datetime.now().isoformat(),
        "total_amount": 199.98,
        "status": "pending"
    }
    response = client.post("/orders", json=order_data)
    assert response.status_code == 200
    assert response.json()["customer_name"] == "测试用户"
    assert response.json()["total_amount"] == 199.98