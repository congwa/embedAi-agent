"""项目路径相关工具."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path


def _search_project_root(start: Path, marker: str) -> Path:
    """从起始路径向上查找包含指定标记文件的目录."""
    current = start
    if current.is_file():
        current = current.parent

    for candidate in (current, *current.parents):
        if (candidate / marker).exists():
            return candidate

    raise FileNotFoundError(
        f"未能在 {start} 及其父目录中找到 {marker}，请确认项目结构。"
    )


@lru_cache(maxsize=1)
def get_project_root(marker: str = "pyproject.toml") -> Path:
    """
    获取项目根目录（通过 pyproject.toml 等标记文件确定）。

    Args:
        marker: 用于标记项目根目录的文件名，默认 pyproject.toml。
    """
    start = Path(__file__).resolve()
    return _search_project_root(start, marker)


def resolve_path_from_project_root(relative_path: str | Path) -> Path:
    """以项目根目录为基准解析相对路径，返回绝对路径。"""
    return get_project_root() / Path(relative_path)
