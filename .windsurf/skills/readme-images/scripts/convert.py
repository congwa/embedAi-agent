#!/usr/bin/env python3
"""
README.md 图片路径转换脚本

将 README.md 中的图片引用在 GitHub（七牛云 URL）和 Gitee（本地相对路径）格式之间转换。

用法:
    # 转换为 GitHub 格式（本地路径 → 七牛云 URL，会自动上传图片）
    python3 convert.py --to github README.md

    # 转换为 Gitee 格式（七牛云 URL → 本地相对路径）
    python3 convert.py --to gitee README.md

    # 输出到指定文件（不修改原文件）
    python3 convert.py --to github README.md -o README_github.md

    # 预览变更，不写入文件
    python3 convert.py --to github README.md --dry-run
"""

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request


QINIU_BASE_URL = "http://qiniu.biomed168.com/pic/"
PICLIST_UPLOAD_URL = "http://127.0.0.1:36677/upload"
PICLIST_PARAMS = {"picbed": "qiniu", "configName": "biomed168"}

IMAGE_PATTERN = re.compile(r"(!\[[^\]]*\])\(([^)]+)\)")


def upload_to_qiniu(image_path):
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


def is_qiniu_url(path):
    """判断路径是否为七牛云 URL。"""
    return path.startswith(QINIU_BASE_URL) or path.startswith("http://qiniu.biomed168.com/")


def is_remote_url(path):
    """判断路径是否为远程 URL。"""
    return path.startswith("http://") or path.startswith("https://")


def extract_filename(url):
    """从七牛云 URL 中提取文件名。"""
    if url.startswith(QINIU_BASE_URL):
        return url[len(QINIU_BASE_URL):]
    return os.path.basename(urllib.parse.urlparse(url).path)


def convert_to_github(content, readme_dir, dry_run=False):
    """将本地图片路径转换为七牛云 URL（上传图片）。"""
    changes = []

    def replace_match(m):
        alt_part = m.group(1)
        img_path = m.group(2)

        if is_remote_url(img_path):
            return m.group(0)

        abs_path = os.path.join(readme_dir, img_path)
        if not os.path.isfile(abs_path):
            print(f"  警告: 图片不存在，跳过: {img_path}", file=sys.stderr)
            return m.group(0)

        if dry_run:
            qiniu_url = QINIU_BASE_URL + os.path.basename(img_path)
            changes.append(f"  {img_path} → {qiniu_url} (预览)")
            return f"{alt_part}({qiniu_url})"

        try:
            qiniu_url = upload_to_qiniu(abs_path)
            changes.append(f"  {img_path} → {qiniu_url}")
            return f"{alt_part}({qiniu_url})"
        except Exception as e:
            print(f"  上传失败 [{img_path}]: {e}", file=sys.stderr)
            return m.group(0)

    result = IMAGE_PATTERN.sub(replace_match, content)
    return result, changes


def convert_to_gitee(content):
    """将七牛云 URL 转换为本地相对路径。"""
    changes = []

    def replace_match(m):
        alt_part = m.group(1)
        img_path = m.group(2)

        if not is_qiniu_url(img_path):
            return m.group(0)

        filename = extract_filename(img_path)
        changes.append(f"  {img_path} → {filename}")
        return f"{alt_part}({filename})"

    result = IMAGE_PATTERN.sub(replace_match, content)
    return result, changes


def main():
    parser = argparse.ArgumentParser(description="README.md 图片路径转换工具")
    parser.add_argument("readme", help="README.md 文件路径")
    parser.add_argument("--to", required=True, choices=["github", "gitee"], help="目标平台")
    parser.add_argument("-o", "--output", help="输出文件路径（默认覆盖原文件）")
    parser.add_argument("--dry-run", action="store_true", help="预览变更，不写入文件")
    args = parser.parse_args()

    readme_path = os.path.abspath(args.readme)
    if not os.path.isfile(readme_path):
        print(f"错误: 文件不存在: {readme_path}", file=sys.stderr)
        sys.exit(1)

    with open(readme_path, "r", encoding="utf-8") as f:
        content = f.read()

    readme_dir = os.path.dirname(readme_path)

    if args.to == "github":
        print(f"转换为 GitHub 格式（上传图片到七牛云）...")
        result, changes = convert_to_github(content, readme_dir, dry_run=args.dry_run)
    else:
        print(f"转换为 Gitee 格式（使用本地相对路径）...")
        result, changes = convert_to_gitee(content)

    if not changes:
        print("无需转换，所有图片引用已是目标格式。")
        return

    print(f"转换了 {len(changes)} 个图片引用:")
    for c in changes:
        print(c)

    if args.dry_run:
        print("\n(--dry-run 模式，未写入文件)")
        return

    output_path = args.output or readme_path
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(result)
    print(f"\n已写入: {output_path}")


if __name__ == "__main__":
    main()
