"""
JWT 认证模块测试
测试 Token 创建、验证、过期和无效 Token 场景
"""
import pytest
import os
import time
from datetime import datetime, timedelta
import jwt

# 设置测试环境变量（至少32字节以满足JWT安全要求）
os.environ["JWT_SECRET"] = "test-secret-key-for-jwt-testing-min-32-chars"

from shared.auth import (
    create_access_token,
    create_token,
    verify_token,
    get_current_merchant,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_DAYS
)
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


class TestCreateAccessToken:
    """Token 创建测试"""
    
    def test_create_token_with_default_expiry(self):
        """测试使用默认过期时间创建 Token"""
        merchant_id = 1
        token = create_access_token(merchant_id)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
        
        # 验证可以解码
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["merchant_id"] == merchant_id
        assert "exp" in payload
        assert "iat" in payload
    
    def test_create_token_with_custom_expiry(self):
        """测试使用自定义过期时间创建 Token"""
        merchant_id = 2
        custom_expiry = timedelta(hours=1)
        token = create_access_token(merchant_id, expires_delta=custom_expiry)
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["merchant_id"] == merchant_id
        
        # 验证过期时间约为1小时后（使用 utcfromtimestamp 避免 时区问题）
        exp_time = datetime.utcfromtimestamp(payload["exp"])
        expected_exp = datetime.utcnow() + timedelta(hours=1)
        # 允许1秒误差
        assert abs((exp_time - expected_exp).total_seconds()) < 1
    
    def test_create_token_contains_correct_payload(self):
        """测试 Token 包含正确的载荷信息"""
        merchant_id = 123
        token = create_access_token(merchant_id)
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        assert payload["merchant_id"] == merchant_id
        assert "exp" in payload
        assert "iat" in payload
        
        # 验证过期时间约为7天后（使用 utcfromtimestamp 避免时区问题）
        exp_time = datetime.utcfromtimestamp(payload["exp"])
        expected_exp = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
        # 允许1秒误差
        assert abs((exp_time - expected_exp).total_seconds()) < 1
    
    def test_create_token_for_different_merchants(self):
        """测试为不同商家创建不同的 Token"""
        token1 = create_access_token(1)
        token2 = create_access_token(2)
        
        payload1 = jwt.decode(token1, SECRET_KEY, algorithms=[ALGORITHM])
        payload2 = jwt.decode(token2, SECRET_KEY, algorithms=[ALGORITHM])
        
        assert payload1["merchant_id"] == 1
        assert payload2["merchant_id"] == 2
        assert token1 != token2


class TestVerifyToken:
    """Token 验证测试"""
    
    def test_verify_valid_token(self):
        """测试验证有效的 Token"""
        merchant_id = 1
        token = create_access_token(merchant_id)
        
        payload = verify_token(token)
        
        assert payload is not None
        assert payload["merchant_id"] == merchant_id
    
    def test_verify_token_returns_payload_with_timestamps(self):
        """测试验证 Token 返回包含时间戳的载荷"""
        merchant_id = 1
        token = create_access_token(merchant_id)
        
        payload = verify_token(token)
        
        assert "merchant_id" in payload
        assert "exp" in payload
        assert "iat" in payload
    
    def test_verify_token_with_multiple_verifications(self):
        """测试同一个 Token 可以多次验证"""
        merchant_id = 42
        token = create_access_token(merchant_id)
        
        # 验证多次
        for _ in range(3):
            payload = verify_token(token)
            assert payload["merchant_id"] == merchant_id


class TestExpiredToken:
    """过期 Token 测试"""
    
    def test_expired_token_raises_exception(self):
        """测试过期 Token 抛出异常"""
        merchant_id = 1
        # 创建一个已过期的 Token（过期时间为-1秒）
        expired_payload = {
            "merchant_id": merchant_id,
            "exp": datetime.utcnow() - timedelta(seconds=1),
            "iat": datetime.utcnow() - timedelta(seconds=10)
        }
        expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token(expired_token)
        
        assert exc_info.value.status_code == 401
        assert "过期" in exc_info.value.detail
    
    def test_token_expires_after_seven_days(self):
        """测试 Token 在7天后过期"""
        merchant_id = 1
        # 创建一个刚好7天前创建的 Token（应该已经过期）
        expired_payload = {
            "merchant_id": merchant_id,
            "exp": datetime.utcnow() - timedelta(days=7, seconds=1),
            "iat": datetime.utcnow() - timedelta(days=7, seconds=2)
        }
        expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token(expired_token)
        
        assert exc_info.value.status_code == 401


class TestInvalidToken:
    """无效 Token 测试"""
    
    def test_invalid_token_raises_exception(self):
        """测试无效 Token 抛出异常"""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token(invalid_token)
        
        assert exc_info.value.status_code == 401
        assert "无效" in exc_info.value.detail or "Invalid" in str(exc_info.value.detail)
    
    def test_token_with_wrong_secret_raises_exception(self):
        """测试使用错误密钥签名的 Token 抛出异常"""
        merchant_id = 1
        # 使用错误的密钥创建 Token
        wrong_secret = "wrong-secret-key"
        payload = {
            "merchant_id": merchant_id,
            "exp": datetime.utcnow() + timedelta(days=7),
            "iat": datetime.utcnow()
        }
        wrong_token = jwt.encode(payload, wrong_secret, algorithm=ALGORITHM)
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token(wrong_token)
        
        assert exc_info.value.status_code == 401
    
    def test_token_without_merchant_id_raises_exception(self):
        """测试缺少 merchant_id 的 Token 抛出异常"""
        # 创建一个没有 merchant_id 的 Token
        payload = {
            "exp": datetime.utcnow() + timedelta(days=7),
            "iat": datetime.utcnow()
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token(token)
        
        assert exc_info.value.status_code == 401
        assert "merchant_id" in exc_info.value.detail or "无效" in exc_info.value.detail
    
    def test_empty_token_raises_exception(self):
        """测试空 Token 抛出异常"""
        with pytest.raises(HTTPException) as exc_info:
            verify_token("")
        
        assert exc_info.value.status_code == 401
    
    def test_malformed_token_raises_exception(self):
        """测试格式错误的 Token 抛出异常"""
        malformed_tokens = [
            "abc",
            "abc.def",
            "abc.def.ghi.jkl",
            "not-a-jwt-token",
            "12345",
            "Bearer token"
        ]
        
        for token in malformed_tokens:
            with pytest.raises(HTTPException) as exc_info:
                verify_token(token)
            
            assert exc_info.value.status_code == 401


class TestGetCurrentMerchant:
    """商家鉴权中间件测试"""
    
    def test_get_current_merchant_with_valid_token(self):
        """测试使用有效 Token 获取商家信息"""
        merchant_id = 1
        token = create_access_token(merchant_id)
        
        # 模拟 HTTPAuthorizationCredentials
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        
        payload = get_current_merchant(credentials)
        
        assert payload is not None
        assert payload["merchant_id"] == merchant_id
    
    def test_get_current_merchant_with_expired_token(self):
        """测试使用过期 Token 抛出异常"""
        expired_payload = {
            "merchant_id": 1,
            "exp": datetime.utcnow() - timedelta(seconds=1),
            "iat": datetime.utcnow() - timedelta(seconds=10)
        }
        expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
        
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=expired_token
        )
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_merchant(credentials)
        
        assert exc_info.value.status_code == 401


class TestTokenConfiguration:
    """Token 配置测试"""
    
    def test_default_expiry_is_seven_days(self):
        """测试默认过期时间为7天"""
        assert ACCESS_TOKEN_EXPIRE_DAYS == 7
    
    def test_algorithm_is_hs256(self):
        """测试算法为 HS256"""
        assert ALGORITHM == "HS256"
    
    def test_secret_key_exists(self):
        """测试密钥存在"""
        assert SECRET_KEY is not None
        assert len(SECRET_KEY) > 0
    
    def test_secret_key_from_jwt_secret_env(self):
        """测试密钥从 JWT_SECRET 环境变量读取"""
        # 重新导入以验证环境变量读取
        import importlib
        import shared.auth
        importlib.reload(shared.auth)
        assert shared.auth.SECRET_KEY == "test-secret-key-for-jwt-testing-min-32-chars"


class TestCreateTokenAlias:
    """create_token 别名函数测试"""
    
    def test_create_token_is_alias_of_create_access_token(self):
        """测试 create_token 是 create_access_token 的别名"""
        assert create_token == create_access_token
    
    def test_create_token_works_correctly(self):
        """测试 create_token 函数正常工作"""
        merchant_id = 999
        token = create_token(merchant_id)
        
        assert token is not None
        assert isinstance(token, str)
        
        # 验证可以解码
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["merchant_id"] == merchant_id
    
    def test_create_token_with_custom_expiry(self):
        """测试 create_token 支持自定义过期时间"""
        merchant_id = 123
        custom_expiry = timedelta(hours=2)
        token = create_token(merchant_id, expires_delta=custom_expiry)
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["merchant_id"] == merchant_id


# 运行测试的入口
if __name__ == "__main__":
    pytest.main([__file__, "-v"])