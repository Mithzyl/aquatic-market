"""
视觉验证脚本：平台商家管理页面
截图场景：
1. 商家列表页 (desktop + mobile)
2. 新增商家弹窗 (desktop)
3. 详情→编辑模式 (desktop)
4. 删除确认对话框 (desktop)
"""
import os
from playwright.sync_api import sync_playwright

EVIDENCE_DIR = os.path.join(os.path.dirname(__file__), 'evidence')
BASE_URL = 'http://localhost:5173'
TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6MSwiZXhwIjoxNzc4Mzk3MjY0LCJpYXQiOjE3Nzc3OTI0NjQsInRva2VuX3R5cGUiOiJhZG1pbiIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJwbGF0Zm9ybTpyZWFkIiwicGxhdGZvcm06d3JpdGUiLCJtZXJjaGFudDpyZWFkIiwibWVyY2hhbnQ6Y3JlYXRlIiwibWVyY2hhbnQ6dXBkYXRlIiwibWVyY2hhbnQ6ZGVsZXRlIiwiYWRtaW46cmVhZCIsImFkbWluOmNyZWF0ZSIsImFkbWluOnVwZGF0ZSIsImFkbWluOmRlbGV0ZSIsInJlcG9ydDpyZWFkIiwicmVwb3J0OmV4cG9ydCJdfQ.x7X_40GcHoLqI8DLxD6jqdZhlR500hkvH5bT6gImHcc'

ADMIN_INFO = {
    "id": 1,
    "username": "admin",
    "role": "super_admin",
    "permissions": [
        "platform:read", "platform:write",
        "merchant:read", "merchant:create", "merchant:update", "merchant:delete",
        "admin:read", "admin:create", "admin:update", "admin:delete",
        "report:read", "report:export"
    ]
}

import json

def setup_auth(page):
    """在页面加载前设置 localStorage 完成认证"""
    page.goto(BASE_URL + '/platform/login')
    page.wait_for_load_state('networkidle')
    # 注入认证信息
    page.evaluate(
        """([token, admin]) => {
            localStorage.setItem('platform_token', token);
            localStorage.setItem('platform_admin', JSON.stringify(admin));
        }""",
        [TOKEN, ADMIN_INFO]
    )

def take_screenshot(page, name, viewport_label):
    """截图并保存"""
    path = os.path.join(EVIDENCE_DIR, f'{name}_{viewport_label}.png')
    page.screenshot(path=path, full_page=True)
    print(f'  [OK] {path}')
    return path

def run():
    os.makedirs(EVIDENCE_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # =============================================
        # 场景 1: 商家列表页 (Desktop + Mobile)
        # =============================================
        print('\n=== 场景 1: 商家列表页 ===')
        
        # Desktop (1280x900)
        context_d = browser.new_context(viewport={'width': 1280, 'height': 900})
        page_d = context_d.new_page()
        setup_auth(page_d)
        page_d.goto(BASE_URL + '/platform/merchants')
        page_d.wait_for_load_state('networkidle')
        page_d.wait_for_timeout(1500)  # 等待数据加载
        take_screenshot(page_d, 'merchants_list', 'desktop-1280')
        context_d.close()
        
        # Mobile (375x812)
        context_m = browser.new_context(viewport={'width': 375, 'height': 812})
        page_m = context_m.new_page()
        setup_auth(page_m)
        page_m.goto(BASE_URL + '/platform/merchants')
        page_m.wait_for_load_state('networkidle')
        page_m.wait_for_timeout(1500)
        take_screenshot(page_m, 'merchants_list', 'mobile-375')
        context_m.close()
        
        # =============================================
        # 场景 2: 新增商家弹窗 (Desktop)
        # =============================================
        print('\n=== 场景 2: 新增商家弹窗 ===')
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()
        setup_auth(page)
        page.goto(BASE_URL + '/platform/merchants')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1500)
        
        # 点击「+ 新增商家」按钮
        add_btn = page.locator('button:has-text("新增商家")')
        if add_btn.count() > 0:
            add_btn.first.click()
            page.wait_for_timeout(800)
        else:
            print('  [WARN] 未找到「新增商家」按钮')
        take_screenshot(page, 'merchants_create_modal', 'desktop-1280')
        context.close()
        
        # =============================================
        # 场景 3: 详情弹窗 → 编辑模式 (Desktop)
        # =============================================
        print('\n=== 场景 3: 编辑模式 ===')
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()
        setup_auth(page)
        page.goto(BASE_URL + '/platform/merchants')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1500)
        
        # 点击第一个商家的「详情」按钮
        detail_btn = page.locator('button:has-text("详情")').first
        if detail_btn.count() > 0:
            detail_btn.click()
            page.wait_for_timeout(1000)
            # 截图详情弹窗
            take_screenshot(page, 'merchants_detail_modal', 'desktop-1280')
            
            # 点击详情弹窗内的「编辑」按钮
            edit_btn = page.locator('button:has-text("编辑")').last  # 详情弹窗内的编辑按钮
            if edit_btn.count() > 0:
                edit_btn.click()
                page.wait_for_timeout(800)
            else:
                # 尝试其他方式匹配
                page.locator('.fixed button:has-text("编辑")').first.click()
                page.wait_for_timeout(800)
            take_screenshot(page, 'merchants_edit_mode', 'desktop-1280')
        else:
            print('  [WARN] 未找到「详情」按钮')
        context.close()
        
        # =============================================
        # 场景 4: 删除确认对话框 (Desktop)
        # =============================================
        print('\n=== 场景 4: 删除确认对话框 ===')
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()
        setup_auth(page)
        page.goto(BASE_URL + '/platform/merchants')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1500)
        
        # 在列表页直接点击「删除」按钮
        delete_btn = page.locator('button:has-text("删除")').first
        if delete_btn.count() > 0:
            delete_btn.click()
            page.wait_for_timeout(800)
        else:
            print('  [WARN] 未找到「删除」按钮')
        take_screenshot(page, 'merchants_delete_dialog', 'desktop-1280')
        context.close()
        
        browser.close()
    
    print('\n=== 截图完成 ===')

if __name__ == '__main__':
    run()
