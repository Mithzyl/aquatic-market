"""
初始化数据脚本
将前端dummy data中的商品数据写入MySQL数据库
支持重复运行（不重复插入）
"""
import os
import sys
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

from sqlmodel import SQLModel, Session, select
from models import Product, Merchant, Category

# 前端商品数据
FRONTEND_PRODUCTS = [
    {
        "id": 1,
        "name": "基围虾",
        "price": 49,
        "original_price": 58,
        "category": "shrimp",
        "category_name": "虾类",
        "image": "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=800&fit=crop",
        "description": "鲜活基围虾，适合白灼与椒盐，门店现打氧保鲜。",
        "stock": 120,
        "sales": 618,
        "unit": "500g/份",
        "tag": "招牌",
        "tag_type": "hot",
        "badges": ["活鲜现挑", "白灼推荐"]
    },
    {
        "id": 2,
        "name": "黑虎虾",
        "price": 79,
        "original_price": 92,
        "category": "shrimp",
        "category_name": "虾类",
        "image": "https://images.unsplash.com/photo-1625943555419-56a2cb596640?w=800&h=800&fit=crop",
        "description": "肉质紧实，适合香煎与黄油焗烤，大规格更适合多人餐。",
        "stock": 88,
        "sales": 302,
        "unit": "6只/份",
        "tag": "热卖",
        "tag_type": "hot",
        "badges": ["大规格", "香煎推荐"]
    },
    {
        "id": 3,
        "name": "梭子蟹",
        "price": 89,
        "original_price": 108,
        "category": "crab",
        "category_name": "蟹类",
        "image": "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&h=800&fit=crop",
        "description": "膏黄饱满，适合清蒸和葱姜炒，下午档出货最快。",
        "stock": 76,
        "sales": 248,
        "unit": "2只/份",
        "tag": "时令",
        "tag_type": "new",
        "badges": ["今日到港", "清蒸推荐"]
    },
    {
        "id": 4,
        "name": "帝王蟹腿",
        "price": 168,
        "original_price": 198,
        "category": "crab",
        "category_name": "蟹类",
        "image": "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&h=800&fit=crop",
        "description": "精选帝王蟹腿，解冻即烹，适合火锅和黄油焗。",
        "stock": 45,
        "sales": 129,
        "unit": "700g/盒",
        "tag": "宴请",
        "tag_type": "hot",
        "badges": ["厚切蟹腿", "火锅推荐"]
    },
    {
        "id": 5,
        "name": "挪威三文鱼",
        "price": 98,
        "original_price": 118,
        "category": "fish",
        "category_name": "鱼类",
        "image": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&h=800&fit=crop",
        "description": "油脂均衡，适合刺身与香煎，门店可代切薄片。",
        "stock": 90,
        "sales": 540,
        "unit": "300g/盒",
        "tag": "刺身",
        "tag_type": "new",
        "badges": ["现切装盒", "刺身推荐"]
    },
    {
        "id": 6,
        "name": "金鲳鱼",
        "price": 36,
        "original_price": 42,
        "category": "fish",
        "category_name": "鱼类",
        "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop",
        "description": "净膛处理，适合香煎与清蒸，家庭晚餐常备款。",
        "stock": 150,
        "sales": 410,
        "unit": "1条/份",
        "tag": "家常",
        "tag_type": "hot",
        "badges": ["已净膛", "香煎推荐"]
    },
    {
        "id": 7,
        "name": "乳山生蚝",
        "price": 55,
        "original_price": 68,
        "category": "shell",
        "category_name": "贝类",
        "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=800&fit=crop",
        "description": "个头饱满，适合蒜蓉烤和炭烤，门店可代开壳。",
        "stock": 64,
        "sales": 286,
        "unit": "12只/份",
        "tag": "肥美",
        "tag_type": "hot",
        "badges": ["代开壳", "烧烤推荐"]
    },
    {
        "id": 8,
        "name": "北极贝",
        "price": 45,
        "original_price": 52,
        "category": "shell",
        "category_name": "贝类",
        "image": "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=800&h=800&fit=crop",
        "description": "口感脆甜，适合凉拌和寿司拼盘，冷藏出品更佳。",
        "stock": 70,
        "sales": 214,
        "unit": "200g/盒",
        "tag": "冷盘",
        "tag_type": "new",
        "badges": ["即食冷盘", "寿司搭配"]
    },
    {
        "id": 9,
        "name": "波士顿龙虾",
        "price": 188,
        "original_price": 218,
        "category": "lobster",
        "category_name": "龙虾",
        "image": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&h=800&fit=crop",
        "description": "鲜活波龙，适合芝士焗和蒜蓉蒸，节庆聚餐必点。",
        "stock": 38,
        "sales": 168,
        "unit": "1只/份",
        "tag": "聚餐",
        "tag_type": "hot",
        "badges": ["鲜活到店", "芝士焗推荐"]
    },
    {
        "id": 10,
        "name": "小青龙",
        "price": 139,
        "original_price": 158,
        "category": "lobster",
        "category_name": "龙虾",
        "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=800&fit=crop",
        "description": "肉质紧实，适合避风塘和椒盐做法，适合双人餐。",
        "stock": 52,
        "sales": 198,
        "unit": "1只/份",
        "tag": "限时",
        "tag_type": "new",
        "badges": ["双人餐", "椒盐推荐"]
    }
]

# 前端分类数据
FRONTEND_CATEGORIES = [
    {"id": "shrimp", "name": "虾类", "icon": "🦐", "order": 1},
    {"id": "crab", "name": "蟹类", "icon": "🦀", "order": 2},
    {"id": "fish", "name": "鱼类", "icon": "🐟", "order": 3},
    {"id": "shell", "name": "贝类", "icon": "🦪", "order": 4},
    {"id": "lobster", "name": "龙虾", "icon": "🦞", "order": 5}
]


def init_merchant(session: Session) -> int:
    """初始化商家数据，返回商家ID"""
    # 检查是否已存在商家
    existing = session.exec(select(Merchant)).first()
    if existing:
        print(f"✓ 商家已存在: ID={existing.id}, 名称={existing.shop_name}")
        return existing.id
    
    # 创建默认商家
    merchant = Merchant(
        name="海鲜市场",
        phone="13800138000",
        wechat_openid="default_openid_001",
        shop_name="鲜活海鲜市场"
    )
    session.add(merchant)
    session.commit()
    session.refresh(merchant)
    print(f"✓ 创建商家: ID={merchant.id}, 名称={merchant.shop_name}")
    return merchant.id


def init_categories(session: Session, merchant_id: int):
    """初始化分类数据"""
    import json
    
    for cat_data in FRONTEND_CATEGORIES:
        # 检查是否已存在该分类
        existing = session.exec(
            select(Category).where(
                Category.merchant_id == merchant_id,
                Category.name == cat_data["name"]
            )
        ).first()
        
        if not existing:
            category = Category(
                merchant_id=merchant_id,
                name=cat_data["name"],
                icon=cat_data["icon"],
                order=cat_data["order"]
            )
            session.add(category)
            print(f"✓ 创建分类: {cat_data['name']}")
    
    session.commit()
    print("✓ 分类初始化完成")


def init_products(session: Session, merchant_id: int):
    """初始化商品数据"""
    import json
    
    created_count = 0
    updated_count = 0
    
    for prod_data in FRONTEND_PRODUCTS:
        # 检查是否已存在该商品（按名称判断）
        existing = session.exec(
            select(Product).where(
                Product.merchant_id == merchant_id,
                Product.name == prod_data["name"]
            )
        ).first()
        
        if existing:
            # 更新现有商品
            existing.price = prod_data["price"]
            existing.original_price = prod_data["original_price"]
            existing.image = prod_data["image"]
            existing.description = prod_data["description"]
            existing.stock = prod_data["stock"]
            existing.sales = prod_data["sales"]
            existing.unit = prod_data["unit"]
            existing.category = prod_data["category"]
            existing.category_name = prod_data["category_name"]
            existing.tag = prod_data["tag"]
            existing.tag_type = prod_data["tag_type"]
            existing.badges = json.dumps(prod_data["badges"], ensure_ascii=False)
            updated_count += 1
            print(f"✓ 更新商品: {prod_data['name']}")
        else:
            # 创建新商品
            product = Product(
                merchant_id=merchant_id,
                name=prod_data["name"],
                description=prod_data["description"],
                price=prod_data["price"],
                original_price=prod_data["original_price"],
                image=prod_data["image"],
                category=prod_data["category"],
                category_name=prod_data["category_name"],
                stock=prod_data["stock"],
                sales=prod_data["sales"],
                unit=prod_data["unit"],
                tag=prod_data["tag"],
                tag_type=prod_data["tag_type"],
                badges=json.dumps(prod_data["badges"], ensure_ascii=False),
                is_active=True
            )
            session.add(product)
            created_count += 1
            print(f"✓ 创建商品: {prod_data['name']}")
    
    session.commit()
    print(f"\n✓ 商品初始化完成: 新建 {created_count} 个, 更新 {updated_count} 个")


def main():
    """主函数"""
    print("=" * 50)
    print("开始初始化数据...")
    print("=" * 50)
    
    # 获取数据库连接
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aquatic_market.db")
    
    if DATABASE_URL.startswith("mysql"):
        from sqlalchemy import create_engine
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
            connect_args={"charset": "utf8mb4"}
        )
    else:
        from sqlalchemy import create_engine
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    # 创建表结构
    print("\n创建数据库表...")
    SQLModel.metadata.create_all(engine)
    print("✓ 数据库表创建完成")
    
    # 初始化数据
    with Session(engine) as session:
        print("\n初始化商家数据...")
        merchant_id = init_merchant(session)
        
        print("\n初始化分类数据...")
        init_categories(session, merchant_id)
        
        print("\n初始化商品数据...")
        init_products(session, merchant_id)
    
    print("\n" + "=" * 50)
    print("数据初始化完成!")
    print("=" * 50)


if __name__ == "__main__":
    main()