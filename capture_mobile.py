from playwright.sync_api import sync_playwright

def capture_mobile_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 移动端视口 (iPhone 12 Pro 尺寸)
        mobile_context = browser.new_context(viewport={'width': 390, 'height': 844})
        mobile_page = mobile_context.new_page()
        
        pages_to_capture = [
            ('home_mobile', 'http://localhost:5173'),
            ('product_detail_mobile', 'http://localhost:5173/product/1'),
            ('booking_mobile', 'http://localhost:5173/booking'),
            ('price_query_mobile', 'http://localhost:5173/price-query'),
            ('order_management_mobile', 'http://localhost:5173/order-management')
        ]
        
        for name, url in pages_to_capture:
            try:
                print(f"Capturing {name}...")
                mobile_page.goto(url, timeout=10000)
                mobile_page.wait_for_load_state('networkidle', timeout=10000)
                mobile_page.wait_for_timeout(2000)
                
                screenshot_path = f'/tmp/{name}.png'
                mobile_page.screenshot(path=screenshot_path, full_page=True)
                print(f"  ✓ Saved to {screenshot_path}")
                
            except Exception as e:
                print(f"  ✗ Error capturing {name}: {str(e)}")
        
        mobile_context.close()
        browser.close()
        print("\nMobile screenshot capture complete!")

if __name__ == "__main__":
    capture_mobile_screenshots()
