"""
Product Service - 商品业务逻辑层
"""
import json
from typing import List, Optional
from sqlmodel import Session, select
from models import Product


class ProductService:
    """商品服务类"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_all_products(self, merchant_id: Optional[int] = None) -> List[Product]:
        """获取所有商品列表"""
        query = select(Product).where(Product.is_active == True)
        if merchant_id:
            query = query.where(Product.merchant_id == merchant_id)
        return self.session.exec(query).all()
    
    def get_product_by_id(self, product_id: int) -> Optional[Product]:
        """根据ID获取商品"""
        return self.session.exec(
            select(Product).where(Product.id == product_id)
        ).first()
    
    def search_by_price(
        self,
        min_price: float = 0,
        max_price: float = 1000,
        merchant_id: Optional[int] = None
    ) -> List[Product]:
        """按价格范围搜索商品"""
        query = select(Product).where(
            Product.price >= min_price,
            Product.price <= max_price,
            Product.is_active == True
        )
        if merchant_id:
            query = query.where(Product.merchant_id == merchant_id)
        return self.session.exec(query).all()
    
    def search_by_category(
        self,
        category: str,
        merchant_id: Optional[int] = None
    ) -> List[Product]:
        """按品类获取商品"""
        query = select(Product).where(
            Product.category == category,
            Product.is_active == True
        )
        if merchant_id:
            query = query.where(Product.merchant_id == merchant_id)
        return self.session.exec(query).all()
    
    @staticmethod
    def to_response(product: Product) -> dict:
        """将Product模型转换为前端需要的响应格式"""
        badges_list = []
        if product.badges:
            try:
                badges_list = json.loads(product.badges)
            except (json.JSONDecodeError, Exception):
                badges_list = []
        
        return {
            "id": product.id,
            "merchant_id": product.merchant_id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "original_price": product.original_price,
            "image": product.image,
            "category": product.category,
            "category_name": product.category_name,
            "stock": product.stock,
            "sales": product.sales,
            "unit": product.unit,
            "tag": product.tag,
            "tag_type": product.tag_type,
            "badges": badges_list,
            "is_active": product.is_active
        }
