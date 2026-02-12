---
name: qiniu-upload
description: Upload images to Qiniu Cloud (七牛云) via local PicList/PicGo service and return the public access URL. Use when the user needs to upload images, screenshots, or any picture files to Qiniu cloud storage, get image hosting URLs, or publish images to http://qiniu.biomed168.com/pic/.
---

# Qiniu Upload

通过本地 PicList 服务将图片上传到七牛云对象存储，返回公开访问地址。

## 快速开始

运行上传脚本：

```bash
python3 scripts/upload.py <图片路径> [图片路径2 ...]
```

上传成功后输出格式：`上传成功: http://qiniu.biomed168.com/pic/<filename>`

## 作为模块调用

```python
from scripts.upload import upload_to_qiniu

# 单张图片
url = upload_to_qiniu("/path/to/image.png")

# 多张图片
urls = upload_to_qiniu(["/path/to/a.png", "/path/to/b.jpg"])
```

## API 说明

- **上传端点**: `POST http://127.0.0.1:36677/upload?picbed=qiniu&configName=biomed168`
- **请求格式**: `multipart/form-data`，字段名 `file`
- **返回地址前缀**: `http://qiniu.biomed168.com/pic/`

## 前置条件

- PicList（或 PicGo）正在本地运行，监听端口 36677
- 已配置名为 `biomed168` 的七牛云图床

## scripts/

- **upload.py** — 上传脚本，支持命令行和模块两种调用方式，无第三方依赖
