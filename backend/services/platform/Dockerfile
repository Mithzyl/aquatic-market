# Platform Admin Service Dockerfile
# 平台后台管理服务 Docker 构建文件

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

# 复制依赖文件（使用平台端专用依赖，含 bcrypt/passlib）
COPY services/platform/requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码和共享模块
# 构建上下文: ./backend (docker-compose.yml 定义)
# 仅复制平台端需要的文件，避免启动错误的 main.py
COPY shared ./shared
COPY schemas ./schemas
COPY services/__init__.py ./services/__init__.py
COPY services/platform/__init__.py ./services/platform/__init__.py
COPY services/platform/main.py ./services/platform/main.py
COPY services/platform/routes ./services/platform/routes

# 暴露端口
EXPOSE 8003

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# 启动命令（使用完整模块路径，确保启动平台端 main.py）
CMD ["uvicorn", "services.platform.main:app", "--host", "0.0.0.0", "--port", "8003"]