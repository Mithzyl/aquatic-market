from playwright.sync_api import sync_playwright
import time

def capture_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})
        
        pages_to_capture = [
            ('home', 'http://localhost:5173'),
            ('product_detail', 'http://localhost:5173/product/1'),
            ('booking', 'http://localhost:5173/booking'),
            ('price_query', 'http://localhost:5173/price-query'),
            ('order_management', 'http://localhost:5173/orders')
        ]
        
        for name, url in pages_to_capture:
            try:
                print(f"Capturing {name}...")
                page.goto(url, timeout=10000)
                page.wait_for_load_state('networkidle', timeout=10000)
                page.wait_for_timeout(2000)
                
                screenshot_path = f'/tmp/{name}_screenshot.png'
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"  ✓ Saved to {screenshot_path}")
                
                content = page.content()
                title = page.title()
                print(f"  Title: {title}")
                print(f"  Content length: {len(content)} chars")
                print()
                
            except Exception as e:
                print(f"  ✗ Error capturing {name}: {str(e)}")
                print()
        
        browser.close()
        print("Screenshot capture complete!")

if __name__ == "__main__":
    capture_screenshots()
