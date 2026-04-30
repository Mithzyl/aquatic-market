"""
测试 Merchant + User 新增登录字段 & bcrypt 工具函数
TASK-2026-04-29-000
"""
import pytest
import sys
import os

# 确保 backend 在 path 中
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from shared.models import Merchant, User, hash_password, verify_password


class TestBcryptUtils:
    """bcrypt 工具函数测试"""

    def test_hash_and_verify_correct_password(self):
        """正向：正确密码应通过验证"""
        h = hash_password("test123")
        assert isinstance(h, str)
        assert len(h) > 20
        assert h.startswith("$2b$") or h.startswith("$2a$")
        assert verify_password("test123", h) is True

    def test_verify_wrong_password(self):
        """异常：错误密码应拒绝"""
        h = hash_password("correct_password")
        assert verify_password("wrong_password", h) is False

    def test_hash_different_salts(self):
        """边界：相同密码两次 hash 应产生不同结果（salt 不同）"""
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")
        assert h1 != h2
        assert verify_password("same_password", h1) is True
        assert verify_password("same_password", h2) is True

    def test_hash_empty_password(self):
        """边界：空密码仍可 hash"""
        h = hash_password("")
        assert isinstance(h, str)
        assert verify_password("", h) is True

    def test_verify_empty_hash(self):
        """边界：空 hash 与任何密码不应匹配"""
        result = verify_password("anything", "")
        assert result is False, "空 hash 应与任何密码不匹配"

    def test_verify_with_empty_password_and_nonempty_hash(self):
        """边界：空密码 vs 有效 hash"""
        h = hash_password("real_password")
        assert verify_password("", h) is False


class TestMerchantLoginFields:
    """Merchant 模型新增字段测试"""

    def test_merchant_has_username_field(self):
        """正向：Merchant 应有 username 字段"""
        m = Merchant(name="测试商户")
        assert hasattr(m, 'username')
        assert m.username == ""  # 默认空字符串

    def test_merchant_has_password_hash_field(self):
        """正向：Merchant 应有 password_hash 字段"""
        m = Merchant(name="测试商户")
        assert hasattr(m, 'password_hash')
        assert m.password_hash == ""  # 默认空字符串

    def test_merchant_can_set_username(self):
        """正向：可设置 username"""
        m = Merchant(name="测试商户", username="shop001")
        assert m.username == "shop001"

    def test_merchant_can_set_password_hash(self):
        """正向：可设置 password_hash"""
        m = Merchant(name="测试商户", password_hash="hashed_value")
        assert m.password_hash == "hashed_value"

    def test_merchant_username_field_metadata(self):
        """正向：username 字段属性检查"""
        field = Merchant.model_fields['username']
        # 通过 metadata 检查 max_length 约束
        max_length_constraints = [
            m for m in field.metadata
            if hasattr(m, 'max_length')
        ]
        assert len(max_length_constraints) > 0, "username 应有 max_length 约束"
        assert max_length_constraints[0].max_length == 50


class TestUserLoginFields:
    """User 模型新增字段测试"""

    def test_user_has_password_hash_field(self):
        """正向：User 应有 password_hash 字段"""
        u = User(phone="13800138000")
        assert hasattr(u, 'password_hash')
        assert u.password_hash == ""

    def test_user_can_set_password_hash(self):
        """正向：可设置 User.password_hash"""
        u = User(phone="13800138000", password_hash="hashed_value")
        assert u.password_hash == "hashed_value"

    def test_user_no_username_field(self):
        """边界：User 不应有 username 字段（用 phone 登录）"""
        u = User(phone="13800138000")
        assert not hasattr(u, 'username'), "User 不应有 username 字段"
