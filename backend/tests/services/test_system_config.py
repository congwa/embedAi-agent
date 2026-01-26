"""SystemConfigService 测试

测试系统配置服务的业务逻辑。
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.schemas.system_config import (
    EmbeddingConfigBase,
    FullConfigUpdate,
    LLMConfigBase,
    PROVIDER_PRESETS,
    QuickConfigUpdate,
    RerankConfigBase,
    SystemConfigRead,
)
from app.services.system_config import (
    CONFIG_KEYS,
    SystemConfigService,
    clear_config_cache,
)


class TestSystemConfigServiceInit:
    """测试 SystemConfigService 初始化"""

    def test_init_with_db(self):
        """测试使用数据库会话初始化"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        assert service.db is mock_db


class TestSystemConfigServiceGetConfig:
    """测试获取配置"""

    @pytest.mark.anyio
    async def test_get_config_not_initialized(self):
        """测试未初始化时返回环境变量配置"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        # Mock _get_value 返回 None（未初始化）
        service._get_value = AsyncMock(return_value=None)

        config = await service.get_config()

        assert config.source == "env"
        # 验证调用了 _get_value 检查初始化状态
        service._get_value.assert_called()

    @pytest.mark.anyio
    async def test_get_config_initialized(self):
        """测试已初始化时返回数据库配置"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        # Mock 数据库返回
        llm_json = '{"provider": "openai", "api_key": "sk-test", "base_url": "https://api.openai.com/v1", "chat_model": "gpt-4"}'
        embedding_json = '{"provider": "openai", "model": "text-embedding-3-large", "dimension": 3072}'
        rerank_json = '{"enabled": false}'

        async def mock_get_value(key):
            if key == CONFIG_KEYS["initialized"]:
                return "true"
            elif key == CONFIG_KEYS["llm"]:
                return llm_json
            elif key == CONFIG_KEYS["embedding"]:
                return embedding_json
            elif key == CONFIG_KEYS["rerank"]:
                return rerank_json
            return None

        service._get_value = AsyncMock(side_effect=mock_get_value)

        config = await service.get_config()

        assert config.initialized is True
        assert config.source == "database"
        assert config.llm.provider == "openai"
        assert config.llm.api_key == "sk-test"
        assert config.embedding.model == "text-embedding-3-large"


class TestSystemConfigServiceGetConfigMasked:
    """测试获取脱敏配置"""

    @pytest.mark.anyio
    async def test_get_config_masked_hides_api_key(self):
        """测试 API Key 脱敏"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        # Mock get_config 返回
        mock_config = SystemConfigRead(
            initialized=True,
            llm=LLMConfigBase(
                provider="siliconflow",
                api_key="sk-1234567890abcdef",
                base_url="https://api.siliconflow.cn/v1",
                chat_model="test-model",
            ),
            embedding=EmbeddingConfigBase(),
            rerank=RerankConfigBase(),
            source="database",
        )
        service.get_config = AsyncMock(return_value=mock_config)

        masked = await service.get_config_masked()

        assert masked.llm_api_key_masked == "sk-1...cdef"
        assert "1234567890abcdef" not in masked.llm_api_key_masked

    @pytest.mark.anyio
    async def test_get_config_masked_short_key(self):
        """测试短 API Key 脱敏"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        mock_config = SystemConfigRead(
            initialized=True,
            llm=LLMConfigBase(
                provider="test",
                api_key="short",
                base_url="https://example.com",
                chat_model="test",
            ),
            embedding=EmbeddingConfigBase(),
            rerank=RerankConfigBase(),
            source="database",
        )
        service.get_config = AsyncMock(return_value=mock_config)

        masked = await service.get_config_masked()

        assert masked.llm_api_key_masked == "***"


class TestSystemConfigServiceQuickConfig:
    """测试快速配置"""

    @pytest.mark.anyio
    async def test_update_quick_config_siliconflow(self):
        """测试快速配置 SiliconFlow"""
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        service = SystemConfigService(mock_db)

        service._set_value = AsyncMock()
        service.get_config_masked = AsyncMock()

        data = QuickConfigUpdate(
            api_key="sk-test-key",
            provider="siliconflow",
        )

        with patch("app.services.system_config.clear_config_cache"):
            await service.update_quick_config(data)

        # 验证设置了正确的值
        assert service._set_value.call_count == 4  # llm, embedding, rerank, initialized
        mock_db.commit.assert_called_once()

    @pytest.mark.anyio
    async def test_update_quick_config_openai(self):
        """测试快速配置 OpenAI"""
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        service = SystemConfigService(mock_db)

        service._set_value = AsyncMock()
        service.get_config_masked = AsyncMock()

        data = QuickConfigUpdate(
            api_key="sk-openai-key",
            provider="openai",
        )

        with patch("app.services.system_config.clear_config_cache"):
            await service.update_quick_config(data)

        # 验证使用了 OpenAI 的预设
        calls = service._set_value.call_args_list
        llm_call = [c for c in calls if CONFIG_KEYS["llm"] in str(c)]
        assert len(llm_call) > 0


class TestSystemConfigServiceFullConfig:
    """测试完整配置"""

    @pytest.mark.anyio
    async def test_update_full_config(self):
        """测试完整配置更新"""
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        service = SystemConfigService(mock_db)

        service._set_value = AsyncMock()
        service.get_config_masked = AsyncMock()

        data = FullConfigUpdate(
            llm_provider="deepseek",
            llm_api_key="sk-deepseek",
            llm_base_url="https://api.deepseek.com/v1",
            llm_chat_model="deepseek-chat",
            embedding_provider="deepseek",
            embedding_model="deepseek-embedding",
            embedding_dimension=1536,
            rerank_enabled=True,
            rerank_model="rerank-model",
            rerank_top_n=10,
        )

        with patch("app.services.system_config.clear_config_cache"):
            await service.update_full_config(data)

        assert service._set_value.call_count == 4
        mock_db.commit.assert_called_once()


class TestSystemConfigServiceTestConfig:
    """测试配置测试功能"""

    @pytest.mark.anyio
    async def test_test_config_success(self):
        """测试配置测试成功"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        from app.schemas.system_config import ConfigTestRequest

        data = ConfigTestRequest(
            provider="test",
            api_key="test-key",
            base_url="https://api.example.com/v1",
        )

        # Mock httpx（在函数内部导入，需要 patch httpx 模块）
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"data": [{"id": "model-1"}, {"id": "model-2"}]}

            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            result = await service.test_config(data)

        assert result.success is True
        assert "连接成功" in result.message

    @pytest.mark.anyio
    async def test_test_config_auth_error(self):
        """测试配置测试认证失败"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        from app.schemas.system_config import ConfigTestRequest

        data = ConfigTestRequest(
            provider="test",
            api_key="invalid-key",
            base_url="https://api.example.com/v1",
        )

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_response = MagicMock()
            mock_response.status_code = 401

            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            result = await service.test_config(data)

        assert result.success is False
        assert "无效" in result.message or "权限" in result.message


class TestProviderPresets:
    """测试提供商预设"""

    def test_provider_presets_contains_siliconflow(self):
        """测试预设包含 SiliconFlow"""
        assert "siliconflow" in PROVIDER_PRESETS
        preset = PROVIDER_PRESETS["siliconflow"]
        assert preset["name"] == "SiliconFlow"
        assert "api.siliconflow.cn" in preset["base_url"]

    def test_provider_presets_contains_openai(self):
        """测试预设包含 OpenAI"""
        assert "openai" in PROVIDER_PRESETS
        preset = PROVIDER_PRESETS["openai"]
        assert preset["name"] == "OpenAI"
        assert "api.openai.com" in preset["base_url"]

    def test_provider_presets_contains_deepseek(self):
        """测试预设包含 DeepSeek"""
        assert "deepseek" in PROVIDER_PRESETS
        preset = PROVIDER_PRESETS["deepseek"]
        assert preset["name"] == "DeepSeek"

    def test_get_provider_presets(self):
        """测试获取提供商预设列表"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        result = service.get_provider_presets()

        assert len(result.items) > 0
        provider_ids = [p.id for p in result.items]
        assert "siliconflow" in provider_ids
        assert "openai" in provider_ids


class TestClearConfigCache:
    """测试清除配置缓存"""

    def test_clear_config_cache(self):
        """测试清除缓存不抛异常"""
        # 简单测试不抛异常
        clear_config_cache()


class TestIsConfigured:
    """测试配置状态检查"""

    @pytest.mark.anyio
    async def test_is_configured_database(self):
        """测试数据库已配置"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        service._get_value = AsyncMock(return_value="true")

        result = await service.is_configured()

        assert result is True

    @pytest.mark.anyio
    async def test_is_configured_env(self):
        """测试环境变量已配置"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        service._get_value = AsyncMock(return_value=None)

        # 环境变量中有 LLM_API_KEY（由 conftest.py 设置）
        result = await service.is_configured()

        assert result is True

    @pytest.mark.anyio
    async def test_is_configured_none(self):
        """测试未配置"""
        mock_db = MagicMock()
        service = SystemConfigService(mock_db)

        service._get_value = AsyncMock(return_value=None)

        # Mock settings 没有 LLM_API_KEY（需要 patch app.core.config 模块）
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.LLM_API_KEY = ""
            # 需要重新导入服务以使用 mock 的 settings
            from importlib import reload
            import app.services.system_config as svc_module
            reload(svc_module)
            
            service2 = svc_module.SystemConfigService(mock_db)
            service2._get_value = AsyncMock(return_value=None)
            result = await service2.is_configured()

        # 重新 reload 恢复正常
        reload(svc_module)
        assert result is False
