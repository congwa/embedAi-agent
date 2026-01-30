"""工具调用策略测试"""


from app.services.agent.core.policy import (
    DEFAULT_POLICY,
    ToolPolicy,
    get_policy,
)


class TestToolPolicy:
    """测试 ToolPolicy 数据类"""

    def test_default_values(self):
        """测试默认值"""
        policy = ToolPolicy()
        assert policy.min_tool_calls == 0
        assert policy.fallback_tool is None
        assert policy.allow_direct_answer is True
        assert policy.clarification_tool is None
        assert policy.description == ""

    def test_custom_values(self):
        """测试自定义值"""
        policy = ToolPolicy(
            min_tool_calls=2,
            fallback_tool="search_products",
            allow_direct_answer=False,
            clarification_tool="guide_user",
            description="测试策略",
        )
        assert policy.min_tool_calls == 2
        assert policy.fallback_tool == "search_products"
        assert policy.allow_direct_answer is False
        assert policy.clarification_tool == "guide_user"
        assert policy.description == "测试策略"


class TestDefaultPolicy:
    """测试 DEFAULT_POLICY 预定义策略"""

    def test_min_tool_calls(self):
        """测试不强制工具调用"""
        assert DEFAULT_POLICY.min_tool_calls == 0

    def test_allow_direct_answer(self):
        """测试允许直接回答"""
        assert DEFAULT_POLICY.allow_direct_answer is True

    def test_no_fallback_tool(self):
        """测试无回退工具"""
        assert DEFAULT_POLICY.fallback_tool is None

    def test_description(self):
        """测试描述"""
        assert "默认策略" in DEFAULT_POLICY.description


class TestGetPolicy:
    """测试 get_policy 函数"""

    def test_get_default_policy(self):
        """测试获取默认策略"""
        policy = get_policy()
        assert policy is DEFAULT_POLICY
