"""
Visual QA - 三端页面截图脚本
TASK-2026-04-08-003
"""
from playwright.sync_api import sync_playwright
import os

EVIDENCE_DIR = "/Users/mith/Desktop/project/sales/tests/visual_qa/evidence"
BASE_URL = "http://localhost:5173"

VIEWPORTS = {
    "desktop-1280": {"width": 1280, "height": 900},
    "mobile-375": {"width": 375, "height": 812},
}

# 所有待截图页面
PAGES = [
    # C端
    ("home", "/", False),
    ("price-query", "/price-query", False),
    ("booking", "/booking", False),  # 重点：路由跳转验证
    ("order-management", "/order-management", True),
    ("my", "/my", True),
    ("login", "/login", False),
    # 管理端
    ("admin-login", "/admin", False),
    ("admin-products", "/admin/products", True),
    ("admin-categories", "/admin/categories", True),
    ("admin-revenue", "/admin/revenue", True),
    ("admin-settings", "/admin/settings", True),
    # 平台后台
    ("platform-login", "/platform/login", False),
    ("platform-dashboard", "/platform/dashboard", True),
    ("platform-merchants", "/platform/merchants", True),
]


def take_screenshots():
    os.makedirs(EVIDENCE_DIR, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for page_name, path, requires_auth in PAGES:
            for vp_name, vp_size in VIEWPORTS.items():
                context = browser.new_context(
                    viewport=vp_size,
                    device_scale_factor=1,
                )
                page = context.new_page()

                url = f"{BASE_URL}{path}"
                print(f"[SCREENSHOT] {page_name} | {vp_name} | {url}")

                try:
                    page.goto(url, wait_until="networkidle", timeout=15000)
                    page.wait_for_timeout(1500)  # 等待动画/重定向完成

                    # 检查是否发生了路由重定向
                    current_url = page.url
                    redirected = current_url != url
                    if redirected:
                        print(f"  -> 重定向到: {current_url}")

                    filename = f"{page_name}_{vp_name}.png"
                    filepath = os.path.join(EVIDENCE_DIR, filename)
                    page.screenshot(path=filepath, full_page=True)
                    print(f"  -> 截图: {filename}")
                except Exception as e:
                    print(f"  -> ERROR: {e}")
                    # 即使出错也尝试截图
                    try:
                        filename = f"{page_name}_{vp_name}_error.png"
                        filepath = os.path.join(EVIDENCE_DIR, filename)
                        page.screenshot(path=filepath, full_page=True)
                        print(f"  -> 错误截图: {filename}")
                    except:
                        pass

                context.close()

        browser.close()

    print("\n[DONE] 所有截图完成")


if __name__ == "__main__":
    take_screenshots()
