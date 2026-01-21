# ✅ 配置检查清单

## ⚡ 新用户必需配置（仅 4 项）

---

下载项目后，**只需配置以下 4 项**即可运行：

### 1️⃣ 复制配置文件

```bash
cd backend
cp .env.example .env
```

### 2️⃣ 编辑 `backend/.env`，填写以下 4 项（唯一需要修改的）

```bash
# ✅ 必填项 1: LLM 提供商
LLM_PROVIDER=siliconflow

# ✅ 必填项 2: API Key（这是唯一需要你提供的敏感信息）
LLM_API_KEY=sk-your-api-key-here

# ✅ 必填项 3: API 地址
LLM_BASE_URL=https://api.siliconflow.cn/v1

# ✅ 必填项 4: 模型名称
LLM_CHAT_MODEL=moonshotai/Kimi-K2-Thinking
```

### 3️⃣ 启动服务

```bash
# 启动 Qdrant 和 MinIO
docker compose up -d

# 启动后端
cd backend
uv sync
uv run python scripts/import_products.py
uv run uvicorn app.main:app --reload --port 8000

# 启动前端（新终端）
cd frontend
pnpm install
pnpm dev
```

### 4️⃣ 访问应用

- 对话界面：http://localhost:3000
- 管理后台：http://localhost:3000/admin

---

## 📁 关于 .env.json 目录（可选）

**⚠️ 重要**：`.env.json` 目录是**可选的**，新用户无需配置即可运行。

### 何时需要配置？

| 功能 | 是否需要 |
|------|---------|
| 基础对话功能 | ❌ 不需要 |
| 覆盖模型能力 | ✅ 需要（当 models.dev 数据不准确时） |
| 配置爬虫站点 | ✅ 需要（启用爬虫功能时） |
| 预置多个 Agent | ✅ 需要 |
| 多域名 CORS | ✅ 需要 |

### 如何配置？

**⚠️ 不要直接复制整个 .env.json.example 目录！**

示例文件中的值仅供参考，不能直接使用。正确做法：

```bash
# 1. 创建目录
mkdir backend/.env.json

# 2. 按需复制单个文件
cp backend/.env.json.example/MODEL_PROFILES_JSON.json backend/.env.json/
# 然后编辑该文件，填写你的实际配置

# 3. 在 .env 中启用
echo "ENV_JSON_DIR=.env.json" >> backend/.env
```

详细说明请查看：[backend/.env.json.example/README.md](backend/.env.json.example/README.md)

---

---

---

## 📋 完整配置清单

---

### 必需配置（已有默认值，无需修改）

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `QDRANT_HOST` | `localhost` | Qdrant 地址 |
| `QDRANT_PORT` | `6333` | Qdrant 端口 |
| `DATABASE_BACKEND` | `sqlite` | 数据库类型 |
| `DATABASE_PATH` | `./data/app.db` | SQLite 路径 |
| `EMBEDDING_MODEL` | `Qwen/Qwen3-Embedding-8B` | 向量模型 |
| `EMBEDDING_DIMENSION` | `4096` | 向量维度 |

---

---

---

## 🎨 可选配置（都有默认值，按需调整）

---

**以下所有配置都有合理的默认值，新用户无需修改。**

### 🔧 功能开关

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `MEMORY_ENABLED` | `true` | 记忆系统 |
| `CRAWLER_ENABLED` | `false` | 网站爬虫 |
| `MINIO_ENABLED` | `false` | 图片上传 |
| `SUPERVISOR_ENABLED` | `false` | 多 Agent 编排 |

#### 🤖 Agent 配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `CHAT_MODE` | `natural` | 对话模式 |
| `AGENT_TODO_ENABLED` | `true` | TODO 规划 |
| `AGENT_SUMMARIZATION_ENABLED` | `true` | 上下文压缩 |
| `AGENT_TOOL_RETRY_ENABLED` | `true` | 工具重试 |
| `AGENT_TOOL_LIMIT_ENABLED` | `true` | 工具调用限制 |

#### 📊 高级配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `MODELS_DEV_ENABLED` | `true` | 自动获取模型能力 |
| `CATALOG_PROFILE_ENABLED` | `true` | 商品库画像 |
| `RERANK_ENABLED` | `true` | 重排序 |

---

## 🎯 配置优先级

```
1. backend/.env 环境变量（最高优先级）
   ↓
2. backend/.env.json/ 目录中的 JSON 文件
   ↓
3. 代码中的默认值（最低优先级）
```

---

## 📁 配置文件说明

### 必需文件

```
backend/
└── .env                    # 主配置文件（必需创建，包含 API Key）
```

### 可选文件（推荐）

```
backend/
└── .env.json/              # JSON 配置目录（可选但推荐）
    ├── MODEL_PROFILES_JSON.json      # 模型能力配置
    ├── CRAWLER_SITES_JSON.json       # 爬虫站点配置
    ├── DEFAULT_AGENTS_JSON.json      # Agent 配置
    └── CORS_ORIGINS.json             # CORS 配置
```

**创建方式**：
```bash
cd backend
cp -r .env.json.example .env.json
```

### 示例文件（仅供参考）

```
backend/
├── .env.example            # 配置示例（不要修改）
└── .env.json.example/      # JSON 配置示例（不要修改）
```

---

## 🔍 配置验证

### 检查必需配置

```bash
# 检查 .env 文件是否存在
ls backend/.env

# 检查 API Key 是否配置
grep "LLM_API_KEY" backend/.env
```

### 检查服务状态

```bash
# 检查 Qdrant
curl http://localhost:6333/healthz

# 检查后端
curl http://localhost:8000/health

# 检查前端
curl http://localhost:3000
```

---

## 🚨 常见配置错误

### ❌ 错误 1：未创建 .env 文件

**症状**：后端启动失败，提示找不到配置

**解决**：
```bash
cd backend
cp .env.example .env
```

### ❌ 错误 2：LLM_API_KEY 未设置

**症状**：LLM 调用失败

**解决**：编辑 `backend/.env`，填写正确的 API Key

### ❌ 错误 3：Qdrant 未启动

**症状**：后端启动失败，提示 Qdrant 连接失败

**解决**：
```bash
docker compose up -d qdrant
```

### ❌ 错误 4：端口冲突

**症状**：服务启动失败，提示端口已被占用

**解决**：修改 `backend/.env` 中的端口配置
```bash
API_PORT=8001  # 改为其他端口
```

---

## 📝 配置模板

### SiliconFlow（推荐国内用户）

```bash
LLM_PROVIDER=siliconflow
LLM_API_KEY=sk-your-siliconflow-key
LLM_BASE_URL=https://api.siliconflow.cn/v1
LLM_CHAT_MODEL=moonshotai/Kimi-K2-Thinking
EMBEDDING_PROVIDER=siliconflow
EMBEDDING_MODEL=Qwen/Qwen3-Embedding-8B
EMBEDDING_DIMENSION=4096
```

### OpenAI

```bash
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-openai-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_CHAT_MODEL=gpt-4
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-large
EMBEDDING_DIMENSION=3072
```

### DeepSeek

```bash
LLM_PROVIDER=deepseek
LLM_API_KEY=sk-your-deepseek-key
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_CHAT_MODEL=deepseek-chat
EMBEDDING_PROVIDER=deepseek
EMBEDDING_MODEL=deepseek-embedding
EMBEDDING_DIMENSION=1536
```

---

## 🎓 配置最佳实践

### 1. 环境隔离

```bash
# 开发环境
backend/.env          # 本地配置

# 生产环境
backend/.env.prod     # 生产配置（通过 CI/CD 注入）
```

### 2. 敏感信息管理

```bash
# ✅ 放在 .env 中（不提交到 Git）
LLM_API_KEY=sk-xxxxx
POSTGRES_PASSWORD=xxxxx

# ✅ 放在 .env.json/ 中（可提交到 Git）
CRAWLER_SITES_JSON.json
DEFAULT_AGENTS_JSON.json
```

### 3. 配置文档化

在 `.env` 中添加注释：
```bash
# ========================================
# LLM 配置
# ========================================
# 使用 SiliconFlow，国内访问快速稳定
LLM_PROVIDER=siliconflow
LLM_API_KEY=sk-xxxxx
```

---

## 📚 相关文档

- [新用户快速上手](GETTING_STARTED.md) - 详细的部署指南
- [完整配置说明](backend/.env.example) - 所有配置项的详细说明
- [JSON 配置指南](backend/.env.json.example/README.md) - JSON 配置文件使用方法

---

## 💡 总结

**新用户只需配置 4 项：**
1. ✅ `LLM_PROVIDER` - 选择服务商
2. ✅ `LLM_API_KEY` - 填写 API Key
3. ✅ `LLM_BASE_URL` - API 地址
4. ✅ `LLM_CHAT_MODEL` - 模型名称

**其他所有配置都有合理的默认值，可以稍后根据需要调整。**
