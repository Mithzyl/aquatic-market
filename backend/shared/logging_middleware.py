"""
请求日志中间件 - 记录每个 HTTP 请求的 method、path、状态码和耗时
"""
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("request_logger")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """记录请求信息的中间件"""

    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        elapsed = (time.time() - start) * 1000
        logger.info(
            "%s %s | %d | %.1fms | %s",
            request.method,
            request.url.path,
            response.status_code,
            elapsed,
            request.client.host if request.client else "-",
        )
        return response
