"""
Audit Routes - 审核管理路由

提供审核管理功能：
- GET /audit/pending: 获取待审核列表
- PUT /audit/merchant/{id}: 商家入驻审核
- GET /audit/history: 审核历史记录
- POST /audit/report: 生成审核报告
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlmodel import Session, select

# 导入共享模块
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from shared.database import get_session
from shared.models import Merchant
from shared.auth import get_current_admin, require_admin_permission

router = APIRouter()


# ============== 响应模型 ==============

class PendingAuditItem(BaseModel):
    """待审核项目"""
    id: int
    type: str = Field(..., description="审核类型：merchant/product/user")
    applicant_name: str = Field(..., description="申请人名称")
    applicant_phone: str = Field(default="", description="申请人联系方式")
    submit_time: datetime = Field(..., description="提交时间")
    status: str = Field(default="pending", description="审核状态")
    details: dict = Field(default={}, description="详细信息")


class PendingAuditList(BaseModel):
    """待审核列表"""
    items: List[PendingAuditItem]
    total: int


class MerchantAuditRequest(BaseModel):
    """商家审核请求"""
    approved: bool = Field(..., description="是否通过")
    reason: Optional[str] = Field(default=None, description="审核意见/拒绝原因")


class AuditHistoryItem(BaseModel):
    """审核历史记录"""
    id: int
    type: str
    applicant_name: str
    auditor_name: str = Field(default="", description="审核人")
    audit_time: datetime
    result: str = Field(..., description="审核结果：approved/rejected")
    reason: Optional[str] = Field(default=None, description="审核意见")


class AuditHistoryList(BaseModel):
    """审核历史列表"""
    items: List[AuditHistoryItem]
    total: int


# ============== API 端点 ==============

@router.get("/audit/pending", response_model=PendingAuditList)
def get_pending_audit(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    type: Optional[str] = Query(default=None, description="审核类型筛选"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    获取待审核列表
    
    支持按审核类型筛选
    
    注意：当前版本 Merchant 模型未实现审核状态字段
    此接口返回模拟数据，后续可扩展
    """
    # TODO: Merchant 模型添加 audit_status 字段后实现真实查询
    # statement = select(Merchant).where(Merchant.audit_status == "pending")
    
    # 当前返回空列表（预留接口）
    items = []
    
    # 如果需要，可以返回所有商家作为待审核（模拟）
    if type == "merchant":
        merchants = session.exec(select(Merchant)).all()
        for m in merchants:
            items.append(PendingAuditItem(
                id=m.id,
                type="merchant",
                applicant_name=m.name,
                applicant_phone=m.phone,
                submit_time=m.created_at,
                status="pending",
                details={
                    "shop_name": m.shop_name,
                    "wechat_openid": m.wechat_openid
                }
            ))
    
    total = len(items)
    
    # 分页
    offset = (page - 1) * page_size
    items = items[offset:offset + page_size]
    
    return PendingAuditList(items=items, total=total)


@router.put("/audit/merchant/{merchant_id}")
def audit_merchant(
    merchant_id: int,
    request: MerchantAuditRequest,
    admin: dict = Depends(require_admin_permission("merchant:update")),
    session: Session = Depends(get_session)
):
    """
    商家入驻审核
    
    需要权限：merchant:update
    
    注意：当前版本 Merchant 模型未实现审核状态字段
    此接口为预留接口，后续可扩展
    """
    merchant = session.get(Merchant, merchant_id)
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )
    
    # TODO: Merchant 模型添加 audit_status 字段后实现
    # merchant.audit_status = "approved" if request.approved else "rejected"
    # merchant.audit_time = datetime.utcnow()
    # merchant.auditor_id = admin.get("admin_id")
    # merchant.audit_reason = request.reason
    # session.add(merchant)
    # session.commit()
    
    return {
        "success": True,
        "message": f"商家审核已{'通过' if request.approved else '拒绝'}",
        "merchant_id": merchant_id,
        "note": "当前版本 Merchant 模型未实现审核状态字段，此操作为预留接口"
    }


@router.get("/audit/history", response_model=AuditHistoryList)
def get_audit_history(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    type: Optional[str] = Query(default=None, description="审核类型筛选"),
    result: Optional[str] = Query(default=None, description="审核结果筛选"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    审核历史记录
    
    支持按审核类型和结果筛选
    
    注意：当前版本未实现审核历史记录模型
    此接口返回模拟数据，后续可扩展
    """
    # TODO: 实现 AuditHistory 模型后查询真实数据
    
    # 当前返回空列表（预留接口）
    items = []
    total = 0
    
    return AuditHistoryList(items=items, total=total)


@router.post("/audit/report")
def generate_audit_report(
    start_date: Optional[str] = Query(default=None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(default=None, description="结束日期 YYYY-MM-DD"),
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    生成审核报告
    
    返回指定时间范围内的审核统计
    
    注意：当前版本未实现审核历史记录模型
    此接口返回模拟数据，后续可扩展
    """
    # TODO: 实现审核报告生成
    
    return {
        "success": True,
        "message": "审核报告生成成功",
        "report": {
            "start_date": start_date or "未指定",
            "end_date": end_date or "未指定",
            "total_audits": 0,
            "approved_count": 0,
            "rejected_count": 0,
            "pending_count": 0,
            "average_audit_time": "0分钟",
            "note": "当前版本未实现审核历史记录模型，此报告为预留接口"
        }
    }


@router.get("/audit/statistics")
def get_audit_statistics(
    admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    审核统计
    
    返回审核相关统计数据
    
    注意：当前版本未实现审核历史记录模型
    此接口返回模拟数据，后续可扩展
    """
    # TODO: 实现审核统计
    
    return {
        "pending_count": 0,
        "approved_today": 0,
        "rejected_today": 0,
        "average_processing_time": "0分钟",
        "note": "当前版本未实现审核历史记录模型，此统计为预留接口"
    }