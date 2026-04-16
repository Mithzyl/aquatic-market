-- MySQL 建表语句

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


-- 数据迁移语句
INSERT INTO merchant (id, name, phone, wechat_openid, shop_name, created_at, updated_at) 
VALUES (1, '海鲜市场', '13800138000', 'default_openid_001', '鲜活海鲜市场', '2026-04-08 13:53:29.474690', '2026-04-08 13:53:29.474701')
ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), shop_name=VALUES(shop_name);
INSERT INTO category (id, merchant_id, name, icon, `order`, created_at, updated_at)
VALUES (1, 1, '虾类', '', 1, '2026-04-08 13:53:29.482447', '2026-04-08 13:53:29.482459')
ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon);
INSERT INTO category (id, merchant_id, name, icon, `order`, created_at, updated_at)
VALUES (2, 1, '蟹类', '', 2, '2026-04-08 13:53:29.484272', '2026-04-08 13:53:29.484281')
ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon);
INSERT INTO category (id, merchant_id, name, icon, `order`, created_at, updated_at)
VALUES (3, 1, '鱼类', '', 3, '2026-04-08 13:53:29.484882', '2026-04-08 13:53:29.484890')
ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon);
INSERT INTO category (id, merchant_id, name, icon, `order`, created_at, updated_at)
VALUES (4, 1, '贝类', '', 4, '2026-04-08 13:53:29.485706', '2026-04-08 13:53:29.485715')
ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon);
INSERT INTO category (id, merchant_id, name, icon, `order`, created_at, updated_at)
VALUES (5, 1, '龙虾', '', 5, '2026-04-08 13:53:29.486492', '2026-04-08 13:53:29.486500')
ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon);
INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES (1, 1, '基围虾', '鲜活基围虾，适合白灼与椒盐，门店现打氧保鲜。', 49.0, 58.0, 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=800&fit=crop', 'shrimp', '虾类', 117, 618, '500g/份', '招牌', 'hot', '["活鲜现挑", "白灼推荐"]', 1, '2026-04-08 13:53:29.489783', '2026-04-08 13:53:29.489793')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);
INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES (2, 1, '黑虎虾', '肉质紧实，适合香煎与黄油焗烤，大规格更适合多人餐。', 79.0, 92.0, 'https://images.unsplash.com/photo-1625943555419-56a2cb596640?w=800&h=800&fit=crop', 'shrimp', '虾类', 88, 302, '6只/份', '热卖', 'hot', '["大规格", "香煎推荐"]', 1, '2026-04-08 13:53:29.493278', '2026-04-08 13:53:29.493290')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);
INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES (3, 1, '梭子蟹', '膏黄饱满，适合清蒸和葱姜炒，下午档出货最快。', 89.0, 108.0, 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&h=800&fit=crop', 'crab', '蟹类', 76, 248, '2只/份', '时令', 'new', '["今日到港", "清蒸推荐"]', 1, '2026-04-08 13:53:29.494148', '2026-04-08 13:53:29.494157')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);
INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES (4, 1, '帝王蟹腿', '精选帝王蟹腿，解冻即烹，适合火锅和黄油焗。', 168.0, 198.0, 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&h=800&fit=crop', 'crab', '蟹类', 45, 129, '700g/盒', '宴请', 'hot', '["厚切蟹腿", "火锅推荐"]', 1, '2026-04-08 13:53:29.494748', '2026-04-08 13:53:29.494755')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);
INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES (5, 1, '挪威三文鱼', '油脂均衡，适合刺身与香煎，门店可代切薄片。', 98.0, 118.0, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&h=800&fit=crop', 'fish', '鱼类', 90, 540, '300g/盒', '刺身', 'new', '["现切装盒", "刺身推荐"]', 1, '2026-04-08 13:53:29.495278', '2026-04-08 13:53:29.495285')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);
INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES (6, 1, '金鲳鱼', '净膛处理，适合香煎与清蒸，家庭晚餐常备款。', 36.0, 42.0, 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop', 'fish', '鱼类', 150, 410, '1条/份', '家常', 'hot', '["已净膛", "香煎推荐"]', 1, '2026-04-08 13:53:29.495784', '2026-04-08 13:53:29.495791')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);
INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES (7, 1, '乳山生蚝', '个头饱满，适合蒜蓉烤和炭烤，门店可代开壳。', 55.0, 68.0, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=800&fit=crop', 'shell', '贝类', 64, 286, '12只/份', '肥美', 'hot', '["代开壳", "烧烤推荐"]', 1, '2026-04-08 13:53:29.496493', '2026-04-08 13:53:29.496504')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);
INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES (8, 1, '北极贝', '口感脆甜，适合凉拌和寿司拼盘，冷藏出品更佳。', 45.0, 52.0, 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=800&h=800&fit=crop', 'shell', '贝类', 70, 214, '200g/盒', '冷盘', 'new', '["即食冷盘", "寿司搭配"]', 1, '2026-04-08 13:53:29.497281', '2026-04-08 13:53:29.497290')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);
INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES (9, 1, '波士顿龙虾', '鲜活波龙，适合芝士焗和蒜蓉蒸，节庆聚餐必点。', 188.0, 218.0, 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&h=800&fit=crop', 'lobster', '龙虾', 38, 168, '1只/份', '聚餐', 'hot', '["鲜活到店", "芝士焗推荐"]', 1, '2026-04-08 13:53:29.497858', '2026-04-08 13:53:29.497865')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);
INSERT INTO product (id, merchant_id, name, description, price, original_price, image, category, category_name, stock, sales, unit, tag, tag_type, badges, is_active, created_at, updated_at)
VALUES (10, 1, '小青龙', '肉质紧实，适合避风塘和椒盐做法，适合双人餐。', 139.0, 158.0, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=800&fit=crop', 'lobster', '龙虾', 52, 198, '1只/份', '限时', 'new', '["双人餐", "椒盐推荐"]', 1, '2026-04-08 13:53:29.498641', '2026-04-08 13:53:29.498651')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock);
INSERT INTO `order` (id, merchant_id, customer_name, customer_phone, pickup_time, total_amount, status, created_at, updated_at)
VALUES (1, 1, 'zyl', '18577203324', '2026-04-09 16:55:00.000000', 49.0, 'pending', '2026-04-09 03:52:03.288282', '2026-04-09 03:52:03.288282')
ON DUPLICATE KEY UPDATE status=VALUES(status);
INSERT INTO `order` (id, merchant_id, customer_name, customer_phone, pickup_time, total_amount, status, created_at, updated_at)
VALUES (2, 1, '2', '22222222', '2026-04-09 12:59:00.000000', 49.0, 'pending', '2026-04-09 04:59:55.516893', '2026-04-09 04:59:55.516893')
ON DUPLICATE KEY UPDATE status=VALUES(status);
INSERT INTO `order` (id, merchant_id, customer_name, customer_phone, pickup_time, total_amount, status, created_at, updated_at)
VALUES (3, 1, '2', '3123', '2026-04-09 15:49:00.000000', 49.0, 'pending', '2026-04-09 07:43:25.091883', '2026-04-09 07:43:25.091883')
ON DUPLICATE KEY UPDATE status=VALUES(status);
INSERT INTO orderitem (id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (1, 1, 1, 1, 49.0, 49.0)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);
INSERT INTO orderitem (id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (2, 2, 1, 1, 49.0, 49.0)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);
INSERT INTO orderitem (id, order_id, product_id, quantity, unit_price, subtotal)
VALUES (3, 3, 1, 1, 49.0, 49.0)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);
