#!/usr/bin/env python3
"""
七牛云图片上传脚本
通过本地 PicList/PicGo 服务上传图片到七牛云，返回图片访问地址。

用法:
    python3 upload.py <图片路径> [图片路径2 ...]

示例:
    python3 upload.py /path/to/image.png
    python3 upload.py /path/to/a.png /path/to/b.jpg
"""

import json
import os
import sys
import urllib.request
import urllib.parse
from pathlib import Path


PICLIST_UPLOAD_URL = "http://127.0.0.1:36677/upload"
PICLIST_PARAMS = {
    "picbed": "qiniu",
    "configName": "biomed168",
}
QINIU_BASE_URL = "http://qiniu.biomed168.com/pic/"


def upload_to_qiniu(image_path):
    """
    上传图片到七牛云。

    Args:
        image_path: 图片文件路径（str）或路径列表（list[str]）。

    Returns:
        str: 单张图片时返回图片 URL 字符串。
        list[str]: 多张图片时返回 URL 列表。

    Raises:
        FileNotFoundError: 图片文件不存在。
        ValueError: 上传失败。
        ConnectionError: 无法连接到 PicList 服务。
    """
    if isinstance(image_path, list):
        return [_upload_single(p) for p in image_path]
    return _upload_single(image_path)


def _upload_single(image_path):
    """上传单张图片到七牛云，返回图片 URL。"""
    image_path = os.path.abspath(image_path)

    if not os.path.isfile(image_path):
        raise FileNotFoundError(f"图片文件不存在: {image_path}")

    filename = os.path.basename(image_path)
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"

    with open(image_path, "rb") as f:
        file_data = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n"
    ).encode("utf-8") + file_data + f"\r\n--{boundary}--\r\n".encode("utf-8")

    params = urllib.parse.urlencode(PICLIST_PARAMS)
    url = f"{PICLIST_UPLOAD_URL}?{params}"

    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError:
        raise ConnectionError(
            "无法连接到 PicList 服务，请确认 PicList 正在运行 (端口 36677)"
        )

    if not data.get("success"):
        raise ValueError(f"上传失败: {data.get('message', '未知错误')}")

    urls = data.get("result", [])
    if not urls:
        raise ValueError("上传成功但未返回图片 URL")

    return urls[0]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python3 upload.py <图片路径> [图片路径2 ...]")
        sys.exit(1)

    paths = sys.argv[1:]
    for p in paths:
        try:
            url = _upload_single(p)
            print(f"上传成功: {url}")
        except Exception as e:
            print(f"上传失败 [{p}]: {e}", file=sys.stderr)
            sys.exit(1)
