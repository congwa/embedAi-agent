---
name: release
description: 发版流程 - 仔细阅读上个版本到现在版本的内容，把更改功能放到项目CHANGELOG.md目录下，然后提交且推送所有源码，再之后打一个tag
---

# 发版 Skill

## 发版流程

### 1. 检查当前版本状态

首先查看项目当前的 CHANGELOG.md 文件，了解最新版本信息：

```bash
# 查看当前 CHANGELOG
cat CHANGELOG.md

# 或者查看子项目的 CHANGELOG
find . -name "CHANGELOG.md" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./frontend/node_modules/*"
```

### 2. 分析版本变更

使用 git log 查看自上个版本以来的所有变更：

```bash
# 查看自上次 tag 以来的提交
git log --oneline --decorate --graph $(git describe --tags --abbrev=0)..HEAD

# 查看详细变更
git log --since="$(git describe --tags --abbrev=0 --date=format:'%Y-%m-%d')" --pretty=format:"%h %s" --no-merges
```

### 3. 更新 CHANGELOG.md

根据 git 变更内容，更新 CHANGELOG.md：

1. **确定新版本号**（遵循语义化版本）
2. **添加新版本条目**，包含：
   - 版本号和发布日期
   - 核心亮点（可选）
   - Added - 新增功能
   - Changed - 修改的功能
   - Fixed - 修复的问题
   - Deprecated - 废弃的功能
   - Removed - 移除的功能

### 4. 提交 CHANGELOG

```bash
git add CHANGELOG.md
git commit -m "docs: 更新 CHANGELOG.md v[版本号]"
```

### 5. 提交并推送所有源码

```bash
# 添加所有变更
git add .

# 提交所有变更
git commit -m "release: v[版本号] 发布"

# 推送到远程仓库
git push origin main
# 或者推送到其他分支
# git push origin [branch-name]
```

### 6. 创建版本标签

```bash
# 创建标签
git tag -a v[版本号] -m "Release v[版本号]"

# 推送标签到远程仓库
git push origin v[版本号]

# 推送所有标签（可选）
git push origin --tags
```

## 版本号规则

遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)：

- **主版本号 (MAJOR)**: 不兼容的 API 修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正

## CHANGELOG.md 格式

```markdown
## [X.Y.Z] - YYYY-MM-DD

### 核心亮点

简要描述本版本的重要特性或改进

### Added

- 新功能列表

### Changed

- 修改的功能列表

### Fixed

- 修复的问题列表

### Deprecated

- 废弃的功能列表

### Removed

- 移除的功能列表
```

## 多子项目处理

如果项目包含多个子项目（如 frontend、backend 等）：

1. **主项目 CHANGELOG**: 记录整体项目变更
2. **子项目 CHANGELOG**: 记录子模块特定变更
3. **版本同步**: 确保相关子项目版本号保持一致

## 发布前检查清单

- [ ] 所有代码已提交
- [ ] CHANGELOG.md 已更新
- [ ] 版本号符合语义化版本规范
- [ ] 标签已创建并推送
- [ ] 远程仓库已同步

## 常用命令

```bash
# 查看最新标签
git describe --tags --abbrev=0

# 查看所有标签
git tag --sort=-version:refname

# 删除本地标签（如果需要）
git tag -d v[版本号]

# 删除远程标签（如果需要）
git push origin --delete v[版本号]
```
