"""系统配置 Schema"""

from pydantic import BaseModel, Field


class LLMConfigBase(BaseModel):
    """LLM 配置基础字段"""

    provider: str = Field(default="siliconflow", description="LLM 提供商")
    api_key: str = Field(default="", description="API Key")
    base_url: str = Field(default="https://api.siliconflow.cn/v1", description="API Base URL")
    chat_model: str = Field(default="moonshotai/Kimi-K2-Thinking", description="聊天模型")


class EmbeddingConfigBase(BaseModel):
    """Embedding 配置基础字段"""

    provider: str = Field(default="siliconflow", description="Embedding 提供商")
    api_key: str | None = Field(default=None, description="API Key（留空使用 LLM 的）")
    base_url: str | None = Field(default=None, description="Base URL（留空使用 LLM 的）")
    model: str = Field(default="Qwen/Qwen3-Embedding-8B", description="Embedding 模型")
    dimension: int = Field(default=4096, description="Embedding 维度")


class RerankConfigBase(BaseModel):
    """Rerank 配置基础字段"""

    enabled: bool = Field(default=False, description="是否启用 Rerank")
    provider: str | None = Field(default=None, description="Rerank 提供商")
    api_key: str | None = Field(default=None, description="API Key")
    base_url: str | None = Field(default=None, description="Base URL")
    model: str | None = Field(default=None, description="Rerank 模型")
    top_n: int = Field(default=5, description="返回前 N 个结果")


class SystemConfigRead(BaseModel):
    """系统配置读取响应"""

    # 配置是否已初始化（数据库中是否有配置）
    initialized: bool = Field(default=False, description="配置是否已初始化")

    # LLM 配置
    llm: LLMConfigBase = Field(default_factory=LLMConfigBase)

    # Embedding 配置
    embedding: EmbeddingConfigBase = Field(default_factory=EmbeddingConfigBase)

    # Rerank 配置
    rerank: RerankConfigBase = Field(default_factory=RerankConfigBase)

    # 配置来源
    source: str = Field(default="env", description="配置来源: env | database")


class SystemConfigReadMasked(BaseModel):
    """系统配置读取响应（API Key 脱敏）"""

    initialized: bool = Field(default=False)

    # LLM 配置
    llm_provider: str
    llm_api_key_masked: str
    llm_base_url: str
    llm_chat_model: str

    # Embedding 配置
    embedding_provider: str
    embedding_api_key_masked: str | None
    embedding_base_url: str | None
    embedding_model: str
    embedding_dimension: int

    # Rerank 配置
    rerank_enabled: bool
    rerank_provider: str | None
    rerank_api_key_masked: str | None
    rerank_base_url: str | None
    rerank_model: str | None
    rerank_top_n: int

    # 配置来源
    source: str


class QuickConfigUpdate(BaseModel):
    """快速配置更新（只需 API Key）"""

    api_key: str = Field(..., min_length=1, description="API Key")
    provider: str = Field(default="siliconflow", description="LLM 提供商")
    base_url: str | None = Field(default=None, description="Base URL（可选，留空使用默认）")


class FullConfigUpdate(BaseModel):
    """完整配置更新"""

    # LLM 配置
    llm_provider: str = Field(..., description="LLM 提供商")
    llm_api_key: str = Field(..., min_length=1, description="API Key")
    llm_base_url: str = Field(..., description="Base URL")
    llm_chat_model: str = Field(..., description="聊天模型")

    # Embedding 配置
    embedding_provider: str = Field(..., description="Embedding 提供商")
    embedding_api_key: str | None = Field(default=None, description="Embedding API Key")
    embedding_base_url: str | None = Field(default=None, description="Embedding Base URL")
    embedding_model: str = Field(..., description="Embedding 模型")
    embedding_dimension: int = Field(..., ge=1, description="Embedding 维度")

    # Rerank 配置（可选）
    rerank_enabled: bool = Field(default=False, description="是否启用 Rerank")
    rerank_provider: str | None = Field(default=None, description="Rerank 提供商")
    rerank_api_key: str | None = Field(default=None, description="Rerank API Key")
    rerank_base_url: str | None = Field(default=None, description="Rerank Base URL")
    rerank_model: str | None = Field(default=None, description="Rerank 模型")
    rerank_top_n: int = Field(default=5, ge=1, description="Rerank Top N")


class ConfigTestRequest(BaseModel):
    """配置测试请求"""

    provider: str = Field(..., description="LLM 提供商")
    api_key: str = Field(..., min_length=1, description="API Key")
    base_url: str = Field(..., description="Base URL")
    model: str | None = Field(default=None, description="模型（可选，用于测试）")


class ConfigTestResponse(BaseModel):
    """配置测试响应"""

    success: bool
    message: str
    latency_ms: float | None = None
    models: list[str] | None = None  # 可用的模型列表


# 预置的提供商配置
PROVIDER_PRESETS: dict[str, dict[str, str]] = {
    "siliconflow": {
        "name": "SiliconFlow",
        "base_url": "https://api.siliconflow.cn/v1",
        "default_model": "moonshotai/Kimi-K2-Thinking",
        "default_embedding_model": "Qwen/Qwen3-Embedding-8B",
        "default_embedding_dimension": "4096",
    },
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o",
        "default_embedding_model": "text-embedding-3-large",
        "default_embedding_dimension": "3072",
    },
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "default_model": "deepseek-chat",
        "default_embedding_model": "deepseek-embedding",
        "default_embedding_dimension": "1536",
    },
    "anthropic": {
        "name": "Anthropic",
        "base_url": "https://api.anthropic.com/v1",
        "default_model": "claude-3-5-sonnet-20241022",
        "default_embedding_model": "",
        "default_embedding_dimension": "0",
    },
    "openrouter": {
        "name": "OpenRouter",
        "base_url": "https://openrouter.ai/api/v1",
        "default_model": "anthropic/claude-3.5-sonnet",
        "default_embedding_model": "",
        "default_embedding_dimension": "0",
    },
}


class ProviderPreset(BaseModel):
    """提供商预设"""

    id: str
    name: str
    base_url: str
    default_model: str
    default_embedding_model: str
    default_embedding_dimension: int


class ProviderPresetsResponse(BaseModel):
    """提供商预设列表响应"""

    items: list[ProviderPreset]
