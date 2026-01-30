# 快速设置双层架构方案

## 一、问题分析

### 当前状态
现有快速设置包含 **9 个步骤**（单 Agent 模式）：
1. welcome - 欢迎 & 检查清单
2. mode - 模式选择
3. system - 系统基础设置（公司信息、品牌主题、语言、时区、联系方式）
4. models - 模型 & 向量服务
5. agent-type - Agent 类型选择
6. knowledge - 知识 & Agent 配置
7. greeting - 开场白配置
8. channel - 渠道 & 集成
9. summary - 总结 & 快捷入口

**问题：** 配置项过多，首次用户体验负担重，很多配置实际上不是必须的。

---

## 二、系统运行必需配置分析

通过分析后端代码，识别出系统正常运行的 **最小必需配置**：

### 必需项（系统无法运行）

| 配置项 | 说明 | 来源 |
|--------|------|------|
| `LLM_API_KEY` | LLM API 密钥 | `settings.LLM_API_KEY` |
| `LLM_CHAT_MODEL` | 聊天模型 ID | `settings.LLM_CHAT_MODEL`（有默认值） |
| Mode 选择 | single / supervisor | 决定系统架构 |
| 默认 Agent | 至少有一个可用 Agent | `get_or_create_default_agent()` |

### 可选项（影响功能但不阻塞）

| 配置项 | 说明 | 影响 |
|--------|------|------|
| Qdrant 连接 | 向量数据库 | 影响商品搜索、知识库检索 |
| Embedding 配置 | 嵌入模型 | 影响向量化质量 |
| 公司信息 | 品牌名称、主题 | 影响 UI 展示 |
| 开场白 | 欢迎语、推荐问题 | 影响用户体验 |
| 渠道集成 | 企业微信、Webhook | 影响通知功能 |

---

## 三、双层配置方案设计

### 3.1 精简模式（Essential Setup）

**目标：** 3 步完成，系统即可正常对话

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: 模式选择                                        │
│  ├── 单 Agent 模式（推荐新手）                           │
│  └── 多 Agent 编排模式                                   │
├─────────────────────────────────────────────────────────┤
│  Step 2: API 配置                                        │
│  ├── LLM Provider（下拉选择）                            │
│  ├── API Key（必填，带验证）                             │
│  └── 模型选择（带默认值）                                │
├─────────────────────────────────────────────────────────┤
│  Step 3: Agent 确认                                      │
│  ├── 选择 Agent 类型（商品推荐/FAQ/知识库/自定义）        │
│  └── 自动创建默认 Agent                                  │
└─────────────────────────────────────────────────────────┘
          ↓
    完成！可以开始对话
          ↓
    可选：继续完整配置
```

**校验规则：**
- Step 1：必须选择模式
- Step 2：API Key 必填，需要验证连通性
- Step 3：必须有一个 Agent（可自动创建）

### 3.2 完整模式（Full Setup）

**目标：** 精细配置所有功能

```
┌─────────────────────────────────────────────────────────┐
│  基础配置（继承精简模式结果）                             │
├─────────────────────────────────────────────────────────┤
│  Step 4: 系统基础设置                                    │
│  ├── 公司/品牌名称                                       │
│  ├── 品牌主题色                                          │
│  ├── 语言、时区                                          │
│  └── 管理员联系方式                                      │
├─────────────────────────────────────────────────────────┤
│  Step 5: 向量服务配置                                    │
│  ├── Qdrant 连接配置                                     │
│  ├── Embedding 模型选择                                  │
│  └── 连通性测试                                          │
├─────────────────────────────────────────────────────────┤
│  Step 6: Agent 详细配置                                  │
│  ├── 知识源配置（商品库/FAQ/文档）                       │
│  ├── 工具策略                                            │
│  └── 中间件开关                                          │
├─────────────────────────────────────────────────────────┤
│  Step 7: 开场白配置                                      │
│  ├── 欢迎语                                              │
│  ├── 推荐问题                                            │
│  └── 渠道差异化策略                                      │
├─────────────────────────────────────────────────────────┤
│  Step 8: 渠道 & 集成                                     │
│  ├── 企业微信配置                                        │
│  ├── Webhook 通知                                        │
│  └── 嵌入代码生成                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 四、前端组件架构

### 4.1 目录结构

```
frontend/app/admin/quick-setup/
├── page.tsx                    # 主页面（路由）
├── components/
│   ├── SetupWizard.tsx        # 向导容器（管理模式切换）
│   ├── EssentialSetup/        # 精简模式组件
│   │   ├── index.tsx          # 精简模式主组件
│   │   ├── ModeSelectStep.tsx # 模式选择
│   │   ├── ApiConfigStep.tsx  # API 配置
│   │   └── AgentConfirmStep.tsx # Agent 确认
│   ├── FullSetup/             # 完整模式组件
│   │   ├── index.tsx          # 完整模式主组件
│   │   ├── SystemStep.tsx     # 系统设置
│   │   ├── VectorStep.tsx     # 向量服务
│   │   ├── AgentDetailStep.tsx # Agent 详细配置
│   │   ├── GreetingStep.tsx   # 开场白
│   │   └── ChannelStep.tsx    # 渠道集成
│   ├── shared/                # 共享组件
│   │   ├── StepLayout.tsx     # 步骤布局
│   │   ├── StepHeader.tsx     # 步骤头部
│   │   ├── ValidationBadge.tsx # 校验状态徽章
│   │   └── ConnectionTest.tsx  # 连通性测试组件
│   └── ui/                    # UI 原子组件
│       ├── SetupCard.tsx      # 设置卡片
│       ├── SetupProgress.tsx  # 进度指示器
│       └── SetupNav.tsx       # 导航按钮
└── hooks/
    ├── useSetupState.ts       # 状态管理 Hook
    ├── useValidation.ts       # 校验 Hook
    └── useConnectionTest.ts   # 连通性测试 Hook
```

### 4.2 核心组件设计

#### SetupWizard（向导容器）

```tsx
interface SetupWizardProps {
  initialMode?: "essential" | "full";
  onComplete: () => void;
}

// 职责：
// 1. 管理精简/完整模式切换
// 2. 维护全局状态
// 3. 控制步骤流转
// 4. 处理完成/取消
```

#### EssentialSetup（精简模式）

```tsx
interface EssentialSetupProps {
  onComplete: (data: EssentialSetupData) => void;
  onSwitchToFull: () => void;  // 切换到完整模式
}

interface EssentialSetupData {
  mode: "single" | "supervisor";
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;
  agentType: string;
  agentId: string;
}
```

#### StepLayout（步骤布局）

```tsx
interface StepLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  isValid: boolean;
  onNext: () => void;
  onPrev?: () => void;
  onSkip?: () => void;  // 仅完整模式
  isLoading?: boolean;
}
```

### 4.3 校验策略

```tsx
// hooks/useValidation.ts

interface ValidationRule {
  field: string;
  required: boolean;
  validate?: (value: any) => Promise<boolean> | boolean;
  message: string;
}

interface StepValidation {
  stepKey: string;
  rules: ValidationRule[];
  asyncValidate?: () => Promise<{ valid: boolean; errors: string[] }>;
}

// 精简模式校验规则
const ESSENTIAL_VALIDATIONS: StepValidation[] = [
  {
    stepKey: "mode",
    rules: [
      { field: "mode", required: true, message: "请选择运行模式" }
    ]
  },
  {
    stepKey: "api",
    rules: [
      { field: "llmApiKey", required: true, message: "请输入 API Key" },
      { field: "llmModel", required: true, message: "请选择模型" }
    ],
    asyncValidate: async () => {
      // 调用后端 /health 接口验证 LLM 连通性
    }
  },
  {
    stepKey: "agent",
    rules: [
      { field: "agentType", required: true, message: "请选择 Agent 类型" }
    ]
  }
];
```

---

## 五、后端 API 调整

### 5.1 新增接口

```python
# POST /api/v1/admin/quick-setup/essential/complete
# 一次性完成精简配置

class EssentialSetupRequest(BaseModel):
    mode: Literal["single", "supervisor"]
    llm_provider: str
    llm_api_key: str
    llm_model: str
    agent_type: str

class EssentialSetupResponse(BaseModel):
    success: bool
    agent_id: str
    message: str
```

### 5.2 状态扩展

```python
class QuickSetupState(BaseModel):
    # 现有字段...
    
    # 新增
    setup_level: Literal["none", "essential", "full"] = "none"
    essential_completed: bool = False
    essential_data: dict[str, Any] | None = None
```

### 5.3 校验接口增强

```python
# POST /api/v1/admin/quick-setup/validate/essential
# 验证精简配置是否满足最小要求

class EssentialValidationResponse(BaseModel):
    can_proceed: bool  # 是否可以完成精简配置
    missing_items: list[str]  # 缺失的必需项
    warnings: list[str]  # 警告（非阻塞）
```

---

## 六、用户流程

### 6.1 首次用户

```
进入后台
    ↓
检测 setup_level = "none"
    ↓
强制进入精简配置
    ↓
完成 3 步精简配置
    ↓
setup_level = "essential"
    ↓
可以正常使用系统
    ↓
随时可进入完整配置优化
```

### 6.2 已完成精简配置用户

```
进入后台
    ↓
检测 setup_level = "essential"
    ↓
正常显示后台界面
    ↓
侧边栏显示"继续配置"入口
    ↓
点击进入完整配置（从 Step 4 开始）
```

### 6.3 已完成完整配置用户

```
进入后台
    ↓
检测 setup_level = "full"
    ↓
正常显示后台界面
    ↓
侧边栏显示"快速配置"入口
    ↓
点击可重新运行配置向导
```

---

## 七、实施计划

### Phase 1: 后端调整（1-2 天）
- [ ] 扩展 `QuickSetupState` schema
- [ ] 新增 `/essential/complete` 接口
- [ ] 新增 `/validate/essential` 接口
- [ ] 调整状态管理器支持双层模式

### Phase 2: 前端精简模式（2-3 天）
- [ ] 创建 `EssentialSetup` 组件
- [ ] 实现 3 个精简步骤组件
- [ ] 实现校验 Hook
- [ ] 实现连通性测试组件

### Phase 3: 前端完整模式重构（1-2 天）
- [ ] 重构现有步骤组件适配新架构
- [ ] 实现模式切换逻辑
- [ ] 调整 `SetupGuardProvider` 支持双层检测

### Phase 4: 测试与优化（1 天）
- [ ] 端到端测试
- [ ] 错误处理优化
- [ ] 用户体验打磨

---

## 八、关键设计决策

### 8.1 精简模式不可跳过

精简配置的 3 个步骤**都是必须的**，不提供跳过选项。因为这些是系统运行的最小依赖。

### 8.2 完整模式可跳过

完整配置的步骤可以跳过，因为它们只影响功能完整性，不影响基础运行。

### 8.3 状态持久化

- `essential_completed: true` 后，用户可以正常使用系统
- 即使 `full` 未完成，也不阻塞使用
- 状态存储在 `./data/quick_setup_state.json`

### 8.4 向后兼容

已有用户（`completed: true`）自动视为 `setup_level: "full"`。

---

## 九、UI 设计要点

### 精简模式
- 全屏沉浸式向导
- 大字体、简洁布局
- 每步一个核心任务
- 明显的验证反馈
- "继续完整配置"入口明显但不强制

### 完整模式
- 左侧步骤导航
- 可跳转到任意步骤
- 步骤可跳过
- 进度清晰可见
