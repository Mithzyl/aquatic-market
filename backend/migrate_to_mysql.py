#!/usr/bin/env python3
"""
SQLite to MySQL 数据迁移脚本
将 aquatic_market.db 的数据迁移到 MySQL
"""

import sqlite3
import os
import sys
from datetime import datetime

# MySQL连接配置
MYSQL_HOST = "43.134.24.99"
MYSQL_PORT = 3306
MYSQL_USER = "aquatic_user"
MYSQL_PASSWORD = "huyuan---3059709"
MYSQL_DATABASE = "aquatic_market"

# SQLite数据库路径
SQLITE_DB = "aquatic_market.db"

def get_sqlite_data():
    """从SQLite读取所有数据"""
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    data = {
        'merchants': [],
        'categories': [],
        'products': [],
        'orders': [],
        'order_items': []
    }
    
    # 读取商家数据
    try:
        cursor.execute("SELECT * FROM merchant")
        for row in cursor.fetchall():
            data['merchants'].append(dict(row))
        print(f"读取到 {len(data['merchants'])} 条商家数据")
    except sqlite3.OperationalError as e:
        print(f"读取merchant表失败: {e}")
    
    # 读取品类数据
    try:
        cursor.execute("SELECT * FROM category")
        for row in cursor.fetchall():
            data['categories'].append(dict(row))
        print(f"读取到 {len(data['categories'])} 条品类数据")
    except sqlite3.OperationalError as e:
        print(f"读取category表失败: {e}")
    
    # 读取商品数据
    try:
        cursor.execute("SELECT * FROM product")
        for row in cursor.fetchall():
            data['products'].append(dict(row))
        print(f"读取到 {len(data['products'])} 条商品数据")
    except sqlite3.OperationalError as e:
        print(f"读取product表失败: {e}")
    
    # 读取订单数据 (order是SQL关键字，需要用方括号或引号包裹)
    try:
        cursor.execute("SELECT * FROM \"order\"")
        for row in cursor.fetchall():
            data['orders'].append(dict(row))
        print(f"读取到 {len(data['orders'])} 条订单数据")
    except sqlite3.OperationalError as e:
        print(f"读取order表失败: {e}")
    
    # 读取订单明细数据
    try:
        cursor.execute("SELECT * FROM orderitem")
        for row in cursor.fetchall():
            data['order_items'].append(dict(row))
        print(f"读取到 {len(data['order_items'])} 条订单明细数据")
    except sqlite3.OperationalError as e:
        print(f"读取orderitem表失败: {e}")
    
    conn.close()
    return data

def generate_mysql_insert_sql(data):
    """生成MySQL INSERT语句"""
    sql_statements = []
    
    # 商家数据
    if data['merchants']:
        for m in data['merchants']:
            created_at = m.get('created_at', datetime.utcnow().isoformat())
            updated_at = m.get('updated_at', datetime.utcnow().isoformat())
            sql = f"""INSERT INTO merchant (id, name, phone, wechat_openid, shop_name, created_at, updated_at) 
VALUES ({m['id']}, '{m.get('name', '')}', '{m.get('phone', '')}', '{m.get('wechat_openid', '')}', '{m.get('shop_name', '')}', '{created_at}', '{updated_at}')
ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), shop_name=VALUES(shop_name);"""
            sql_statements.append(sql)
    
    # 品类数据
    if data['categories']:
        for c in data['categories']:
            created_at = c.get('created_at', datetime.utcnow().isoformat())
            updated_at = c.get('updated_at', datetime.utcnow().isoformat())
            sql = f"""INSERT INTO category (id, merchant_id, name, icon, `order`, created_at, updated_at)
VALUES ({c['id']}, {c['merchant_id']}, '{c['name']}', '{c.get('icon', '')}', {c.get('order', 0)}, '{created_at}', '{updated_at}')
ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon);"""
            sql_statements.append(sql)
    
    # 商品数据
    if data['products']:
        for p in data['products']:
            # 处理特殊字符，防止SQL注入
            name = p['name'].replace("'", "''") if p.get('name') else ''
            description = p.get('description', '').replace("'", "''") if p.get('description') else ''
            image = p.get('image', '').replace("'", "''") if p.get('image') else ''
            category = p.get('category', '').replace("'", "''") if p.get('category') else ''
            category_name = p.get('category_name', '').replace("'", "''") if p.get('category_name') else ''
            unit = p.get('unit', '').replace("'", "''") if p.get('unit') else ''
            tag = p.get('tag', '').replace("'", "''") if p.get('tag') else ''
            tag_type = p.get('tag_type', '').replace("'", "''") if p.get('tag_type') else ''
            badges = p.get('badges', '').replace("'", "''") if p.get('badges') else ''
            
            created_at = p.get('created_at', datetime.utcnow().isoformat())
            updated_at = p.get('updated_at', datetime.utcnow().isoformat())
            
            sql = f"""INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES ({p['id']}, {p['merchant_id']}, '{name}', '{description}', {p['price']}, {p.get('original_price', 0)}, '{image}', '{category}', '{category_name}', {p['stock']}, {p['sales']}, '{unit}', '{tag}', '{tag_type}', '{badges}', {p.get('is_active', 1)}, '{created_at}', '{updated_at}')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);"""
            sql_statements.append(sql)
    
    # 订单数据
    if data['orders']:
        for o in data['orders']:
            customer_name = o['customer_name'].replace("'", "''") if o.get('customer_name') else ''
            customer_phone = o.get('customer_phone', '').replace("'", "''") if o.get('customer_phone') else ''
            pickup_time = o.get('pickup_time', datetime.utcnow().isoformat())
            created_at = o.get('created_at', datetime.utcnow().isoformat())
            updated_at = o.get('updated_at', datetime.utcnow().isoformat())
            
            sql = f"""INSERT INTO `order` (id, merchant_id, customer_name, customer_phone, pickup_time, total_amount, status, created_at, updated_at)
VALUES ({o['id']}, {o['merchant_id']}, '{customer_name}', '{customer_phone}', '{pickup_time}', {o['total_amount']}, '{o['status']}', '{created_at}', '{updated_at}')
ON DUPLICATE KEY UPDATE status=VALUES(status);"""
            sql_statements.append(sql)
    
    # 订单明细数据
    if data['order_items']:
        for item in data['order_items']:
            sql = f"""INSERT INTO orderitem (id, order_id, product_id, quantity, unit_price, subtotal)
VALUES ({item['id']}, {item['order_id']}, {item['product_id']}, {item['quantity']}, {item['unit_price']}, {item['subtotal']})
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);"""
            sql_statements.append(sql)
    
    return sql_statements

def create_mysql_tables_sql():
    """生成MySQL建表语句"""
    return """
-- 商家表
CREATE TABLE IF NOT EXISTS merchant (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    wechat_openid VARCHAR(100) DEFAULT '' UNIQUE,
    shop_name VARCHAR(100) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 品类表
CREATE TABLE IF NOT EXISTS category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id INT DEFAULT 1,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(100) DEFAULT '',
    `order` INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商品表
CREATE TABLE IF NOT EXISTS product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id INT DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) DEFAULT '',
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) DEFAULT 0,
    image VARCHAR(500) DEFAULT '',
    category VARCHAR(50) DEFAULT '',
    category_name VARCHAR(50) DEFAULT '',
    stock INT DEFAULT 0,
    sales INT DEFAULT 0,
    unit VARCHAR(50) DEFAULT '',
    tag VARCHAR(50) DEFAULT '',
    tag_type VARCHAR(20) DEFAULT '',
    badges TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_name (name),
    FOREIGN KEY (merchant_id) REFERENCES merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 订单表
CREATE TABLE IF NOT EXISTS `order` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id INT DEFAULT 1,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    pickup_time DATETIME NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_merchant_id (merchant_id),
    FOREIGN KEY (merchant_id) REFERENCES merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 订单明细表
CREATE TABLE IF NOT EXISTS orderitem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES `order`(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

def main():
    print("=" * 50)
    print("SQLite to MySQL 数据迁移")
    print("=" * 50)
    
    # 检查SQLite数据库是否存在
    if not os.path.exists(SQLITE_DB):
        print(f"错误: SQLite数据库 {SQLITE_DB} 不存在")
        sys.exit(1)
    
    # 读取SQLite数据
    print("\n步骤1: 从SQLite读取数据...")
    data = get_sqlite_data()
    
    # 生成建表SQL
    print("\n步骤2: 生成MySQL建表语句...")
    tables_sql = create_mysql_tables_sql()
    
    # 生成INSERT语句
    print("\n步骤3: 生成数据INSERT语句...")
    insert_sqls = generate_mysql_insert_sql(data)
    
    # 保存到文件
    output_file = "mysql_migration.sql"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- MySQL 建表语句\n")
        f.write(tables_sql)
        f.write("\n\n-- 数据迁移语句\n")
        for sql in insert_sqls:
            f.write(sql + "\n")
    
    print(f"\n迁移SQL已保存到: {output_file}")
    print(f"共生成 {len(insert_sqls)} 条INSERT语句")
    
    print("\n" + "=" * 50)
    print("下一步：")
    print("1. 将 mysql_migration.sql 上传到服务器")
    print("2. 执行以下命令导入数据:")
    print(f"   sudo docker exec -i mysql-server mysql -u{MYSQL_USER} -p{MYSQL_PASSWORD} {MYSQL_DATABASE} < mysql_migration.sql")
    print("=" * 50)

if __name__ == "__main__":
    main()