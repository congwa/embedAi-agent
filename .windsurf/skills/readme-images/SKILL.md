---
name: readme-images
description: Handle README.md image references for GitHub and Gitee platforms. Use when writing or converting README.md files that contain images, ensuring correct image paths for each platform. GitHub READMEs use Qiniu cloud URLs (via qiniu-upload skill), Gitee READMEs use local relative image paths.
---

# Readme Images

根据目标平台（GitHub / Gitee）处理 README.md 中的图片引用方式。

## 规则

### GitHub

将项目中的图片上传到七牛云图床，在 README.md 中使用上传后的 URL。

1. 使用 `qiniu-upload` skill 上传图片
2. 用返回的 URL 替换本地路径

```markdown
![Cursor界面](http://qiniu.biomed168.com/pic/cursor.png)
![参考图](http://qiniu.biomed168.com/pic/image.png)
```

### Gitee

直接使用项目中的本地相对路径引用图片。

```markdown
![Cursor界面](cursor.png)
![参考图](image.png)
```

## 工作流

### 为 GitHub 生成 README

1. 找到 README.md 中所有图片引用 `![alt](path)`
2. 收集所有本地图片文件路径
3. 调用 `qiniu-upload` skill 的 `scripts/upload.py` 批量上传
4. 将 README.md 中的本地路径替换为七牛云 URL

### 为 Gitee 生成 README

1. 找到 README.md 中所有图片引用 `![alt](url_or_path)`
2. 如果包含七牛云 URL，提取文件名部分
3. 将 URL 替换为本地相对路径（仅文件名）

### 同时维护两个平台

使用 `scripts/convert.py` 在两种格式之间转换：

```bash
# 本地路径 → 七牛云 URL（用于 GitHub）
python3 scripts/convert.py --to github README.md

# 七牛云 URL → 本地路径（用于 Gitee）
python3 scripts/convert.py --to gitee README.md
```

## scripts/

- **convert.py** — README 图片路径转换脚本，支持 GitHub/Gitee 双向转换
