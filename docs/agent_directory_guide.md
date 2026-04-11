# Agent Directory Guide

本文件为多 agent 协作时的统一目录与操作指南。

使用规则:
1. 所有 agent 都默认知道本项目根目录为 `/Users/mith/Desktop/project/sales`。
2. 与目录、命令、可操作范围相关的信息不再重复写进各 agent prompt，统一以本文件为准。
3. agent 只可在自己职责范围内引用本文件，不得因此越权串台。

## 目录说明

### 根目录
- 路径: `/Users/mith/Desktop/project/sales`
- 用途: 项目工作区根目录，所有相对路径、命令、交付物都以此为起点。

### 前端目录
- 路径: `/Users/mith/Desktop/project/sales/frontend`
- 用途: React/Vite 前端代码、构建产物、前端依赖。
- 适用岗位: `FE`、`QA`、`DevOps`、`Visual QA`、`UAT`
- 常用操作:
  - 安装依赖: `npm install`
  - 本地开发: `npm run dev`
  - 构建检查: `npm run build`
  - 代码质量: `npm run lint`

### 后端目录
- 路径: `/Users/mith/Desktop/project/sales/backend`
- 用途: FastAPI/SQLModel 后端代码、后端依赖、测试。
- 适用岗位: `BE`、`QA`、`DevOps`、`UAT`
- 常用操作:
  - 启动服务: `./venv_new/bin/uvicorn main:app --reload`
  - 运行测试: `./venv_new/bin/pytest -q`

### 文档目录
- 路径: `/Users/mith/Desktop/project/sales/docs`
- 用途: 项目规则、agent prompt、目录说明、测试/设计文档。
- 适用岗位: 全部 agent
- 常用操作:
  - 读取多 agent prompt 包
  - 读取目录与命令说明
  - 追加新的协作文档

### 测试目录
- 路径: `/Users/mith/Desktop/project/sales/tests`
- 用途: 测试脚本、测试证据、测试报告。
- 适用岗位: `QA`、`DevOps`、`Visual QA`、`UAT`
- 子目录:
  - `tests/e2e/scripts/`: E2E 测试脚本
  - `tests/e2e/evidence/`: E2E 测试证据
  - `tests/visual_qa/scripts/`: Visual QA 测试脚本
  - `tests/visual_qa/evidence/`: Visual QA 测试证据
  - `tests/debug/`: 调试脚本
  - `tests/reports/`: 测试报告

### 归档目录
- 路径: `/Users/mith/Desktop/project/sales/archives`
- 用途: 原型、历史产物、压缩包归档。
- 适用岗位: `FE`、`Visual QA`、`UAT`
- 子目录:
  - `archives/prototypes/`: 设计原型图片（原 原型/ 目录）
  - `archives/dogfood-output/`: Dogfood 测试输出
  - `archives/packages/`: 压缩包文件

## 推荐命令矩阵

### FE
- 工作目录: `/Users/mith/Desktop/project/sales/frontend`
- 必跑命令:
  - `npm run build`
  - `npm run lint`

### BE
- 工作目录: `/Users/mith/Desktop/project/sales/backend`
- 必跑命令:
  - `./venv_new/bin/pytest -q`

### QA
- 工作目录:
  - `/Users/mith/Desktop/project/sales/frontend`
  - `/Users/mith/Desktop/project/sales/backend`
- 关注内容:
  - FE/BE 提供的测试命令是否可复现
  - 主链路是否具备回归条件

### DevOps
- 工作目录: 根目录、`frontend`、`backend`
- 关注内容:
  - 命令可复现
  - 质量门顺序
  - 依赖与环境说明

### Visual QA
- 工作目录:
  - 代码核对: `/Users/mith/Desktop/project/sales/frontend`
  - 页面预览: 浏览器访问 FE 提供的本地地址和路由
- 关注内容:
  - 真实浏览器截图
  - 桌面端/移动端视口
  - 页面状态与视觉回归

### UAT
- 工作目录: 根目录
- 关注内容:
  - 按真实业务流程访问前后端联调结果
  - 仅在总控允许时执行最终验收

## 目录相关操作规则
1. 除总控外，专业 agent 只读取与自身职责相关的目录。
2. 专业 agent 发现需要跨目录、跨岗位处理时，不得自行扩权，必须回调总控。
3. 没有总控许可，任何 agent 不得把“能访问某目录”理解为“可以处理该目录的所有问题”。
4. 文档更新优先落在 `docs/`，不要把协作规则散落在各业务目录。

## 对 prompt 的引用方式

建议每个 agent prompt 中统一保留一句:

`目录、路径、命令和操作边界请遵循 docs/agent_directory_guide.md。`
