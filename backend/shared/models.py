"""
Models Module - 数据模型定义
支持商家数据隔离、RBAC 权限管理、平台管理员、用户管理
"""
from sqlmodel import SQLModel, Field, Session, select
from datetime import datetime
from typing import Optional, List
import json


# ============== RBAC 角色模型 ==============

class MerchantRole(SQLModel, table=True):
    """商家角色模型 - RBAC 权限管理"""
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    name: str = Field(..., max_length=50, description="角色名称")
    code: str = Field(..., max_length=20, unique=True, index=True, description="角色代码")
    permissions: str = Field(default="", description="权限列表JSON字符串")
    description: str = Field(default="", max_length=200, description="角色描述")
    is_active: bool = Field(default=True, description="是否启用")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def get_permissions_list(self) -> List[str]:
        """获取权限列表"""
        if self.permissions:
            try:
                return json.loads(self.permissions)
            except (json.JSONDecodeError, Exception):
                return []
        return []
    
    def set_permissions_list(self, permissions_list: List[str]):
        """设置权限列表"""
        self.permissions = json.dumps(permissions_list, ensure_ascii=False)
    
    def has_permission(self, permission: str) -> bool:
        """检查是否拥有某个权限"""
        permissions_list = self.get_permissions_list()
        return permission in permissions_list
    
    @staticmethod
    def get_default_roles_data() -> List[dict]:
        """获取默认角色数据"""
        return [
            {
                "name": "店主",
                "code": "owner",
                "permissions": [
                    "product:read", "product:create", "product:update", "product:delete",
                    "order:read", "order:update",
                    "category:read", "category:create",
                    "revenue:read",
                    "merchant:read", "merchant:update"
                ],
                "description": "商店所有者，拥有所有权限"
            },
            {
                "name": "管理员",
                "code": "admin",
                "permissions": [
                    "product:read", "product:create", "product:update", "product:delete",
                    "order:read", "order:update",
                    "category:read", "category:create",
                    "revenue:read",
                    "merchant:read"
                ],
                "description": "可管理商品、订单、品类、查看收益"
            },
            {
                "name": "员工",
                "code": "staff",
                "permissions": [
                    "product:read",
                    "order:read", "order:update",
                    "merchant:read"
                ],
                "description": "仅可查看和更新订单"
            }
        ]
    
    @staticmethod
    def init_default_roles(session: Session) -> bool:
        """初始化默认角色（如果不存在）"""
        try:
            # 检查是否已有角色
            existing = session.exec(select(MerchantRole)).first()
            if existing:
                return False  # 已存在，无需初始化
            
            # 创建默认角色
            for role_data in MerchantRole.get_default_roles_data():
                role = MerchantRole(
                    name=role_data["name"],
                    code=role_data["code"],
                    permissions=json.dumps(role_data["permissions"], ensure_ascii=False),
                    description=role_data["description"],
                    is_active=True
                )
                session.add(role)
            
            session.commit()
            return True
        except Exception:
            session.rollback()
            return False


# ============== 商家模型 ==============

class Merchant(SQLModel, table=True):
    """商家模型"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="", max_length=100)
    phone: str = Field(default="", max_length=20)
    wechat_openid: str = Field(default="", max_length=100, unique=True)
    shop_name: str = Field(default="", max_length=100)
    role_id: int = Field(default=1, foreign_key="merchantrole.id", description="角色ID，默认为owner")
    is_active: bool = Field(default=True, description="是否启用，默认True")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============== 商品模型 ==============

class Product(SQLModel, table=True):
    """商品模型 - 支持商家数据隔离"""
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    merchant_id: int = Field(default=1, foreign_key="merchant.id", index=True)
    name: str = Field(..., index=True, max_length=100)
    description: str = Field(default="", max_length=500)
    price: float = Field(..., gt=0)
    original_price: float = Field(default=0, ge=0)  # 原价
    image: str = Field(default="", max_length=500)  # 商品图片URL
    category: str = Field(default="", max_length=50)
    category_name: str = Field(default="", max_length=50)  # 分类名称
    stock: int = Field(default=0, ge=0)
    sales: int = Field(default=0, ge=0)  # 销量
    unit: str = Field(default="", max_length=50)  # 单位规格
    tag: str = Field(default="", max_length=50)  # 标签文字
    tag_type: str = Field(default="", max_length=20)  # 标签类型: hot, new 等
    badges: str = Field(default="")  # JSON数组字符串，如 ["活鲜现挑", "白灼推荐"]
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def get_badges_list(self) -> list:
        """获取badges列表"""
        if self.badges:
            try:
                return json.loads(self.badges)
            except:
                return []
        return []
    
    def set_badges_list(self, badges_list: list):
        """设置badges列表"""
        self.badges = json.dumps(badges_list, ensure_ascii=False)


# ============== 订单模型 ==============

class Order(SQLModel, table=True):
    """订单模型 - 支持商家数据隔离和用户关联"""
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    merchant_id: int = Field(default=1, foreign_key="merchant.id", index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True, description="用户ID")
    customer_name: str = Field(..., max_length=100)
    customer_phone: str = Field(..., max_length=20)
    pickup_time: datetime = Field(...)
    total_amount: float = Field(..., gt=0)
    status: str = Field(default="pending", max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class OrderItem(SQLModel, table=True):
    """订单明细模型"""
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    order_id: int = Field(..., foreign_key="order.id")
    product_id: int = Field(..., foreign_key="product.id")
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    subtotal: float = Field(..., gt=0)


# ============== 品类模型 ==============

class Category(SQLModel, table=True):
    """品类模型 - 支持商家数据隔离"""
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    merchant_id: int = Field(default=1, foreign_key="merchant.id", index=True)
    slug: str = Field(default="", max_length=50, index=True)  # 字符串标识符，如 'shrimp'
    name: str = Field(..., max_length=50)
    icon: str = Field(default="", max_length=100)
    order: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============== 平台管理员模型（新增） ==============

class PlatformAdmin(SQLModel, table=True):
    """平台管理员模型 - 用于平台级管理"""
    __tablename__ = "platform_admin"
    
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    username: str = Field(..., max_length=50, unique=True, index=True, description="管理员用户名")
    password_hash: str = Field(..., max_length=200, description="密码哈希")
    email: str = Field(default="", max_length=100, unique=True, description="邮箱")
    phone: str = Field(default="", max_length=20, description="手机号")
    real_name: str = Field(default="", max_length=50, description="真实姓名")
    role: str = Field(default="admin", max_length=20, description="角色：super_admin/admin/operator")
    permissions: str = Field(default="", description="权限列表JSON字符串")
    is_active: bool = Field(default=True, description="是否启用")
    last_login_at: Optional[datetime] = Field(default=None, description="最后登录时间")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def get_permissions_list(self) -> List[str]:
        """获取权限列表"""
        if self.permissions:
            try:
                return json.loads(self.permissions)
            except (json.JSONDecodeError, Exception):
                return []
        return []
    
    def set_permissions_list(self, permissions_list: List[str]):
        """设置权限列表"""
        self.permissions = json.dumps(permissions_list, ensure_ascii=False)
    
    def has_permission(self, permission: str) -> bool:
        """检查是否拥有某个权限"""
        permissions_list = self.get_permissions_list()
        return permission in permissions_list
    
    @staticmethod
    def get_default_admin_data() -> List[dict]:
        """获取默认管理员数据"""
        return [
            {
                "username": "super_admin",
                "password_hash": "",  # 需要在初始化时设置
                "email": "admin@platform.com",
                "real_name": "超级管理员",
                "role": "super_admin",
                "permissions": [
                    "platform:read", "platform:write",
                    "merchant:read", "merchant:create", "merchant:update", "merchant:delete",
                    "admin:read", "admin:create", "admin:update", "admin:delete",
                    "report:read", "report:export"
                ],
                "description": "平台超级管理员，拥有所有权限"
            },
            {
                "username": "operator",
                "password_hash": "",  # 需要在初始化时设置
                "email": "operator@platform.com",
                "real_name": "运营人员",
                "role": "operator",
                "permissions": [
                    "merchant:read", "merchant:update",
                    "report:read"
                ],
                "description": "运营人员，可查看和管理商家、查看报表"
            }
        ]
    
    @staticmethod
    def init_default_admin(session: Session, username: str = None, password: str = None) -> bool:
        """
        初始化默认管理员账号（F03: 管理员账号初始化）
        
        Args:
            session: 数据库会话
            username: 管理员用户名（从环境变量 ADMIN_USERNAME 读取）
            password: 管理员密码（从环境变量 ADMIN_PASSWORD 读取）
        
        Returns:
            bool: True 表示创建了管理员，False 表示已存在
        """
        import logging
        import bcrypt
        import os
        
        logger = logging.getLogger("platform_admin_init")
        
        # 检查是否已有管理员账号
        existing = session.exec(select(PlatformAdmin)).first()
        if existing:
            logger.info("管理员账号已存在，无需初始化")
            return False
        
        # 从环境变量读取默认管理员配置
        admin_username = username or os.getenv("ADMIN_USERNAME", "admin")
        admin_password = password or os.getenv("ADMIN_PASSWORD", "admin123")
        
        if not admin_username or not admin_password:
            logger.warning("未配置管理员账号环境变量 ADMIN_USERNAME/ADMIN_PASSWORD，跳过初始化")
            return False
        
        # 密码 bcrypt 加密
        password_hash = bcrypt.hashpw(
            admin_password.encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # 创建默认管理员账号
        admin = PlatformAdmin(
            username=admin_username,
            password_hash=password_hash,
            email=os.getenv("ADMIN_EMAIL", "admin@platform.com"),
            real_name="默认管理员",
            role="super_admin",
            permissions=json.dumps([
                "platform:read", "platform:write",
                "merchant:read", "merchant:create", "merchant:update", "merchant:delete",
                "admin:read", "admin:create", "admin:update", "admin:delete",
                "report:read", "report:export"
            ], ensure_ascii=False),
            is_active=True
        )
        
        session.add(admin)
        session.commit()
        
        logger.info(f"默认管理员账号已创建: username={admin_username}")
        return True


# ============== 用户模型（新增） ==============

class User(SQLModel, table=True):
    """用户模型 - 用于C端用户管理"""
    __tablename__ = "user"
    
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    phone: str = Field(default="", max_length=20, unique=True, index=True, description="手机号")
    wechat_openid: Optional[str] = Field(default=None, max_length=100, unique=True, description="微信OpenID")
    nickname: str = Field(default="", max_length=50, description="昵称")
    avatar_url: str = Field(default="", max_length=500, description="头像URL")
    real_name: str = Field(default="", max_length=50, description="真实姓名")
    gender: str = Field(default="", max_length=10, description="性别：male/female/other")
    birthday: Optional[datetime] = Field(default=None, description="生日")
    address: str = Field(default="", max_length=200, description="默认地址")
    is_active: bool = Field(default=True, description="是否启用")
    last_login_at: Optional[datetime] = Field(default=None, description="最后登录时间")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # 关联字段
    default_merchant_id: Optional[int] = Field(default=None, foreign_key="merchant.id", description="默认商家ID")


# ============== 商家配置模型 ==============

class MerchantConfig(SQLModel, table=True):
    """商家配置模型 - 存储商家店铺配置数据"""
    __tablename__ = "merchant_config"
    
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    merchant_id: int = Field(..., foreign_key="merchant.id", unique=True, index=True, description="商家ID，一对一关联")
    shop_name: str = Field(default="", max_length=100, description="店铺名称")
    shop_logo: str = Field(default="", max_length=500, description="店铺Logo URL")
    contact_phone: str = Field(default="", max_length=20, description="联系电话")
    contact_wechat: str = Field(default="", max_length=50, description="联系微信")
    address: str = Field(default="", max_length=200, description="店铺地址")
    business_hours: str = Field(default="", max_length=100, description="营业时间，如 '08:00-20:00'")
    announcement: str = Field(default="", max_length=500, description="店铺公告")
    theme_color: str = Field(default="#1890ff", max_length=20, description="主题色")
    enable_ordering: bool = Field(default=True, description="是否开启下单功能")
    enable_pickup: bool = Field(default=True, description="是否开启自提功能")
    min_order_amount: float = Field(default=0, ge=0, description="最低订单金额")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @staticmethod
    def get_default_config(merchant_id: int) -> "MerchantConfig":
        """获取默认配置"""
        return MerchantConfig(
            merchant_id=merchant_id,
            shop_name="",
            shop_logo="",
            contact_phone="",
            contact_wechat="",
            address="",
            business_hours="08:00-20:00",
            announcement="欢迎光临！",
            theme_color="#1890ff",
            enable_ordering=True,
            enable_pickup=True,
            min_order_amount=0
        )


# ============== 商家操作日志模型（F02: 商家状态管理） ==============

class MerchantOperationLog(SQLModel, table=True):
    """商家操作日志模型 - 记录商家启用/禁用操作"""
    __tablename__ = "merchant_operation_log"
    
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    merchant_id: int = Field(..., foreign_key="merchant.id", index=True, description="商家ID")
    admin_id: int = Field(..., foreign_key="platform_admin.id", index=True, description="操作管理员ID")
    operation_type: str = Field(..., max_length=20, description="操作类型：enable/disable")
    previous_status: bool = Field(..., description="操作前状态")
    new_status: bool = Field(..., description="操作后状态")
    reason: str = Field(default="", max_length=500, description="操作原因")
    cancelled_orders_count: int = Field(default=0, ge=0, description="取消的订单数量")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="操作时间")


# ============== 初始化锁模型（F03: 管理员账号初始化） ==============

class InitLock(SQLModel, table=True):
    """初始化锁模型 - 防止多实例并发初始化冲突"""
    __tablename__ = "init_lock"
    
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    lock_name: str = Field(..., max_length=50, unique=True, index=True, description="锁名称")
    is_locked: bool = Field(default=False, description="是否锁定")
    locked_at: Optional[datetime] = Field(default=None, description="锁定时间")
    locked_by: str = Field(default="", max_length=100, description="锁定者标识")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)