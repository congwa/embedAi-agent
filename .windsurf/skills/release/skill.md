---
name: release
description: 发版流程 - 仔细阅读上个版本到现在版本的内容，把更改功能放到项目CHANGELOG.md目录下，处理README图片引用，然后提交且推送所有源码到GitHub和Gitee双平台，再之后打tag
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

### 5. 处理 README 图片引用（使用 readme-images skill）

在发版前，需要处理 README.md 中的图片引用以适配不同平台：

```bash
# 检查 README.md 中的图片引用
grep -n "!\[.*\](" README.md

# 如果有本地图片，需要上传到七牛云（使用 qiniu-upload skill）
python3 .windsurf/skills/qiniu-upload/scripts/upload.py image1.png image2.png

# 使用 readme-images skill 转换图片路径
# GitHub 版本：使用七牛云 URL
python3 .windsurf/skills/readme-images/scripts/convert.py --to github README.md

# Gitee 版本：使用本地相对路径
python3 .windsurf/skills/readme-images/scripts/convert.py --to gitee README.md
```

### 6. 提交并推送所有源码（双平台）

```bash
# 添加所有变更
git add .

# 提交所有变更
git commit -m "release: v[版本号] 发布"

# 推送到 GitHub
git push github main
# 或其他分支
# git push github [branch-name]

# 推送到 Gitee
git push gitee main
# 或其他分支
# git push gitee [branch-name]

# 检查远程仓库配置
git remote -v
```

### 7. 创建版本标签（双平台）

```bash
# 创建标签
git tag -a v[版本号] -m "Release v[版本号]"

# 推送标签到 GitHub
git push github v[版本号]

# 推送标签到 Gitee
git push gitee v[版本号]

# 推送所有标签（可选）
git push github --tags
git push gitee --tags
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

## 双平台发版配置

### 远程仓库设置

确保项目配置了 GitHub 和 Gitee 两个远程仓库：

```bash
# 添加 GitHub 远程仓库（如果不存在）
git remote add github https://github.com/[username]/[repository].git

# 添加 Gitee 远程仓库（如果不存在）
git remote add gitee https://gitee.com/[username]/[repository].git

# 查看远程仓库配置
git remote -v

# 设置默认推送分支
git push --set-upstream github main
git push --set-upstream gitee main
```

### README 图片处理策略

#### GitHub 平台
- 使用七牛云图床 URL
- 格式：`http://qiniu.biomed168.com/pic/[filename]`

#### Gitee 平台  
- 使用本地相对路径
- 格式：`[filename]` 或 `./[filename]`

#### 自动化处理
```bash
# 检查图片引用
grep -o "!\[.*\](.*))" README.md | grep -o "(.*)" | sed 's/[()]//g'

# 批量上传本地图片到七牛云
find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | grep -E "(README|docs|images)" | xargs python3 .windsurf/skills/qiniu-upload/scripts/upload.py

# 生成 GitHub 版本 README
cp README.md README.github.md
python3 .windsurf/skills/readme-images/scripts/convert.py --to github README.github.md

# 生成 Gitee 版本 README  
cp README.md README.gitee.md
python3 .windsurf/skills/readme-images/scripts/convert.py --to gitee README.gitee.md
```

## 发布前检查清单

- [ ] 所有代码已提交
- [ ] CHANGELOG.md 已更新
- [ ] 版本号符合语义化版本规范
- [ ] README 图片已处理（GitHub 使用七牛云 URL，Gitee 使用本地路径）
- [ ] 远程仓库已配置（GitHub + Gitee）
- [ ] 标签已创建并推送到双平台
- [ ] 双平台仓库已同步

## 常用命令

```bash
# 查看最新标签
git describe --tags --abbrev=0

# 查看所有标签
git tag --sort=-version:refname

# 删除本地标签（如果需要）
git tag -d v[版本号]

# 删除 GitHub 远程标签（如果需要）
git push github --delete v[版本号]

# 删除 Gitee 远程标签（如果需要）
git push gitee --delete v[版本号]

# 强制推送（谨慎使用）
git push github main --force
git push gitee main --force

# 查看远程仓库状态
git remote show github
git remote show gitee
```
