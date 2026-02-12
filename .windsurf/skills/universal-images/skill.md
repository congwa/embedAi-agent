---
name: universal-images
description: 通用图片处理方案 - 自动为GitHub和Gitee平台生成合适的图片引用，支持多种图片托管方式
---

# Universal Images Skill

## 通用图片解决方案

### 方案1: 使用jsdelivr CDN（推荐）

jsdelivr CDN是GitHub的CDN加速服务，访问更稳定：

```markdown
![图片](https://cdn.jsdelivr.net/gh/congwa/mobile-agent@main/docs/videos/demo.gif)
![图片](https://cdn.jsdelivr.net/gh/congwa/mobile-agent@main/images/agent1.png)
```

### 方案2: 使用相对路径（最稳定）

确保图片文件在两个仓库中都存在，使用相对路径：

```markdown
![图片](docs/videos/demo.gif)
![图片](images/agent1.png)
```

### 方案3: 使用GitHub Raw URL（备选）

```markdown
![图片](https://raw.githubusercontent.com/congwa/mobile-agent/main/docs/videos/demo.gif)
```

### 方案4: 使用Gitee Raw URL

```markdown
![图片](https://gitee.com/cong_wa/mobile-mcp/raw/main/docs/videos/demo.gif)
```

## 自动化处理

### 检测当前平台并转换

```bash
# 自动检测git远程仓库并转换图片路径
python3 .windsurf/skills/universal-images/scripts/auto_convert.py

# 手动指定平台转换
python3 .windsurf/skills/universal-images/scripts/auto_convert.py --platform jsdelivr-cdn
python3 .windsurf/skills/universal-images/scripts/auto_convert.py --platform relative
python3 .windsurf/skills/universal-images/scripts/auto_convert.py --platform github-raw
python3 .windsurf/skills/universal-images/scripts/auto_convert.py --platform gitee-raw
```

### 批量处理多个项目

```bash
# 处理所有项目
for project in mobile-mcp Skill-Know embedease-ai embedease-sdk; do
    cd /Users/wang/code/$project
    python3 .windsurf/skills/universal-images/scripts/auto_convert.py --platform universal
    git add README.md
    git commit -m "feat: 使用通用图片路径支持双平台"
    git push github main
    git push gitee main
done
```

## 最佳实践

### 推荐配置

1. **使用GitHub Raw URL** - 两个平台都支持
2. **图片文件存放在GitHub仓库** - 单一数据源
3. **相对路径作为备选** - 本地开发时使用

### 图片目录规范

```
project/
├── README.md
├── images/
│   ├── screenshot1.png
│   ├── screenshot2.jpg
│   └── demo.gif
└── docs/
    └── images/
        └── diagram.png
```

### 转换规则

| 原路径 | GitHub Raw URL | 相对路径 |
|--------|----------------|----------|
| `images/pic.png` | `https://raw.githubusercontent.com/user/repo/main/images/pic.png` | `images/pic.png` |
| `docs/images/diagram.png` | `https://raw.githubusercontent.com/user/repo/main/docs/images/diagram.png` | `docs/images/diagram.png` |

## 脚本功能

### auto_convert.py

- 自动检测Git远程仓库
- 扫描README.md中的图片引用
- 根据指定平台转换图片路径
- 支持批量处理多个文件

### 使用示例

```bash
# 检测当前平台并自动转换
python3 scripts/auto_convert.py

# 转换为GitHub Raw URL格式
python3 scripts/auto_convert.py --platform github-raw

# 转换为相对路径格式
python3 scripts/auto_convert.py --platform relative

# 预览转换结果（不修改文件）
python3 scripts/auto_convert.py --dry-run
```

## 优势

1. **一次配置，双平台可用**
2. **自动化处理，减少手工操作**
3. **支持多种图片托管方案**
4. **保持图片文件的一致性**

## 注意事项

1. GitHub Raw URL需要确保仓库是公开的
2. 相对路径需要确保两个平台的图片文件结构一致
3. CDN服务可能有访问限制
4. 大文件建议使用专门的图床服务
