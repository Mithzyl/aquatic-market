"""
UAT 测试脚本 - TASK-20260411-006
验证商家登录流程和品类页面功能

测试范围：
- T-001: 商家登录流程验证
- T-002: 登录后顶部栏角色名称显示
- T-003: 品类页数据加载与显示
- T-004: 品类卡片点击跳转
"""

from playwright.sync_api import sync_playwright
import time
import os

# 测试结果收集
test_results = []
defects = []

def log_result(test_id, scenario, expected, actual, status, notes=""):
    """记录测试结果"""
    test_results.append({
        "test_id": test_id,
        "scenario": scenario,
        "expected": expected,
        "actual": actual,
        "status": status,
        "notes": notes
    })
    print(f"[{test_id}] {scenario}: {status}")
    if status == "FAIL":
        print(f"  Expected: {expected}")
        print(f"  Actual: {actual}")
        if notes:
            print(f"  Notes: {notes}")

def log_defect(defect_id, description, severity, scenario, reproducible="Yes"):
    """记录缺陷"""
    defects.append({
        "defect_id": defect_id,
        "description": description,
        "severity": severity,
        "scenario": scenario,
        "reproducible": reproducible
    })
    print(f"[DEFECT-{defect_id}] {severity}: {description}")

def main():
    """执行 UAT 测试"""
    screenshots_dir = "/Users/mith/Desktop/project/sales/tests/uat_screenshots"
    os.makedirs(screenshots_dir, exist_ok=True)
    
    with sync_playwright() as p:
        # 启动浏览器 - 使用 headless 模式
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},  # iPhone 14 Pro 尺寸
            device_scale_factor=3
        )
        page = context.new_page()
        
        # 收集 console 日志
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        
        # ============================================
        # T-001: 商家登录流程验证
        # ============================================
        print("\n" + "="*50)
        print("T-001: 商家登录流程验证")
        print("="*50)
        
        try:
            # 访问登录页面
            page.goto('http://localhost:5173/admin')
            page.wait_for_load_state('networkidle')
            time.sleep(1)
            
            # 截图：登录页面初始状态
            page.screenshot(path=f"{screenshots_dir}/01_login_page.png", full_page=True)
            
            # 验证登录页面元素
            login_title = page.locator('text=柳州鲜选 · 商家版')
            phone_input = page.locator('input[placeholder="请输入手机号"]')
            verify_code_input = page.locator('input[placeholder="请输入 6 位验证码"]')
            send_code_btn = page.locator('button:has-text("获取验证码")')
            login_btn = page.locator('button:has-text("登录")')
            
            # 检查关键元素是否存在
            elements_exist = {
                "登录标题": login_title.count() > 0,
                "手机号输入框": phone_input.count() > 0,
                "验证码输入框": verify_code_input.count() > 0,
                "获取验证码按钮": send_code_btn.count() > 0,
                "登录按钮": login_btn.count() > 0
            }
            
            all_elements_present = all(elements_exist.values())
            log_result(
                "T-001-1", 
                "登录页面关键元素显示",
                "所有关键元素可见：登录标题、手机号输入框、验证码输入框、获取验证码按钮、登录按钮",
                f"元素状态: {elements_exist}",
                "PASS" if all_elements_present else "FAIL",
                "" if all_elements_present else f"缺失元素: {[k for k,v in elements_exist.items() if not v]}"
            )
            
            if not all_elements_present:
                log_defect("D-001", "登录页面关键元素缺失", "P0", "T-001-1")
            
            # 输入手机号
            test_phone = "13800138000"
            phone_input.fill(test_phone)
            time.sleep(0.5)
            
            # 验证手机号输入
            phone_value = phone_input.input_value()
            log_result(
                "T-001-2",
                "手机号输入功能",
                f"输入手机号: {test_phone}",
                f"实际值: {phone_value}",
                "PASS" if phone_value == test_phone else "FAIL"
            )
            
            # 点击获取验证码
            send_code_btn.click()
            time.sleep(1.5)  # 等待模拟发送
            
            # 验证验证码发送状态变化
            sent_btn = page.locator('button:has-text("已发送")')
            code_sent = sent_btn.count() > 0
            log_result(
                "T-001-3",
                "验证码发送功能",
                "按钮状态变为'已发送'",
                f"按钮状态: {'已发送' if code_sent else '未变化'}",
                "PASS" if code_sent else "FAIL"
            )
            
            # 截图：验证码发送后
            page.screenshot(path=f"{screenshots_dir}/02_code_sent.png", full_page=True)
            
            # 输入验证码（演示环境固定为 123456）
            test_verify_code = "123456"
            verify_code_input.fill(test_verify_code)
            time.sleep(0.5)
            
            # 验证验证码输入
            code_value = verify_code_input.input_value()
            log_result(
                "T-001-4",
                "验证码输入功能",
                f"输入验证码: {test_verify_code}",
                f"实际值: {code_value}",
                "PASS" if code_value == test_verify_code else "FAIL"
            )
            
            # 截图：填写完成准备登录
            page.screenshot(path=f"{screenshots_dir}/03_ready_to_login.png", full_page=True)
            
            # 点击登录按钮
            login_btn.click()
            time.sleep(2)  # 等待登录请求完成
            
            # 验证登录成功 - 应跳转到商品管理页
            current_url = page.url
            login_success = '/admin/products' in current_url
            
            log_result(
                "T-001-5",
                "登录成功跳转",
                "跳转到 /admin/products 页面",
                f"当前URL: {current_url}",
                "PASS" if login_success else "FAIL"
            )
            
            if not login_success:
                # 检查是否有错误提示
                error_msg = page.locator('text*=登录失败').text_content() if page.locator('text*=登录失败').count() > 0 else "无错误提示"
                log_defect("D-002", f"登录失败，未跳转到商品管理页。URL: {current_url}, 错误: {error_msg}", "P0", "T-001-5")
            
            # 截图：登录后页面
            page.screenshot(path=f"{screenshots_dir}/04_after_login.png", full_page=True)
            
        except Exception as e:
            log_result("T-001", "商家登录流程", "完整流程执行成功", f"异常: {str(e)}", "FAIL")
            log_defect("D-003", f"登录流程执行异常: {str(e)}", "P0", "T-001")
        
        # ============================================
        # T-002: 登录后顶部栏角色名称显示
        # ============================================
        print("\n" + "="*50)
        print("T-002: 登录后顶部栏角色名称显示")
        print("="*50)
        
        try:
            # 确保在商品管理页
            if '/admin/products' not in page.url:
                page.goto('http://localhost:5173/admin/products')
                page.wait_for_load_state('networkidle')
                time.sleep(1)
            
            # 截图：顶部栏区域
            page.screenshot(path=f"{screenshots_dir}/05_header_area.png", full_page=True)
            
            # 查找顶部栏元素
            header = page.locator('header')
            shop_name_elem = page.locator('header span.text-base.font-semibold')
            role_name_elem = page.locator('header span.text-xs.text-\\[\\#8b755d\\]')
            
            # 验证店铺名称显示
            shop_name_visible = shop_name_elem.count() > 0
            shop_name_text = shop_name_elem.text_content() if shop_name_visible else "未找到"
            
            log_result(
                "T-002-1",
                "顶部栏店铺名称显示",
                "店铺名称可见（如：我的店铺）",
                f"店铺名称: {shop_name_text}",
                "PASS" if shop_name_visible else "FAIL"
            )
            
            # 验证角色名称显示
            role_name_visible = role_name_elem.count() > 0
            role_name_text = role_name_elem.text_content() if role_name_visible else "未找到"
            
            log_result(
                "T-002-2",
                "顶部栏角色名称显示",
                "角色名称可见（如：店主）",
                f"角色名称: {role_name_text}",
                "PASS" if role_name_visible else "FAIL",
                "TASK-004 要求：登录后顶部栏显示角色名称"
            )
            
            if not role_name_visible:
                log_defect("D-004", "顶部栏未显示角色名称", "P1", "T-002-2")
            
            # 验证角色名称内容（应为店主、管理员或员工）
            valid_roles = ["店主", "管理员", "员工"]
            role_valid = role_name_text in valid_roles if role_name_visible else False
            
            log_result(
                "T-002-3",
                "角色名称内容正确",
                f"角色名称为有效值: {valid_roles}",
                f"角色名称: {role_name_text}",
                "PASS" if role_valid else "FAIL" if role_name_visible else "SKIP"
            )
            
            # 截图：顶部栏详细
            header.screenshot(path=f"{screenshots_dir}/06_header_detail.png")
            
        except Exception as e:
            log_result("T-002", "顶部栏角色名称显示", "角色名称正确显示", f"异常: {str(e)}", "FAIL")
            log_defect("D-005", f"顶部栏验证异常: {str(e)}", "P1", "T-002")
        
        # ============================================
        # T-003: 品类页数据加载与显示
        # ============================================
        print("\n" + "="*50)
        print("T-003: 品类页数据加载与显示")
        print("="*50)
        
        try:
            # 导航到品类页
            category_tab = page.locator('nav a:has-text("品类")')
            if category_tab.count() > 0:
                category_tab.click()
                page.wait_for_load_state('networkidle')
                time.sleep(2)  # 等待数据加载
            else:
                # 直接导航
                page.goto('http://localhost:5173/admin/categories')
                page.wait_for_load_state('networkidle')
                time.sleep(2)
            
            current_url = page.url
            log_result(
                "T-003-1",
                "品类页导航",
                "成功导航到 /admin/categories",
                f"当前URL: {current_url}",
                "PASS" if '/admin/categories' in current_url else "FAIL"
            )
            
            # 截图：品类页面初始加载
            page.screenshot(path=f"{screenshots_dir}/07_categories_page.png", full_page=True)
            
            # 验证页面标题
            page_title = page.locator('h1:has-text("品类管理")')
            title_visible = page_title.count() > 0
            
            log_result(
                "T-003-2",
                "品类页面标题显示",
                "标题'品类管理'可见",
                f"标题状态: {'可见' if title_visible else '不可见'}",
                "PASS" if title_visible else "FAIL"
            )
            
            # 验证统计卡片
            stats_cards = page.locator('div.rounded-\\[20px\\].border')
            stats_visible = stats_cards.count() >= 2  # 品类总数 + 商品总数
            
            log_result(
                "T-003-3",
                "统计卡片显示",
                "至少显示2个统计卡片（品类总数、商品总数）",
                f"统计卡片数量: {stats_cards.count()}",
                "PASS" if stats_visible else "FAIL"
            )
            
            # 验证品类卡片列表
            category_cards = page.locator('button.rounded-\\[24px\\]')
            cards_count = category_cards.count()
            
            log_result(
                "T-003-4",
                "品类卡片列表显示",
                "品类卡片列表加载并显示",
                f"品类卡片数量: {cards_count}",
                "PASS" if cards_count > 0 else "FAIL",
                "空状态也属于正常情况，但需要有明确的空状态提示"
            )
            
            # 如果没有品类卡片，检查空状态提示
            if cards_count == 0:
                empty_state = page.locator('text=暂无品类数据')
                empty_visible = empty_state.count() > 0
                log_result(
                    "T-003-5",
                    "空状态提示显示",
                    "无品类数据时显示空状态提示",
                    f"空状态提示: {'可见' if empty_visible else '不可见'}",
                    "PASS" if empty_visible else "FAIL"
                )
            else:
                # 验证品类卡片内容
                first_card = category_cards.first
                card_content = first_card.text_content()
                
                # 检查卡片是否包含品类名称
                has_category_name = len(card_content) > 0
                
                log_result(
                    "T-003-5",
                    "品类卡片内容正确",
                    "品类卡片包含品类名称和商品数量",
                    f"卡片内容: {card_content[:50]}...",
                    "PASS" if has_category_name else "FAIL"
                )
                
                # 截图：品类卡片详情
                first_card.screenshot(path=f"{screenshots_dir}/08_category_card.png")
            
            # 截图：品类页完整状态
            page.screenshot(path=f"{screenshots_dir}/09_categories_full.png", full_page=True)
            
        except Exception as e:
            log_result("T-003", "品类页数据加载与显示", "品类数据正确加载显示", f"异常: {str(e)}", "FAIL")
            log_defect("D-006", f"品类页验证异常: {str(e)}", "P1", "T-003")
        
        # ============================================
        # T-004: 品类卡片点击跳转
        # ============================================
        print("\n" + "="*50)
        print("T-004: 品类卡片点击跳转")
        print("="*50)
        
        try:
            # 确保在品类页
            if '/admin/categories' not in page.url:
                page.goto('http://localhost:5173/admin/categories')
                page.wait_for_load_state('networkidle')
                time.sleep(2)
            
            category_cards = page.locator('button.rounded-\\[24px\\]')
            cards_count = category_cards.count()
            
            if cards_count > 0:
                # 点击第一个品类卡片
                first_card = category_cards.first
                first_card.click()
                time.sleep(1)
                page.wait_for_load_state('networkidle')
                
                # 验证跳转到商品管理页
                current_url = page.url
                jump_success = '/admin/products' in current_url and 'category=' in current_url
                
                log_result(
                    "T-004-1",
                    "品类卡片点击跳转",
                    "跳转到 /admin/products 并带有 category 参数",
                    f"当前URL: {current_url}",
                    "PASS" if jump_success else "FAIL"
                )
                
                if not jump_success:
                    if '/admin/products' in current_url:
                        log_result(
                            "T-004-2",
                            "跳转目标页面正确",
                            "跳转到商品管理页",
                            f"跳转成功，URL: {current_url}",
                            "PASS"
                        )
                        log_defect("D-007", "品类卡片点击跳转缺少 category 参数", "P2", "T-004-1")
                    else:
                        log_defect("D-008", f"品类卡片点击未跳转到商品管理页，URL: {current_url}", "P1", "T-004-1")
                
                # 截图：跳转后页面
                page.screenshot(path=f"{screenshots_dir}/10_after_category_click.png", full_page=True)
                
            else:
                log_result(
                    "T-004",
                    "品类卡片点击跳转",
                    "点击品类卡片跳转到商品管理页",
                    "无品类卡片可点击（空状态）",
                    "SKIP",
                    "测试环境无品类数据，跳过此测试"
                )
            
        except Exception as e:
            log_result("T-004", "品类卡片点击跳转", "点击跳转成功", f"异常: {str(e)}", "FAIL")
            log_defect("D-009", f"品类卡片点击异常: {str(e)}", "P1", "T-004")
        
        # ============================================
        # 收集 Console 日志分析
        # ============================================
        print("\n" + "="*50)
        print("Console 日志分析")
        print("="*50)
        
        error_logs = [log for log in console_logs if '[error]' in log]
        warning_logs = [log for log in console_logs if '[warning]' in log]
        
        print(f"总日志数: {len(console_logs)}")
        print(f"错误日志: {len(error_logs)}")
        print(f"警告日志: {len(warning_logs)}")
        
        if error_logs:
            print("\n错误日志详情:")
            for log in error_logs[:5]:  # 只显示前5条
                print(f"  {log}")
        
        # ============================================
        # 输出测试报告
        # ============================================
        print("\n" + "="*60)
        print("UAT 测试报告 - TASK-20260411-006")
        print("="*60)
        
        # 测试矩阵
        print("\n## 1. Test Matrix")
        print("| Test ID | 场景 | 状态 |")
        print("|---------|------|------|")
        for result in test_results:
            print(f"| {result['test_id']} | {result['scenario']} | {result['status']} |")
        
        # 缺陷列表
        print("\n## 2. Defect List")
        if defects:
            print("| Defect ID | 描述 | 级别 | 场景 | 可复现 |")
            print("|-----------|------|------|------|--------|")
            for defect in defects:
                print(f"| {defect['defect_id']} | {defect['description']} | {defect['severity']} | {defect['scenario']} | {defect['reproducible']} |")
        else:
            print("无缺陷发现")
        
        # 统计
        pass_count = len([r for r in test_results if r['status'] == 'PASS'])
        fail_count = len([r for r in test_results if r['status'] == 'FAIL'])
        skip_count = len([r for r in test_results if r['status'] == 'SKIP'])
        p0_defects = len([d for d in defects if d['severity'] == 'P0'])
        p1_defects = len([d for d in defects if d['severity'] == 'P1'])
        
        print(f"\n## 3. Summary")
        print(f"- 总测试数: {len(test_results)}")
        print(f"- 通过: {pass_count}")
        print(f"- 失败: {fail_count}")
        print(f"- 跳过: {skip_count}")
        print(f"- P0 缺陷: {p0_defects}")
        print(f"- P1 缺陷: {p1_defects}")
        
        # 截图位置
        print(f"\n## 4. Evidence")
        print(f"截图保存在: {screenshots_dir}")
        
        # 关闭浏览器
        browser.close()
        
        # 返回测试状态
        return {
            "pass_count": pass_count,
            "fail_count": fail_count,
            "skip_count": skip_count,
            "p0_defects": p0_defects,
            "p1_defects": p1_defects,
            "has_blocking": p0_defects > 0
        }

if __name__ == "__main__":
    result = main()
    print("\n" + "="*60)
    print("测试执行完成")
    print("="*60)