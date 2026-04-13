# Customer Service Dockerfile
# 用户端服务 Docker 构建文件
#
# 构建上下文: ./backend (由 docker-compose.yml 定义)
# Dockerfile 路径: services/customer/Dockerfile

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

# 复制依赖文件（从构建上下文 backend/services/customer）
COPY services/customer/requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制共享模块（从构建上下文 backend/shared）
COPY shared ./shared

# 复制 schemas 模块（从构建上下文 backend/schemas）
COPY schemas ./schemas

# 复制 config 模块（从构建上下文 backend/config）
COPY config ./config

# 复制服务层代码（从构建上下文 backend/services）
COPY services/product_service.py ./services/product_service.py
COPY services/order_service.py ./services/order_service.py
COPY services/__init__.py ./services/__init__.py

# 复制用户端服务代码（从构建上下文 backend/services/customer）
COPY services/customer/main.py ./main.py
COPY services/customer/routes ./routes

# 暴露端口
EXPOSE 8002

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]