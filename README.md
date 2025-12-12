# 商品推荐 Agent

基于 LangChain v1.1 的智能商品推荐系统。

## 技术栈

### 后端
- **FastAPI** - Web 框架
- **LangChain v1.1** - AI Agent 框架
- **LangGraph** - 状态图管理
- **SQLite** - 数据库
- **Qdrant** - 向量数据库
- **硅基流动** - LLM + Embedding API

### 前端
- **Next.js 15** - React 框架
- **Tailwind CSS** - 样式
- **shadcn/ui** - UI 组件

## 快速开始

### 1. 启动 Qdrant

```bash
# 使用已有的 Qdrant（推荐）
# 或者使用 docker-compose
docker-compose up -d qdrant
```

### 2. 启动后端

```bash
cd backend

# 安装依赖
uv sync

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的硅基流动 API Key

# 导入商品数据
uv run python scripts/import_products.py

# 启动服务
uv run uvicorn app.main:app --reload --port 8000
```

### 3. 启动前端

```bash
cd frontend

# 安装依赖
pnpm install

# 配置环境变量（可选）
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 启动开发服务器
pnpm dev
```

### 4. 访问应用

打开浏览器访问 http://localhost:3000

## 功能

- ✅ 匿名用户（UUID 自动生成）
- ✅ 智能对话推荐商品
- ✅ 流式回复（SSE）
- ✅ 会话历史侧边栏
- ✅ 商品卡片展示

## 智能体流程架构

### 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │   External      │
│   (Next.js)     │◄──►│    (FastAPI)    │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Chat UI       │    │ • Agent Service │    │ • SiliconFlow   │
│ • Conversation  │    │ • Vector Search │    │ • Qdrant        │
│ • Product Cards │    │ • SQLite        │    │ • Embeddings    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Agent 流程图

```
用户请求 → [1] 接收请求 → [2] Agent 输入 → [3] 流式处理 → [4] 完成统计 → [5] 返回结果
           │              │                 │                   │
           ▼              ▼                 ▼                   ▼
      验证参数       创建 HumanMessage   监听事件流       计算统计      发送完成事件
      生成会话ID     准备配置对象       处理工具调用     记录工具调用    + 商品数据
                                    ↙         ↘
                                工具开始   工具结束
```

### 详细处理流程

#### 1. 用户请求接收
```
前端发送 → 后端接收 → 验证参数 → 生成会话ID → 记录请求日志
   ↓
SSE 连接建立
```

#### 2. Agent 初始化
```
检查单例实例 → 初始化模型 → 连接 SQLite → 创建 checkpointer → 加载 Agent
   ↓
LangChain v1.1 Agent (create_agent)
```

#### 3. 工具调用流程
```
用户消息 → Agent 推理 → 决定调用工具 → 执行 search_products
   ↓
向量检索 → Qdrant 查询 → 结果去重 → 返回商品列表
   ↓
Agent 分析结果 → 生成推荐回复 → 流式输出
```

#### 4. 数据流处理
```
ToolMessage → JSON 解析 → 提取商品数据 → 前端展示商品卡片
   ↓
流式文本 → 实时显示 → 构建完整回复 → 保存到数据库
```

#### 5. 状态管理
```
SQLite Checkpointer → 会话状态持久化 → 支持多轮对话
   ↓
用户历史 → 上下文关联 → 个性化推荐
```

### 核心组件

#### Agent Service
```python
# LangChain v1.1 Agent 核心
agent = create_agent(
    model=chat_model,           # SiliconFlow Qwen
    tools=[search_products],    # 商品搜索工具
    system_prompt=SYSTEM_PROMPT, # 推荐逻辑
    checkpointer=AsyncSqliteSaver # 状态管理
)
```

#### 向量检索
```python
# 商品嵌入和检索
embeddings = get_embeddings()  # BAAI/bge-m3 (4096维)
vector_store = QdrantVectorStore(
    client=qdrant_client,
    collection_name="products",
    embedding=embeddings
)
retriever = vector_store.as_retriever(k=5)
```

#### 工具定义
```python
@tool
def search_products(query: str) -> str:
    """基于向量相似度搜索商品"""
    docs = retriever.invoke(query)
    # 去重、整理、返回 JSON
```

### 日志系统

支持三级日志模式：
- **simple**: 简洁控制台输出
- **detailed**: 详细堆栈信息 + 文件位置
- **json**: 结构化日志 + 文件持久化

```bash
# 配置环境变量
LOG_MODE=detailed
LOG_LEVEL=DEBUG
LOG_FILE=./logs/app.log
```

### 扩展性设计

#### 数据层扩展
```
SQLite → PostgreSQL (生产环境)
Qdrant → 其他向量数据库 (Weaviate, Pinecone)
```

#### 功能扩展
```
商品推荐 → 价格比较、库存查询、多语言支持
单一 Agent → 多 Agent 协作 (LangGraph)
```

#### 性能优化
```
缓存层 → Redis 缓存
异步处理 → 消息队列
监控 → Prometheus + Grafana
```

## 目录结构

```
embedAi-agent/
├── backend/           # 后端服务
│   ├── app/           # 应用代码
│   ├── scripts/       # 脚本
│   └── data/          # 数据文件
├── frontend/          # 前端应用
│   ├── app/           # Next.js 页面
│   ├── components/    # React 组件
│   ├── hooks/         # 自定义 Hooks
│   └── lib/           # 工具函数
└── docker-compose.yml # Docker 配置
```

## API 文档

启动后端后，访问 http://localhost:8000/docs 查看 Swagger API 文档。
