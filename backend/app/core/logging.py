"""日志系统 - 使用 loguru + structlog + rich

支持配置模式:
- simple: 简洁模式，只显示关键信息
- detailed: 详细模式，显示完整堆栈和上下文
- json: JSON 格式，适合生产环境日志收集

使用方式:
    from app.core.logging import logger

    logger.info("消息")
    logger.debug("调试信息", extra={"user_id": "123"})
    logger.error("错误", exc_info=True)
"""

import sys
import traceback
from enum import Enum
from functools import lru_cache
from pathlib import Path
from typing import Any

import structlog
from loguru import logger as loguru_logger
from rich.console import Console
from rich.traceback import install as install_rich_traceback

from app.core.config import settings


class LogLevel(str, Enum):
    """日志级别"""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogMode(str, Enum):
    """日志模式"""

    SIMPLE = "simple"  # 简洁模式
    DETAILED = "detailed"  # 详细模式
    JSON = "json"  # JSON 模式（生产环境）


# Rich 控制台
console = Console(force_terminal=True, color_system="auto")


def get_caller_info(depth: int = 2) -> dict[str, Any]:
    """获取调用者信息"""
    try:
        frame = sys._getframe(depth + 1)
        return {
            "file": Path(frame.f_code.co_filename).name,
            "line": frame.f_lineno,
            "function": frame.f_code.co_name,
        }
    except (ValueError, AttributeError):
        return {"file": "unknown", "line": 0, "function": "unknown"}


def format_simple(record: dict) -> str:
    """简洁格式"""
    level = record["level"].name
    message = record["message"]
    module = record.get("extra", {}).get("module", "app")

    # 颜色映射
    color_map = {
        "DEBUG": "dim",
        "INFO": "green",
        "WARNING": "yellow",
        "ERROR": "red",
        "CRITICAL": "bold red",
    }
    color = color_map.get(level, "white")

    return f"<{color}>[{module}]</{color}> {message}\n"


def format_detailed(record: dict) -> str:
    """详细格式"""
    level = record["level"].name
    time = record["time"].strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    message = record["message"]
    extra = record.get("extra", {})
    module = extra.get("module", "app")
    
    # 优先使用 extra 中的调用者信息（我们自己记录的）
    # 否则回退到 loguru 的 record 信息
    file = extra.get("file") or getattr(record.get("file"), "name", str(record.get("file", "")))
    line = extra.get("line") or record.get("line", "")
    function = extra.get("function") or record.get("function", "")

    # 颜色映射
    color_map = {
        "DEBUG": "dim cyan",
        "INFO": "green",
        "WARNING": "yellow",
        "ERROR": "red",
        "CRITICAL": "bold red on white",
    }
    color = color_map.get(level, "white")

    # 基础信息
    header = f"<dim>{time}</dim> <{color}>{level:8}</{color}>"
    location = f"<cyan>{file}:{line}</cyan> in <blue>{function}</blue>"
    module_tag = f"<magenta>[{module}]</magenta>"

    # 额外上下文（转义大括号避免被 loguru 解析）
    context_keys = [k for k in extra if k not in ("module", "file", "line", "function")]
    context = ""
    if context_keys:
        ctx_parts = []
        for k in context_keys:
            # 转义大括号，避免被 loguru 解析为格式化占位符
            value_repr = repr(extra[k]).replace("{", "{{").replace("}", "}}")
            ctx_parts.append(f"{k}={value_repr}")
        context = f" <dim>| {', '.join(ctx_parts)}</dim>"

    result = f"{header} {module_tag} {location}{context}\n    → {message}\n"

    # 异常信息
    if record.get("exception"):
        exc_type, exc_value, exc_tb = record["exception"]
        if exc_value:
            tb_str = "".join(traceback.format_exception(exc_type, exc_value, exc_tb))
            result += f"\n<red>{tb_str}</red>\n"

    return result


def format_json(record: dict) -> str:
    """JSON 格式"""
    import json

    extra = record.get("extra", {})

    log_entry = {
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        "module": extra.get("module", "app"),
        "file": str(record.get("file", "")),
        "line": record.get("line", 0),
        "function": record.get("function", ""),
    }

    # 添加额外字段
    for k, v in extra.items():
        if k not in ("module", "file", "line", "function"):
            try:
                json.dumps(v)  # 测试是否可序列化
                log_entry[k] = v
            except (TypeError, ValueError):
                log_entry[k] = str(v)

    # 异常信息
    if record.get("exception"):
        exc_type, exc_value, exc_tb = record["exception"]
        if exc_value:
            log_entry["exception"] = {
                "type": exc_type.__name__ if exc_type else None,
                "message": str(exc_value),
                "traceback": traceback.format_exception(exc_type, exc_value, exc_tb),
            }

    return json.dumps(log_entry, ensure_ascii=False, default=str) + "\n"


class Logger:
    """统一日志接口"""

    def __init__(self) -> None:
        self._configured = False
        self._mode = LogMode.DETAILED
        self._level = LogLevel.DEBUG

    def configure(
        self,
        mode: LogMode | str | None = None,
        level: LogLevel | str | None = None,
        log_file: str | None = None,
    ) -> None:
        """配置日志系统

        Args:
            mode: 日志模式 (simple, detailed, json)
            level: 日志级别 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            log_file: 日志文件路径，留空则不记录文件
        """
        # 从参数或配置获取设置
        if mode is None:
            mode = getattr(settings, "LOG_MODE", "detailed")
        if level is None:
            level = getattr(settings, "LOG_LEVEL", "DEBUG")
        if log_file is None:
            log_file = getattr(settings, "LOG_FILE", "")

        # 转换为枚举
        if isinstance(mode, str):
            mode = LogMode(mode.lower())
        if isinstance(level, str):
            level = LogLevel(level.upper())

        self._mode = mode
        self._level = level

        # 移除默认处理器
        loguru_logger.remove()

        # 选择格式化器
        if mode == LogMode.SIMPLE:
            formatter = format_simple
        elif mode == LogMode.JSON:
            formatter = format_json
        else:
            formatter = format_detailed
            # 详细模式下安装 Rich traceback
            install_rich_traceback(console=console, show_locals=True, width=120)

        # 添加控制台处理器
        loguru_logger.add(
            sys.stderr,
            format=formatter,
            level=level.value,
            colorize=mode != LogMode.JSON,
            backtrace=mode == LogMode.DETAILED,
            diagnose=mode == LogMode.DETAILED,
            enqueue=True,  # 异步写入，避免阻塞
        )

        # 添加文件处理器
        log_file_configured = False
        if log_file:
            log_path = Path(log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)
            
            rotation = getattr(settings, "LOG_FILE_ROTATION", "10 MB")
            retention = getattr(settings, "LOG_FILE_RETENTION", "7 days")
            
            # 文件日志使用 JSON 格式（方便解析）
            loguru_logger.add(
                str(log_path),
                format="{message}",
                level=level.value,
                rotation=rotation,
                retention=retention,
                compression="gz",  # 压缩旧日志
                enqueue=True,
                serialize=True,  # 自动序列化为 JSON
            )
            log_file_configured = True

        # 标记为已配置（必须在记录日志之前设置，避免递归）
        self._configured = True
        
        # 记录配置完成信息
        if log_file_configured:
            loguru_logger.bind(module="logging").info(
                f"日志文件已配置: {log_file} (rotation={rotation}, retention={retention})"
            )
        loguru_logger.bind(module="logging").info(
            f"日志系统已配置: mode={mode.value}, level={level.value}"
        )

    def _ensure_configured(self) -> None:
        """确保已配置"""
        if not self._configured:
            self.configure()

    def _log(
        self,
        level: str,
        message: str,
        *,
        module: str = "app",
        exc_info: bool = False,
        _depth: int = 0,
        **extra: Any,
    ) -> None:
        """内部日志方法"""
        self._ensure_configured()

        # 获取调用位置（基础深度 2 + 额外深度）
        # 调用栈: get_caller_info -> _log -> Logger.info -> [BoundLogger.info] -> 调用者
        # 直接调用 Logger: depth=2+0=2, _getframe(3) -> 调用者
        # 通过 BoundLogger: depth=2+1=3, _getframe(4) -> 调用者
        caller = get_caller_info(depth=2 + _depth)

        # 合并上下文
        context = {
            "module": module,
            **caller,
            **extra,
        }

        # 记录日志
        log_func = getattr(loguru_logger.bind(**context), level)
        if exc_info:
            log_func(message, exception=True)
        else:
            log_func(message)

    def debug(
        self, message: str, *, module: str = "app", _depth: int = 0, **extra: Any
    ) -> None:
        """调试日志"""
        self._log("debug", message, module=module, _depth=_depth, **extra)

    def info(
        self, message: str, *, module: str = "app", _depth: int = 0, **extra: Any
    ) -> None:
        """信息日志"""
        self._log("info", message, module=module, _depth=_depth, **extra)

    def warning(
        self, message: str, *, module: str = "app", _depth: int = 0, **extra: Any
    ) -> None:
        """警告日志"""
        self._log("warning", message, module=module, _depth=_depth, **extra)

    def error(
        self,
        message: str,
        *,
        module: str = "app",
        exc_info: bool = False,
        _depth: int = 0,
        **extra: Any,
    ) -> None:
        """错误日志"""
        self._log("error", message, module=module, exc_info=exc_info, _depth=_depth, **extra)

    def critical(
        self,
        message: str,
        *,
        module: str = "app",
        exc_info: bool = False,
        _depth: int = 0,
        **extra: Any,
    ) -> None:
        """严重错误日志"""
        self._log("critical", message, module=module, exc_info=exc_info, _depth=_depth, **extra)

    def exception(
        self, message: str, *, module: str = "app", _depth: int = 0, **extra: Any
    ) -> None:
        """异常日志（自动包含堆栈）"""
        self._log("error", message, module=module, exc_info=True, _depth=_depth, **extra)

    def bind(self, **context: Any) -> "BoundLogger":
        """创建绑定上下文的日志器"""
        return BoundLogger(self, context)


class BoundLogger:
    """绑定上下文的日志器"""

    def __init__(self, parent: Logger, context: dict[str, Any]) -> None:
        self._parent = parent
        self._context = context

    def debug(self, message: str, **extra: Any) -> None:
        self._parent.debug(message, _depth=1, **{**self._context, **extra})

    def info(self, message: str, **extra: Any) -> None:
        self._parent.info(message, _depth=1, **{**self._context, **extra})

    def warning(self, message: str, **extra: Any) -> None:
        self._parent.warning(message, _depth=1, **{**self._context, **extra})

    def error(self, message: str, exc_info: bool = False, **extra: Any) -> None:
        self._parent.error(message, exc_info=exc_info, _depth=1, **{**self._context, **extra})

    def critical(self, message: str, exc_info: bool = False, **extra: Any) -> None:
        self._parent.critical(message, exc_info=exc_info, _depth=1, **{**self._context, **extra})

    def exception(self, message: str, **extra: Any) -> None:
        self._parent.exception(message, _depth=1, **{**self._context, **extra})


# 全局日志实例
logger = Logger()


# 便捷模块日志创建器
def get_logger(module: str) -> BoundLogger:
    """获取模块专用日志器

    Args:
        module: 模块名称

    Returns:
        绑定了模块名的日志器

    Example:
        from app.core.logging import get_logger

        logger = get_logger("agent")
        logger.info("Agent 初始化")
    """
    return logger.bind(module=module)
