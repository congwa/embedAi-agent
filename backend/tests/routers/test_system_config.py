"""系统配置 Router 测试

测试配置 API 端点。
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.schemas.system_config import (
    ConfigTestResponse,
    ProviderPresetsResponse,
    ProviderPreset,
    SystemConfigReadMasked,
)


class TestSystemConfigRouter:
    """测试系统配置路由"""

    @pytest.fixture
    def mock_service(self):
        """Mock SystemConfigService"""
        with patch("app.routers.system_config.SystemConfigService") as mock:
            service_instance = MagicMock()
            mock.return_value = service_instance
            yield service_instance

    @pytest.fixture
    def mock_db(self):
        """Mock 数据库会话"""
        with patch("app.routers.system_config.get_db_session") as mock:
            mock.return_value = AsyncMock()
            yield mock

    def test_get_system_config_endpoint_exists(self):
        """测试获取配置端点存在"""
        from app.routers.system_config import router
        
        routes = [route.path for route in router.routes]
        # 路由路径包含完整前缀
        assert any("system-config" in r and r.endswith("system-config") for r in routes)

    def test_get_providers_endpoint_exists(self):
        """测试获取提供商端点存在"""
        from app.routers.system_config import router
        
        routes = [route.path for route in router.routes]
        assert any("providers" in r for r in routes)

    def test_quick_config_endpoint_exists(self):
        """测试快速配置端点存在"""
        from app.routers.system_config import router
        
        routes = [route.path for route in router.routes]
        assert any("quick" in r for r in routes)

    def test_full_config_endpoint_exists(self):
        """测试完整配置端点存在"""
        from app.routers.system_config import router
        
        routes = [route.path for route in router.routes]
        assert any("full" in r for r in routes)

    def test_test_config_endpoint_exists(self):
        """测试测试配置端点存在"""
        from app.routers.system_config import router
        
        routes = [route.path for route in router.routes]
        assert any("test" in r for r in routes)

    def test_status_endpoint_exists(self):
        """测试状态端点存在"""
        from app.routers.system_config import router
        
        routes = [route.path for route in router.routes]
        assert any("status" in r for r in routes)


class TestRouterMethods:
    """测试路由方法"""

    def test_get_system_config_method(self):
        """测试 get_system_config 方法存在"""
        from app.routers.system_config import get_system_config
        assert callable(get_system_config)

    def test_get_provider_presets_method(self):
        """测试 get_provider_presets 方法存在"""
        from app.routers.system_config import get_provider_presets
        assert callable(get_provider_presets)

    def test_update_quick_config_method(self):
        """测试 update_quick_config 方法存在"""
        from app.routers.system_config import update_quick_config
        assert callable(update_quick_config)

    def test_update_full_config_method(self):
        """测试 update_full_config 方法存在"""
        from app.routers.system_config import update_full_config
        assert callable(update_full_config)

    def test_test_config_method(self):
        """测试 test_config 方法存在"""
        from app.routers.system_config import test_config
        assert callable(test_config)

    def test_get_config_status_method(self):
        """测试 get_config_status 方法存在"""
        from app.routers.system_config import get_config_status
        assert callable(get_config_status)


class TestRouterPrefix:
    """测试路由前缀"""

    def test_router_prefix(self):
        """测试路由前缀正确"""
        from app.routers.system_config import router
        assert router.prefix == "/api/v1/admin/system-config"

    def test_router_tags(self):
        """测试路由标签"""
        from app.routers.system_config import router
        assert "system-config" in router.tags


class TestGetSystemConfigAsync:
    """测试获取系统配置异步方法"""

    @pytest.mark.anyio
    async def test_get_system_config_returns_masked(self):
        """测试返回脱敏配置"""
        from app.routers.system_config import get_system_config
        
        mock_db = MagicMock()
        
        with patch("app.routers.system_config.SystemConfigService") as MockService:
            mock_service = MockService.return_value
            mock_service.get_config_masked = AsyncMock(
                return_value=SystemConfigReadMasked(
                    initialized=True,
                    llm_provider="siliconflow",
                    llm_api_key_masked="sk-1...test",
                    llm_base_url="https://api.siliconflow.cn/v1",
                    llm_chat_model="test-model",
                    embedding_provider="siliconflow",
                    embedding_api_key_masked=None,
                    embedding_base_url=None,
                    embedding_model="test-embed",
                    embedding_dimension=4096,
                    rerank_enabled=False,
                    rerank_provider=None,
                    rerank_api_key_masked=None,
                    rerank_base_url=None,
                    rerank_model=None,
                    rerank_top_n=5,
                    source="database",
                )
            )
            
            result = await get_system_config(db=mock_db)
            
            assert result.llm_api_key_masked == "sk-1...test"
            assert result.source == "database"
            mock_service.get_config_masked.assert_called_once()


class TestGetProviderPresetsAsync:
    """测试获取提供商预设异步方法"""

    @pytest.mark.anyio
    async def test_get_provider_presets(self):
        """测试获取提供商预设"""
        from app.routers.system_config import get_provider_presets
        
        mock_db = MagicMock()
        
        with patch("app.routers.system_config.SystemConfigService") as MockService:
            mock_service = MockService.return_value
            mock_service.get_provider_presets = MagicMock(
                return_value=ProviderPresetsResponse(
                    items=[
                        ProviderPreset(
                            id="test",
                            name="Test Provider",
                            base_url="https://test.com/v1",
                            default_model="test-model",
                            default_embedding_model="test-embed",
                            default_embedding_dimension=1024,
                        )
                    ]
                )
            )
            
            result = await get_provider_presets(db=mock_db)
            
            assert len(result.items) == 1
            assert result.items[0].id == "test"


class TestUpdateQuickConfigAsync:
    """测试快速配置更新异步方法"""

    @pytest.mark.anyio
    async def test_update_quick_config(self):
        """测试快速配置更新"""
        from app.routers.system_config import update_quick_config
        from app.schemas.system_config import QuickConfigUpdate
        
        mock_db = MagicMock()
        data = QuickConfigUpdate(api_key="sk-test", provider="siliconflow")
        
        with patch("app.routers.system_config.SystemConfigService") as MockService:
            mock_service = MockService.return_value
            mock_service.update_quick_config = AsyncMock(
                return_value=SystemConfigReadMasked(
                    initialized=True,
                    llm_provider="siliconflow",
                    llm_api_key_masked="sk-t...test",
                    llm_base_url="https://api.siliconflow.cn/v1",
                    llm_chat_model="test",
                    embedding_provider="siliconflow",
                    embedding_api_key_masked=None,
                    embedding_base_url=None,
                    embedding_model="test",
                    embedding_dimension=4096,
                    rerank_enabled=False,
                    rerank_provider=None,
                    rerank_api_key_masked=None,
                    rerank_base_url=None,
                    rerank_model=None,
                    rerank_top_n=5,
                    source="database",
                )
            )
            
            result = await update_quick_config(data=data, db=mock_db)
            
            assert result.initialized is True
            mock_service.update_quick_config.assert_called_once_with(data)


class TestTestConfigAsync:
    """测试配置测试异步方法"""

    @pytest.mark.anyio
    async def test_test_config_success(self):
        """测试配置测试成功"""
        from app.routers.system_config import test_config
        from app.schemas.system_config import ConfigTestRequest
        
        mock_db = MagicMock()
        data = ConfigTestRequest(
            provider="siliconflow",
            api_key="sk-test",
            base_url="https://api.siliconflow.cn/v1",
        )
        
        with patch("app.routers.system_config.SystemConfigService") as MockService:
            mock_service = MockService.return_value
            mock_service.test_config = AsyncMock(
                return_value=ConfigTestResponse(
                    success=True,
                    message="连接成功",
                    latency_ms=100.5,
                )
            )
            
            result = await test_config(data=data, db=mock_db)
            
            assert result.success is True
            assert "成功" in result.message
            mock_service.test_config.assert_called_once_with(data)

    @pytest.mark.anyio
    async def test_test_config_failure(self):
        """测试配置测试失败"""
        from app.routers.system_config import test_config
        from app.schemas.system_config import ConfigTestRequest
        
        mock_db = MagicMock()
        data = ConfigTestRequest(
            provider="siliconflow",
            api_key="invalid-key",
            base_url="https://api.siliconflow.cn/v1",
        )
        
        with patch("app.routers.system_config.SystemConfigService") as MockService:
            mock_service = MockService.return_value
            mock_service.test_config = AsyncMock(
                return_value=ConfigTestResponse(
                    success=False,
                    message="API Key 无效",
                )
            )
            
            result = await test_config(data=data, db=mock_db)
            
            assert result.success is False
            assert "无效" in result.message


class TestGetConfigStatusAsync:
    """测试获取配置状态异步方法"""

    @pytest.mark.anyio
    async def test_get_config_status_configured(self):
        """测试已配置状态"""
        from app.routers.system_config import get_config_status
        
        mock_db = MagicMock()
        
        with patch("app.routers.system_config.SystemConfigService") as MockService:
            mock_service = MockService.return_value
            mock_service.is_configured = AsyncMock(return_value=True)
            mock_service.get_config_masked = AsyncMock(
                return_value=SystemConfigReadMasked(
                    initialized=True,
                    llm_provider="siliconflow",
                    llm_api_key_masked="sk-1...test",
                    llm_base_url="https://api.siliconflow.cn/v1",
                    llm_chat_model="test",
                    embedding_provider="siliconflow",
                    embedding_api_key_masked=None,
                    embedding_base_url=None,
                    embedding_model="test",
                    embedding_dimension=4096,
                    rerank_enabled=False,
                    rerank_provider=None,
                    rerank_api_key_masked=None,
                    rerank_base_url=None,
                    rerank_model=None,
                    rerank_top_n=5,
                    source="database",
                )
            )
            
            result = await get_config_status(db=mock_db)
            
            assert result["configured"] is True
            assert result["llm_provider"] == "siliconflow"

    @pytest.mark.anyio
    async def test_get_config_status_not_configured(self):
        """测试未配置状态"""
        from app.routers.system_config import get_config_status
        
        mock_db = MagicMock()
        
        with patch("app.routers.system_config.SystemConfigService") as MockService:
            mock_service = MockService.return_value
            mock_service.is_configured = AsyncMock(return_value=False)
            mock_service.get_config_masked = AsyncMock(
                return_value=SystemConfigReadMasked(
                    initialized=False,
                    llm_provider="siliconflow",
                    llm_api_key_masked="未配置",
                    llm_base_url="https://api.siliconflow.cn/v1",
                    llm_chat_model="test",
                    embedding_provider="siliconflow",
                    embedding_api_key_masked=None,
                    embedding_base_url=None,
                    embedding_model="test",
                    embedding_dimension=4096,
                    rerank_enabled=False,
                    rerank_provider=None,
                    rerank_api_key_masked=None,
                    rerank_base_url=None,
                    rerank_model=None,
                    rerank_top_n=5,
                    source="env",
                )
            )
            
            result = await get_config_status(db=mock_db)
            
            assert result["configured"] is False
            assert result["llm_provider"] is None
