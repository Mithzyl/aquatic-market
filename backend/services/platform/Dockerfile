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
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码和共享模块
# 注意：docker-compose.yml 的 build context 设置为 ./backend
# 所以 shared 目录已经在构建上下文内
COPY . .
COPY shared ./shared

# 暴露端口
EXPOSE 8003

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# 启动命令
# 注意：COPY . . 将 backend/ 复制到 /app/，因此 platform 代码在 /app/services/platform/
CMD ["uvicorn", "services.platform.main:app", "--host", "0.0.0.0", "--port", "8003"]