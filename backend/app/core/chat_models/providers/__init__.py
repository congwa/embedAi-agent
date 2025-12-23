"""各平台推理模型实现（多态架构）

每个文件包含一个继承 BaseReasoningChatModel 的子类，
实现平台特定的推理内容提取逻辑。

当前实现：
- reasoning_content.py: SiliconFlow（使用 reasoning_content 字段）

扩展方式：
1. 新建文件（如 moonshot.py）
2. 继承 BaseReasoningChatModel
3. 实现 provider_name 和 _normalize_reasoning_from_chunk
4. 在 registry.py 中注册
"""

