# Merchant Service Dockerfile
# 商家端服务 Docker 构建文件
#
# 构建上下文: ./backend (由 docker-compose.yml 定义)
# Dockerfile 路径: services/merchant/Dockerfile

FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件（从构建上下文 backend/services/merchant 目录）
COPY services/merchant/requirements.txt ./

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制共享模块（从构建上下文 backend/shared 目录）
COPY shared ./shared

# 复制 schemas 模块（从构建上下文 backend/schemas 目录）
COPY schemas ./schemas

# 复制 services 模块中的 merchant_service.py（从构建上下文 backend/services 目录）
COPY services/merchant_service.py ./services/

# 复制全局路由到商家路由目录（从构建上下文 backend/routes）
COPY routes/carousel_routes.py ./merchant_service/routes/

# 复制商家端服务代码（从构建上下文 backend/services/merchant 目录）
COPY services/merchant ./merchant_service

# 暴露端口
EXPOSE 8001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# 设置工作目录到商家服务目录
WORKDIR /app/merchant_service

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]