"""
Config Routes - 配置路由定义（用户端）

提供用户端获取商家配置的接口
支持"无商家"场景优雅降级
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel, Field as PydanticField

# 导入共享模块
from shared.database import get_session
from shared.models import MerchantConfig, Merchant

router = APIRouter()


# ============== 响应模型 ==============

class CustomerConfigResponse(BaseModel):
    """用户端配置响应"""
    is_empty: bool = PydanticField(default=False, description="是否为空配置（无商家时为true）")
    merchant_id: Optional[int] = PydanticField(default=None, description="商家ID，无商家时为null")
    shop_name: str = PydanticField(default="", description="店铺名称")
    shop_logo: str = PydanticField(default="", description="店铺Logo URL")
    contact_phone: str = PydanticField(default="", description="联系电话")
    contact_wechat: str = PydanticField(default="", description="联系微信")
    address: str = PydanticField(default="", description="店铺地址")
    business_hours: str = PydanticField(default="", description="营业时间")
    announcement: str = PydanticField(default="", description="店铺公告")
    theme_color: str = PydanticField(default="#1890ff", description="主题色")
    enable_ordering: bool = PydanticField(default=True, description="是否开启下单功能")
    enable_pickup: bool = PydanticField(default=True, description="是否开启自提功能")
    min_order_amount: float = PydanticField(default=0, description="最低订单金额")


# ============== 辅助函数 ==============

def get_first_merchant(session: Session) -> Optional[Merchant]:
    """
    获取首个商家（按ID升序）
    
    Args:
        session: 数据库会话
    
    Returns:
        Merchant 或 None（无商家时）
    """
    return session.exec(
        select(Merchant).order_by(Merchant.id.asc()).limit(1)
    ).first()


def get_empty_config_response() -> CustomerConfigResponse:
    """
    生成空配置响应（无商家场景）
    
    Returns:
        CustomerConfigResponse: 空配置模板，is_empty=True
    """
    return CustomerConfigResponse(
        is_empty=True,
        merchant_id=None,
        shop_name="",
        shop_logo="",
        contact_phone="",
        contact_wechat="",
        address="",
        business_hours="",
        announcement="",
        theme_color="#1890ff",
        enable_ordering=True,
        enable_pickup=True,
        min_order_amount=0
    )


# ============== API 端点 ==============

@router.get("/config", response_model=CustomerConfigResponse)
def get_config(
    merchant_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """
    获取商家配置信息
    
    用户端获取商家的店铺配置，包括店铺名称、Logo、联系方式、营业时间等。
    
    支持三种场景：
    1. 无商家：返回 is_empty=true + 空配置模板，不抛404
    2. 有商家但未传 merchant_id：返回首个商家配置
    3. 传入 merchant_id：返回指定商家配置（原逻辑）
    
    Args:
        merchant_id: 商家ID，可选。如果不传，返回首个商家的配置
    
    Returns:
        CustomerConfigResponse: 商家配置信息
    """
    # 场景3：传入 merchant_id 时保持原逻辑
    if merchant_id is not None:
        # 查询指定商家
        merchant = session.exec(
            select(Merchant).where(Merchant.id == merchant_id)
        ).first()
        
        if not merchant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="商家不存在"
            )
        
        # 查询商家配置
        config = session.exec(
            select(MerchantConfig).where(MerchantConfig.merchant_id == merchant_id)
        ).first()
        
        # 如果配置不存在，创建默认配置
        if not config:
            config = MerchantConfig.get_default_config(merchant_id)
            session.add(config)
            session.commit()
            session.refresh(config)
        
        return CustomerConfigResponse(
            is_empty=False,
            merchant_id=config.merchant_id,
            shop_name=config.shop_name or merchant.shop_name,
            shop_logo=config.shop_logo,
            contact_phone=config.contact_phone,
            contact_wechat=config.contact_wechat,
            address=config.address,
            business_hours=config.business_hours,
            announcement=config.announcement,
            theme_color=config.theme_color,
            enable_ordering=config.enable_ordering,
            enable_pickup=config.enable_pickup,
            min_order_amount=config.min_order_amount
        )
    
    # 场景1和2：未传 merchant_id
    # 获取首个商家
    first_merchant = get_first_merchant(session)
    
    # 场景1：无商家，返回空配置
    if not first_merchant:
        return get_empty_config_response()
    
    # 场景2：有商家，返回首个商家配置
    config = session.exec(
        select(MerchantConfig).where(MerchantConfig.merchant_id == first_merchant.id)
    ).first()
    
    # 如果配置不存在，创建默认配置
    if not config:
        config = MerchantConfig.get_default_config(first_merchant.id)
        session.add(config)
        session.commit()
        session.refresh(config)
    
    return CustomerConfigResponse(
        is_empty=False,
        merchant_id=config.merchant_id,
        shop_name=config.shop_name or first_merchant.shop_name,
        shop_logo=config.shop_logo,
        contact_phone=config.contact_phone,
        contact_wechat=config.contact_wechat,
        address=config.address,
        business_hours=config.business_hours,
        announcement=config.announcement,
        theme_color=config.theme_color,
        enable_ordering=config.enable_ordering,
        enable_pickup=config.enable_pickup,
        min_order_amount=config.min_order_amount
    )