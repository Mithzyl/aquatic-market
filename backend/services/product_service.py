"""
Product Service - 商品业务逻辑层
"""
import json
from typing import List, Optional
from sqlmodel import Session, select
from models import Product, Category


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


class CategoryService:
    """分类服务类 - 用户端"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_categories(self, merchant_id: Optional[int] = None) -> List[dict]:
        """
        获取分类列表
        
        Args:
            merchant_id: 可选的商家ID筛选
            
        Returns:
            分类列表，id 使用 slug 字段（字符串），与前端 retailCategories 兼容
        """
        query = select(Category).order_by(Category.order)
        if merchant_id:
            query = query.where(Category.merchant_id == merchant_id)
        
        categories = self.session.exec(query).all()
        
        return [
            {
                "id": cat.slug or str(cat.id),  # 使用 slug 作为字符串 id，兼容前端
                "name": cat.name,
                "icon": cat.icon,
                "order": cat.order
            }
            for cat in categories
        ]
