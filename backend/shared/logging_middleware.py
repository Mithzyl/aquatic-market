"""
Request Logging Middleware — 请求日志中间件
记录每个 HTTP 请求的 method、path、status_code、耗时
"""
import time
import logging

logger = logging.getLogger("request_logger")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S"))
if not logger.handlers:
    logger.addHandler(handler)


async def request_logging_middleware(request, call_next):
    """ASGI 中间件：记录请求方法、路径、状态码和耗时"""
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    logger.info(
        f"{request.method:6s} {request.url.path:40s} → {response.status_code:3d}  {duration:7.1f}ms"
    )
    return response
